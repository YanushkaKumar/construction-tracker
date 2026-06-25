import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the company ID from the current authenticated user.
 * Shorthand for @CurrentUser('companyId')
 */
export const CompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.companyId;
  },
);
