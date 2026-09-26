import { INestApplication, Controller, Post, Get, Body } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// supertest ships no types in this workspace and this spec is not worth a new
// dependency for; the request helper is used untyped.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { PrismaService } from '../database/prisma.service';
import { META_KEY, REDACTED } from './audit.util';

/**
 * Boots the real HTTP stack — routing, guards, the globally registered
 * interceptor — over an in-memory stand-in for the database, so the wiring is
 * exercised without a server or a live connection.
 */

const rows: any[] = [];

const prismaDouble: any = {
  auditLog: {
    create: async ({ data }: any) => {
      const row = {
        ...data,
        id: `log-${rows.length + 1}`,
        createdAt: new Date('2026-09-26T09:30:00Z'),
        user: {
          id: data.userId, firstName: 'Naveen', lastName: 'Perera',
          email: 'naveen@inbuilders.lk', role: { name: 'COMPANY_OWNER' },
        },
      };
      rows.push(row);
      return row;
    },
    findMany: async ({ where, take, skip = 0 }: any) => {
      let found = rows.filter((r) => r.companyId === where.companyId);
      if (where.action) found = found.filter((r) => r.action === where.action);
      if (where.entityType) found = found.filter((r) => r.entityType === where.entityType);
      return found.slice(skip, skip + take);
    },
    count: async ({ where }: any) => {
      let found = rows.filter((r) => r.companyId === where.companyId);
      if (where.action) found = found.filter((r) => r.action === where.action);
      if (where.entityType) found = found.filter((r) => r.entityType === where.entityType);
      return found.length;
    },
    groupBy: async ({ by }: any) => {
      const key = by[0];
      const counts = new Map<string, number>();
      for (const r of rows) counts.set(r[key], (counts.get(r[key]) ?? 0) + 1);
      return [...counts.entries()].map(([value, count]) => ({ [key]: value, _count: count }));
    },
  },
  user: {
    findMany: async () => [
      { id: 'user-1', firstName: 'Naveen', lastName: 'Perera', email: 'naveen@inbuilders.lk' },
    ],
  },
};

/** A stand-in for a signed-in company owner. */
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = {
      sub: 'user-1',
      companyId: 'company-1',
      role: 'COMPANY_OWNER',
      permissions: ['company:manage'],
    };
    return true;
  }
}

/**
 * Stands in for a real write endpoint. Named exactly as the real controller
 * is, because the entity name in the trail comes from the class name.
 */
@Controller('projects')
class ProjectController {
  @Post()
  create(@Body() body: any) {
    return { id: 'project-1', name: body.name, budgetEstimate: body.budgetEstimate };
  }

  @Get()
  list() {
    return [];
  }
}

describe('Audit trail (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController, ProjectController],
      providers: [
        AuditService,
        Reflector,
        { provide: PrismaService, useValue: prismaDouble },
        { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
        // Globally, so the stand-in write endpoint is authenticated too —
        // the interceptor records nothing for an anonymous request.
        { provide: APP_GUARD, useClass: FakeJwtGuard },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(FakeJwtGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('records a create made through a real HTTP request', async () => {
    await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'Kandy Site', budgetEstimate: 4500000, password: 'hunter2' })
      .expect(201);

    // The interceptor logs after the response is sent; let it settle.
    await new Promise((r) => setImmediate(r));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      companyId: 'company-1',
      userId: 'user-1',
      action: 'CREATE',
      entityType: 'Project',
      entityId: 'project-1',
    });
    expect(rows[0].changes[META_KEY].label).toBe('Kandy Site');
    expect(rows[0].changes.password).toBe(REDACTED);
  });

  it('does not record a read', async () => {
    const before = rows.length;
    await request(app.getHttpServer()).get('/projects').expect(200);
    await new Promise((r) => setImmediate(r));
    expect(rows).toHaveLength(before);
  });

  it('serves the trail as who / what / when', async () => {
    const res = await request(app.getHttpServer()).get('/audit').expect(200);

    expect(res.body.meta).toMatchObject({ total: 1, page: 1, limit: 50 });
    const entry = res.body.data[0];
    expect(entry.user).toMatchObject({ name: 'Naveen Perera', role: 'COMPANY_OWNER' });
    expect(entry.action).toBe('CREATE');
    expect(entry.entityType).toBe('Project');
    expect(entry.label).toBe('Kandy Site');
    expect(entry.createdAt).toBeTruthy();

    const fields = Object.fromEntries(entry.fields.map((f: any) => [f.field, f.value]));
    expect(fields.name).toBe('Kandy Site');
    expect(fields.budgetEstimate).toBe(4500000);
    expect(fields.password).toBe(REDACTED);
    // The tenant key and the row id are noise in a diff.
    expect(fields.companyId).toBeUndefined();
  });

  it('honours a filter passed on the query string', async () => {
    const hit = await request(app.getHttpServer()).get('/audit?action=CREATE').expect(200);
    expect(hit.body.meta.total).toBe(1);

    const miss = await request(app.getHttpServer()).get('/audit?action=DELETE').expect(200);
    expect(miss.body.meta.total).toBe(0);
    expect(miss.body.data).toEqual([]);
  });

  it('offers filter options drawn from what has actually happened', async () => {
    const res = await request(app.getHttpServer()).get('/audit/filters').expect(200);
    expect(res.body.entityTypes).toEqual([{ value: 'Project', count: 1 }]);
    expect(res.body.actions).toEqual([{ value: 'CREATE', count: 1 }]);
    expect(res.body.users).toEqual([{ value: 'user-1', label: 'Naveen Perera', count: 1 }]);
  });

  it('refuses a user without company:manage', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [AuditService, Reflector, { provide: PrismaService, useValue: prismaDouble }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = {
            sub: 'user-2', companyId: 'company-1',
            role: 'SITE_SUPERVISOR', permissions: ['expenses:view_own'],
          };
          return true;
        },
      })
      .compile();

    const restricted = moduleRef.createNestApplication();
    await restricted.init();
    await request(restricted.getHttpServer()).get('/audit').expect(403);
    await restricted.close();
  });
});
