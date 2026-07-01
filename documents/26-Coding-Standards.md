# 26 - Coding Standards

Consistent coding standards prevent bugs and ensure the codebase remains maintainable as new developers join the team.

## 1. File and Folder Naming
- **Kebab-Case**: All folders and non-component files must use kebab-case (e.g., `bank-loan.service.ts`, `auth.controller.ts`).
- **PascalCase**: React Components must use PascalCase (e.g., `BankLoansTab.tsx`, `DashboardCard.tsx`).
- **CamelCase**: Variables and functions must use camelCase (e.g., `fetchProjects`, `outstandingDebt`).

## 2. Formatting (Prettier & ESLint)
The project strictly enforces styling via ESLint and Prettier.
Before committing, ensure your code passes:
```bash
npm run lint
```
*Note*: Configure your IDE (VSCode/WebStorm) to "Format on Save" using the project's `.prettierrc` configuration.

## 3. NestJS (Backend) Standards
- **Keep Controllers Lean**: Controllers should only handle HTTP routing, param validation, and JWT extraction. All business logic MUST live in the `Service`.
- **Use DTOs**: Never accept raw `any` types in requests. Always use heavily decorated Data Transfer Objects (DTOs) with `class-validator` (e.g., `@IsString()`, `@IsNumber()`).
- **Avoid Raw SQL**: Always use the Prisma Client. If raw SQL is absolutely necessary for complex aggregations, document the reasoning thoroughly.

## 4. Next.js (Frontend) Standards
- **Server Components by Default**: Do not use `'use client'` unless the component strictly requires interactivity (e.g., `onClick`, `useState`). Data fetching should happen on the server.
- **Component Colocation**: Put components specific to a route inside that route's `components/` folder (e.g., `projects/[id]/components/BOQTab.tsx`). Shared components go in the global `src/components/ui/`.
- **UI Design Language**: Use flat, solid designs. Avoid complex glassmorphism (`bg-white/60 backdrop-blur-lg`) as it degrades accessibility and scrolling performance. Use standard Tailwind spacing and colors (`bg-white dark:bg-zinc-950`).
