#!/bin/bash

# Install and build the node
echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the node..."
npm run build

# Detect n8n custom directory
N8N_CUSTOM_DIR="${N8N_CUSTOM_EXTENSIONS_DIR:-$HOME/.n8n/custom}"

echo "📂 Installing to: $N8N_CUSTOM_DIR"

# Create directory if it doesn't exist
mkdir -p "$N8N_CUSTOM_DIR"

# Copy built files
echo "📋 Copying files..."
cp -r dist/* "$N8N_CUSTOM_DIR/"

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Restart your n8n instance"
echo "2. Go to Credentials and add 'Databar API' credentials"
echo "3. Add the 'Databar' node to your workflow"
echo ""
echo "Note: If using Docker, you may need to mount $N8N_CUSTOM_DIR as a volume"

