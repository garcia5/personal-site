#!/bin/bash
set -e

echo "Building Docker image..."
docker build -t alexander-personal-site-term .

echo "Starting backend server..."
node index.js
