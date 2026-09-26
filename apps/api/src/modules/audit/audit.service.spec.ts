import { lastValueFrom, of } from 'rxjs';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { META_KEY, REDACTED, describeRecord, normalizeEntityType, redactSecrets } from './audit.util';

describe('audit.util', () => {
  it('redacts anything that looks like a credential, at any depth', () => {
    const out = redactSecrets({
      email: 'a@b.com',
      password: 'hunter2',
      passwordHash: '$2b$10$abc',
      nested: { refreshToken: 'tok', apiKey: 'k', name: 'Cement' },
    }) as any;

    expect(out.email).toBe('a@b.com');
    expect(out.password).toBe(REDACTED);
    expect(out.passwordHash).toBe(REDACTED);
    expect(out.nested.refreshToken).toBe(REDACTED);
    expect(out.nested.apiKey).toBe(REDACTED);
    expect(out.nested.name).toBe('Cement');
  });

  it('keeps fields that merely read like a credential', () => {
    const out = redactSecrets({
      author: 'Naveen', authorizedBy: 'Harsha', passengers: 4, pinned: true,
    }) as any;

    expect(out).toEqual({
      author: 'Naveen', authorizedBy: 'Harsha', passengers: 4, pinned: true,
    });
  });

  it('truncates values too long to be worth storing', () => {
    expect((redactSecrets({ notes: 'x'.repeat(900) }) as any).notes).toHaveLength(501);
  });

  it('names a record from whichever field carries its name', () => {
    expect(describeRecord({ name: 'Site A' })).toBe('Site A');
    expect(describeRecord({ firstName: 'Naveen', lastName: 'Perera' })).toBe('Naveen Perera');
    expect(describeRecord({ invoiceNo: 'INV-9' })).toBe('INV-9');
    expect(describeRecord({ id: 'clx1' })).toBeNull();
    expect(describeRecord(null)).toBeNull();
  });

  it('folds the three spellings of an entity name into one', () => {
    expect(normalizeEntityType('PURCHASE')).toBe('Purchase');
    expect(normalizeEntityType('Purchase')).toBe('Purchase');
    expect(normalizeEntityType('funding_source')).toBe('FundingSource');
  });
});

describe('AuditInterceptor', () => {
  const context = (req: any) =>
    ({
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => req }),
      getClass: () => ({ name: 'ProjectController' }),
    } as any);

  const run = async (req: any, response: any, service: any) => {
    const interceptor = new AuditInterceptor(service);
    await lastValueFrom(
      interceptor.intercept(context(req), { handle: () => of(response) } as any),
    );
  };

  const user = { sub: 'u1', companyId: 'c1' };

  it('records the created record id, not "unknown"', async () => {
    const log = jest.fn();
    await run(
      { method: 'POST', url: '/api/v1/projects', user, body: { name: 'Site A' }, headers: {} },
      { id: 'proj-1', name: 'Site A' },
      { log },
    );

    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toMatchObject({
      action: 'CREATE',
      entityType: 'Project',
      entityId: 'proj-1',
      label: 'Site A',
    });
  });

  it('still finds the id when a response is wrapped as { data }', async () => {
    const log = jest.fn();
    await run(
      { method: 'POST', url: '/projects', user, body: {}, headers: {} },
      { data: { id: 'proj-2' } },
      { log },
    );
    expect(log.mock.calls[0][0].entityId).toBe('proj-2');
  });

  it('falls back to the route parameter when nothing is returned', async () => {
    const log = jest.fn();
    await run(
      { method: 'DELETE', url: '/projects/p9', params: { id: 'p9' }, user, headers: {} },
      undefined,
      { log },
    );
    expect(log.mock.calls[0][0]).toMatchObject({ action: 'DELETE', entityId: 'p9' });
  });

  it('keeps the record that was deleted, so the owner can see what is gone', async () => {
    const log = jest.fn();
    await run(
      { method: 'DELETE', url: '/funding-sources/f1', params: { id: 'f1' }, user, headers: {} },
      { id: 'f1', name: 'Bank loan — BOC', amount: 2500000 },
      { log },
    );

    expect(log.mock.calls[0][0]).toMatchObject({
      action: 'DELETE',
      entityId: 'f1',
      label: 'Bank loan — BOC',
      changes: { name: 'Bank loan — BOC', amount: 2500000 },
    });
  });

  it('never writes a password into the trail', async () => {
    const log = jest.fn();
    await run(
      {
        method: 'POST', url: '/users', user, headers: {},
        body: { email: 'a@b.com', password: 'hunter2' },
      },
      { id: 'u9' },
      { log },
    );
    expect(log.mock.calls[0][0].changes.password).toBe(REDACTED);
    expect(JSON.stringify(log.mock.calls[0][0])).not.toContain('hunter2');
  });

  it('ignores reads, sign-ins and notification reads', async () => {
    for (const req of [
      { method: 'GET', url: '/projects', user, headers: {} },
      { method: 'POST', url: '/api/v1/auth/login', user, body: {}, headers: {} },
      { method: 'PATCH', url: '/notifications/n1/read', user, body: {}, headers: {} },
    ]) {
      const log = jest.fn();
      await run(req, { id: 'x' }, { log });
      expect(log).not.toHaveBeenCalled();
    }
  });

  it('records nothing for an unauthenticated request', async () => {
    const log = jest.fn();
    await run({ method: 'POST', url: '/projects', body: {}, headers: {} }, { id: 'x' }, { log });
    expect(log).not.toHaveBeenCalled();
  });
});

