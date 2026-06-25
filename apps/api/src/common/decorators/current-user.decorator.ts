import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the current authenticated user from the request.
 * @example getCurrentUser(@CurrentUser() user: JwtPayload)
 * @example getEmail(@CurrentUser('email') email: string)
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return null;
    return data ? user[data] : user;
  },
);
