# 25 - CI/CD Pipeline

BuildTrack utilizes **GitHub Actions** for Continuous Integration (CI) and Continuous Deployment (CD). The pipeline is defined in `.github/workflows/ci.yml`.

## Continuous Integration (CI)

Triggered automatically whenever a developer opens a Pull Request against the `develop` or `main` branches.

### Pipeline Steps:
1. **Checkout Code**: Pulls the repository.
2. **Setup Node**: Provisions Node.js 20 environments using caching for `node_modules` to speed up builds.
3. **Install Dependencies**: Runs `npm ci`.
4. **Linting**: Runs `npm run lint` to enforce ESLint and Prettier rules across all apps.
5. **Type Checking**: Runs `npx tsc --noEmit` across `apps/api` and `apps/web` to catch strict TypeScript errors.
6. **Testing**: Runs `npm run test` (Jest unit tests).

*If any step fails, the Pull Request is blocked from merging.*

## Continuous Deployment (CD)

Triggered automatically when a Pull Request is successfully merged into the `main` branch.

### Pipeline Steps:
1. **Docker Build**: The runner builds the `buildtrack-web` and `buildtrack-api` images.
2. **Push to Registry**: The images are pushed to a private Docker container registry (e.g., GitHub Packages or Docker Hub).
3. **Webhook Trigger**: The production server receives a secure webhook, pulling the latest `docker-compose.yml` and executing:
   ```bash
   docker compose pull
   docker compose up -d
   ```
4. **Database Migrations**: Finally, a post-deploy script runs `npx prisma migrate deploy` to safely update the database schema without destroying data.
