# 07 - Environment Variables

BuildTrack requires a correctly configured `.env` file at the root of the project. This file is consumed by both the Docker Compose orchestration and the Node.js applications directly.

## Core Variables

### Database
- `DB_NAME`: The name of the PostgreSQL database. (Default: `buildtrack`)
- `DB_USER`: Database username. (Default: `buildtrack`)
- `DB_PASSWORD`: Database password. **(Required)**
- `DATABASE_URL`: Full Prisma connection string. 
  - *Example*: `postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public`
  - *Note*: In Docker production, `localhost` becomes `postgres`.

### App Configuration
- `API_URL`: The base URL where the API is hosted. Used by the Next.js frontend to make SSR fetch calls.
  - *Example*: `http://localhost:4000`
- `APP_NAME`: Used in emails and UI headers. (Default: `BuildTrack`)

## Security & Authentication
- `JWT_SECRET`: Secret key used to sign access tokens. **(Keep secure!)**
- `JWT_ACCESS_EXPIRATION`: Lifespan of the access token. (Default: `15m`)
- `JWT_REFRESH_SECRET`: Secret key used to sign refresh tokens.
- `JWT_REFRESH_EXPIRATION`: Lifespan of the refresh token. (Default: `7d`)

## Object Storage (MinIO / S3)
- `S3_ENDPOINT`: URL of the storage provider. (Default: `http://localhost:9000` for MinIO)
- `S3_ACCESS_KEY`: Access key or MinIO root user.
- `S3_SECRET_KEY`: Secret key or MinIO root password.
- `S3_BUCKET`: Name of the bucket to store files. (Default: `buildtrack-storage`)
- `S3_REGION`: Region identifier. (Default: `us-east-1`)
- `S3_FORCE_PATH_STYLE`: Must be `true` for MinIO to function correctly.

## Email & Notifications (Optional)
- `SMTP_HOST`: Mail server host.
- `SMTP_PORT`: Mail server port (usually 587).
- `SMTP_USER`: SMTP username.
- `SMTP_PASSWORD`: SMTP password.
- `SMTP_FROM`: Sending address (e.g., `noreply@buildtrack.com`).

## Security Notes
> [!CAUTION]
> Never commit your `.env` file to version control. Ensure it is included in `.gitignore`. 
> In production, `JWT_SECRET` and `DB_PASSWORD` should be long, randomly generated strings. If compromised, attackers can mint valid session tokens or dump the database.
