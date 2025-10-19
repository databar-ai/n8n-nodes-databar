# 🎉 Success! Your Code is on GitHub

Your n8n-nodes-databar is now live at:
**https://github.com/databar-ai/n8n-nodes-databar**

---

## 📦 How to Install in n8n

### Option 1: n8n Cloud or Self-Hosted (via UI) ⭐ **Recommended**

1. Open your n8n instance
2. Click **Settings** (gear icon in the bottom left)
3. Click **Community Nodes**
4. Click **Install**
5. Enter one of these:
   - `databar-ai/n8n-nodes-databar` (recommended)
   - `https://github.com/databar-ai/n8n-nodes-databar`
6. Click **Install**
7. Wait for installation to complete (may take 1-2 minutes)
8. **Restart n8n** if prompted

### Option 2: Self-Hosted (via Command Line)

```bash
# Navigate to your n8n directory
cd ~/.n8n

# Install the node
npm install https://github.com/databar-ai/n8n-nodes-databar

# Restart n8n
# (depending on how you run n8n)
```

### Option 3: Docker

Add to your `docker-compose.yml`:

```yaml
services:
  n8n:
    image: n8nio/n8n
    environment:
      - NODE_FUNCTION_ALLOW_EXTERNAL=https://github.com/databar-ai/n8n-nodes-databar
    # ... rest of your config
```

Then:
```bash
docker-compose down
docker-compose up -d
```

---

## 🔑 Setup Credentials

After installation:

1. Go to **Credentials** in n8n
2. Click **Add Credential**
3. Search for **Databar API**
4. Enter your API key from https://databar.ai (Integrations page)
5. Click **Save**
6. Click **Test** to verify it works

---

## ✅ Test the Node

Create a simple test workflow:

1. Create a new workflow
2. Add a **Manual Trigger** node (if not already there)
3. Click **+** to add a new node
4. Search for **Databar**
5. Select the Databar node
6. Configure:
   - **Credential**: Select your Databar API credential
   - **Resource**: User
   - **Operation**: Get User Info
7. Click **Execute Node**
8. You should see your Databar account information!

---

## 🎯 Example Workflows

### Example 1: Get Available Enrichments
```
Manual Trigger → Databar (Enrichment > List)
```

### Example 2: Run an Enrichment
```
Manual Trigger → Databar (Enrichment > Run)
- Enrichment ID: 833 (or your enrichment ID)
- Parameters: Add your params
```

### Example 3: Check Task Status
```
Manual Trigger → Databar (Task > Get Status)
- Task ID: (from previous enrichment run)
```

### Example 4: Email Finder Waterfall
```
Manual Trigger → Databar (Waterfall > Run)
- Waterfall Identifier: email_getter
- Parameters: first_name, last_name, company
- Enrichment IDs: 833,966
```

---

## 📚 Full Documentation

All operations available:

### 👤 **User**
- Get User Info

### 🔍 **Enrichment**
- List (with optional search)
- Get (by ID)
- Run (single)
- Bulk Run (multiple)

### 📊 **Table**
- Create
- List
- Get Rows (with pagination)
- Get Columns
- Get Enrichments
- Add Enrichment
- Run Enrichment

### 💧 **Waterfall**
- List
- Get (by identifier)
- Run (single)
- Bulk Run (multiple)

### ⏱️ **Task**
- Get Status (check enrichment/waterfall results)

---

## 🔄 Updating the Node

When you make changes to the code:

```bash
cd /Users/davidabaev/Desktop/n8n
git add .
git commit -m "Description of changes"
git push
```

Then in n8n:
- Settings → Community Nodes → Update (next to your node)

---

## 🐛 Troubleshooting

### Node doesn't appear after installation
- Check n8n logs for errors
- Restart n8n completely
- Verify the package installed: `npm list -g | grep databar`

### Credentials test fails
- Verify your API key is correct
- Check you have REST API access enabled with Databar
- Test directly: `curl https://api.databar.ai/v1/user/me -H "x-apikey: YOUR_KEY"`

### Installation fails
- Check your n8n version (needs 1.0.0+)
- Verify you have internet access
- Try installing via URL: `https://github.com/databar-ai/n8n-nodes-databar`

---

## 🚀 You're All Set!

Your Databar n8n integration is ready to use. Start building workflows with:
- Data enrichment
- Table management
- Waterfall enrichments
- And more!

Need help? Contact info@databar.ai

