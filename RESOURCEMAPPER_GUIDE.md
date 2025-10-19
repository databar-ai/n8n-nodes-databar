# ResourceMapper Implementation Guide

## 🎉 What's New

The Databar n8n node now supports **two ways** to input enrichment parameters:

### 1. **Guided Fields** (Default - Recommended)
Individual input fields that automatically adapt to the selected enrichment.

### 2. **Raw JSON**
Traditional JSON object input for power users.

---

## 🎯 How It Works

### User Experience

1. **Select an enrichment** from the dropdown (e.g., "Get people data from email")
2. **Choose input mode**: 
   - **Guided Fields** (default) → Individual labeled fields appear
   - **Raw JSON** → Single JSON editor appears
3. **Fill in the parameters**
4. **Execute!**

### Example: Guided Fields Mode

```
After selecting enrichment 1220 (Email Verifier):

┌─────────────────────────────────────────┐
│ Parameter Input Mode: [Guided Fields ▾]│
├─────────────────────────────────────────┤
│                                         │
│ Email * (Required)                      │
│ ┌─────────────────────────────────────┐│
│ │ john@example.com                    ││
│ └─────────────────────────────────────┘│
│ Email address to enrich (text)          │
│                                         │
│ First Name (Optional)                   │
│ ┌─────────────────────────────────────┐│
│ │ John                                ││
│ └─────────────────────────────────────┘│
│ Person's first name (text)              │
│                                         │
└─────────────────────────────────────────┘
```

### Example: Raw JSON Mode

```
After selecting enrichment:

┌─────────────────────────────────────────┐
│ Parameter Input Mode: [Raw JSON ▾]     │
├─────────────────────────────────────────┤
│                                         │
│ Parameters (JSON)                       │
│ ┌─────────────────────────────────────┐│
│ │ {                                   ││
│ │   "email": "john@example.com",      ││
│ │   "first_name": "John"              ││
│ │ }                                   ││
│ └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Architecture

The resourceMapper feature uses n8n's built-in `resourceMapper` field type:

```typescript
{
    displayName: 'Parameters',
    name: 'paramsFields',
    type: 'resourceMapper',  // Special n8n field type
    typeOptions: {
        loadOptionsDependsOn: ['enrichmentId'],  // Reload when enrichment changes
        resourceMapper: {
            resourceMapperMethod: 'getEnrichmentFields',  // Method to call
            mode: 'add',
            valuesLabel: 'Parameters',
            addAllFields: true,
        },
    },
}
```

### Data Flow

```
1. User selects enrichment (e.g., ID: 1220)
   ↓
2. n8n calls getEnrichmentFields()
   ↓
3. Method fetches: GET /v1/enrichments/1220
   ↓
4. Extracts params array from response:
   [
     {name: "email", type_field: "text", is_required: true, description: "..."},
     {name: "first_name", type_field: "text", is_required: false, description: "..."}
   ]
   ↓
5. Maps to ResourceMapperField format:
   {
     fields: [
       {
         id: "email",
         displayName: "Email",
         type: "string",
         required: true,
         description: "Email address to enrich (text)"
       },
       {
         id: "first_name",
         displayName: "First Name",
         type: "string",
         required: false,
         description: "Person's first name (text)"
       }
     ]
   }
   ↓
6. n8n renders individual input fields
   ↓
7. User fills in values
   ↓
8. On execute, node reads: this.getNodeParameter('paramsFields', i)
   ↓
9. Extracts actual values from: paramsFields.value
   ↓
10. Sends to API: POST /v1/enrichments/1220/run
    Body: {"params": {"email": "john@example.com", "first_name": "John"}}
```

### Code Structure

#### 1. Field Definitions (nodes/Databar/Databar.node.ts)

```typescript
// Mode selector
{
    displayName: 'Parameter Input Mode',
    name: 'parameterMode',
    type: 'options',
    options: [
        {name: 'Guided Fields', value: 'fields'},
        {name: 'Raw JSON', value: 'json'},
    ],
    default: 'fields',
}

