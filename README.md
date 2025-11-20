# n8n-nodes-databar

This is an n8n community node that lets you use [Databar.ai](https://databar.ai) in your n8n workflows.

Databar.ai provides powerful data enrichment capabilities for your automation workflows - enrich contacts, companies, and more with data from multiple providers.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation) · [Configuration](#configuration) · [Operations](#operations) · [Examples](#usage-examples) · [Support](#support)

## ✨ Features

- **🔍 Smart Enrichment Selection**: Browse and search all available enrichments with descriptions, data sources, and pricing displayed in-app
- **📝 Flexible Parameter Input**: Choose between guided individual fields or raw JSON - adapts automatically to your enrichment's requirements
- **⏱️ Automatic Async Handling**: Built-in polling for async operations - no manual status checking needed
- **🌊 Waterfall Support**: Chain multiple data providers with automatic fallback
- **🎯 Type-Safe**: Full TypeScript implementation with proper validation

## Installation

### Community Nodes (Recommended)

Follow this guide in your n8n instance:

**For n8n Cloud:**
1. Go to **Settings → Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-databar`
4. Agree to the risks of using community nodes
5. Select **Install**

**For Self-Hosted n8n:**
1. Go to **Settings → Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-databar`
4. Select **Install**
5. Restart your n8n instance

After installation, the Databar node will appear in your node panel.

### npm Installation

Alternatively, install via npm:

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

1. In n8n, go to **Credentials → New**
2. Search for **Databar API**
3. Enter your API Key
4. Click **Save**

The credentials will be tested automatically to ensure they work.

## Operations

### User
- **Get Account Info**: Retrieve your account information, balance, and plan details

### Enrichment
- **Run**: Execute a single enrichment task
  - Browse enrichments from a searchable dropdown
  - See descriptions, data sources, and credit costs
  - Choose guided fields or JSON input
  - Automatic polling for results
- **Bulk Run**: Execute enrichment on multiple records simultaneously

### Waterfall
- **List**: Browse all available waterfalls
- **Get**: Get details about a specific waterfall
- **Run**: Execute a waterfall with multiple data providers
  - Select which providers to use
  - Automatic fallback between providers
  - Configurable polling and timeouts

## Key Features Explained

### Dynamic Enrichment Selection

Instead of needing to know enrichment IDs, browse all available enrichments in a searchable dropdown with full details:

```
Email Validator
↳ Verify if an email address is valid and deliverable | ZeroBounce · 0.01 Credits

Get people data from email
↳ Returns a person's name, location, social media... | Clearbit · 0.10 Credits
```

### Smart Parameter Input

**Guided Fields Mode (Recommended)**

The node automatically generates individual input fields for each parameter:
- Labeled fields with proper types (text, number, boolean)
- Required vs optional indicators
- Built-in descriptions
- Type validation

**Raw JSON Mode**

For power users and dynamic workflows:
- Enter parameters as JSON object
- Use n8n expressions
- Full control over input format

**Example:**
```
Guided Fields:
  Email: john@example.com ✓ (Required)
  First Name: John (Optional)

Raw JSON:
  {
    "email": "john@example.com",
    "first_name": "John"
  }
```

### Automatic Async Handling

Enrichment and waterfall operations are asynchronous. This node handles it automatically:

**With "Wait for Completion" enabled (default):**
- Submits the task
- Polls every 3 seconds
- Returns completed results
- Clear error messages on failure

**With "Wait for Completion" disabled:**
- Returns `task_id` immediately
- Check status later with another node

**Configuration:**
- **Poll Interval**: Seconds between checks (default: 3)
- **Timeout**: Maximum wait time (default: 300 seconds)

## Usage Examples

### Example 1: Email Enrichment

```
1. Add Databar node to workflow
2. Select Resource: Enrichment
3. Select Operation: Run
4. Select enrichment from dropdown (e.g., "Get people data from email")
5. Enter email address in the Email field
6. Execute → Returns enriched contact data
```

### Example 2: Waterfall with Multiple Providers

```
1. Add Databar node
2. Resource: Waterfall
3. Operation: Run
4. Select your waterfall from dropdown
5. Enter parameters (e.g., company domain)
6. Select data providers to use
7. Execute → Returns data from first successful provider
```

### Example 3: Bulk Contact Enrichment

```
1. Add Databar node
2. Resource: Enrichment
3. Operation: Bulk Run
4. Select enrichment
5. Enter array of records:
   [
     {"email": "john@example.com"},
     {"email": "jane@company.com"}
   ]
6. Execute → Returns all enriched records
```

### Example 4: Integration with Other Nodes

```
Webhook → Databar (Enrich) → Filter → Send Email

Example workflow:
1. Webhook receives new lead
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

### Enrichment Dropdown Empty

If enrichments don't load in the dropdown:
- Check your internet connection
- Verify API key has proper permissions
- Use "By ID" mode as a fallback to enter enrichment ID manually

### Task Timeout

If enrichment tasks timeout:
- Increase timeout in Additional Options
- Check if the enrichment requires more time
- Consider disabling "Wait for Completion" and checking status separately

## Resources

- [Databar.ai](https://databar.ai) - Main website
- [Databar API Documentation](https://databar.ai/docs/api) - API reference
- [n8n Documentation](https://docs.n8n.io/) - n8n platform docs
- [GitHub Repository](https://github.com/databar-ai/n8n-nodes-databar) - Source code

## Support

**For Databar API issues:**
- Email: info@databar.ai
- Visit: [Databar.ai](https://databar.ai)

**For node issues:**
- GitHub Issues: [n8n-nodes-databar/issues](https://github.com/databar-ai/n8n-nodes-databar/issues)

## Version History

### 0.1.1
- Improved documentation for end users
- Removed internal development scaffolding
- Cleaner installation and setup instructions
- Added CONTRIBUTING.md for developers

### 0.1.0
- Initial release
- Dynamic enrichment and waterfall selection
- Guided fields and JSON input modes
- Automatic async task polling
- Full Databar.ai API coverage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)

---

Built with ❤️ for the n8n and Databar.ai communities
