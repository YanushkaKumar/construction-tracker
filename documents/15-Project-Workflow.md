# 15 - Project Workflow

This document explains the complete lifecycle of adding a new feature to BuildTrack.

## 1. Developer Setup
- Ensure Docker infrastructure is running (`docker compose -f docker-compose.dev.yml up -d`).
- Pull the latest `main` or `develop` branch.
- Run `npm install` at the root.

## 2. Database Modification (If necessary)
- Modify `apps/api/prisma/schema.prisma`.
- Generate the migration: `npx prisma migrate dev --name feature_name`.
- Regenerate the Prisma Client (usually automatic, but run `npx prisma generate` to be safe).

## 3. Backend Development (`apps/api`)
- Create the necessary DTOs (Data Transfer Objects) for input validation.
- Create or update the NestJS Controller (handling HTTP requests).
- Create or update the NestJS Service (handling business logic and Prisma calls).
- Test using Postman or Swagger.

## 4. Frontend Development (`apps/web` or `apps/mobile`)
- Update the API client utility (`api-client.ts`) to hit the new endpoint.
- Create React/React Native components.
- Use `@tanstack/react-query` to fetch the data and manage loading/error states.

## 5. Deployment
- Open a Pull Request (see Git Workflow).
- CI pipeline automatically runs `npm run type-check`, tests, and builds Docker images.
- Merging to `main` triggers CD pipeline which runs `prisma migrate deploy` on the production database, pulls new images, and restarts containers via Docker Compose.