// Guided fields (resourceMapper)
{
    displayName: 'Parameters',
    name: 'paramsFields',
    type: 'resourceMapper',
    displayOptions: {
        show: {parameterMode: ['fields']},
    },
    typeOptions: {
        resourceMapper: {
            resourceMapperMethod: 'getEnrichmentFields',
        },
    },
}

// Raw JSON
{
    displayName: 'Parameters (JSON)',
    name: 'paramsJson',
    type: 'json',
    displayOptions: {
        show: {parameterMode: ['json']},
    },
}
```

#### 2. Resource Mapping Method (nodes/Databar/Databar.node.ts)

```typescript
methods = {
    resourceMapping: {
        async getEnrichmentFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
            // Get current enrichment ID
            const enrichmentId = this.getCurrentNodeParameter('enrichmentId');
            
            // Fetch enrichment details
            const enrichment = await this.helpers.httpRequestWithAuthentication.call(
                this,
                'databarApi',
                {
                    method: 'GET',
                    url: `https://api.databar.ai/v1/enrichments/${enrichmentId}`,
                },
            );
            
            // Extract params
            const params = enrichment.params || [];
            
            // Map to ResourceMapperField format
            const fields = params.map((param) => ({
                id: param.name,
                displayName: formatDisplayName(param.name),  // Convert snake_case to Title Case
                type: mapDatabarTypeToN8nType(param.type_field),  // text→string, number→number, etc.
                required: param.is_required,
                description: `${param.description} (${param.type_field})`,
            }));
            
            return { fields };
        },
    },
}
```

#### 3. Execute Method (nodes/Databar/Databar.node.ts)

```typescript
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Check which input mode user selected
    const parameterMode = this.getNodeParameter('parameterMode', i, 'fields');
    
    let params: IDataObject;
    
    if (parameterMode === 'fields') {
        // Resource mapper mode - extract from paramsFields.value
        const paramsFields = this.getNodeParameter('paramsFields', i);
        params = paramsFields.value || {};
    } else {
        // Raw JSON mode - parse JSON string
        const paramsJson = this.getNodeParameter('paramsJson', i);
        params = JSON.parse(paramsJson);
    }
    
    // Send to API
    await this.helpers.httpRequestWithAuthentication.call(
        this,
        'databarApi',
        {
            method: 'POST',
            url: `https://api.databar.ai/v1/enrichments/${enrichmentId}/run`,
            body: { params },
        },
    );
}
```

---

## 🧪 Testing Guide

### Test 1: Guided Fields with Required Parameters

1. Add Databar node
2. Resource: **Enrichment**, Operation: **Run**
3. Enrichment: Search and select **"Get people data from email"** (ID: 2)
4. Parameter Input Mode: **Guided Fields** (default)
5. **Verify**: Individual field appears for "Email" marked as required
6. Email: `john@example.com`
7. Wait for Completion: ✓
8. Execute
9. **Expected**: Successfully enriches and returns person data

### Test 2: Raw JSON Mode

1. Same setup as Test 1, but:
4. Parameter Input Mode: **Raw JSON**
5. **Verify**: Single JSON editor appears
6. Parameters (JSON): `{"email": "john@example.com"}`
7. Execute
8. **Expected**: Same result as Test 1

### Test 3: Multiple Parameters (Optional + Required)

1. Select an enrichment with multiple parameters (e.g., LinkedIn Profile Scraper)
2. Parameter Input Mode: **Guided Fields**
3. **Verify**: 
   - Required fields are marked with *
   - Optional fields have no mark
   - Each field shows description
4. Fill only required fields
5. Execute
6. **Expected**: Works without needing optional fields

### Test 4: Type Validation

1. Select enrichment with number parameter
2. Parameter Input Mode: **Guided Fields**
3. **Verify**: Number field shows number input type
4. Try entering text → Should show validation error
5. Enter valid number
6. Execute
7. **Expected**: Successfully processes

### Test 5: Dynamic Field Loading

1. Select enrichment A
2. **Verify**: Fields for enrichment A appear
3. Change to enrichment B
4. **Verify**: Fields update to enrichment B's parameters
5. Change back to enrichment A
6. **Verify**: Fields revert to enrichment A

---

## ✅ Benefits

### For Users
- **Easier to use**: No need to remember parameter names
- **Type-safe**: Fields validate input types (text, number, boolean)
- **Clear requirements**: Required fields are marked
- **Guided experience**: Descriptions help users understand what to enter
- **Flexible**: Can switch to JSON for complex cases

### For Developers
- **Leverages n8n built-ins**: Uses n8n's resourceMapper instead of custom code
- **Type-safe**: TypeScript types for all fields and values
- **Maintainable**: Changes to enrichments in Databar automatically reflect in UI
- **Extensible**: Easy to add more field types or validation

---

## 🚀 Future Enhancements

### Possible Improvements

1. **Bulk Run with Guided Fields**: Currently bulk run only supports JSON. Could add resourceMapper for bulk mode too.

2. **Default Values**: Pre-fill common parameters (e.g., default to "true" for boolean fields)

3. **Field Validation**: Add regex patterns or custom validators based on enrichment requirements

4. **Nested Objects**: Support complex parameter structures with nested object fields

5. **Field Dependencies**: Show/hide fields based on other field values

6. **Expression Support**: Allow n8n expressions in guided fields (currently works, but could be more explicit)

7. **Help Text**: Add more detailed help tooltips or links to documentation

---

## 📊 Comparison: Before vs After

### Before (Manual Template Copy/Paste)
```
❌ User had to:
1. Toggle "View Template" 
2. Read template from dropdown description
3. Copy JSON structure
4. Paste into Parameters field
5. Replace <text> placeholders
6. Hope they got the format right

