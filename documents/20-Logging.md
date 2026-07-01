# 20 - Logging

BuildTrack utilizes standardized JSON logging to ensure logs are machine-readable and easily searchable.

## Logging Strategy

### Backend (NestJS)
We use the built-in NestJS `Logger` class, enhanced to output JSON logs in production.
- **HTTP Requests**: Every incoming request and its duration is logged.
- **Prisma Queries**: In development, raw SQL queries are logged to the console. In production, only queries exceeding 500ms are logged as warnings.
- **Error Boundaries**: Unhandled exceptions are caught by a global Exception Filter, logged with stack traces, and returned to the client as a generic HTTP 500 error to prevent leaking stack details.

### Frontend (Next.js)
Client-side errors are logged to the browser console. Server-side rendering errors are logged to the Next.js standard output.

## Log Levels
- **`ERROR`**: Critical failures requiring immediate attention (e.g., database connection dropped).
- **`WARN`**: Anomalies that don't stop the application (e.g., slow queries, invalid login attempts).
- **`INFO`**: Normal operational events (e.g., "User logged in", "Loan created").
- **`DEBUG`**: Highly detailed flow information (disabled in production).

## Storage and Rotation
Currently, logs are output to `stdout` and `stderr` and managed by the Docker daemon.
To prevent Docker logs from consuming all disk space, log rotation should be configured in `/etc/docker/daemon.json` on the host machine:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
```
