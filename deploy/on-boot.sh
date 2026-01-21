#!/bin/bash
set -e

echo "Starting deployment on boot: $(date)"

PROJECT_DIR="$HOME/personal-site"

if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"

    echo "Pulling latest changes..."
    git fetch origin main
    git reset --hard origin/main
    git clean -fd

    ./deploy/refresh-server.sh

    echo "Boot deployment complete: $(date)"
else
    echo "Project directory not found at $PROJECT_DIR"
    exit 1
fi
