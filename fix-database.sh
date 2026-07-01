#!/bin/bash
echo "🔌 Loading environment variables..."
if [ -f .env ]; then
  set -a
  source .env
  set +a
else
  echo "❌ Error: .env file not found in root directory!"
  exit 1
fi

echo "🚀 Updating Database Schema..."
npm run db:generate --workspace=apps/api
npm run db:migrate --workspace=apps/api -- --name add_finance_tracking

echo "🌱 Seeding initial financial data..."
npm run db:reset --workspace=apps/api -- --force --skip-seed
npm run db:seed --workspace=apps/api

echo "✅ Database updated!"
echo "⚠️ IMPORTANT: Please restart your backend server (stop the current one and run 'npm run dev' again)"

