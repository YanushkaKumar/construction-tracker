# 18 - DevOps

DevOps at BuildTrack emphasizes Infrastructure as Code (IaC) via Docker Compose, and observability via Prometheus. The goal is to minimize manual server intervention.

## Infrastructure
The entire infrastructure stack is defined in `docker-compose.yml`. This includes:
- **Compute**: Web (Next.js) and API (NestJS) containers.
- **Data**: PostgreSQL and Redis.
- **Storage**: MinIO.
- **Observability**: Prometheus and Grafana.
- **Routing**: Nginx.

By keeping these configuration files in version control under `infra/`, any engineer can instantly recreate the production environment locally by running `docker compose up`.

## Build Processes
We utilize Docker multi-stage builds to minimize image sizes.
1. The **`node:alpine`** base image is used.
2. Dependencies are installed (`npm ci`).
3. The NestJS or Next.js code is compiled.
4. The final stage copies *only* the output (`dist` or `.next`) and `node_modules`, abandoning the raw source code and reducing the image size by up to 70%.

## Continuous Deployment
Instead of manual SSH deployments, changes pushed to the `main` branch trigger a webhook on the production server (via GitHub Actions) that automatically executes the `docker compose up --build -d` sequence, resulting in zero-downtime rolling updates.
