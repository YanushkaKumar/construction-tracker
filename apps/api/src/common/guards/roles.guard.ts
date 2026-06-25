import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check role-based access
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check permission-based access
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions are required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // Super admin bypasses all checks
    if (user.role === 'SUPER_ADMIN') return true;

    // Check roles
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        return false;
      }
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions: string[] = user.permissions || [];
      if (userPermissions.includes('*')) {
        return true;
      }
      const hasAllPermissions = requiredPermissions.every((perm) =>
        userPermissions.some((userPerm) => {
          // Support wildcard permissions (e.g., "projects:*")
          if (userPerm.endsWith(':*')) {
            const prefix = userPerm.slice(0, -1);
            return perm.startsWith(prefix);
          }
          return userPerm === perm;
        }),
      );
      return hasAllPermissions;
    }

    return true;
  }
}
