# 04 - Technology Stack

BuildTrack utilizes a cutting-edge TypeScript-based technology stack to ensure type safety from the database up to the UI.

## 1. Web Frontend
- **Next.js (App Router)**
  - *Why*: Provides robust routing, Server-Side Rendering (SSR), and seamless API integration.
  - *Benefits*: Excellent performance and SEO.
  - *Alternatives*: React (Vite) - Rejected because it lacks built-in SSR capabilities out of the box.
- **TailwindCSS**
  - *Why*: Utility-first CSS framework for rapid UI development.
  - *Benefits*: Keeps CSS file sizes small and styling localized to components without context-switching to CSS files.
- **TanStack Query (React Query)**
  - *Why*: Manages server state, caching, and background fetching.

## 2. Mobile Frontend
- **Expo / React Native**
  - *Why*: Allows writing cross-platform mobile apps (iOS & Android) using React patterns.
  - *Benefits*: Massive ecosystem, over-the-air updates, and easy native module linking without touching Xcode or Android Studio.
  - *Alternatives*: Flutter (Dart) - Rejected to keep the codebase entirely JavaScript/TypeScript for full-stack developer efficiency.

## 3. Backend API
- **NestJS**
  - *Why*: Highly opinionated, strictly typed Node.js framework using decorators.
  - *Benefits*: Enforces solid architectural patterns (Modules, Controllers, Services), making it highly scalable and predictable.
  - *Alternatives*: Express.js - Rejected because it is too unopinionated and prone to spaghetti code in large enterprise apps.
- **Prisma ORM**
  - *Why*: Next-generation Node.js ORM.
  - *Benefits*: Auto-generated, strictly typed client based on the database schema. Eliminates entire classes of runtime errors.

## 4. Databases & Storage
- **PostgreSQL**
  - *Why*: Highly reliable, ACID-compliant relational database.
  - *Benefits*: Perfect for complex financial relationships (Loans, Repayments, BOQ Variance) and reporting.
  - *Alternatives*: MongoDB - Rejected due to the highly relational nature of construction and financial data.
- **Redis**
  - *Why*: In-memory data structure store.
  - *Benefits*: Extremely fast caching, rate-limiting, and managing background tasks.
- **MinIO**
  - *Why*: Self-hosted S3-compatible object storage.
  - *Benefits*: Avoids AWS vendor lock-in while using standard AWS SDKs. Files never leave your infrastructure.

## 5. Infrastructure & DevOps
- **Docker & Docker Compose**
  - *Why*: Containerization ensures the app runs identically in dev, staging, and production environments without "it works on my machine" issues.
- **Nginx**
  - *Why*: Lightweight, high-performance web server.
  - *Benefits*: Acts as a reverse proxy to securely route traffic between the frontend and backend, terminating SSL certificates.
- **Prometheus & Grafana**
  - *Why*: Industry-standard observability stack for monitoring metrics.
  - *Benefits*: Real-time alerts and visual dashboards of system health.
