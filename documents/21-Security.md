# 21 - Security

Security is deeply integrated into BuildTrack at multiple layers, protecting financial data and preventing unauthorized access.

## 1. Network Security
- **HTTPS Only**: Nginx handles SSL termination. All traffic over HTTP (port 80) is redirected to HTTPS (port 443).
- **Internal Docker Network**: The database, Redis, and MinIO are not exposed to the public internet. They can only be accessed by the API container via the `buildtrack-network`.

## 2. API Security
- **Helmet**: NestJS uses `helmet` to set secure HTTP headers, preventing Cross-Site Scripting (XSS) and Clickjacking.
- **Rate Limiting**: NestJS `@nestjs/throttler` backed by Redis restricts endpoints to prevent Brute Force and DDoS attacks (e.g., max 100 requests per minute per IP).
- **CORS**: Cross-Origin Resource Sharing is strictly configured to only allow requests from the designated `NEXT_PUBLIC_API_URL`.

## 3. Data Validation & Sanitization
- **Strict Validation**: The API uses `class-validator` and `ValidationPipe(whitelist: true)`. This strips any properties from the payload that are not explicitly defined in the DTO, preventing Mass Assignment attacks.
- **SQL Injection**: Prisma ORM uses parameterized queries exclusively. Raw SQL is virtually never used.

## 4. Authentication Security
- **JWT**: Tokens are cryptographically signed. The backend does not need to query the database to verify a token's integrity, but it does check the token expiration.
- **Password Hashing**: Plaintext passwords are never logged or stored. They are hashed using `bcrypt` with a work factor of 10.

## 5. Secret Management
Never hardcode secrets. All sensitive keys (`JWT_SECRET`, `DB_PASSWORD`, MinIO keys) are injected via `.env` files which are heavily restricted by server OS permissions.
