# n8n-nodes-databar

This is an n8n community node that lets you use [Databar.ai](https://databar.ai) in your n8n workflows.

Databar.ai provides powerful data enrichment capabilities and table management features for your workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

### Option 1: Self-Hosted n8n (No npm required) ⭐ **Recommended for Testing**

If you're running n8n locally or on your own server, you can install directly without publishing to npm:

```bash
# Clone or download this repository
cd n8n-nodes-databar

# Run the installation script
./install-local.sh

# Restart your n8n instance
```

**For Docker users:**
```bash
./install-docker.sh
# Follow the instructions to add the volume mount to your docker-compose.yml
```

### Option 2: Install from GitHub

Push this code to GitHub (private or public) and install:

1. Push to GitHub: `git push origin main`
2. In n8n, go to **Settings > Community Nodes**
3. Enter: `https://github.com/yourusername/n8n-nodes-databar`
4. Click **Install**

### Option 3: npm (Required for n8n Cloud)

If using n8n Cloud or want to publish publicly:

```bash
npm publish
```

Then in n8n:
1. Go to **Settings > Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-databar`
4. Click **Install**

## Prerequisites

You need a Databar.ai account and API key. To get your API key:

1. Log in to your [Databar workspace](https://databar.ai)
2. Go to **Integrations**
3. Copy your API key

**Note:** You may need to schedule a call with Databar to get REST API access.

## Operations

This node supports the following operations:

### User
- **Get User Info**: Retrieve information about your Databar account including balance and plan

### Enrichment
- **List**: Get all available enrichments (optionally filter with search query)
- **Get**: Get detailed information about a specific enrichment
- **Run**: Execute an enrichment task with parameters
- **Bulk Run**: Execute enrichment on multiple records at once

### Table
- **Create**: Create a new table in your workspace
- **List**: Get all tables in your workspace
- **Get Rows**: Retrieve rows from a specific table (with pagination)
- **Get Columns**: Get column definitions for a table
- **Get Enrichments**: List enrichments associated with a table
- **Add Enrichment**: Add an enrichment to a table with parameter mapping
- **Run Enrichment**: Execute a table enrichment

### Waterfall
- **List**: Get all available waterfalls
- **Get**: Get detailed information about a specific waterfall
- **Run**: Execute a waterfall task with parameters and enrichments
- **Bulk Run**: Execute waterfall on multiple records at once

### Task
- **Get Status**: Check the status and retrieve data from an enrichment or waterfall task

## Credentials

This node requires Databar API credentials. Add them in your n8n instance:

1. Go to **Credentials** in n8n
2. Click **Create New Credential**
3. Search for **Databar API**
4. Enter your API Key from Databar workspace

## Compatibility

Tested with n8n version 1.0.0 and above.

## Usage Examples

### Example 1: Run an Enrichment

1. Add the **Databar** node to your workflow
2. Select **Resource**: Enrichment
3. Select **Operation**: Run
4. Enter the **Enrichment ID** (e.g., 833)
5. Add parameters as key-value pairs
6. Execute the workflow
7. The node returns a task ID - use the **Task** resource to check status and get results

### Example 2: Bulk Email Finder with Waterfall

1. Add the **Databar** node
2. Select **Resource**: Waterfall
3. Select **Operation**: Bulk Run
4. Enter **Waterfall Identifier**: `email_getter`
5. Enter **Parameters**: 
   ```json
   [
     {"first_name": "John", "last_name": "Doe", "company": "example.com"},
     {"first_name": "Jane", "last_name": "Smith", "company": "test.org"}
   ]
   ```
6. Enter **Enrichment IDs**: `833,966`
7. Execute and get task ID
8. Use Task > Get Status to retrieve results

### Example 3: Get Table Data

1. Add the **Databar** node
2. Select **Resource**: Table
3. Select **Operation**: Get Rows
4. Enter your **Table UUID**
5. Set **Per Page**: 100
6. Set **Page**: 1
7. Execute to get table data

## Resources

- [Databar.ai Documentation](https://databar.ai/docs)
- [Databar.ai API Documentation](https://databar.ai/docs/api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## Support

For issues or questions:
- **Databar API**: Contact info@databar.ai
- **n8n Node**: Open an issue on [GitHub](https://github.com/databar-ai/n8n-nodes-databar/issues)

## Version History

### 0.1.0
- Initial release
- Support for User, Enrichment, Table, Waterfall, and Task operations
- Complete API coverage for Databar.ai REST API

## License

[MIT](LICENSE)

