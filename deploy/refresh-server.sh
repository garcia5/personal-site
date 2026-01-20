#!/bin/bash
set -e

# 1. Update Server Code
cd server
npm install
npm run build

# 2. Rebuild docker container
sudo docker build -t alexander-personal-site-term .

# 3. Restart webserver to pick up new image and code
sudo pm2 delete personal-site-backend || true
sudo pm2 start dist/index.js --name "personal-site-backend"
