# 06 - Running the Project

This document details how to run the project in both Development and Production environments.

## Development Mode

In development, we rely on Node's native hot-reloading (Next.js fast refresh, NestJS SWC compiler) rather than putting the application code inside Docker. Only the infrastructure runs in Docker.

1. **Start Infrastructure**:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
2. **Start Services**:
   - Web: `npm run dev:web`
   - API: `npm run dev:api`
   - Mobile: `cd apps/mobile && npm run start`

## Production Mode (Docker Orchestration)

In production, the entire application stack is containerized using the root `docker-compose.yml`.

### Architecture Services
- `nginx`: Reverse proxy mapping port `80/443` to internal services.
- `web`: Next.js production build (`buildtrack-web`).
- `api`: NestJS production build (`buildtrack-api`).
- `postgres`: PostgreSQL 16 database.
- `redis`: Redis 7 cache.
- `minio`: S3-compatible storage.
- `prometheus`: Scrapes metrics from `api` and `web`.
- `grafana`: Visualizes metrics from `prometheus`.

### Ports
- **80 / 443**: Nginx (Main Entrypoint)
- **3000**: Next.js Web App (Internal)
- **4000**: NestJS API (Internal)
- **5432**: PostgreSQL
- **6379**: Redis
- **9000 / 9001**: MinIO API / Console
- **3001**: Grafana Dashboard

### Startup Order
Docker Compose handles the startup sequence via `depends_on` and `healthcheck` configurations.
1. `postgres` and `redis` start first.
2. `api` waits for `postgres` and `redis` to pass their health checks.
3. `web` waits for the `api` to be healthy (specifically pinging `/api/v1/health`).
4. `nginx` waits for both `web` and `api` to be fully started before routing traffic.

### Command to Run Production
```bash
# Build the Next.js and NestJS images, then start all services in detached mode
docker compose up --build -d
```

### Viewing Production Logs
```bash
# View all logs
docker compose logs -f

# View logs for a specific service (e.g., API)
docker compose logs -f api
```
