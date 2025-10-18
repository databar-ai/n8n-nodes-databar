#!/bin/bash

# Install and build the node
echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the node..."
npm run build

# Create a local custom directory for Docker mounting
CUSTOM_DIR="./n8n-custom"
mkdir -p "$CUSTOM_DIR"

echo "📋 Copying files to $CUSTOM_DIR..."
cp -r dist/* "$CUSTOM_DIR/"

echo "✅ Build complete!"
echo ""
echo "📌 Docker Setup Instructions:"
echo ""
echo "Add this volume mount to your docker-compose.yml or docker run command:"
echo ""
echo "  volumes:"
echo "    - $(pwd)/n8n-custom:/home/node/.n8n/custom"
echo ""
echo "Example docker-compose.yml:"
echo ""
cat << 'EOF'
version: "3"
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    volumes:
      - ~/.n8n:/home/node/.n8n
      - ./n8n-custom:/home/node/.n8n/custom
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
EOF
echo ""
echo "Then run: docker-compose restart"

