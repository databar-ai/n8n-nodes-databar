# Setting Up Self-Hosted n8n to Use Your Databar Node

You're correct - n8n Cloud only allows verified npm packages. To install your custom node, you need a self-hosted instance.

---

## Quick Start: Run n8n Locally (Fastest Method) ⭐

### Option 1: Using npx (No Installation)

```bash
# Run n8n directly (simplest way)
npx n8n

# Opens at: http://localhost:5678
```

**Then install your Databar node:**
```bash
# In a new terminal window
npm install -g https://github.com/databar-ai/n8n-nodes-databar

# Restart n8n (Ctrl+C and run npx n8n again)
```

---

## Option 2: Install n8n Globally

```bash
# Install n8n globally
npm install -g n8n

# Run n8n
n8n

# Opens at: http://localhost:5678
```

**Install your Databar node:**
```bash
# In a new terminal
cd ~/.n8n
npm install https://github.com/databar-ai/n8n-nodes-databar

# Or install globally
npm install -g https://github.com/databar-ai/n8n-nodes-databar

# Restart n8n
```

---

## Option 3: Docker (Recommended for Production)

### Using Docker Compose (Best)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - GENERIC_TIMEZONE=America/New_York
    volumes:
      - ~/.n8n:/home/node/.n8n
      - ./n8n-custom:/home/node/.n8n/custom
```

**Install your node:**

```bash
# Option A: Build and copy to custom directory
cd /Users/davidabaev/Desktop/n8n
npm install
npm run build
mkdir -p ./n8n-custom
cp -r dist/* ./n8n-custom/

# Start Docker
docker-compose up -d

# Option B: Install via npm in the container
docker-compose exec n8n npm install -g https://github.com/databar-ai/n8n-nodes-databar
docker-compose restart
```

---

## Option 4: Using Your Install Script (Easiest!) 🚀

I created scripts for you earlier. Use them:

```bash
cd /Users/davidabaev/Desktop/n8n

# Build and install
./install-local.sh

# Then run n8n
npx n8n
# Or if n8n is already installed: n8n
```

---

## Complete Setup Guide

### Step 1: Install n8n

```bash
# Install Node.js if you don't have it
# Download from: https://nodejs.org/

# Install n8n globally
npm install -g n8n
```

### Step 2: Start n8n

```bash
n8n
# Or: n8n start
```

You'll see:
```
n8n ready on http://localhost:5678
```

### Step 3: Set Up Your Account

1. Open http://localhost:5678 in your browser
2. Create your owner account (first user is the owner)
3. Set email and password

### Step 4: Install Your Databar Node

**Method A: Direct Copy (No npm needed)**
```bash
# Open a new terminal (keep n8n running)
cd /Users/davidabaev/Desktop/n8n
npm install
npm run build

# Copy to n8n custom directory
mkdir -p ~/.n8n/custom
cp -r dist/* ~/.n8n/custom/

# Restart n8n (Ctrl+C in n8n terminal, then run: n8n)
```

**Method B: Install as npm package**
```bash
# Install globally
npm install -g https://github.com/databar-ai/n8n-nodes-databar

# Or install in n8n directory
cd ~/.n8n
npm install https://github.com/databar-ai/n8n-nodes-databar

# Restart n8n
```

### Step 5: Verify Installation

1. Go to http://localhost:5678
2. Create a new workflow
3. Click **+** to add a node
4. Search for "Databar"
5. You should see it! 🎉

### Step 6: Add Credentials

1. Go to **Credentials** → **New Credential**
2. Search for "Databar API"
3. Enter your API key
4. Click **Test** → Should show ✅
5. Save

### Step 7: Test the Node

1. Add **Databar** node to workflow
2. Select:
   - Resource: **User**
   - Operation: **Get User Info**
3. Select your credentials
4. Click **Execute Node**
5. Should return your account info! 🎉

---

## Running n8n in Production

### With PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start n8n with PM2
pm2 start n8n

# Make it start on boot
pm2 startup
pm2 save

# Useful commands
pm2 status          # Check status
pm2 logs n8n        # View logs
pm2 restart n8n     # Restart
pm2 stop n8n        # Stop
```

### With Docker (Already covered above)

### As a System Service (Linux)

Create `/etc/systemd/system/n8n.service`:

```ini
[Unit]
Description=n8n - Workflow Automation
After=network.target

[Service]
Type=simple
User=yourusername
ExecStart=/usr/bin/n8n start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable n8n
sudo systemctl start n8n
sudo systemctl status n8n
```

---

## Updating Your Databar Node

After making changes:

```bash
cd /Users/davidabaev/Desktop/n8n

# Rebuild
npm run build

# Reinstall
cp -r dist/* ~/.n8n/custom/
# Or: npm install -g https://github.com/databar-ai/n8n-nodes-databar

# Restart n8n
```

---

## Common n8n Directories

- **Data**: `~/.n8n/`
- **Custom nodes**: `~/.n8n/custom/`
- **Credentials**: `~/.n8n/database.sqlite`
- **Workflows**: Stored in SQLite database

---

## Environment Variables

Useful n8n environment variables:

```bash
# Basic Auth
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER=admin
export N8N_BASIC_AUTH_PASSWORD=yourpassword

# Timezone
export GENERIC_TIMEZONE="America/New_York"

# Custom Extensions Directory
export N8N_CUSTOM_EXTENSIONS_DIR=~/.n8n/custom

# Webhook URL (if using webhooks)
export WEBHOOK_URL=http://localhost:5678/
```

---

## Troubleshooting

### Node doesn't appear after installation

```bash
# Check if files are in custom directory
ls ~/.n8n/custom/

# Check n8n logs
n8n start --log-level=debug

# Restart n8n completely
# Ctrl+C, then: n8n start
```

### Port 5678 already in use

```bash
# Use a different port
n8n start --port 5679

# Or find and kill the process
lsof -ti:5678 | xargs kill -9
```

### Permission errors

```bash
# Fix permissions
sudo chown -R $USER ~/.n8n
```

---

## Comparison: Self-Hosted vs n8n Cloud

| Feature | Self-Hosted | n8n Cloud |
|---------|-------------|-----------|
| Custom nodes | ✅ Any node | ❌ Verified only |
| Cost | Free (hosting costs only) | Paid plans |
| Control | Full control | Managed |
| Updates | Manual | Automatic |
| Setup | ~5 minutes | Instant |
| Maintenance | You manage | n8n manages |

---

## Quick Command Reference

```bash
# Start n8n
npx n8n                          # Run without installing
n8n                              # Run installed version
n8n start                        # Same as above

# Install Databar node
npm install -g https://github.com/databar-ai/n8n-nodes-databar

# Or use custom directory
mkdir -p ~/.n8n/custom
cp -r /path/to/dist/* ~/.n8n/custom/

# Check logs
n8n start --log-level=debug

# Use different port
n8n start --port 5679
```

---

## Next Steps

1. ✅ Install n8n: `npm install -g n8n`
2. ✅ Start n8n: `n8n`
3. ✅ Install Databar node: `npm install -g https://github.com/databar-ai/n8n-nodes-databar`
4. ✅ Restart n8n
5. ✅ Add credentials
6. ✅ Test it!

---

**You're ready to go! Let me know if you need help with any step.**

