# Deployment Guide

This document outlines the architecture, configuration, and management of the interactive terminal backend hosted on AWS EC2.

## Architecture Overview

- **Frontend:** Hosted on AWS S3 + CloudFront (Static Site).
- **Backend:** Hosted on a single AWS EC2 instance (Ubuntu).
  - **Runtime:** Node.js (Express + WebSocket).
  - **Terminal Engine:** `node-pty` spawns ephemeral Docker containers.
  - **Sandboxing:** Docker limits CPU/RAM and networking.
  - **Reverse Proxy:** Nginx handles SSL termination and WebSocket proxying.

## Prerequisites

- AWS Account
- Domain name managed by Cloudflare (DNS)
- AWS EC2 Key Pair (PEM file)

## 1. Cloudflare Configuration (DNS)

To connect the frontend (`https://alexjgarcia.com`) to the backend, we use a subdomain.

- **Record Type:** `A`
- **Name:** `terminal` (Result: `terminal.alexjgarcia.com`)
- **Content:** `<Your EC2 Elastic/Public IP>`
- **Proxy Status:** **DNS Only** (Grey Cloud) - *Crucial for Certbot SSL validation.*

## 2. AWS EC2 Instance Setup

### Instance Details
- **AMI:** Ubuntu 22.04 LTS (or newer)
- **Type:** `t3.small` (Recommended min for Docker builds) or `t3.medium`.
- **Storage:** 20GB+ gp3 (Docker images take space).

### Security Group (`portfolio-sg`)
| Type | Port | Source | Description |
|---|---|---|---|
| SSH | 22 | My IP | Admin Access |
| HTTP | 80 | 0.0.0.0/0 | Certbot Validation / Web |
| HTTPS | 443 | 0.0.0.0/0 | Secure WebSocket (WSS) |

### Networking
- **VPC:** Custom VPC (`portfolio-vpc`)
- **Subnet:** Public Subnet (with Internet Gateway route)
- **Elastic IP:** Required (to prevent IP changes on stop/start).

## 3. Elastic IP Setup (CRITICAL)

To avoid your DNS and GitHub Actions breaking when the instance restarts (e.g., due to scheduled cost-saving stops), you **must** use an Elastic IP.

1.  **Allocate:** In AWS EC2 Console, go to **Network & Security > Elastic IPs**.
2.  **Allocate Address:** Click "Allocate Elastic IP address".
3.  **Associate:** Select the new IP -> **Actions > Associate Elastic IP address**.
4.  **Target:** Choose your EC2 instance and its private IP.
5.  **Update DNS:** Set the `terminal.alexjgarcia.com` A record in Cloudflare to this Elastic IP.

## 4. Initial Deployment

1. **SSH into the server:**
   ```bash
   ssh ubuntu@terminal.alexjgarcia.com
   ```

2. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/personal-site.git
   cd personal-site
   ```

3. **Run the Setup Script:**
   This script installs Docker, Node.js, Nginx, builds the container, and starts the backend.
   ```bash
   chmod +x deploy/setup.sh
   ./deploy/setup.sh
   ```

4. **Enable SSL (Certbot):**
   Required for `wss://` to work from `https://` frontend.
   ```bash
   sudo certbot --nginx -d terminal.alexjgarcia.com
   ```

5. **Configure Startup Behavior**
   The EC2 backend instance is shut down + started up daily by an EventBridge schedule. Add an entry to the system's
   crontab to make sure the `deploy/on-boot.sh` script is executed each time the system starts up.
   ```bash
   CRON_JOB="@reboot $HOME/personal-site/deploy/on-boot.sh >> $HOME/on-boot.log 2>&1"
   (crontab -l 2>/dev/null | grep -v "on-boot.sh"; echo "$CRON_JOB") | crontab -
   ```

## 4. Updates & Maintenance

### Updating the Backend Code
If you push changes to `server/` or the `Dockerfile`:

1. SSH into the server.
2. Pull changes: `git pull`
3. Re-run setup: `./deploy/setup.sh` (It rebuilds the image and restarts PM2).

### Updating the Frontend
Run locally and sync to S3:
```bash
VITE_WS_URL="wss://terminal.alexjgarcia.com/ws" npm run build
aws s3 sync dist/ s3://<your-bucket> --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

## 5. Troubleshooting

**Check Backend Logs:**
```bash
pm2 logs personal-site-backend
```

**Check Docker Containers:**
```bash
docker ps -a
```

**Restart Backend Manualy:**
```bash
pm2 restart personal-site-backend
```

**Test Nginx:**
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

## 6. Continuous Deployment (GitHub Actions)

This repository includes two automated workflows:

### **Frontend (`.github/workflows/main.yml`)**
*   **Trigger:** Push to `main`.
*   **Action:** Builds the React app and syncs it to S3 + CloudFront.
*   **Key Feature:** Injects the `VITE_WS_URL` at build time so the frontend knows where to connect.

### **Backend (`.github/workflows/deploy-backend.yml`)**
*   **Trigger:** Push to `main` involving `server/**` or `deploy/**` files.
*   **Action:** SSHs into the EC2 instance, pulls the latest code, and runs `./deploy/setup.sh` to rebuild the container and restart the service.

### **Required GitHub Secrets**
Go to **Settings > Secrets and variables > Actions** and add:

| Secret Name | Value | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | For S3/CloudFront deploy |
| `AWS_SECRET_ACCESS_KEY` | `...` | For S3/CloudFront deploy |
| `EC2_HOST` | `terminal.alexjgarcia.com` | IP or Domain of EC2 |
| `EC2_USERNAME` | `ubuntu` | SSH Username |
| `EC2_SSH_KEY` | `-----BEGIN RSA PRIVATE KEY...` | Content of your `.pem` key |
| `VITE_WS_URL` | `wss://terminal.alexjgarcia.com/ws` | Secure WebSocket URL |

