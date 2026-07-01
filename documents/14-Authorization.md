# 14 - Authorization

While *Authentication* verifies WHO the user is, *Authorization* (Role-Based Access Control - RBAC) verifies WHAT they are allowed to do.

## Roles
Roles are defined in the Prisma schema as an Enum and attached to the `User` model.
- **`SUPER_ADMIN`**: God-mode. Access to system settings, user creation, and audit logs.
- **`FINANCE_MANAGER`**: Can create Bank Loans, record repayments, process payroll, and view treasury dashboards.
- **`PROJECT_MANAGER`**: Can create projects, edit BOQs, allocate budgets, and assign subcontractors.
- **`SITE_SUPERVISOR`**: Can submit daily logs, view project details, but cannot view financial margins or loan data.
- **`SUBCONTRACTOR`**: Can only view tasks explicitly assigned to them.

## Middleware & Access Flow (NestJS)
Authorization is enforced purely on the Backend API using NestJS Guards and custom Decorators.

### 1. `JwtAuthGuard`
Applied globally or per-controller. Verifies the user's Access Token is valid and extracts their `role` from the JWT payload.

### 2. `@Roles()` Decorator
A custom decorator used to specify which roles can access a specific endpoint.

```typescript
// Example Implementation in NestJS Controller
@Post(':id/repayments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.FINANCE_MANAGER)
async recordRepayment(@Body() dto: CreateRepaymentDto) {
  // Only Admins and Finance Managers can hit this endpoint
}
```

### 3. `RolesGuard`
This guard reads the roles defined in the `@Roles()` decorator via reflection and compares them against the `user.role` extracted from the JWT. If the role doesn't match, it throws a `403 Forbidden` exception.
