# 05 - Development Setup

This guide will walk you through setting up BuildTrack for local development.

## Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Docker**: Docker Engine and Docker Compose (required to spin up the local database and Redis)
- **Git**: For version control
- **Expo CLI**: (Optional, but recommended for mobile development: `npm install -g expo-cli`)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/buildtrack.git
cd buildtrack
```

### 2. Install Dependencies
Since this is a monorepo, dependencies are installed globally at the root and linked via workspace configurations.
```bash
npm install
```

### 3. Environment Variables
Copy the example environment file and configure it.
```bash
cp .env.example .env
```
*Note: See [07-Environment-Variables](./07-Environment-Variables.md) for details on what each variable does.*

### 4. Setup Infrastructure (Database & Redis)
Instead of installing PostgreSQL and Redis natively on your machine, use the provided development Docker Compose file to spin them up.
```bash
docker compose -f docker-compose.dev.yml up -d
```
*(This will start Postgres on port 5432 and Redis on port 6379)*

### 5. Database Initialization
Once the database container is running, push the Prisma schema to generate tables and create the Prisma Client.
```bash
cd apps/api
npx prisma db push --schema=prisma/schema
npx prisma generate
cd ../..
```

## Running the Development Servers

You can run the web frontend and API backend concurrently from the root directory if you have workspace scripts configured, or run them in separate terminal windows.

**Terminal 1 (Backend API):**
```bash
npm run dev:api
```
*(Starts the NestJS server on `http://localhost:4000`)*

**Terminal 2 (Frontend Web):**
```bash
npm run dev:web
```
*(Starts the Next.js server on `http://localhost:3000`)*

## Troubleshooting Setup

- **`PrismaClientInitializationError`**: Ensure your `docker compose -f docker-compose.dev.yml up -d` command succeeded and that the `DATABASE_URL` in your `.env` matches the local credentials (usually `postgresql://buildtrack:buildtrack@localhost:5432/buildtrack?schema=public`).
- **Cannot POST /api/v1/...**: You may have updated the schema without pushing. Run `cd apps/api && npx prisma db push`.
