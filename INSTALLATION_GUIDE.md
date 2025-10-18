# Installation Guide for n8n-nodes-databar

## Quick Start (No npm Required!)

### Are you using n8n Cloud or Self-Hosted?

#### ☁️ **n8n Cloud** (cloud.n8n.io)
- ❌ **Cannot** install directly
- ✅ **Must** publish to npm OR use GitHub

#### 🏠 **Self-Hosted n8n** (Local/Server/Docker)
- ✅ **Can** install directly without npm
- ✅ **Can** use GitHub (private repo works!)
- ✅ **Can** publish to npm (optional)

---

## Installation Methods

### Method 1: Direct Install (Self-Hosted Only) ⭐ **Easiest**

**Requirements:** Self-hosted n8n (not Cloud)

**Steps:**
```bash
# 1. Navigate to this directory
cd /Users/davidabaev/Desktop/n8n

# 2. Run the installer
./install-local.sh

# 3. Restart n8n
# If running directly: Ctrl+C and restart
# If using PM2: pm2 restart n8n
# If using systemd: sudo systemctl restart n8n
```

**For Docker:**
```bash
# 1. Build and prepare files
./install-docker.sh

# 2. Update your docker-compose.yml (see output instructions)

# 3. Restart container
docker-compose restart
```

---

### Method 2: GitHub Install (Any Setup)

**Requirements:** GitHub account (private repo is fine!)

**Steps:**
```bash
# 1. Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Databar n8n node"

# 2. Create a new repository on GitHub
# Go to https://github.com/new
# Name it: n8n-nodes-databar
# (Can be private!)

# 3. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/n8n-nodes-databar.git
git branch -M main
git push -u origin main

# 4. Install in n8n
# Go to Settings > Community Nodes > Install
# Enter: https://github.com/YOUR_USERNAME/n8n-nodes-databar
# Or: YOUR_USERNAME/n8n-nodes-databar
```

**Benefits:**
- ✅ Works with n8n Cloud
- ✅ Can be private repository
- ✅ Version control
- ✅ Easy updates (git push + reinstall)

---

### Method 3: npm Publish (For Public Sharing)

**Requirements:** npm account

**When to use:**
- Sharing with others
- Public release
- n8n Cloud (if not using GitHub)

**Steps:**
```bash
# 1. Build the project
npm install
npm run build

# 2. Test locally first (optional)
npm pack
npm install -g ./n8n-nodes-databar-0.1.0.tgz

# 3. Publish to npm
npm login
npm publish

# 4. Install in n8n
# Settings > Community Nodes > Install
# Enter: n8n-nodes-databar
```

---

## Which Method Should I Use?

### 🤔 Decision Tree

```
Are you using n8n Cloud?
├─ Yes → Use Method 2 (GitHub) or Method 3 (npm)
└─ No (Self-hosted)
   ├─ Just for yourself? → Use Method 1 (Direct Install) ⭐
   ├─ Want version control? → Use Method 2 (GitHub)
   └─ Want to share publicly? → Use Method 3 (npm)
```

### 📊 Comparison

| Method | n8n Cloud | Self-Hosted | Private? | Easiest? | Updates |
|--------|-----------|-------------|----------|----------|---------|
| Direct Install | ❌ | ✅ | ✅ | ⭐⭐⭐ | Manual |
| GitHub | ✅ | ✅ | ✅ | ⭐⭐ | git push |
| npm Publish | ✅ | ✅ | ❌ | ⭐ | npm publish |

---

## Testing Your Installation

After installation, test the node:

1. **Add Credentials:**
   - Go to **Credentials** in n8n
   - Click **Add Credential**
   - Search for **Databar API**
   - Enter your API key
   - Click **Test** to verify

2. **Add Node:**
   - Create a new workflow
   - Click **+** to add a node
   - Search for **Databar**
   - Select the node

3. **Test Operation:**
   - Select Resource: **User**
   - Select Operation: **Get User Info**
   - Execute the node
   - Should return your account info

---

## Troubleshooting

### Node doesn't appear in n8n
- **Self-hosted:** Check that files are in `~/.n8n/custom/` and restart n8n
- **Docker:** Verify volume mount is correct
- **Any:** Check n8n logs for errors

### Credentials not working
- Verify API key is correct
- Check that you have REST API access enabled (may require call with Databar)
- Test the API key with curl:
  ```bash
  curl https://api.databar.ai/v1/user/me -H "x-apikey: YOUR_KEY"
  ```

### Build errors
- Ensure you have Node.js 16+ installed
- Run `npm install` before building
- Check for TypeScript errors: `npm run build`

---

## Updating the Node

### Method 1 (Direct Install):
```bash
cd /Users/davidabaev/Desktop/n8n
# Make your changes
./install-local.sh
# Restart n8n
```

### Method 2 (GitHub):
```bash
# Make your changes
git add .
git commit -m "Update node"
git push
# In n8n: Settings > Community Nodes > Update
```

### Method 3 (npm):
```bash
# Update version in package.json
npm run build
npm publish
# In n8n: Settings > Community Nodes > Update
```

---

## Need Help?

- **Databar API Issues:** info@databar.ai
- **n8n Installation:** https://docs.n8n.io/
- **Node Issues:** Create an issue on GitHub

