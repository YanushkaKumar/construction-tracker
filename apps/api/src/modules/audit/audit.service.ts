import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { META_KEY, normalizeEntityType, redactSecrets } from './audit.util';

export interface AuditQuery {
  page?: number;
  limit?: number;
  userId?: string;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
  search?: string;
}

/** Fields no one wants to read in a diff: ids, tenant keys, bookkeeping. */
const HIDDEN_FIELDS = new Set([
  'companyId', 'company_id', 'createdAt', 'updatedAt', 'created_at', 'updated_at',
  'createdById', 'updatedById', 'id',
]);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    companyId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Record<string, unknown>;
    label?: string | null;
    method?: string;
    path?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const { [META_KEY]: _ignored, ...fields } = (params.changes ?? {}) as Record<
        string,
        unknown
      >;

      await this.prisma.auditLog.create({
        data: {
          companyId: params.companyId,
          userId: params.userId,
          action: params.action,
          entityType: normalizeEntityType(params.entityType),
          entityId: params.entityId,
          changes: {
            ...fields,
            [META_KEY]: {
              label: params.label ?? null,
              method: params.method ?? null,
              path: params.path ?? null,
            },
          } as Prisma.InputJsonValue,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      // A failure to record history must never fail the thing being recorded.
      this.logger.error('Failed to create audit log', error);
    }
  }

  async findAll(companyId: string, query: AuditQuery = {}) {
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
    const page = Math.max(Number(query.page) || 1, 1);

    const where: Prisma.AuditLogWhereInput = { companyId };

    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = normalizeEntityType(query.entityType);

    const createdAt = this.dateRange(query.from, query.to);
    if (createdAt) where.createdAt = createdAt;

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { entityId: search },
        { entityType: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        // The record's own name, which is what someone actually searches for.
        { changes: { path: [META_KEY, 'label'], string_contains: search } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              role: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.present(row)),
      meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) },
    };
  }

  /**
   * The values the filter dropdowns offer. Derived from what has actually
   * happened, so the owner is never offered a filter that matches nothing.
   */
  async filters(companyId: string) {
    const [entityTypes, actions, userIds] = await Promise.all([
      this.prisma.auditLog.groupBy({ by: ['entityType'], where: { companyId }, _count: true }),
      this.prisma.auditLog.groupBy({ by: ['action'], where: { companyId }, _count: true }),
      this.prisma.auditLog.groupBy({ by: ['userId'], where: { companyId }, _count: true }),
    ]);

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds.map((u) => u.userId) } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const counts = new Map(userIds.map((u) => [u.userId, u._count]));

    const dedupe = (list: { entityType?: string; action?: string; _count: number }[], key: 'entityType' | 'action') => {
      const merged = new Map<string, number>();
      for (const row of list) {
        const value = key === 'entityType' ? normalizeEntityType(row[key] as string) : (row[key] as string);
        merged.set(value, (merged.get(value) ?? 0) + row._count);
      }
      return [...merged.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      entityTypes: dedupe(entityTypes as any, 'entityType'),
      actions: dedupe(actions as any, 'action'),
      users: users
        .map((u) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName}`.trim() || u.email,
          count: counts.get(u.id) ?? 0,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }

  private dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    const range: Prisma.DateTimeFilter = {};

    if (from) {
      const start = new Date(from);
      if (!Number.isNaN(start.getTime())) range.gte = start;
    }
    if (to) {
      const end = new Date(to);
      if (!Number.isNaN(end.getTime())) {
        // A bare date means the whole of that day, not midnight at its start —
        // otherwise "to: today" returns nothing. Widened in UTC, because
        // setHours would resolve against whatever timezone the server happens
        // to run in and silently shift the cut-off. The web client sends a full
        // timestamp built from the viewer's own midnight, so this is the
        // fallback for anything calling the API directly.
        if (!/T/.test(to)) end.setUTCHours(23, 59, 59, 999);
        range.lte = end;
      }
    }
    return range.gte || range.lte ? range : undefined;
  }

  private present(row: any) {
    const changes = (row.changes ?? {}) as Record<string, unknown>;
    const meta = (changes[META_KEY] ?? {}) as Record<string, unknown>;

    const fields = Object.entries(changes)
      .filter(([key, value]) => key !== META_KEY && !HIDDEN_FIELDS.has(key) && value !== undefined)
      .map(([key, value]) => ({ field: key, value: redactSecrets(value) }));

    const name = `${row.user?.firstName ?? ''} ${row.user?.lastName ?? ''}`.trim();

    return {
      id: row.id,
      action: row.action,
      entityType: normalizeEntityType(row.entityType),
      entityId: row.entityId,
      label: (meta.label as string) ?? null,
      user: {
        id: row.user?.id ?? row.userId,
        name: name || row.user?.email || 'Unknown user',
        email: row.user?.email ?? null,
        role: row.user?.role?.name ?? null,
      },
      fields,
      ipAddress: row.ipAddress ?? null,
      createdAt: row.createdAt,
    };
  }
}
