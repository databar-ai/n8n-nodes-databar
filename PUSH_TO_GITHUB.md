# Push to GitHub - Quick Guide

## Step 1: Install GitHub CLI

Open your Terminal and run these commands:

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install GitHub CLI
brew install gh
```

**OR download directly:**
- Go to: https://cli.github.com/
- Download the installer for macOS
- Install and restart Terminal

---

## Step 2: Authenticate with GitHub

```bash
gh auth login
```

You'll be asked:
1. **What account do you want to log into?** → Choose `GitHub.com`
2. **What is your preferred protocol?** → Choose `HTTPS`
3. **Authenticate Git with your GitHub credentials?** → Choose `Yes`
4. **How would you like to authenticate?** → Choose `Login with a web browser`
5. Copy the code shown, press Enter
6. Browser will open → Paste the code and authorize

---

## Step 3: Push Your Code

```bash
cd /Users/davidabaev/Desktop/n8n
git push -u origin main
```

That's it! Your code will be pushed to GitHub.

---

## Step 4: Install in n8n

After pushing, install the node in n8n:

### For n8n Cloud or Self-Hosted UI:
1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Enter: `databar-ai/n8n-nodes-databar`
5. Click **Install**
6. Restart n8n

### For Self-Hosted (Command Line):
```bash
npm install -g https://github.com/databar-ai/n8n-nodes-databar
# Then restart n8n
```

---

## Verify Installation

1. Create a new workflow in n8n
2. Click **+** to add a node
3. Search for "Databar"
4. You should see the Databar node!

---

## Troubleshooting

### Can't install GitHub CLI?
Use **Option 2** (Personal Access Token) instead:
1. Go to: https://github.com/settings/tokens/new
2. Create a token with "repo" scope
3. Run: `cd /Users/davidabaev/Desktop/n8n && git push -u origin main`
4. Username: your GitHub username
5. Password: paste the token

### Alternative: Use GitHub Desktop
1. Download: https://desktop.github.com/
2. Open and sign in
3. File → Add Local Repository
4. Select: `/Users/davidabaev/Desktop/n8n`
5. Click "Publish repository"

