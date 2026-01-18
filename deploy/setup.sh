#!/bin/bash
set -e

# 1. Install Dependencies
echo "Installing system dependencies..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs nginx docker.io

# 2. Configure Docker permissions
sudo usermod -aG docker $USER

# 3. Build the Backend & Docker Sandbox
echo "Building Terminal Sandbox..."
# We need to ensure we have the repo. Assuming this script is run inside the repo.
docker build -t alexander-personal-site-term .

# 4. Install & Start Backend
echo "Starting Backend..."
cd server
npm install
npm install -g pm2
# Stop existing process if any
pm2 delete personal-site-backend || true
pm2 start index.js --name "personal-site-backend"
cd ..

# 5. Build Frontend
echo "Building Frontend..."
npm install
npm run build

# 6. Deploy Frontend
echo "Deploying Frontend..."
sudo mkdir -p /var/www/personal-site
sudo cp -r dist/* /var/www/personal-site/

# 7. Configure Nginx
echo "Configuring Nginx..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/personal-site
sudo ln -sf /etc/nginx/sites-available/personal-site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "Deployment Complete! Your site should be live."
