# 11 - Mobile App Architecture

The mobile application (`apps/mobile`) is designed specifically for on-site personnel: Site Supervisors and Subcontractors. It prioritizes speed, offline capabilities, and a simplified UX.

## Core Technologies
- **Expo Framework**: Built on React Native. Provides an excellent developer experience and allows over-the-air (OTA) updates using EAS (Expo Application Services).
- **Navigation**: Uses Expo Router (file-based routing similar to Next.js).
- **Icons**: `lucide-react-native` for lightweight, scalable SVGs consistent with the web app.

## State Management & API
The mobile app relies heavily on **`@tanstack/react-query`**.
- *Why*: Mobile network conditions on construction sites are often poor. React Query provides aggressive caching, retry mechanisms, and optimistic UI updates.
- *API Calls*: Executed via `axios`, interacting exclusively with the NestJS backend at `/api/v1`.

## Key Screens
1. **Authentication Flow**: Login screen that securely stores the JWT in `SecureStore`.
2. **Dashboard**: Daily summary of assigned tasks and current project weather/status.
3. **Daily Logs**: The most critical feature. Allows supervisors to input worker counts, material deliveries, and snap photos (uploaded to MinIO) directly from the site.
4. **Task List**: Subcontractors can view their specific allocated tasks and mark them as "In Progress" or "Completed".
