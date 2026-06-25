export interface JwtPayload {
  sub: string;        // User ID
  email: string;
  companyId: string;
  role: string;       // Role name
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;        // User ID
  tokenId: string;    // Refresh token ID
  iat?: number;
  exp?: number;
}
