# Deployment Guide

This guide covers deploying VibeCheck to production environments.

## Prerequisites

- Docker and Docker Compose installed
- MongoDB Atlas account (or self-hosted MongoDB)
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)

## Quick Start (Docker)

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/vibecheck.git
cd vibecheck

# Copy and configure environment variables
cp .env.production .env
```

### 2. Configure Environment

Edit `.env` with your production values:

```bash
# Generate secure secrets
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 32  # For HMAC_SECRET

# Edit .env
nano .env
```

**Required variables:**
- `MONGO_USERNAME` / `MONGO_PASSWORD` - MongoDB credentials
- `JWT_SECRET` - Secure random string for JWT signing
- `HMAC_SECRET` - Secure random string for HMAC signing
- `CORS_ORIGIN` - Your frontend domain (e.g., `https://vibecheck.yourdomain.com`)

### 3. Deploy

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Verify Deployment

```bash
# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/health/detailed
curl http://localhost/health
```

## Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Generate cryptographically secure JWT_SECRET
- [ ] Generate cryptographically secure HMAC_SECRET
- [ ] Configure CORS_ORIGIN to your exact domain
- [ ] Enable HTTPS (see SSL section below)
- [ ] Set up firewall rules

### Database
- [ ] Enable MongoDB authentication
- [ ] Configure MongoDB replica set for HA
- [ ] Set up automated backups
- [ ] Create database indexes (run seed script)

### Monitoring
- [ ] Set up log aggregation (ELK, Datadog, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up alerting for health check failures
- [ ] Monitor container resource usage

### Performance
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression (already in nginx.conf)
- [ ] Set appropriate rate limits

## SSL/HTTPS Setup

### Option 1: Let's Encrypt with Certbot

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d vibecheck.yourdomain.com

# Auto-renewal is configured automatically
```

### Option 2: Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Update nameservers at your registrar
3. Enable Full (strict) SSL/TLS mode
4. Cloudflare handles SSL automatically

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.override.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Load Balancing

For production, consider:
- AWS Application Load Balancer
- Nginx as reverse proxy with upstream
- Kubernetes Ingress

## Cloud Deployment Options

### AWS (Recommended)

1. **ECS/Fargate** - Managed containers
   - Push images to ECR
   - Create ECS service with ALB
   - Use Parameter Store for secrets

2. **EC2** - Self-managed
   - Launch EC2 instance
   - Install Docker
   - Run docker-compose

### GCP

- Cloud Run for containers
- Cloud SQL for MongoDB (Atlas recommended instead)

### Azure

- Azure Container Instances
- Azure App Service

## Backup Strategy

### MongoDB

```bash
# Manual backup
docker exec vibecheck-mongodb mongodump --out /backup

# Automated (cron)
0 2 * * * docker exec vibecheck-mongodb mongodump --archive | gzip > /backups/mongo-$(date +%Y%m%d).gz
```

### Application Data

```bash
# Backup volumes
docker run --rm -v vibecheck_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-data.tar.gz /data
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check health
docker-compose exec backend wget -qO- http://localhost:3000/health
```

### Database connection issues

```bash
# Test connectivity
docker-compose exec backend ping mongodb

# Check MongoDB logs
docker-compose logs mongodb
```

### 502 Bad Gateway

```bash
# Check if backend is healthy
docker-compose ps
docker-compose logs backend

# Restart services
docker-compose restart backend
```

## Monitoring Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic health check (load balancer) |
| `GET /health/detailed` | Detailed status with dependencies |
| `GET /health/live` | Liveness probe (Kubernetes) |
| `GET /health/ready` | Readiness probe (Kubernetes) |

## Support

For issues, check:
1. Container logs: `docker-compose logs -f`
2. Health endpoints for dependency status
3. MongoDB connection and authentication