⚠️ Error-prone, multi-step process
```

### After (Guided Fields)
```
✅ User just:
1. Select enrichment
2. Fill in labeled fields
3. Execute

✨ Clean, intuitive, error-free
```

---

## 🎓 Key Learnings

### Why Auto-Fill Didn't Work

The initial approach tried to auto-populate a JSON field from a template dropdown:
- Used `default: '={{ $parameter["templateHelper"] }}'` expression
- Problem: `loadOptionsMethod` loads options but doesn't auto-select one
- Field stayed at default value until user manually clicked dropdown
- Resulted in empty `{}` or "loading" text instead of actual template

### Why ResourceMapper Works

ResourceMapper doesn't try to auto-populate:
- Generates **individual input fields** instead of one JSON field
- Each field has its own value, not dependent on dropdown selection
- n8n handles all the rendering, validation, and data extraction
- We just provide field definitions, n8n does the rest

### Architecture Decision

**Chose resourceMapper over:**
- ❌ Auto-fill expressions (unreliable)
- ❌ Custom field generation (too much code)
- ❌ Manual JSON only (poor UX)
- ✅ **n8n's built-in resourceMapper** (best of both worlds)

---

## 📝 Commits

1. **`f5dbfb3`**: feat: Implement resourceMapper for guided parameter input
2. **`438b162`**: docs: Update README with resourceMapper (Guided Fields) feature

---

## 🔗 Related Files

- **Implementation**: `nodes/Databar/Databar.node.ts` (lines 307-381, 1089-1174, 1301-1323)
- **Documentation**: `README.md` (sections: Features, Key Features, Usage Examples, Technical Details)
- **Types**: Imported from `n8n-workflow` (ResourceMapperFields, ResourceMapperField)

---

**Status**: ✅ **Fully Implemented and Deployed**

The node is now live at `http://localhost:5678` with resourceMapper support!

