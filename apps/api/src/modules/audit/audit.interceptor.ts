import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

/**
 * Interceptor that automatically logs audit trails for CUD operations.
 * Apply with @UseInterceptors(AuditInterceptor) on controllers.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit POST, PATCH, PUT, DELETE
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response) => {
        const user = request.user;
        if (!user) return;

        const actionMap: Record<string, string> = {
          POST: 'CREATE',
          PATCH: 'UPDATE',
          PUT: 'UPDATE',
          DELETE: 'DELETE',
        };

        const entityId = request.params?.id || response?.data?.id || 'unknown';
        const controllerName = context.getClass().name.replace('Controller', '');

        this.auditService.log({
          companyId: user.companyId,
          userId: user.sub,
          action: actionMap[method] || method,
          entityType: controllerName,
          entityId,
          changes: method === 'DELETE' ? {} : request.body,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
