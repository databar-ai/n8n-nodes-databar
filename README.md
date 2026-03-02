# n8n-nodes-databar

This is an n8n community node that lets you use [Databar.ai](https://databar.ai) in your n8n workflows.

Databar.ai provides powerful data enrichment and table management capabilities for your automation workflows — enrich contacts, companies, and more with data from multiple providers, and manage structured data in Databar tables.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation) · [Configuration](#configuration) · [Operations](#operations) · [Examples](#usage-examples) · [Support](#support)

## Installation

### Community Nodes (Recommended)

**For n8n Cloud:**
1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-databar`
4. Agree to the risks of using community nodes
5. Select **Install**

**For Self-Hosted n8n:**
1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-databar`
4. Select **Install**
5. Restart your n8n instance

### npm Installation

```bash
npm install n8n-nodes-databar
```

Then restart your n8n instance.

## Prerequisites

You need a Databar.ai account and API key:

1. Sign up at [Databar.ai](https://databar.ai)
2. Navigate to **Integrations** in your workspace
3. Copy your API key

## Configuration

### Setting up Credentials

1. In n8n, go to **Credentials > New**
2. Search for **Databar API**
3. Enter your API Key
4. Click **Save**

The credentials are tested automatically to ensure they work.

## Operations

### User
- **Get Account Info**: Retrieve your account information, balance, and plan details

### Enrichment
- **Run**: Execute a single enrichment task
  - Browse enrichments from a searchable dropdown with descriptions and pricing
  - Dynamic parameter form generated from enrichment requirements
  - Automatic polling for results (configurable interval and timeout)

### Table
- **Insert Rows**: Insert one or more rows into a Databar table
  - Select table from a searchable dropdown
  - Dynamic column form generated from the table schema
  - Options for deduplication and auto-creating new columns
- **Upsert Rows**: Update existing rows by key, or insert new ones if no match is found
  - Select match column and value
  - Dynamic column form for fields to update

### Waterfall
- **Run**: Execute a waterfall with multiple data providers
  - Select which data providers to use
  - Dynamic parameter form generated from waterfall requirements
  - Automatic fallback between providers
  - Configurable polling and timeouts

## Usage Examples

### Example 1: Enrich a Contact

1. Add a Databar node to your workflow
2. Select Resource: **Enrichment**, Operation: **Run**
3. Select an enrichment from the dropdown (e.g., "Get people data from email")
4. Fill in the required parameters (e.g., email address)
5. Execute — returns enriched contact data

### Example 2: Waterfall with Multiple Providers

1. Add a Databar node
2. Resource: **Waterfall**, Operation: **Run**
3. Select your waterfall from the dropdown
4. Fill in the parameters (e.g., company domain)
5. Select data providers to use
6. Execute — returns data from the first successful provider

### Example 3: Insert Data into a Table

1. Add a Databar node
2. Resource: **Table**, Operation: **Insert Rows**
3. Select a table from the dropdown
4. Fill in column values using the generated form
5. Execute — row is inserted into the table

### Example 4: Workflow Integration

```
Webhook > Databar (Enrich) > Filter > Send Email

1. Webhook receives a new lead
2. Databar enriches with company data
3. Filter checks if company size > 100
4. Send personalized email to qualified leads
```

## Troubleshooting

### Node Not Appearing

If the Databar node doesn't appear after installation:
1. Restart your n8n instance
2. Clear your browser cache
3. Check n8n logs for any installation errors

### Authentication Errors

If you see authentication errors:
- Verify your API key is correct in credentials
- Check that your Databar account is active
- Ensure you have sufficient credits

### Task Timeout

If enrichment or waterfall tasks timeout:
- Increase the timeout in Additional Options
- Consider disabling "Wait for Completion" and checking status separately

## Resources

- [Databar.ai](https://databar.ai) — Main website
- [Databar API Documentation](https://databar.ai/docs/api) — API reference
- [n8n Documentation](https://docs.n8n.io/) — n8n platform docs
- [GitHub Repository](https://github.com/databar-ai/n8n-nodes-databar) — Source code

## Support

**For Databar API issues:**
- Email: info@databar.ai
- Visit: [Databar.ai](https://databar.ai)

**For node issues:**
- GitHub Issues: [n8n-nodes-databar/issues](https://github.com/databar-ai/n8n-nodes-databar/issues)

## Version History

### 0.2.0
- Added Table resource with Insert Rows and Upsert Rows operations
- Dynamic column forms via resource mapper for table and all operations
- Simplified UX: removed selection mode dropdowns, parameter mode switchers
- Hidden Bulk Run (available in a future release)
- Removed waterfall List and Get operations (embedded in Run)
- Filtered enrichment-generated columns from table field forms
- Cleaned up emoji and stale references per n8n guidelines

### 0.1.1
- Improved documentation
- Removed internal development scaffolding

### 0.1.0
- Initial release
- Dynamic enrichment and waterfall selection
- Guided fields and JSON input modes
- Automatic async task polling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
