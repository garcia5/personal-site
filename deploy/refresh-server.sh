#!/bin/bash
set -e

# 1. Rebuild docker container
cd server
sudo docker build -t alexander-personal-site-term .

# 2. Restart webserver to pick up new image
sudo pm2 restart personal-site-backend
