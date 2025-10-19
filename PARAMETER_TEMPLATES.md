# Parameter Template Feature

## Overview

The Databar n8n node now includes **automatic parameter template generation** for enrichments. This feature eliminates the guesswork when configuring enrichment parameters by automatically fetching and displaying the required parameter structure.

## How It Works

### For Run Enrichment Operations

1. **Select an Enrichment**
   - Choose from the enrichment dropdown (recommended)
   - Or enter an enrichment ID manually

2. **Enable Template Display** (default: ON)
   - Toggle "Show Parameter Template" to enable/disable
   - When enabled, a "Parameter Template" dropdown appears

3. **View Template**
   - Click on the "Parameter Template" dropdown
   - The node automatically fetches enrichment details from Databar API
   - Displays:
     - Parameter names
     - Types (text, number, etc.)
     - Required vs Optional status
     - Descriptions
     - JSON template

4. **Copy & Use**
   - Copy the JSON template from the description
   - Paste into "Parameters (JSON)" field
   - Replace placeholder values with your actual data
   - Execute!

### For Bulk Run Operations

Same workflow as Run, but with array format:
- Template shows single object format
- Use this format for each item in your array
- Example: `[{template}, {template}, ...]`

## Example Workflow

### Step 1: Select Enrichment
```
Enrichment Selection: From List
Enrichment: "Get people data from email"
```

### Step 2: View Template
```
Parameter Template: "Copy this template ⬇"

Description shows:
Parameters:
• email (text, **REQUIRED**): Email address to enrich
• first_name (text, optional): Person's first name for better matching

JSON Template:
{
  "email": "<text>",
  "first_name": "<text>"
}
```

### Step 3: Fill Parameters
```json
{
  "email": "john@example.com",
  "first_name": "John"
}
```

### Step 4: Execute
- Click Execute
- Node runs with correct parameters
- Returns enriched data

## Benefits

### Before (Without Template):
❌ Had to use "Get Enrichment" operation first  
❌ Manually note down parameter names  
❌ Guess parameter types  
❌ Risk of typos in parameter names  
❌ Trial and error to find required fields  

### After (With Template):
✅ See parameters instantly in the same node  
✅ Know exact parameter names (no typos)  
✅ See which fields are required vs optional  
✅ Understand parameter types  
✅ Copy-paste JSON template directly  
✅ Faster workflow setup  

## Technical Details

### API Call
- Calls: `GET /v1/enrichments/{enrichment_id}`
- Returns: Full enrichment details including `params` array
- Cached: Loaded once when dropdown is opened

### Template Format
```typescript
{
  "param_name": "<type>"
}
```

Where:
- `param_name`: Actual parameter name from API
- `<type>`: Parameter type (text, number, email, url, etc.)

### Parameter Information
Each parameter includes:
- **name**: API parameter name
- **type_field**: Data type
- **is_required**: Boolean indicating if required
- **description**: What the parameter is used for

## Use Cases

### Use Case 1: Email Enrichment
```
Template:
{
  "email": "<text>"
}

Your Data:
{
  "email": "contact@company.com"
}
```

### Use Case 2: Company Enrichment
```
Template:
{
  "company_domain": "<text>",
  "company_name": "<text>"
}

Your Data:
{
  "company_domain": "example.com",
  "company_name": "Example Inc"
}
```

### Use Case 3: Bulk People Enrichment
```
Template (per item):
{
  "first_name": "<text>",
  "last_name": "<text>",
  "company": "<text>"
}

Your Data:
[
  {
    "first_name": "John",
    "last_name": "Doe",
    "company": "example.com"
  },
  {
    "first_name": "Jane",
    "last_name": "Smith",
    "company": "test.org"
  }
]
```

## Troubleshooting

### Template Shows "Select an enrichment first"
- **Cause**: No enrichment selected yet
- **Fix**: Select an enrichment from the dropdown above

### Template Shows "Error fetching parameters"
- **Cause**: API call failed or enrichment ID is invalid
- **Fix**: 
  - Verify enrichment ID is correct
  - Check API key has proper permissions
  - Try switching to "By ID" mode and entering ID manually

### Template Shows "No parameters required"
- **Cause**: This enrichment doesn't need input parameters
- **Fix**: Leave Parameters field empty or use `{}`

### Dropdown Won't Load
- **Cause**: Network issue or API rate limit
- **Fix**:
  - Refresh the node
  - Toggle "Show Parameter Template" off and on
  - Use "Get Enrichment" operation as fallback

## Advanced Usage

### Dynamic Parameters with Expressions
```json
{
  "email": "={{$json.email}}",
  "first_name": "={{$json.first_name}}"
}
```

### Optional Parameters
```json
{
  "email": "john@example.com"
}
```
(Leave out optional parameters if you don't need them)

### Required Parameters Only
The template shows which parameters are **REQUIRED**. At minimum, include those:
```json
{
  "required_param_1": "value",
  "required_param_2": "value"
}
```

## Implementation Details

### Load Options Method
```typescript
async getEnrichmentTemplate(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  // 1. Get enrichment ID from node parameters
  const enrichmentId = this.getCurrentNodeParameter('enrichmentId');
  
  // 2. Fetch enrichment details from API
  const enrichment = await this.helpers.httpRequestWithAuthentication.call(
    this,
    'databarApi',
    { method: 'GET', url: `/v1/enrichments/${enrichmentId}` }
  );
  
  // 3. Parse params array and build template
  const params = enrichment.params;
  const template = {};
  
  for (const param of params) {
    template[param.name] = `<${param.type_field}>`;
  }
  
  // 4. Return formatted template
  return [{
    name: 'Copy this template',
    value: JSON.stringify(template, null, 2),
    description: '...parameter details...'
  }];
}
```

### Field Dependencies
- **Depends on**: `enrichmentId` field
- **Triggers when**: Enrichment is selected or changed
- **Loads**: Dynamically via `loadOptionsMethod`
- **Displays**: In dropdown format with description

## Future Enhancements

Potential improvements:
1. **Auto-fill Parameters**: Automatically populate the JSON field
2. **Dynamic Fields**: Generate individual fields per parameter
3. **Validation**: Validate parameters before execution
4. **Smart Defaults**: Suggest common values for parameters
5. **Parameter History**: Remember previously used parameter sets

## Feedback

If you have suggestions for improving this feature, please open an issue on GitHub:
https://github.com/databar-ai/n8n-nodes-databar/issues

---

**Last Updated:** October 19, 2025  
**Feature Version:** 0.1.0+  
**Status:** ✅ Production Ready

