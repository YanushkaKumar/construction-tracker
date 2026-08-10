import { registerAs } from '@nestjs/config';

const DEV_FALLBACK_SECRET = 'change-me-in-production';

/**
 * Resolve a JWT secret, refusing to fall back to a well-known default in
 * production — a shared placeholder secret lets anyone forge valid tokens.
 */
function requireSecret(name: string): string {
  const value = process.env[name];
  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${name} must be set in production. Refusing to start with a default JWT secret.`,
    );
  }

  return DEV_FALLBACK_SECRET;
}

export const authConfig = registerAs('auth', () => ({
  jwtSecret: requireSecret('JWT_SECRET'),
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshSecret: requireSecret('JWT_REFRESH_SECRET'),
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  bcryptRounds: 12,
}));
