#!/bin/bash
# ==============================================================================
# BuildTrack — Build & Push Docker Images to AWS ECR
# ==============================================================================
set -e

# AWS Registry Details
AWS_ACCOUNT_ID="842549707720"
AWS_REGION="us-east-1"
REGISTRY_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
AWS_CLI_PATH="/home/yanushka/.local/bin/aws"

echo "🔐 Logging Docker into Amazon ECR..."
sudo -u yanushka $AWS_CLI_PATH ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REGISTRY_URL

echo "🚀 Building NestJS API image..."
docker build -t buildtrack-api ./apps/api

echo "🏷️  Tagging API image..."
docker tag buildtrack-api:latest ${REGISTRY_URL}/buildtrack-api:latest

echo "📤 Pushing API image to Amazon ECR..."
docker push ${REGISTRY_URL}/buildtrack-api:latest

echo "🚀 Building Next.js Web image..."
docker build -t buildtrack-web ./apps/web

echo "🏷️  Tagging Web image..."
docker tag buildtrack-web:latest ${REGISTRY_URL}/buildtrack-web:latest

echo "📤 Pushing Web image to Amazon ECR..."
docker push ${REGISTRY_URL}/buildtrack-web:latest

echo "🎉 All images successfully built and pushed to Amazon ECR!"
echo "   - API: ${REGISTRY_URL}/buildtrack-api:latest"
echo "   - Web: ${REGISTRY_URL}/buildtrack-web:latest"
