#!/bin/bash
set -e

echo "Building Docker image..."
docker build -t alexander-personal-site-term .

echo "Starting backend server..."
# Local macOS configuration
export SHELL_PATH="/bin/zsh"
export DOCKER_PATH="/usr/local/bin/docker"
node index.js
