import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard that ensures all database queries are scoped to the current tenant.
 * Extracts companyId from JWT and attaches it to the request for use in services.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super admin can access all tenants
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    if (!user.companyId) {
      throw new ForbiddenException('User is not associated with any company');
    }

    // Attach companyId to request for easy access in controllers/services
    request.companyId = user.companyId;
    return true;
  }
}
