#!/bin/bash

set -e

echo "🚀 Setting up self-hosted n8n with Databar node..."
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon
    if [[ $(uname -m) == 'arm64' ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
    fi
fi

echo "✅ Homebrew is ready"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    brew install node
else
    echo "✅ Node.js already installed: $(node --version)"
fi

echo "✅ npm is ready: $(npm --version)"
echo ""

# Install n8n
if ! command -v n8n &> /dev/null; then
    echo "📦 Installing n8n..."
    npm install -g n8n
else
    echo "✅ n8n already installed"
fi

echo ""
echo "🔨 Building Databar node..."
cd /Users/davidabaev/Desktop/n8n
npm install
npm run build

echo ""
echo "📋 Installing Databar node..."

# Method 1: Try global install from GitHub
echo "Attempting to install from GitHub..."
npm install -g https://github.com/databar-ai/n8n-nodes-databar || {
    echo "⚠️  GitHub install failed, using local copy method..."
    
    # Method 2: Copy to custom directory
    mkdir -p ~/.n8n/custom
    cp -r dist/* ~/.n8n/custom/
    echo "✅ Databar node copied to ~/.n8n/custom/"
}

echo ""
echo "✅ Setup complete!"
echo ""
echo "═══════════════════════════════════════════"
echo "🎉 Next Steps:"
echo "═══════════════════════════════════════════"
echo ""
echo "1. Start n8n:"
echo "   n8n"
echo ""
echo "2. Open in browser:"
echo "   http://localhost:5678"
echo ""
echo "3. Create your account (first user is owner)"
echo ""
echo "4. Add Databar credentials:"
echo "   - Go to Credentials → New"
echo "   - Search 'Databar API'"
echo "   - Enter your API key"
echo ""
echo "5. Test the node:"
echo "   - Create workflow"
echo "   - Add 'Databar' node"
echo "   - Select: User → Get User Info"
echo "   - Execute!"
echo ""
echo "═══════════════════════════════════════════"
echo ""

