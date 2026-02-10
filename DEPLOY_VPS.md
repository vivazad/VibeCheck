# VibeCheck VPS Deployment Guide

This guide walks you through deploying VibeCheck to a Virtual Private Server (VPS) using the automated setup script.

## Prerequisites

1.  **A VPS**:
    - Providers: DigitalOcean, Linode, AWS EC2, Vultr, Hetzner.
    - Spec: Minimum 1 vCPU, 2GB RAM (Ubuntu 22.04 or 24.04 LTS recommended).
2.  **Domain Name**:
    - Point an **A Record** for your domain (e.g., `app.vibecheck.com`) to your VPS IP address.
    - **Recommended**: Use Cloudflare for DNS and SSL (set SSL/TLS mode to "Flexible" or "Full").

## Step 1: Transfer Files

Run this command from your **local machine** (where your code is) to copy the project to your VPS. Replace `your-vps-ip` with your server's IP address.

```bash
# Copy all files to the VPS
scp -r . root@your-vps-ip:~/vibecheck
```

*Note: If you use an SSH key, you might need `scp -i /path/to/key.pem ...`*

## Step 2: Run Setup Script

SSH into your VPS:

```bash
ssh root@your-vps-ip
```

Navigate to the folder and run the script:

```bash
cd ~/vibecheck

# Make the script executable (if not already)
chmod +x setup-vps.sh

# Run the setup
./setup-vps.sh
```

## Step 3: Configure Environment

The script will generate a `.env` file for you. You **must** edit it to set your production values:

1.  **MONGO_PASSWORD**: Set a strong password.
2.  **CORS_ORIGIN**: Set this to your actual domain (e.g., `https://app.vibecheck.com`).
    - *Important*: If using Cloudflare, this must match the browser URL exactly.

```bash
nano .env
```

After saving (Ctrl+O, Enter, Ctrl+X), restart the application to apply changes:

```bash
docker compose -f docker-compose.prod.yml restart
```

## Step 4: Verify Deployment

Open your browser and visit your domain (e.g., `http://your-vps-ip` or `https://app.vibecheck.com` if DNS is propagated).

To match local testing:
- **Frontend**: Served on Port 80.
- **Backend API**: Protected internally, accessible via `http://your-domain/api/v1`.
- **Health Check**: `http://your-domain/health` (Nginx) or API health via `docker exec`.

## Maintenance

**View Logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Update Application:**
1. Copy new files to VPS (using `scp` or `git pull` if you set up git).
2. Rebuild:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
