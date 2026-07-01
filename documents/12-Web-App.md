# 12 - Web App Architecture

The web application (`apps/web`) is the command center for BuildTrack, utilized by Project Managers, Finance/Treasury teams, and Super Admins. It is built using **Next.js 14+ (App Router)**.

## Routing and Layouts
The app uses file-based routing inside `src/app`.
- **`(app)/`**: A route group for authenticated pages. Contains the main navigation sidebar layout (`layout.tsx`).
- **`dashboard/page.tsx`**: The main overview screen.
- **`finance/page.tsx`**: Treasury management, integrating `BankLoansTab`.
- **`projects/[id]/page.tsx`**: Dynamic route for viewing a specific project, rendering nested components like `BOQTab`.

## React Server Components vs Client Components
By default, Next.js uses Server Components for fast initial page loads and excellent SEO.
- **Client Components (`'use client'`)**: Used specifically for interactive elements like the `BankLoansTab`, charting libraries, and places utilizing React Hooks (`useState`, `useQuery`).

## Components & UI
The UI is strictly standardized. 
- Custom, reusable atomic components (`Button`, `Card`, `Input`) live in `src/components/ui/`.
- **Styling**: TailwindCSS is used exclusively. The design language emphasizes flat, clean enterprise UI (solid colors, subtle borders) over heavy glassmorphism to maximize text readability and performance.

## Data Fetching
- **Server Actions / SSR**: Used for initial data loads on heavy pages.
- **TanStack Query (React Query)**: Used on the client side (`'use client'`) to fetch real-time updates (like loan repayments or task status changes) without full page reloads, calling the NestJS API.
