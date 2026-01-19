#!/bin/bash
set -e

# 1. Install Dependencies
echo "Installing system dependencies..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs nginx docker.io build-essential certbot python3-certbot-nginx

# 2. Configure Docker permissions
sudo usermod -aG docker $USER

# 3. Build the Backend & Docker Sandbox
echo "Building Terminal Sandbox..."
# Build from server/ directory where Dockerfile now lives
cd server
sudo docker build -t alexander-personal-site-term .

# 4. Install & Start Backend
echo "Starting Backend..."
npm install
npm install -g pm2
# Stop existing process if any
pm2 delete personal-site-backend || true
pm2 start index.js --name "personal-site-backend"
cd ..

# 5. Configure Nginx (Backend Proxy Only)
echo "Configuring Nginx..."
sudo cp deploy/nginx-backend-only.conf /etc/nginx/sites-available/personal-site
sudo ln -sf /etc/nginx/sites-available/personal-site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "Backend Deployment Complete!"
echo "Don't forget to run certbot if you haven't yet: sudo certbot --nginx -d terminal.alexjgarcia.com"
