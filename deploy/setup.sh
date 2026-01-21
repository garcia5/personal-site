#!/bin/bash
set -e

# 1. Install Dependencies
echo "Installing system dependencies..."
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
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
npm run build
sudo npm install -g pm2 --force
# Stop existing process if any
sudo pm2 delete personal-site-backend || true
sudo pm2 start dist/index.js --name "personal-site-backend"
cd ..

# 5. Configure Nginx (Backend Proxy Only)
echo "Configuring Nginx..."
DOMAIN="terminal.alexjgarcia.com"

# Copy the HTTP template
sudo cp deploy/nginx-backend-only.conf /etc/nginx/sites-available/personal-site
# Update server_name to real domain
sudo sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/personal-site

sudo ln -sf /etc/nginx/sites-available/personal-site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# 6. Enable SSL (Certbot)
echo "Setting up SSL..."
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "SSL certificate already exists for $DOMAIN"
    # Ensure Nginx uses it (in case we overwrote config with HTTP template)
    # We run certbot again to reinstall the redirect/ssl block without getting a new cert
    sudo certbot install --nginx -d $DOMAIN --redirect --non-interactive
else
    echo "Requesting new SSL certificate..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email agarcia1359@gmail.com --redirect
fi

echo "Backend Deployment Complete!"
