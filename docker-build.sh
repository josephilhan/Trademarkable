#!/bin/bash

# Build Docker image
echo "Building Docker image..."
docker build -t trademarkable:latest .

echo "Docker image built successfully!"
echo "Run with: docker run -p 3000:3000 trademarkable:latest"
echo "Or use docker-compose: docker-compose up"