# BuildTrack — AWS Cloud Deployment Documentation

## Part 2: AWS Infrastructure Setup (Step-by-Step)

---

## 7. AWS Infrastructure Overview

### Resource Inventory

| AWS Service | Resource Name | Purpose | Spec |
|:---|:---|:---|:---|
| **IAM** | `buildtrack-s3-user` | Programmatic access for deployments | Access Key + Policies |
| **S3** | `buildtrack-storage-yanushka` | File uploads (daily report photos, documents) | Standard storage |
| **RDS** | `buildtrack-db` | PostgreSQL database | `db.t4g.micro`, 20GB SSD |
| **ECR** | `buildtrack-api` | Docker image registry for NestJS API | Private repo |
| **ECR** | `buildtrack-web` | Docker image registry for Next.js frontend | Private repo |
| **ALB** | `buildtrack-alb` | Application Load Balancer (traffic routing) | Internet-facing |
| **ECS Cluster** | `buildtrack-cluster` | Fargate container orchestration | Serverless |
| **ECS Service** | `buildtrack-api-service` | Manages API container lifecycle | 1 task, rolling deploy |
| **ECS Service** | `buildtrack-web-service` | Manages Web container lifecycle | 1 task, rolling deploy |
| **Security Groups** | `buildtrack-alb-sg` | ALB inbound rules (ports 80, 443) | VPC-scoped |
| **Security Groups** | `buildtrack-ecs-tasks-sg` | ECS task inbound rules (ports 3000, 4000) | VPC-scoped |
| **Security Groups** | `buildtrack-db-sg` | RDS inbound rules (port 5432) | VPC-scoped |

### Network & Security Architecture

```mermaid
graph LR
    subgraph "Internet"
        USER["🌐 User"]
    end

    subgraph "Cloudflare Edge"
        CF["☁️ Cloudflare Proxy<br/>SSL Termination"]
    end

    subgraph "AWS VPC — vpc-03098c9ccd88f2637"
        subgraph "Public Subnets (3 AZs)"
            ALB["⚖️ ALB<br/>sg: buildtrack-alb-sg<br/>Ports: 80, 443"]
        end

        subgraph "ECS Tasks (awsvpc mode)"
            API_TASK["🔧 API Task<br/>sg: buildtrack-ecs-tasks-sg<br/>Port: 4000"]
            WEB_TASK["🌐 Web Task<br/>sg: buildtrack-ecs-tasks-sg<br/>Port: 3000"]
        end

        subgraph "Data Tier"
            RDS["🐘 RDS PostgreSQL<br/>sg: buildtrack-db-sg<br/>Port: 5432"]
        end
    end

    USER -->|HTTPS 443| CF
    CF -->|HTTP 80| ALB
    ALB -->|"TCP 3000<br/>(from ALB SG only)"| WEB_TASK
    ALB -->|"TCP 4000<br/>(from ALB SG only)"| API_TASK
    API_TASK -->|"TCP 5432<br/>(from ECS SG only)"| RDS

    style CF fill:#f48120,color:#fff
    style ALB fill:#ff9900,color:#fff
    style API_TASK fill:#e0234e,color:#fff
    style WEB_TASK fill:#000,color:#fff
    style RDS fill:#3b48cc,color:#fff
```

### Security Group Rules Summary

| Security Group | Direction | Port | Source | Purpose |
|:---|:---|:---|:---|:---|
| `buildtrack-alb-sg` | Inbound | 80 | 0.0.0.0/0 | Allow HTTP from internet |
| `buildtrack-alb-sg` | Inbound | 443 | 0.0.0.0/0 | Allow HTTPS from internet |
| `buildtrack-ecs-tasks-sg` | Inbound | 4000 | `buildtrack-alb-sg` | ALB → API container |
| `buildtrack-ecs-tasks-sg` | Inbound | 3000 | `buildtrack-alb-sg` | ALB → Web container |
| `buildtrack-db-sg` | Inbound | 5432 | `buildtrack-ecs-tasks-sg` | ECS tasks → PostgreSQL |

> [!IMPORTANT]
> Security groups follow the **principle of least privilege**. The database is only accessible from ECS tasks, and ECS tasks only accept traffic from the ALB. No public IP can directly reach the containers or database.

---

## 8. Step-by-Step Setup Instructions

### Step 1: Create an IAM User

1. Go to **AWS Console → IAM → Users → Create user**.
2. Name: `buildtrack-s3-user`
3. Attach the following managed policies:
   - `AmazonS3FullAccess` — for file uploads
   - `AmazonEC2ContainerRegistryFullAccess` — for pushing Docker images
   - `AmazonECS_FullAccess` — for managing ECS services
4. Create an **Access Key** (CLI access) and save the credentials securely.

