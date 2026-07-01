# 03 - Folder Structure

BuildTrack uses an Nx/Turborepo-style monorepo structure. This allows shared configuration and unified dependency management while keeping services isolated.

## Root Directory

```text
/
├── .github/          # GitHub Actions workflows for CI/CD pipeline
├── apps/             # Contains all deployable applications
│   ├── api/          # NestJS Backend Application
│   ├── mobile/       # Expo React Native Application
│   └── web/          # Next.js Frontend Application
├── documents/        # Comprehensive Project Documentation (You are here)
├── infra/            # Infrastructure configuration files
│   ├── grafana/      # Grafana dashboard JSON models
│   ├── nginx/        # Nginx conf.d and SSL certificates
│   ├── postgres/     # PostgreSQL init.sql scripts
│   └── prometheus/   # Prometheus scrape configurations
├── packages/         # Shared libraries (types, UI components, utilities)
├── docker-compose.yml     # Production Docker orchestration
├── docker-compose.dev.yml # Development Docker orchestration (hot-reload)
├── package.json      # Root workspace configurations
└── tsconfig.base.json# Base TypeScript configuration extended by apps
```

## Detailed Breakdown

### `apps/api`
The backend engine. 
- `src/modules/`: Contains business logic grouped by domain (auth, users, bank-loan, purchases).
- `prisma/`: Contains `schema.prisma` and migrations defining the database structure.
- `package.json`: Contains API-specific dependencies like `@nestjs/core`, `prisma`.

### `apps/web`
The web portal. 
- `src/app/`: Next.js App Router structure defining all page routes (e.g., `/dashboard`, `/finance`).
- `src/components/`: Reusable React components (UI library like Buttons, Cards).
- `src/lib/`: Utilities like API clients and date formatters.
- `tailwind.config.js`: Shared styling tokens.

### `apps/mobile`
The mobile app. 
- Contains mobile screens and React Native components, managed entirely through Expo commands (`expo start`). Uses `lucide-react-native` and `@tanstack/react-query`.

### `infra/`
Crucial for DevOps. Modifying anything in here generally requires rebuilding or restarting the Docker containers. Holds raw configurations that the Docker containers mount as Read-Only volumes on startup.
