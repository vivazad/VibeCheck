#!/bin/bash

# VibeCheck VPS Setup Script
# Usage: ./setup-vps.sh

set -e

echo "🚀 Starting VibeCheck VPS Setup..."

# 1. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker is already installed"
fi

# 2. Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    if [ -f .env.production ]; then
        echo "📝 Creating .env from .env.production..."
        cp .env.production .env
        
        # Generate random secrets
        JWT_SECRET=$(openssl rand -base64 32)
        HMAC_SECRET=$(openssl rand -base64 32)
        
        # Update secrets in .env
        # Use a cross-platform sed approach or simpler perl replacement to avoid mac/linux sed differences if users run this locally to test,
        # but for VPS (Linux) standard sed is fine.
        sed -i "s/your_jwt_secret_here_at_least_32_chars/$JWT_SECRET/" .env
        sed -i "s/your_hmac_secret_key_for_signatures/$HMAC_SECRET/" .env
        
        echo "🔑 Generated new secure secrets in .env"
        echo "⚠️  PLEASE EDIT .env NOW to set your MONGO_PASSWORD and CORS_ORIGIN!"
        
        # Optional: prompt user to edit now
        read -p "Do you want to edit .env now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            nano .env
        fi
    else
        echo "❌ .env.production not found. Please upload your project files."
        exit 1
    fi
fi

# 3. Build and Deploy
echo "🚀 Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build

echo "✅ Deployment complete!"
echo "   Frontend running on port 80"
echo "   Backend running internally (protected)"
echo ""
echo "👉 Check status: docker compose -f docker-compose.prod.yml ps"
echo "👉 View logs:    docker compose -f docker-compose.prod.yml logs -f"
