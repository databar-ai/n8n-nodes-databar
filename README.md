# n8n-nodes-databar

This is an n8n community node that lets you use [Databar.ai](https://databar.ai) in your n8n workflows.

Databar.ai provides powerful data enrichment capabilities and table management features for your workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## ✨ Features

- **🔍 Dynamic Enrichment Discovery**: Search and select from all available enrichments with descriptions, data sources, and credit costs displayed in-app
- **📝 Smart Parameter Input**: Choose between guided individual fields or raw JSON input - the node adapts to your enrichment's requirements automatically
- **⏱️ Automatic Async Handling**: Built-in polling for async API calls - no need for separate nodes to check task status
- **📊 Complete API Coverage**: All Databar.ai REST API endpoints are supported
- **🎯 Type-Safe**: Full TypeScript implementation with proper type validation

## Installation

### For Self-Hosted n8n (Recommended for Development)

#### Quick Install
```bash
# Clone the repository
cd /path/to/n8n-nodes-databar

# Build the project
npm install
npm run build

# Copy to n8n custom directory
cp -r dist/* ~/.n8n/custom/

# Restart n8n
pkill -f "n8n" && n8n start
```

#### Install Globally from GitHub
```bash
npm install -g https://github.com/databar-ai/n8n-nodes-databar
```

Then manually register the node by adding entries to n8n's database (see troubleshooting section if needed).

### For n8n Cloud

This node must be published to npm to be used with n8n Cloud:

```bash
npm publish
```

Then in n8n Cloud:
1. Go to **Settings > Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-databar`
4. Click **Install**

## Prerequisites

You need a Databar.ai account and API key:

1. Log in to your [Databar workspace](https://databar.ai)
2. Navigate to **Integrations**
3. Copy your API key

**Note:** REST API access may require scheduling a call with Databar.

## Configuration

### Add Credentials in n8n

1. Go to **Credentials** in n8n
2. Click **Create New Credential**
3. Search for **Databar API**
4. Enter your API Key from Databar workspace
5. Click **Save**

## Operations

### User
- **Get User Info**: Retrieve account information including balance and plan details

### Enrichment
- **List**: Browse all available enrichments with optional search filtering
- **Get**: Get detailed information about a specific enrichment including parameters and pricing
- **Run**: Execute a single enrichment task
  - **Automatic Polling**: Enable "Wait for Completion" to automatically poll until results are ready
  - **From List**: Select enrichments from a searchable dropdown with descriptions and pricing
  - **By ID**: Manually enter enrichment ID as fallback
- **Bulk Run**: Execute enrichment on multiple records simultaneously with automatic polling support

### Table
- **Create**: Create a new table in your workspace
- **List**: Get all tables in your workspace
- **Get Rows**: Retrieve rows from a table with pagination support
- **Get Columns**: Get column definitions for a table
- **Get Enrichments**: List enrichments associated with a table
- **Add Enrichment**: Add an enrichment to a table with custom parameter mapping
- **Run Enrichment**: Execute a table enrichment

### Waterfall
- **List**: Browse all available waterfalls with searchable dropdown
- **Get**: Get detailed information about a specific waterfall
- **Run**: Execute a waterfall task with automatic polling
- **Bulk Run**: Execute waterfall on multiple records with automatic polling

### Task
- **Get Status**: Check status and retrieve data from async enrichment or waterfall tasks

## Key Features Explained

### 1. Dynamic Enrichment Selection

Instead of needing to know enrichment IDs, you can:
- Browse all enrichments in a searchable dropdown
- See enrichment name, description, data source, and credit cost
- Select from the list or enter an ID manually

Example dropdown entry:
```
Get people data from email
↳ Returns a person's name, location, social media... | Clearbit Companies API · 0.10 Credits
```

### 2. Smart Parameter Input (Guided Fields)

**NEW!** Choose how you want to input parameters:

#### **Option 1: Guided Fields (Recommended)**
The node automatically generates individual input fields for each parameter:
- Fetches enrichment requirements from the API
- Creates labeled input fields with proper types (text, number, boolean)
- Shows descriptions and marks required vs optional fields
- Type-safe input with validation
- Perfect for manual data entry and simple workflows

#### **Option 2: Raw JSON**
Traditional JSON object input for power users:
- Enter parameters as a JSON object
- Best for complex objects and dynamic expressions
- Full control over input format

**Example: Guided Fields Mode**
```
1. Select enrichment "Get people data from email"
2. Parameter Input Mode: Guided Fields (default)
3. The node automatically shows:
   
   Email: [______________] (Required)
   ↳ Email address to enrich (text)
   
   First Name: [______________] (Optional)
   ↳ Person's first name (text)
   
4. Fill in the fields directly
5. Execute!
```

**Example: Raw JSON Mode**
```
1. Select enrichment
2. Parameter Input Mode: Raw JSON
3. Parameters (JSON):
   {
     "email": "john@example.com",
     "first_name": "John"
   }
4. Execute!
```

No more guessing parameter names or types! The fields adapt automatically to whichever enrichment you select.

### 3. Automatic Async Task Polling

Databar's enrichment and waterfall operations are asynchronous. This node handles the complexity for you:

**When "Wait for Completion" is enabled (default):**
- Node submits the task
- Automatically polls task status every 5 seconds (configurable)
- Returns completed results directly
- Throws clear errors if task fails

**When "Wait for Completion" is disabled:**
- Returns the `task_id` immediately
- Use the **Task > Get Status** operation to check results later

**Polling Configuration:**
- **Poll Interval**: Seconds between status checks (default: 5)
- **Timeout**: Maximum seconds to wait before failing (default: 300 / 5 minutes)

### 3. Full URL Handling

All API calls use absolute URLs (`https://api.databar.ai/v1/...`) to ensure compatibility with n8n's authentication system.

## Usage Examples

### Example 1: Email Enrichment with Guided Fields

```
1. Add Databar node
2. Resource: Enrichment
3. Operation: Run
4. Enrichment Selection: From List
5. Search and select "Get people data from email"
6. Parameter Input Mode: Guided Fields (default)
7. Individual fields auto-appear:
   - Email: john@example.com
8. Wait for Completion: ✓ True
9. Execute → Returns enriched data directly!
```

**Alternative with Raw JSON:**
```
...step 5...
6. Parameter Input Mode: Raw JSON
7. Parameters (JSON): {"email": "john@example.com"}
8. Wait for Completion: ✓ True
9. Execute → Returns enriched data directly!
```

### Example 2: Bulk Waterfall Enrichment

```
1. Add Databar node
2. Resource: Waterfall
3. Operation: Bulk Run
4. Waterfall: Select from dropdown
5. Parameters (JSON):
   [
     {"first_name": "John", "last_name": "Doe", "company": "example.com"},
     {"first_name": "Jane", "last_name": "Smith", "company": "test.org"}
   ]
6. Enrichment IDs: 833,966
7. Wait for Completion: ✓ True
8. Execute → Returns all results when complete
```

### Example 3: Browse Available Enrichments

```
1. Add Databar node
2. Resource: Enrichment
3. Operation: List
4. Search Query: "email" (optional)
5. Execute → Returns all matching enrichments with details
```

### Example 4: Manual Task Status Check

```
1. Run an enrichment with "Wait for Completion" disabled
2. Note the task_id from response
3. Add another Databar node
4. Resource: Task
5. Operation: Get Status
6. Task ID: <paste task_id>
7. Execute → Check if completed and get results
```

## Architecture

### Project Structure

```
n8n-nodes-databar/
├── credentials/
│   └── DatabarApi.credentials.ts    # API key credential definition
├── nodes/
│   └── Databar/
│       ├── Databar.node.ts          # Main node implementation
│       └── databar.svg              # Node icon
├── dist/                            # Compiled JavaScript (generated)
├── package.json                     # Node package configuration
├── tsconfig.json                    # TypeScript configuration
├── gulpfile.js                      # Icon build script
├── openapi.json                     # API specification (reference)
├── LICENSE                          # MIT license
└── README.md                        # This file
```

### Technical Details

**Authentication:**
- Uses `x-apikey` header for all requests
- Credentials stored securely in n8n's credential system

**URL Handling:**
- All API calls use absolute URLs: `https://api.databar.ai/v1/...`
- This ensures proper request routing in n8n's HTTP client

**Async Polling:**
- Implemented as standalone `pollTaskStatus()` helper function
- Polls `/v1/tasks/{task_id}` endpoint until status is `completed` or `failed`
- Configurable interval and timeout
- Proper error handling with clear error messages

**Dynamic Options:**
- `loadOptionsMethod` functions fetch enrichments, waterfalls, and tables from API
- Options are searchable client-side with `searchable: true`
- Falls back to manual ID entry if needed

**Resource Mapper (Guided Fields):**
- `resourceMapperMethod` dynamically generates input fields based on enrichment parameters
- Fetches parameter definitions from `/v1/enrichments/{id}` endpoint
- Maps Databar types (text, number, boolean) to n8n field types
- Displays required/optional status and descriptions
- Returns structured data in `paramsFields.value` object

**Type Safety:**
- Full TypeScript with `IExecuteFunctions`, `ILoadOptionsFunctions` contexts
- Explicit type conversions and validations for all parameters
- Proper error handling with `NodeOperationError`

## Development

### Building

```bash
npm install
npm run build
```

### Local Testing

```bash
# Build and copy to n8n
npm run build && cp -r dist/* ~/.n8n/custom/

# Restart n8n
pkill -f "n8n" && n8n start
```

### Code Structure

The main node (`Databar.node.ts`) is organized as:

1. **Imports & Helper Functions**: Standalone functions like `pollTaskStatus()`
2. **Class Definition**: `Databar` class implementing `INodeType`
3. **Description**: Node metadata, properties, and UI configuration
4. **Methods**: 
   - `loadOptions`: Dynamic option loaders for dropdowns
   - `resourceMapping`: Dynamic field generators for guided input (resourceMapper)
   - `getEnrichmentParams`: Helper to fetch enrichment details
5. **Execute Function**: Main execution logic with resource/operation routing

## Troubleshooting

### Node Not Appearing in n8n

If the node doesn't appear after installation:

1. Check that files are in `~/.n8n/custom/`:
   ```bash
   ls -la ~/.n8n/custom/nodes/Databar/
   ```

2. Check n8n logs:
   ```bash
   tail -f ~/.n8n/n8n.log
   ```

3. Manually add to database (if needed):
   ```bash
   sqlite3 ~/.n8n/database.sqlite
   
   INSERT INTO installed_packages VALUES ('n8n-nodes-databar','0.1.0',NOW(),NOW());
   INSERT INTO installed_nodes VALUES ('n8n.nodes.Databar','databar','0.1.0','n8n-nodes-databar',NOW(),NOW());
   INSERT INTO installed_nodes VALUES ('credentials.DatabarApi','databarApi','0.1.0','n8n-nodes-databar',NOW(),NOW());
   ```

4. Restart n8n

### "Invalid URL" Errors

All URLs are now absolute paths (`https://api.databar.ai/v1/...`). If you still see this error:
- Check that you're using the latest build
- Verify API key is correctly configured in credentials
- Check n8n logs for specific error details

### "pollTaskStatus is not a function"

This was fixed by moving `pollTaskStatus` outside the class as a standalone function. If you see this:
- Ensure you have the latest code from GitHub
- Rebuild and redeploy: `npm run build && cp -r dist/* ~/.n8n/custom/`

### Enrichment Dropdown Not Loading

If enrichments don't appear in dropdown:
- Check that your API key has proper permissions
- Verify you can access `https://api.databar.ai/v1/enrichments/` directly
- Fall back to "By ID" mode to manually enter enrichment ID

## Resources

- [Databar.ai](https://databar.ai)
- [Databar.ai API Documentation](https://databar.ai/docs/api)
- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [GitHub Repository](https://github.com/databar-ai/n8n-nodes-databar)

## Support

For issues or questions:
- **Databar API Support**: Contact info@databar.ai
- **Node Issues**: Open an issue on [GitHub](https://github.com/databar-ai/n8n-nodes-databar/issues)

## Version History

### 0.1.0 (Current)
- ✅ Initial release with full API coverage
- ✅ Dynamic enrichment/waterfall/table dropdowns with search
- ✅ **Guided Fields Mode**: Automatic parameter field generation with resourceMapper
- ✅ **Dual Input Modes**: Choose between guided fields or raw JSON for parameters
- ✅ Automatic async task polling with configurable options
- ✅ Support for all Databar.ai REST API endpoints
- ✅ Type-safe implementation with proper error handling
- ✅ Complete documentation and troubleshooting guides

## License

[MIT](LICENSE)

---

Built with ❤️ for the n8n and Databar.ai communities