### Step 2: Create an S3 Bucket

1. Go to **AWS Console → S3 → Create bucket**.
2. Bucket name: `buildtrack-storage-yanushka`
3. Region: `us-east-1`
4. Keep "Block all public access" enabled (files are accessed via presigned URLs).
5. Enable versioning (optional, for document history).

### Step 3: Provision RDS PostgreSQL

1. Go to **AWS Console → RDS → Create database**.
2. Configuration:
   - Engine: **PostgreSQL 16**
   - Template: **Free tier**
   - Instance: `db.t4g.micro` (2 vCPU, 1GB RAM)
   - Storage: 20GB GP3 SSD
   - DB identifier: `buildtrack-db`
   - Master username: `buildtrack`
   - Master password: `BuildTrackRds2026!`
3. Connectivity:
   - VPC: Default VPC
   - Public access: **Yes** (for initial migration from local machine)
   - Security group: Create new → `buildtrack-db-sg`
4. Wait for the instance to become **Available**.
5. Note the **Endpoint**: `buildtrack-db.cgpys4iigr4r.us-east-1.rds.amazonaws.com`

### Step 4: Apply Database Migrations

Run from your local machine to initialize the database schema:

```bash
DATABASE_URL='postgresql://buildtrack:BuildTrackRds2026!@buildtrack-db.cgpys4iigr4r.us-east-1.rds.amazonaws.com:5432/buildtrack?schema=public' \
npx prisma migrate deploy --schema=apps/api/prisma/schema
```

Seed the database with demo data:
```bash
DATABASE_URL='postgresql://buildtrack:BuildTrackRds2026!@buildtrack-db.cgpys4iigr4r.us-east-1.rds.amazonaws.com:5432/buildtrack?schema=public' \
npm run db:seed --workspace=apps/api
```

> [!TIP]
> Always wrap the `DATABASE_URL` in **single quotes** (`'...'`) to prevent bash from interpreting the `!` character as history expansion.

### Step 5: Create ECR Repositories

```bash
aws ecr create-repository --repository-name buildtrack-api
aws ecr create-repository --repository-name buildtrack-web
```

### Step 6: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 842549707720.dkr.ecr.us-east-1.amazonaws.com

# Build & push API
docker build -t buildtrack-api ./apps/api
docker tag buildtrack-api:latest 842549707720.dkr.ecr.us-east-1.amazonaws.com/buildtrack-api:latest
docker push 842549707720.dkr.ecr.us-east-1.amazonaws.com/buildtrack-api:latest

# Build & push Web
docker build -t buildtrack-web ./apps/web
docker tag buildtrack-web:latest 842549707720.dkr.ecr.us-east-1.amazonaws.com/buildtrack-web:latest
docker push 842549707720.dkr.ecr.us-east-1.amazonaws.com/buildtrack-web:latest
```

### Step 7: Create Security Groups

```bash
# ALB Security Group (allow HTTP/HTTPS from internet)
aws ec2 create-security-group --group-name buildtrack-alb-sg \
  --description "ALB Security Group" --vpc-id vpc-03098c9ccd88f2637

aws ec2 authorize-security-group-ingress --group-id <ALB_SG_ID> \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id <ALB_SG_ID> \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# ECS Tasks Security Group (allow traffic only from ALB)
aws ec2 create-security-group --group-name buildtrack-ecs-tasks-sg \
  --description "ECS Tasks Security Group" --vpc-id vpc-03098c9ccd88f2637

aws ec2 authorize-security-group-ingress --group-id <ECS_SG_ID> \
  --protocol tcp --port 4000 --source-group <ALB_SG_ID>
aws ec2 authorize-security-group-ingress --group-id <ECS_SG_ID> \
  --protocol tcp --port 3000 --source-group <ALB_SG_ID>

# Allow ECS tasks to connect to RDS
aws ec2 authorize-security-group-ingress --group-id <DB_SG_ID> \
  --protocol tcp --port 5432 --source-group <ECS_SG_ID>
```

### Step 8: Create Target Groups

```bash
# API Target Group (port 4000, IP-based for Fargate)
aws elbv2 create-target-group --name buildtrack-tg-api \
  --protocol HTTP --port 4000 --vpc-id vpc-03098c9ccd88f2637 \
  --target-type ip --health-check-path /api/v1/health

# Web Target Group (port 3000, IP-based for Fargate)
aws elbv2 create-target-group --name buildtrack-tg-web \
  --protocol HTTP --port 3000 --vpc-id vpc-03098c9ccd88f2637 \
  --target-type ip
