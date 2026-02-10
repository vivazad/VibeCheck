#!/bin/bash

# VibeCheck Local Demo Runner
# runs the production docker stack locally

set -e

echo "🚀 Setting up VibeCheck local demo..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Create temporary .env.demo if not exists
if [ ! -f .env.demo ]; then
    echo "📝 Creating .env.demo configuration..."
    cat > .env.demo <<EOL
# Demo Configuration
MONGO_USERNAME=vibecheck
MONGO_PASSWORD=demo_secret_password_123
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=1d
HMAC_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://localhost
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
EOL
    echo "✅ Created .env.demo with local settings"
fi

echo "🐳 Building and starting containers..."
echo "----------------------------------------"
echo "Frontend: http://localhost"
echo "API:      http://localhost/api/v1"
echo "----------------------------------------"
echo "Press Ctrl+C to stop"

docker compose -f docker-compose.prod.yml --env-file .env.demo up --build

# Cleanup (optional, keeping volumes for persistence)
# docker compose -f docker-compose.prod.yml --env-file .env.demo down
