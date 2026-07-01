# 23 - Troubleshooting

A quick-reference guide for resolving the most common issues encountered by developers and DevOps engineers on BuildTrack.

## 1. Nginx 502 Bad Gateway
**Symptom**: Accessing the web app or API returns a 502 error.
**Cause**: Nginx is running, but it cannot communicate with the upstream `web` or `api` containers on the Docker network.
**Solution**: 
1. Check if the containers are actually running: `docker compose ps`.
2. Check the logs of the failing container: `docker compose logs -f api`.
3. Usually, this means the API crashed during startup (often due to missing environment variables).

## 2. Prisma: `Environment variable not found: DATABASE_URL`
**Symptom**: Running `npx prisma db push` fails.
**Cause**: The Prisma CLI is executing in a directory where it cannot find the `.env` file. In our monorepo, the `.env` is at the root, but the schema is in `apps/api`.
**Solution**:
Use `dotenv-cli` to map the path:
```bash
cd apps/api
npx dotenv -e ../../.env -- npx prisma db push --schema=prisma/schema
```

## 3. Database is Out of Sync (`Cannot POST...`)
**Symptom**: You added a new route or database column, but hitting the endpoint returns an error.
**Cause**: The PostgreSQL database does not have the updated tables, or the Prisma Client was not re-generated for the API.
**Solution**:
Run the sync command:
```bash
docker exec -it buildtrack-api npx prisma migrate deploy
docker exec -it buildtrack-api npx prisma generate
# Restart the container to load the new client
docker restart buildtrack-api
```

## 4. Web App Shows Stale Data
**Symptom**: A loan repayment was made on the mobile app, but the Next.js web dashboard doesn't show it immediately.
**Cause**: Next.js aggressively caches fetch requests.
**Solution**: Ensure that your API fetch calls in Server Components use `revalidate` tags, or use `react-query` in Client Components to manage cache invalidation (`queryClient.invalidateQueries`).
