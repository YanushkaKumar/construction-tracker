import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/roles.decorator';

/**
 * Permissions that are implied by a broader one. A holder of the broader
 * permission satisfies any requirement for the narrower.
 *
 * Without this, a COMPANY_OWNER — who is granted `projects:manage_all` but not
 * `projects:manage_assigned` — is refused on endpoints guarded by the narrower
 * permission, locking the owner out of editing their own projects. Resolving it
 * here fixes every existing company without rewriting stored role rows.
 */
const PERMISSION_IMPLIES: Record<string, string[]> = {
  'projects:manage_all': ['projects:manage_assigned', 'projects:view'],
  'expenses:view_all': ['expenses:view_own'],
  'attendance:view': ['attendance:view_own'],
};

function expandPermissions(granted: string[]): Set<string> {
  const all = new Set(granted);
  for (const p of granted) {
    for (const implied of PERMISSION_IMPLIES[p] ?? []) all.add(implied);
  }
  return all;
}

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
      const granted: string[] = user.permissions || [];
      if (granted.includes('*')) {
        return true;
      }
      const userPermissions = [...expandPermissions(granted)];
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
