# 17 - Deployment Guide

Deploying BuildTrack requires a Linux server (Ubuntu 22.04+ recommended) with Docker and Docker Compose installed.

## 1. Initial Server Setup
1. SSH into your production server.
2. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```
3. Clone the repository (or pull the latest if already cloned):
   ```bash
   git clone https://github.com/your-org/buildtrack.git
   cd buildtrack
   ```

## 2. Environment Configuration
Create the production `.env` file at the root of the project.
```bash
nano .env
```
Ensure you generate strong, random strings for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `DB_PASSWORD`. Update the `API_URL` to match your production domain.

## 3. Nginx and SSL
The `infra/nginx/conf.d` directory maps to the Nginx container. Ensure your server's domain points to the server's IP address. For SSL, place your certificates inside `infra/nginx/ssl` or configure Certbot inside Nginx.

## 4. First Time Deployment
Build the images and start the infrastructure.
```bash
docker compose up --build -d
```

### Initializing the Database
Since this is the first deployment, the database is empty. You must apply the Prisma migrations manually from within the API container.
```bash
docker exec -it buildtrack-api npx prisma migrate deploy
```

## 5. Routine Updates (Zero Downtime)
When new code is pushed to `main`, pull the changes and rebuild. Docker Compose handles graceful restarts.
```bash
git pull origin main
docker compose up --build -d
# Apply any new DB changes
docker exec -it buildtrack-api npx prisma migrate deploy
```
