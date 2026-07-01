# 29 - FAQ (Frequently Asked Questions)

### Q: Why do I get a CORS error when calling the API from localhost?
**A**: NestJS strictly enforces CORS. Ensure your `NEXT_PUBLIC_API_URL` environment variable matches the exact domain/port you are calling from, and that it is whitelisted in `apps/api/src/main.ts`.

### Q: How do I access the Grafana dashboard locally?
**A**: Ensure your Docker containers are running (`docker compose -f docker-compose.dev.yml up -d`), then navigate to `http://localhost:3001`. The default login is usually `admin` / `admin` (or whatever is set in your `.env` for `GRAFANA_ADMIN_PASSWORD`).

### Q: I updated the database schema but the frontend keeps breaking with type errors.
**A**: Whenever you change `schema.prisma`, you MUST run `npx prisma generate` in the `apps/api` folder. Since the monorepo shares types, you might also need to restart the Next.js development server to pick up the new types.

### Q: Why are my changes not reflecting in the Docker production build?
**A**: Docker caches layers heavily. If you changed a `package.json` dependency, you must rebuild the image without the cache:
`docker compose build --no-cache`

### Q: Is it safe to expose MinIO to the public internet?
**A**: You should never expose the MinIO console port (9001) publicly. The API port (9000) should ideally sit behind Nginx or a WAF, configured only to allow `GET` requests for public buckets, and requiring signed URLs for everything else.
