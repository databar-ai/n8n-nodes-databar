# Installing n8n Node from Private GitHub Repository

**Good news:** You do NOT need n8n verification! You can install directly from your private GitHub repo.

---

## Method 1: Install via GitHub Token (Recommended) ⭐

### Step 1: Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens/new
2. Set:
   - **Note**: "n8n-databar-install"
   - **Expiration**: 90 days (or longer)
   - **Scopes**: Check ✅ `repo` (Full control of private repositories)
3. Click **Generate token**
4. **Copy the token** (shows only once!)

### Step 2: Install in n8n

#### Option A: Via n8n UI (Self-Hosted with npm access)

In n8n:
1. **Settings** → **Community Nodes** → **Install**
2. Enter:
   ```
   https://YOUR_TOKEN@github.com/databar-ai/n8n-nodes-databar
   ```
   Replace `YOUR_TOKEN` with your GitHub token
3. Click **Install**

#### Option B: Via Command Line (Self-Hosted)

```bash
# Install globally
npm install -g "https://YOUR_TOKEN@github.com/databar-ai/n8n-nodes-databar"

# Or in n8n's node_modules
cd ~/.n8n
npm install "https://YOUR_TOKEN@github.com/databar-ai/n8n-nodes-databar"
```

Replace `YOUR_TOKEN` with your GitHub Personal Access Token.

#### Option C: Environment Variable (Docker/Production)

Add to your environment:

```bash
# .env file or docker-compose.yml
GITHUB_TOKEN=your_token_here
```

Then install:
```bash
npm install "https://${GITHUB_TOKEN}@github.com/databar-ai/n8n-nodes-databar"
```

---

## Method 2: Make Repo Public (Easiest)

If you're comfortable with the repo being public:

1. Go to https://github.com/databar-ai/n8n-nodes-databar/settings
2. Scroll to **Danger Zone**
3. Click **Change visibility** → **Make public**
4. Confirm

Then in n8n:
```
Settings → Community Nodes → Install
Enter: databar-ai/n8n-nodes-databar
```

**Pros:**
- ✅ No token management
- ✅ Easier for team members
- ✅ Can share with customers

**Cons:**
- ❌ Code is publicly visible

---

## Method 3: SSH Key (Advanced)

If you have SSH keys set up:

```bash
# Install using SSH
npm install "git+ssh://git@github.com:databar-ai/n8n-nodes-databar.git"
```

---

## Method 4: Local Installation (No GitHub Needed)

Build and install directly without GitHub:

```bash
cd /Users/davidabaev/Desktop/n8n

# Build the package
npm install
npm run build

# Create tarball
npm pack
# Creates: n8n-nodes-databar-0.1.0.tgz

# Install in n8n
npm install -g /Users/davidabaev/Desktop/n8n/n8n-nodes-databar-0.1.0.tgz

# Or copy to n8n custom directory
mkdir -p ~/.n8n/custom
cp -r dist/* ~/.n8n/custom/
```

---

## Which Method Should You Use?

### 🤔 Decision Tree

```
Do you want to keep the repo private?
├─ Yes
│  ├─ Self-hosted n8n → Method 1 (GitHub Token) or Method 4 (Local)
│  └─ n8n Cloud → Method 1 (GitHub Token)
└─ No
   └─ Any setup → Method 2 (Make Public) ⭐ Easiest!
```

### 📊 Comparison

| Method | Private? | n8n Cloud | Self-Hosted | Easiest? |
|--------|----------|-----------|-------------|----------|
| GitHub Token | ✅ | ✅ | ✅ | ⭐⭐ |
| Make Public | ❌ | ✅ | ✅ | ⭐⭐⭐ |
| SSH Key | ✅ | ❌ | ✅ | ⭐ |
| Local Install | ✅ | ❌ | ✅ | ⭐⭐ |

---

## n8n Verification - Do You Need It?

**Short answer: NO!**

n8n has three types of nodes:

1. **Core Nodes** - Built into n8n (verified by n8n team)
2. **Community Nodes** - Published on npm (anyone can publish)
3. **Custom Nodes** - Installed from GitHub or locally (no verification needed)

Your Databar node is a **Community/Custom Node** - you can install it immediately without any verification from n8n!

### When would you want npm/verification?

Only if you want to:
- Share publicly with the n8n community
- Make it easily discoverable in n8n's community node search
- Publish on npm registry

For internal use or direct sharing, **GitHub installation works perfectly!**

---

## Testing Installation

After installing with any method:

```bash
# Verify it's installed
npm list -g | grep databar

# Or check n8n's node_modules
ls ~/.n8n/node_modules | grep databar
```

In n8n UI:
1. Restart n8n
2. Create new workflow
3. Click **+** to add node
4. Search "Databar"
5. Should appear! 🎉

---

## Recommended Approach for Your Use Case

### For Internal/Team Use:
```bash
# Option 1: Use GitHub Token
Settings → Community Nodes → Install
Enter: https://YOUR_TOKEN@github.com/databar-ai/n8n-nodes-databar
```

### For Customer/Public Use:
```bash
# Option 2: Make repo public
# Then customers can install via:
Settings → Community Nodes → Install
Enter: databar-ai/n8n-nodes-databar
```

---

## Security Notes

- ✅ GitHub tokens can be revoked anytime
- ✅ Set token expiration dates
- ✅ Use environment variables for tokens in production
- ⚠️ Don't commit tokens to code
- ⚠️ Tokens in n8n UI are stored in n8n's database

---

## Need Help?

**Common Issues:**

1. **"Authentication failed"** → Check token has `repo` scope
2. **"Package not found"** → Verify repo URL is correct
3. **"Node doesn't appear"** → Restart n8n completely

Contact: info@databar.ai

