import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import { describeRecord, redactSecrets } from './audit.util';

const ACTION_BY_METHOD: Record<string, string> = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * Writes that are plumbing rather than record-keeping: signing in, rotating a
 * token, marking a notification read. They fire constantly and would bury the
 * activity an owner actually wants to review.
 */
const IGNORED_PATHS: RegExp[] = [
  /\/auth\//i,
  /\/notifications\/[^/]+\/read$/i,
  /\/notifications\/read-all$/i,
  /\/health$/i,
];

/**
 * Records every create, update and delete so the owner can see who changed
 * what, and when. Registered globally in AppModule, so a new endpoint is
 * covered the day it is written rather than when someone remembers to
 * annotate it.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest();
    const action = ACTION_BY_METHOD[request.method];
    if (!action) return next.handle();

    const path: string = request.originalUrl || request.url || '';
    if (IGNORED_PATHS.some((p) => p.test(path))) return next.handle();

    return next.handle().pipe(
      // Only on success: a rejected or failed request changed nothing, so
      // recording it would make the trail lie about the state of the data.
      tap((response) => {
        const user = request.user;
        if (!user?.sub || !user?.companyId) return;

        // The response is the record itself on most routes. ResponseInterceptor
        // is not applied globally, so reading `response.data.id` alone left
        // every CREATE recorded against the id "unknown".
        const record =
          response && typeof response === 'object' && 'data' in response
            ? (response as any).data
            : response;

        const entityId =
          (record && typeof record === 'object' && (record as any).id) ||
          request.params?.id ||
          'unknown';

        this.auditService.log({
          companyId: user.companyId,
          userId: user.sub,
          action,
          entityType: context.getClass().name.replace(/Controller$/, ''),
          entityId: String(entityId),
          // What the user submitted is what they changed. A delete submits
          // nothing, so the record that was removed is kept instead — for a
          // deleted payment or funding row, that is the whole point of asking.
          changes: redactSecrets(
            action === 'DELETE'
              ? (record && typeof record === 'object' ? record : {})
              : (request.body ?? {}),
          ) as Record<string, unknown>,
          // A cuid means nothing to a person reading the log; carry a label so
          // the trail can name the thing that changed.
          label: describeRecord(record) ?? describeRecord(request.body),
          method: request.method,
          path,
          ipAddress: request.ip,
          userAgent: request.headers?.['user-agent'],
        });
      }),
    );
  }
}