```

### Step 9: Create Application Load Balancer

1. Create the ALB via AWS Console (requires `iam:CreateServiceLinkedRole`):
   - Name: `buildtrack-alb`
   - Scheme: Internet-facing
   - Subnets: Select at least 3 availability zones
   - Security group: `buildtrack-alb-sg`
   - Listener: HTTP:80 → Forward to `buildtrack-tg-web`

2. Add path-based routing rule for API traffic:
```bash
aws elbv2 create-rule \
  --listener-arn <LISTENER_ARN> \
  --priority 10 \
  --conditions "Field=path-pattern,Values='/api/*','/socket.io/*'" \
  --actions Type=forward,TargetGroupArn=<API_TARGET_GROUP_ARN>
```

### ALB Routing Logic

```mermaid
graph TD
    ALB["⚖️ ALB — HTTP:80"]
    
    ALB -->|"IF path = /api/* OR /socket.io/*<br/>(Priority 10)"| TG_API["buildtrack-tg-api<br/>→ NestJS Port 4000"]
    ALB -->|"DEFAULT<br/>(Everything else)"| TG_WEB["buildtrack-tg-web<br/>→ Next.js Port 3000"]

    style ALB fill:#ff9900,color:#fff
    style TG_API fill:#e0234e,color:#fff
    style TG_WEB fill:#000,color:#fff
```

### Step 10: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name buildtrack-cluster
```

### Step 11: Create ECS Task Definitions

#### API Task Definition (`buildtrack-api`)

| Setting | Value |
|:---|:---|
| Launch type | Fargate |
| CPU | 0.25 vCPU |
| Memory | 0.5 GB |
| Network mode | awsvpc |

**Container 1: `api`**
- Image: `842549707720.dkr.ecr.us-east-1.amazonaws.com/buildtrack-api:latest`
- Port: 4000
- Environment variables:

| Variable | Value |
|:---|:---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://buildtrack:BuildTrackRds2026!@buildtrack-db.cgpys4iigr4r.us-east-1.rds.amazonaws.com:5432/buildtrack?schema=public` |
| `REDIS_HOST` | `127.0.0.1` |
| `REDIS_PORT` | `6379` |
| `JWT_SECRET` | `<your-secret>` |
| `JWT_REFRESH_SECRET` | `<your-secret>` |
| `APP_URL` | `https://build.synccent.com` |
| `S3_BUCKET` | `buildtrack-storage-yanushka` |
| `S3_REGION` | `us-east-1` |
| `S3_ACCESS_KEY` | `<IAM Access Key>` |
| `S3_SECRET_KEY` | `<IAM Secret Key>` |
| `S3_ENDPOINT` | `https://s3.us-east-1.amazonaws.com` |
| `S3_FORCE_PATH_STYLE` | `false` |

**Container 2: `redis` (Sidecar)**
- Image: `redis:7-alpine`
- Port: 6379
- Essential: No

> [!TIP]
> **Redis Sidecar Pattern**: By running Redis inside the same ECS task as the API, both containers share the same network namespace. The API connects to Redis via `127.0.0.1:6379` (localhost). This eliminates the need for Amazon ElastiCache, saving ~$15/month.

#### Web Task Definition (`buildtrack-web`)

| Setting | Value |
|:---|:---|
| Launch type | Fargate |
| CPU | 0.25 vCPU |
| Memory | 0.5 GB |

**Container 1: `web`**
- Image: `842549707720.dkr.ecr.us-east-1.amazonaws.com/buildtrack-web:latest`
- Port: 3000
- Environment variables:

| Variable | Value |
|:---|:---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `https://build.synccent.com/api/v1` |

### Step 12: Create ECS Services

```bash
# API Service
aws ecs create-service \
  --cluster buildtrack-cluster \
  --service-name buildtrack-api-service \
  --task-definition buildtrack-api \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-078db651549af25ec,subnet-0f589ca2e0d235c33,subnet-02858ba106105bd60],
    securityGroups=[<ECS_SG_ID>],
    assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<API_TG_ARN>,containerName=api,containerPort=4000"

# Web Service
aws ecs create-service \
  --cluster buildtrack-cluster \
  --service-name buildtrack-web-service \
  --task-definition buildtrack-web \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-078db651549af25ec,subnet-0f589ca2e0d235c33,subnet-02858ba106105bd60],
    securityGroups=[<ECS_SG_ID>],
    assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<WEB_TG_ARN>,containerName=web,containerPort=3000"
```

### Step 13: Configure Cloudflare DNS & SSL

1. **DNS Record**: Add a CNAME record:
   - Name: `build`
   - Target: `buildtrack-alb-977695729.us-east-1.elb.amazonaws.com`
   - Proxy: **Proxied** (orange cloud)
2. **SSL/TLS Mode**: Set to **Flexible**
3. **Always Use HTTPS**: Enable under Edge Certificates
