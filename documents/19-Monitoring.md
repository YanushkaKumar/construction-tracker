# 19 - Monitoring

Observability is critical for enterprise software. BuildTrack uses a combination of **Prometheus** for metrics collection and **Grafana** for data visualization.

## Prometheus
Prometheus is configured via `infra/prometheus/prometheus.yml` to scrape metrics from our Node.js applications every 15 seconds.
- **NestJS Metrics**: Exposed at `/api/v1/metrics`. Tracks active HTTP requests, database query durations, event loop lag, and memory usage.
- **Next.js Metrics**: Tracks Server-Side Rendering (SSR) latency and 404/500 error rates.

## Grafana
Grafana connects to Prometheus and provides visual dashboards. It is accessible internally at port `3001`.
- **Pre-configured Dashboards**: Stored as JSON in `infra/grafana/dashboards/`. These are automatically loaded when Grafana starts.
- **Key Metrics to Watch**:
  1. **HTTP 500 Rates**: A sudden spike indicates a critical backend bug.
  2. **PostgreSQL Connection Pool**: If connections max out, the API will bottleneck.
  3. **Event Loop Lag**: Indicates blocking synchronous code in the Node.js API, severely degrading performance.

## Alerts
Alerts can be configured in Grafana to send messages to a Slack channel or Email if memory usage exceeds 85% or if the API goes offline.