describe('AuditService', () => {
  const prisma: any = {
    auditLog: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    user: { findMany: jest.fn() },
  };
  const service = new AuditService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('stores the label alongside the fields without needing new columns', async () => {
    await service.log({
      companyId: 'c1', userId: 'u1', action: 'CREATE',
      entityType: 'PROJECT', entityId: 'p1',
      changes: { name: 'Site A' }, label: 'Site A', method: 'POST', path: '/projects',
    });

    const data = prisma.auditLog.create.mock.calls[0][0].data;
    expect(data.entityType).toBe('Project');
    expect(data.changes.name).toBe('Site A');
    expect(data.changes[META_KEY]).toEqual({ label: 'Site A', method: 'POST', path: '/projects' });
  });

  it('never lets a logging failure reach the caller', async () => {
    prisma.auditLog.create.mockRejectedValueOnce(new Error('db down'));
    await expect(
      service.log({ companyId: 'c1', userId: 'u1', action: 'CREATE', entityType: 'P', entityId: '1' }),
    ).resolves.toBeUndefined();
  });

  it('reads a bare "to" date as the whole of that day', async () => {
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.auditLog.findMany.mockResolvedValue([]);

    await service.findAll('c1', { from: '2026-09-01', to: '2026-09-26' });

    const where = prisma.auditLog.findMany.mock.calls[0][0].where;
    expect(where.createdAt.lte.toISOString()).toContain('2026-09-26T23:59:59');
  });

  it('caps the page size so one request cannot pull the whole table', async () => {
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.auditLog.findMany.mockResolvedValue([]);
    await service.findAll('c1', { limit: 5000 });
    expect(prisma.auditLog.findMany.mock.calls[0][0].take).toBe(200);
  });

  it('presents a row as who / what / when, hiding the plumbing fields', async () => {
    prisma.auditLog.count.mockResolvedValue(1);
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'a1', action: 'UPDATE', entityType: 'PROJECT', entityId: 'p1',
        createdAt: new Date('2026-09-26T10:00:00Z'), ipAddress: '1.2.3.4',
        changes: {
          budgetEstimate: 500000, companyId: 'c1', id: 'p1',
          [META_KEY]: { label: 'Site A' },
        },
        user: { id: 'u1', firstName: 'Naveen', lastName: 'Perera', email: 'n@b.com', role: { name: 'COMPANY_OWNER' } },
      },
    ]);

    const result = await service.findAll('c1', {});
    const row = result.data[0];

    expect(row.user.name).toBe('Naveen Perera');
    expect(row.entityType).toBe('Project');
    expect(row.label).toBe('Site A');
    expect(row.fields).toEqual([{ field: 'budgetEstimate', value: 500000 }]);
    expect(result.meta).toEqual({ total: 1, page: 1, limit: 50, totalPages: 1 });
  });

  it('searches people and record names together', async () => {
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.auditLog.findMany.mockResolvedValue([]);
    await service.findAll('c1', { search: 'Cement' });

    const or = prisma.auditLog.findMany.mock.calls[0][0].where.OR;
    expect(or).toContainEqual({ changes: { path: [META_KEY, 'label'], string_contains: 'Cement' } });
    expect(or).toContainEqual({ user: { email: { contains: 'Cement', mode: 'insensitive' } } });
  });

  it('merges the spellings of an entity when building the filter list', async () => {
    prisma.auditLog.groupBy
      .mockResolvedValueOnce([
        { entityType: 'PURCHASE', _count: 2 },
        { entityType: 'Purchase', _count: 3 },
      ])
      .mockResolvedValueOnce([{ action: 'CREATE', _count: 5 }])
      .mockResolvedValueOnce([{ userId: 'u1', _count: 5 }]);
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', firstName: 'Naveen', lastName: 'Perera', email: 'n@b.com' },
    ]);

    const out = await service.filters('c1');
    expect(out.entityTypes).toEqual([{ value: 'Purchase', count: 5 }]);
    expect(out.users).toEqual([{ value: 'u1', label: 'Naveen Perera', count: 5 }]);
  });
});
