# 27 - Future Improvements

BuildTrack is highly functional, but the architecture allows for significant future scalability. Here are proposed enhancements for future sprints:

## 1. Message Queuing (RabbitMQ / Kafka)
Currently, heavy reports (like generating a massive PDF ledger for a project) are handled synchronously by the API, which blocks the event loop.
**Improvement**: Introduce a RabbitMQ container to handle asynchronous jobs. The API pushes a "generate_report" event to the queue, and a separate worker service processes it, emailing the PDF to the user when finished.

## 2. Real-Time WebSockets
Presently, updates rely on client-side polling or manual refreshes.
**Improvement**: Implement NestJS WebSockets (`@nestjs/websockets` with Socket.io). When a field worker submits a daily log from the mobile app, the Web Dashboard receives a push notification and live-updates the screen without a refresh.

## 3. High Availability Database
Currently, PostgreSQL is running as a single container instance.
**Improvement**: Migrate to a Managed PostgreSQL instance (like AWS RDS or DigitalOcean Managed Databases) with read replicas and automated point-in-time recovery (PITR) backups.

## 4. Enhanced Caching
Cache aggressive read-heavy endpoints (like the Projects List) using Redis JSON instead of standard strings for faster querying and field extraction directly from the cache layer.

## 5. Mobile Offline Mode
Enhance `@tanstack/react-query` with a persistence persister (like `async-storage`). If a site supervisor logs a purchase while in an area with zero cellular reception, the app queues the mutation locally and automatically pushes it to the API once the connection is restored.
