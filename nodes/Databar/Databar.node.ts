/**
 * Databar.ai n8n Community Node
 * 
 * This node provides integration with the Databar.ai REST API for data enrichment
 * and table management operations.
 * 
 * Key Features:
 * - Dynamic enrichment/waterfall/table selection with search functionality
 * - Automatic async task polling with configurable intervals and timeouts
 * - Full type safety with proper error handling
 * - Complete API coverage for all Databar.ai endpoints
 * 
 * Architecture:
 * - Uses absolute URLs (https://api.databar.ai/v1/...) for all API calls
 * - Credentials passed via x-apikey header (defined in DatabarApi.credentials.ts)
 * - Async operations (enrichments, waterfalls) return task_id and optionally poll for completion
 * - Dynamic dropdowns populated via loadOptionsMethod functions
 * 
 * Resources & Operations:
 * - User: Get user info
 * - Enrichment: List, Get, Run, Bulk Run (with async polling)
 * - Table: Create, List, Get Rows, Get Columns, Get Enrichments, Add Enrichment, Run Enrichment
 * - Waterfall: List, Get, Run, Bulk Run (with async polling)
 * - Task: Get Status (for checking async task results)
 */

import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	ResourceMapperFields,
	ResourceMapperField,
} from 'n8n-workflow';

/**
 * Helper function to poll task status until completion
 * 
 * This function handles the asynchronous nature of Databar enrichment and waterfall operations.
 * It polls the /v1/tasks/{taskId} endpoint at regular intervals until the task completes or fails.
 * 
 * @param context - n8n execution context for making HTTP requests
 * @param taskId - The task ID returned from enrichment/waterfall run operations
 * @param pollInterval - Seconds between status checks (default: 5)
 * @param timeout - Maximum seconds to wait before timing out (default: 300)
 * @returns The completed task data with results
 * @throws NodeOperationError if task fails or times out
 */
async function pollTaskStatus(
	context: IExecuteFunctions,
	taskId: string,
	pollInterval: number,
	timeout: number,
): Promise<IDataObject> {
	const startTime = Date.now();
	const pollIntervalMs = pollInterval * 1000;
	const timeoutMs = timeout * 1000;

	while (true) {
		// Check if we've exceeded the timeout
		if (Date.now() - startTime > timeoutMs) {
			throw new NodeOperationError(
				context.getNode(),
				`Task ${taskId} timed out after ${timeout} seconds`,
			);
		}

		// Check task status
		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'databarApi',
			{
				method: 'GET',
				url: `https://api.databar.ai/v1/tasks/${taskId}`,
			},
		);

		const taskData = response as IDataObject;
		const status = taskData.status as string;

		if (status === 'completed') {
			return taskData;
		}

		if (status === 'failed') {
			const error = taskData.error || 'Task failed without error message';
			throw new NodeOperationError(
				context.getNode(),
				`Task ${taskId} failed: ${error}`,
			);
		}

		// Wait before polling again
		await new Promise<void>((resolve) => {
			(globalThis as any).setTimeout(resolve, pollIntervalMs);
		});
	}
}

export class Databar implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Databar',
		name: 'databar',
		icon: 'file:databar.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Databar.ai API for data enrichment and table management',
		defaults: {
			name: 'Databar',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'databarApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.databar.ai',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Enrichment',
						value: 'enrichment',
					},
					{
						name: 'Table',
						value: 'table',
					},
					{
						name: 'Waterfall',
						value: 'waterfall',
					},
					{
						name: 'Task',
						value: 'task',
					},
				],
				default: 'enrichment',
			},

			// ====================================
			//         USER OPERATIONS
			// ====================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get User Info',
						value: 'getMe',
						description: 'Get information about your current account',
						action: 'Get user info',
					},
				],
				default: 'getMe',
			},

			// ====================================
			//      ENRICHMENT OPERATIONS
			// ====================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['enrichment'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'Get all available enrichments',
						action: 'List enrichments',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get details of a specific enrichment',
						action: 'Get enrichment',
					},
					{
						name: 'Run',
						value: 'run',
						description: 'Run an enrichment task',
						action: 'Run enrichment',
					},
					{
						name: 'Bulk Run',
						value: 'bulkRun',
						description: 'Run enrichment on multiple records',
						action: 'Bulk run enrichment',
					},
				],
				default: 'list',
			},

			// Enrichment: List - Search query
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['list'],
					},
				},
				default: '',
				description: 'Search enrichments by keyword (minimum 3 characters)',
			},

			// Enrichment: Selection Mode
			{
				displayName: 'Enrichment Selection',
				name: 'enrichmentSelectionMode',
				type: 'options',
				options: [
					{
						name: 'From List',
						value: 'list',
						description: 'Select from available enrichments',
					},
					{
						name: 'By ID',
						value: 'id',
						description: 'Enter enrichment ID manually',
					},
				],
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['get', 'run', 'bulkRun'],
					},
				},
				default: 'list',
				description: 'How to select the enrichment',
			},

			// Enrichment: Get/Run/BulkRun - Enrichment Selection from List
			{
				displayName: 'Enrichment',
				name: 'enrichmentId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEnrichments',
					searchable: true,  // Enable client-side search
				},
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['get', 'run', 'bulkRun'],
						enrichmentSelectionMode: ['list'],
					},
				},
				default: '',
				required: true,
				description: 'Select the enrichment to use. If this dropdown is empty, switch to "By ID" mode above.',
			},

			// Enrichment: Get/Run/BulkRun - Enrichment ID Manual Entry
			{
				displayName: 'Enrichment ID',
				name: 'enrichmentId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['get', 'run', 'bulkRun'],
						enrichmentSelectionMode: ['id'],
					},
				},
				default: 0,
				required: true,
				description: 'Enter the enrichment ID (e.g., 1220 for Email Verifier)',
			},

			// Enrichment: Run - Parameter Input Mode
			{
				displayName: 'Parameter Input Mode',
				name: 'parameterMode',
				type: 'options',
				options: [
					{
						name: 'Guided Fields',
						value: 'fields',
						description: 'Fill in parameters using individual fields',
					},
					{
						name: 'Raw JSON',
						value: 'json',
						description: 'Enter parameters as JSON object',
					},
				],
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['run'],
					},
				},
				default: 'fields',
				description: 'Choose how to input enrichment parameters',
			},

			// Enrichment: Run - Parameters as Resource Mapper (Guided Fields)
			{
				displayName: 'Parameters',
				name: 'paramsFields',
				type: 'resourceMapper',
				noDataExpression: true,
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				required: true,
				typeOptions: {
					loadOptionsDependsOn: ['enrichmentId'],
					resourceMapper: {
						resourceMapperMethod: 'getEnrichmentFields',
						mode: 'add',
						valuesLabel: 'Parameters',
						addAllFields: true,
						multiKeyMatch: false,
					},
				},
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['run'],
						parameterMode: ['fields'],
					},
				},
				description: 'Fill in the enrichment parameters',
			},

			// Enrichment: Run - Template Helper for JSON Mode (Hidden field that loads template)
			{
				displayName: 'Template',
				name: 'jsonTemplateHelper',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEnrichmentTemplate',
					loadOptionsDependsOn: ['enrichmentId'],
				},
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['run'],
						parameterMode: ['json'],
					},
				},
				default: '{}',
				description: 'Click to see the parameter template, then copy it into the field below',
			},

			// Enrichment: Run - Parameters as JSON (Raw JSON)
			{
				displayName: 'Parameters (JSON)',
				name: 'paramsJson',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['run'],
						parameterMode: ['json'],
					},
				},
				default: '={{ $parameter["jsonTemplateHelper"] }}',
				placeholder: '{"email": "test@example.com"}',
				hint: '✨ Auto-filled from template above! Replace <text> placeholders with your actual data.',
				description: 'Parameters automatically populated from template. Replace placeholders with real values.',
				required: true,
			},

			// Enrichment: Bulk Run - Parameters JSON
			{
				displayName: 'Parameters (Array of Objects)',
				name: 'bulkParams',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['bulkRun'],
					},
				},
				default: '[{}]',
				placeholder: '[{"email": "john@example.com"}, {"email": "jane@example.com"}]',
				hint: 'Array of parameter objects. Each object should have the same structure as the single enrichment run.',
				description: 'Array of enrichment parameters for bulk processing.',
				required: true,
			},

			// Enrichment: Run/BulkRun - Wait for Completion
			{
				displayName: 'Wait for Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['run', 'bulkRun'],
					},
				},
				default: true,
				description: 'Whether to wait for the enrichment to complete and return results automatically',
			},

			// Enrichment: Additional Options
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['run', 'bulkRun'],
						waitForCompletion: [true],
					},
				},
				options: [
					{
						displayName: 'Poll Interval (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'How often to check for completion (in seconds)',
					},
					{
						displayName: 'Timeout (seconds)',
						name: 'timeout',
						type: 'number',
						default: 300,
						description: 'Maximum time to wait for completion (in seconds)',
					},
				],
			},

			// ====================================
			//        TABLE OPERATIONS
			// ====================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['table'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new table',
						action: 'Create table',
					},
					{
						name: 'List',
						value: 'list',
						description: 'Get all workspace tables',
						action: 'List tables',
					},
					{
						name: 'Get Rows',
						value: 'getRows',
						description: 'Get table rows',
						action: 'Get table rows',
					},
					{
						name: 'Get Columns',
						value: 'getColumns',
						description: 'Get table columns',
						action: 'Get table columns',
					},
					{
						name: 'Get Enrichments',
						value: 'getEnrichments',
						description: 'Get table enrichments',
						action: 'Get table enrichments',
					},
					{
						name: 'Add Enrichment',
						value: 'addEnrichment',
						description: 'Add enrichment to table',
						action: 'Add enrichment to table',
					},
					{
						name: 'Run Enrichment',
						value: 'runEnrichment',
						description: 'Run table enrichment',
						action: 'Run table enrichment',
					},
				],
				default: 'list',
			},

			// Table: Get Rows/Columns/Enrichments/Add/Run - Table Selection
			{
				displayName: 'Table',
				name: 'tableUuid',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTables',
					searchable: true,
				},
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['getRows', 'getColumns', 'getEnrichments', 'addEnrichment', 'runEnrichment'],
					},
				},
				default: '',
				required: true,
				description: 'Select the table to use',
			},

			// Table: Get Rows - Pagination
			{
				displayName: 'Per Page',
				name: 'perPage',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['getRows'],
					},
				},
				default: 1000,
				description: 'Number of items to return per page',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['getRows'],
					},
				},
				default: 1,
				description: 'Page number to retrieve',
			},

			// Table: Add Enrichment - Enrichment ID
			{
				displayName: 'Enrichment ID',
				name: 'enrichmentId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['addEnrichment'],
					},
				},
				default: 0,
				required: true,
				description: 'The ID of the enrichment to add',
			},

			// Table: Add Enrichment - Mapping
			{
				displayName: 'Mapping',
				name: 'mapping',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['addEnrichment'],
					},
				},
				default: '{"param1": {"value": "column1", "type": "mapping"}}',
				description: 'Mapping configuration for the enrichment',
				required: true,
			},

			// Table: Run Enrichment - Enrichment ID
			{
				displayName: 'Enrichment ID',
				name: 'tableEnrichmentId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['runEnrichment'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the enrichment to run',
			},

			// ====================================
			//      WATERFALL OPERATIONS
			// ====================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['waterfall'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'Get all available waterfalls',
						action: 'List waterfalls',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get details of a specific waterfall',
						action: 'Get waterfall',
					},
					{
						name: 'Run',
						value: 'run',
						description: 'Run a waterfall task',
						action: 'Run waterfall',
					},
					{
						name: 'Bulk Run',
						value: 'bulkRun',
						description: 'Run waterfall on multiple records',
						action: 'Bulk run waterfall',
					},
				],
				default: 'list',
			},

			// Waterfall: Get/Run/BulkRun - Waterfall Selection
			{
				displayName: 'Waterfall',
				name: 'waterfallIdentifier',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getWaterfalls',
					searchable: true,
				},
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['get', 'run', 'bulkRun'],
					},
				},
				default: '',
				required: true,
				description: 'Select the waterfall to use',
			},

			// Waterfall: Run - Parameter Help Notice
			{
				displayName: 'To see required parameters for this waterfall, check the waterfall details. Use "Get Waterfall" operation to see input parameter requirements.',
				name: 'parameterNotice',
				type: 'notice',
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['run'],
					},
				},
				default: '',
			},

			// Waterfall: Run - Parameters as JSON
			{
				displayName: 'Parameters (JSON)',
				name: 'params',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['run'],
					},
				},
				default: '{"first_name": "John", "last_name": "Doe", "company": "example.com"}',
				description: 'Parameters for the waterfall as a JSON object',
				required: true,
			},

			// Waterfall: Run - Enrichments
			{
				displayName: 'Enrichment IDs',
				name: 'enrichments',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['run'],
					},
				},
				default: '833',
				description: 'Comma-separated list of enrichment IDs to use (e.g., "833,966"). Default is 833.',
			},

			// Waterfall: Bulk Run - Parameters JSON
			{
				displayName: 'Parameters (Array of Objects)',
				name: 'bulkParams',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['bulkRun'],
					},
				},
				default: '[{"param1": "value1"}, {"param1": "value2"}]',
				description: 'Array of parameter objects for bulk waterfall',
				required: true,
			},

			// Waterfall: Bulk Run - Enrichments
			{
				displayName: 'Enrichment IDs',
				name: 'enrichments',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['bulkRun'],
					},
				},
				default: '833',
				description: 'Comma-separated list of enrichment IDs to use (e.g., "833,966"). Default is 833.',
			},

			// Waterfall: Run/BulkRun - Wait for Completion
			{
				displayName: 'Wait for Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['run', 'bulkRun'],
					},
				},
				default: true,
				description: 'Whether to wait for the waterfall to complete and return results automatically',
			},

			// Waterfall: Additional Options
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['run', 'bulkRun'],
						waitForCompletion: [true],
					},
				},
				options: [
					{
						displayName: 'Poll Interval (seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'How often to check for completion (in seconds)',
					},
					{
						displayName: 'Timeout (seconds)',
						name: 'timeout',
						type: 'number',
						default: 300,
						description: 'Maximum time to wait for completion (in seconds)',
					},
				],
			},

			// ====================================
			//        TASK OPERATIONS
			// ====================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['task'],
					},
				},
				options: [
					{
						name: 'Get Status',
						value: 'getStatus',
						description: 'Get task status and data',
						action: 'Get task status',
					},
				],
				default: 'getStatus',
			},

			// Task: Get Status - Request ID
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['getStatus'],
					},
				},
				default: '',
				required: true,
				description: 'The task/request ID to check',
			},
		],
	};

	/**
	 * Methods for loading dynamic options in the UI
	 * 
	 * These functions are called by n8n to populate dropdown selections.
	 * They fetch data from the Databar API and format it for display.
	 */
	methods = {
		loadOptions: {
			/**
			 * Load available enrichments from Databar API
			 * 
			 * Fetches all enrichments and formats them for display in dropdown.
			 * Each option shows: name, description, data source, and credit cost.
			 * The dropdown is searchable client-side.
			 * 
			 * @returns Array of enrichment options with name, value (id), and description
			 */
			async getEnrichments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				try {
					const enrichments = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: 'https://api.databar.ai/v1/enrichments/',
						},
					);

					if (Array.isArray(enrichments)) {
						for (const enrichment of enrichments) {
							const enrichmentData = enrichment as IDataObject;
							const dataSource = enrichmentData.data_source as string || 'Unknown';
							const price = enrichmentData.price as number || 0;
							returnData.push({
								name: enrichmentData.name as string,
								value: enrichmentData.id as number,
								description: `${enrichmentData.description as string} | ${dataSource} · ${price} Credits`,
							});
						}
					}

					// Sort by name
					returnData.sort((a, b) => a.name.localeCompare(b.name));
				} catch (error) {
					// Return error as an option so user knows what went wrong
					const errorMessage = error instanceof Error ? error.message : 'Failed to load enrichments';
					returnData.push({
						name: `⚠️ Error: ${errorMessage}`,
						value: '',
						description: 'Switch to "By ID" mode to enter enrichment ID manually',
					});
				}
				return returnData;
			},

			// Load waterfalls
			async getWaterfalls(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				try {
					const waterfalls = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: 'https://api.databar.ai/v1/waterfalls/',
						},
					);

					if (Array.isArray(waterfalls)) {
						for (const waterfall of waterfalls) {
							const waterfallData = waterfall as IDataObject;
							returnData.push({
								name: waterfallData.name as string,
								value: waterfallData.identifier as string,
								description: waterfallData.description as string,
							});
						}
					}

					// Sort by name
					returnData.sort((a, b) => a.name.localeCompare(b.name));
				} catch (error) {
					// Silently fail
				}
				return returnData;
			},

			// Load tables
			async getTables(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				try {
					const tables = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: 'https://api.databar.ai/v1/table/',
						},
					);

					if (Array.isArray(tables)) {
						for (const table of tables) {
							const tableData = table as IDataObject;
							returnData.push({
								name: tableData.name as string,
								value: tableData.identifier as string,
								description: `Created: ${tableData.created_at}`,
							});
						}
					}

					// Sort by name
					returnData.sort((a, b) => a.name.localeCompare(b.name));
				} catch (error) {
					// Silently fail
				}
				return returnData;
			},

			/**
			 * Get parameter template for selected enrichment
			 * 
			 * Fetches enrichment details and generates a JSON template showing
			 * required and optional parameters with their types and descriptions.
			 */
			async getEnrichmentTemplate(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					// Get enrichment ID - could be from list or manual entry
					let enrichmentId: number | undefined;
					
					try {
						const enrichmentIdRaw = this.getCurrentNodeParameter('enrichmentId');
						if (enrichmentIdRaw) {
							enrichmentId = typeof enrichmentIdRaw === 'string' ? parseInt(enrichmentIdRaw, 10) : enrichmentIdRaw as number;
						}
					} catch (error) {
						// Parameter might not be set yet
					}
					
					if (!enrichmentId || isNaN(enrichmentId)) {
						return [{
							name: '👆 Select an enrichment above first',
							value: '{}',
							description: 'Choose an enrichment from the dropdown above to see its parameter template here.',
						}];
					}

					// Fetch enrichment details
					const enrichment = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: `https://api.databar.ai/v1/enrichments/${enrichmentId}`,
						},
					);

					const enrichmentData = enrichment as IDataObject;
					const params = (enrichmentData.params as IDataObject[]) || [];

					if (params.length === 0) {
						return [{
							name: '✅ No parameters required',
							value: '{}',
							description: 'This enrichment does not require any parameters. You can leave the Parameters field empty.',
						}];
					}

					// Build template object
					const template: IDataObject = {};
					const paramDescriptions: string[] = [];

					for (const param of params) {
						const paramName = param.name as string;
						const isRequired = param.is_required as boolean;
						const typeField = param.type_field as string;
						const description = param.description as string || 'No description';
						
						// Add to template with placeholder
						template[paramName] = `<${typeField}>`;
						
						// Add to description list
						const requiredLabel = isRequired ? '🔴 REQUIRED' : '⚪ optional';
						paramDescriptions.push(`${requiredLabel} • ${paramName} (${typeField}): ${description}`);
					}

					// Format as readable JSON
					const templateJson = JSON.stringify(template, null, 2);
					const singleLineJson = JSON.stringify(template);  // Single line for expression
					const paramList = paramDescriptions.join('\n');

					return [{
						name: '📋 Template loaded',
						value: singleLineJson,  // Valid JSON string without newlines
						description: `Required Parameters:\n${paramList}\n\n📝 JSON Template:\n${templateJson}`,
					}];

				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					return [{
						name: '⚠️ Error loading template',
						value: '{}',
						description: `Could not fetch enrichment parameters. Error: ${errorMessage}\n\nTry:\n• Verify the enrichment ID is valid\n• Check your API key has access\n• Use the "Get" operation to see parameters manually`,
					}];
				}
			},
		},

		resourceMapping: {
			/**
			 * Get enrichment fields for resource mapper
			 * 
			 * Fetches enrichment details and returns field definitions for the resource mapper.
			 * This allows users to fill in parameters using individual input fields.
			 */
			async getEnrichmentFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				try {
					// Get enrichment ID
					let enrichmentId: number | undefined;
					
					try {
						const enrichmentIdRaw = this.getCurrentNodeParameter('enrichmentId');
						if (enrichmentIdRaw) {
							enrichmentId = typeof enrichmentIdRaw === 'string' ? parseInt(enrichmentIdRaw, 10) : enrichmentIdRaw as number;
						}
					} catch (error) {
						// Parameter might not be set yet
					}
					
					if (!enrichmentId || isNaN(enrichmentId)) {
						// Return empty fields if no enrichment selected
						return {
							fields: [],
						};
					}

					// Fetch enrichment details
					const enrichment = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: `https://api.databar.ai/v1/enrichments/${enrichmentId}`,
						},
					);

					const enrichmentData = enrichment as IDataObject;
					const params = (enrichmentData.params as IDataObject[]) || [];

					if (params.length === 0) {
						return {
							fields: [],
						};
					}

					// Build field definitions for resource mapper
					const fields: ResourceMapperField[] = params.map((param) => {
						const paramName = param.name as string;
						const isRequired = param.is_required as boolean;
						const typeField = param.type_field as string;
						const description = param.description as string || 'No description';
						
						// Map Databar types to n8n resource mapper types
						let fieldType: 'string' | 'number' | 'boolean' | 'time' | 'object' | 'options' | 'array' = 'string';
						if (typeField === 'number' || typeField === 'integer') {
							fieldType = 'number';
						} else if (typeField === 'boolean') {
							fieldType = 'boolean';
						}

						return {
							id: paramName,
							displayName: paramName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
							required: isRequired,
							defaultMatch: false,
							display: true,
							type: fieldType,
							canBeUsedToMatch: false,
							description: `${description} (${typeField})`,
						};
					});

					return {
						fields,
					};

				} catch (error) {
					// Return empty fields on error
					return {
						fields: [],
					};
				}
			},
		},

		// This method gets enrichment parameter info to display to users
		async getEnrichmentParams(this: IExecuteFunctions | ILoadOptionsFunctions, enrichmentId: number | string) {
			try {
				const enrichmentDetails = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'databarApi',
					{
						method: 'GET',
						url: `https://api.databar.ai/v1/enrichments/${enrichmentId}`,
					},
				);
				return enrichmentDetails as IDataObject;
			} catch (error) {
				// Silently fail
				return null;
			}
		},
	};

	/**
	 * Main execution function
	 * 
	 * This function is called when the node is executed in a workflow.
	 * It processes each input item and performs the requested operation.
	 * 
	 * Structure:
	 * 1. Get resource (user, enrichment, table, waterfall, task) and operation
	 * 2. Loop through input items
	 * 3. Extract parameters and validate
	 * 4. Make API request with proper authentication
	 * 5. Handle async operations with optional polling
	 * 6. Return formatted results
	 * 
	 * Key Implementation Details:
	 * - All URLs are absolute (https://api.databar.ai/v1/...)
	 * - Enrichment/Waterfall IDs are validated and converted to proper types
	 * - Async operations return task_id or poll for completion based on user preference
	 * - Errors are caught and wrapped in NodeOperationError with helpful messages
	 * 
	 * @returns Array of execution data to pass to next node
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				// ====================================
				//         USER OPERATIONS
				// ====================================
				if (resource === 'user') {
					if (operation === 'getMe') {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: 'https://api.databar.ai/v1/user/me',
							},
						);
						returnData.push(response as IDataObject);
					}
				}

				// ====================================
				//      ENRICHMENT OPERATIONS
				// ====================================
				else if (resource === 'enrichment') {
					if (operation === 'list') {
						const searchQuery = this.getNodeParameter('searchQuery', i) as string;
						const qs: IDataObject = {};
						if (searchQuery) {
							qs.q = searchQuery;
						}
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: 'https://api.databar.ai/v1/enrichments/',
								qs,
							},
						);
						if (Array.isArray(response)) {
							returnData.push(...(response as IDataObject[]));
						} else {
							returnData.push(response as IDataObject);
						}
					} else if (operation === 'get') {
						const enrichmentIdRaw = this.getNodeParameter('enrichmentId', i);
						const enrichmentId = typeof enrichmentIdRaw === 'string' ? parseInt(enrichmentIdRaw, 10) : enrichmentIdRaw;
						
						if (!enrichmentId || isNaN(enrichmentId as number)) {
							throw new NodeOperationError(
								this.getNode(),
								'Please provide a valid enrichment ID',
								{ itemIndex: i },
							);
						}
						
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: `https://api.databar.ai/v1/enrichments/${enrichmentId}`,
							},
						);
						returnData.push(response as IDataObject);
					} else if (operation === 'run') {
						const enrichmentIdRaw = this.getNodeParameter('enrichmentId', i);
						const enrichmentId = typeof enrichmentIdRaw === 'string' ? parseInt(enrichmentIdRaw, 10) : enrichmentIdRaw;
						
						if (!enrichmentId || isNaN(enrichmentId as number)) {
							throw new NodeOperationError(
								this.getNode(),
								'Please provide a valid enrichment ID',
								{ itemIndex: i },
							);
						}
						
						const parameterMode = this.getNodeParameter('parameterMode', i, 'fields') as string;
						const waitForCompletion = this.getNodeParameter('waitForCompletion', i, true) as boolean;
						
						// Get parameters based on input mode
						let params: IDataObject;
						if (parameterMode === 'fields') {
							// Resource mapper mode - get structured fields
							const paramsFields = this.getNodeParameter('paramsFields', i) as IDataObject;
							// Resource mapper returns an object with 'value' containing the actual data
							params = (paramsFields.value as IDataObject) || {};
						} else {
							// Raw JSON mode - parse JSON string
							const paramsJson = this.getNodeParameter('paramsJson', i) as string;
							try {
								params = JSON.parse(paramsJson);
							} catch (error) {
								throw new NodeOperationError(
									this.getNode(),
									'Parameters must be valid JSON object',
									{ itemIndex: i },
								);
							}
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'POST',
								url: `https://api.databar.ai/v1/enrichments/${enrichmentId}/run`,
								body: { params },
							},
						);

						const taskResponse = response as IDataObject;
						
						if (waitForCompletion) {
							const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
							const pollInterval = (additionalOptions.pollInterval as number) || 3;
							const timeout = (additionalOptions.timeout as number) || 300;
							const taskId = taskResponse.task_id as string;
							
							// Poll for completion
							const completedTask = await pollTaskStatus(this, taskId, pollInterval, timeout);
							returnData.push(completedTask);
						} else {
							returnData.push(taskResponse);
						}
					} else if (operation === 'bulkRun') {
						const enrichmentIdRaw = this.getNodeParameter('enrichmentId', i);
						const enrichmentId = typeof enrichmentIdRaw === 'string' ? parseInt(enrichmentIdRaw, 10) : enrichmentIdRaw;
						
						if (!enrichmentId || isNaN(enrichmentId as number)) {
							throw new NodeOperationError(
								this.getNode(),
								'Please provide a valid enrichment ID',
								{ itemIndex: i },
							);
						}
						
						const bulkParams = this.getNodeParameter('bulkParams', i) as string;
						const waitForCompletion = this.getNodeParameter('waitForCompletion', i, true) as boolean;
						
						let paramsArray;
						try {
							paramsArray = JSON.parse(bulkParams);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								'Bulk parameters must be valid JSON array',
								{ itemIndex: i },
							);
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'POST',
								url: `https://api.databar.ai/v1/enrichments/${enrichmentId}/bulk-run`,
								body: { params: paramsArray },
							},
						);

						const taskResponse = response as IDataObject;
						
						if (waitForCompletion) {
							const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
							const pollInterval = (additionalOptions.pollInterval as number) || 3;
							const timeout = (additionalOptions.timeout as number) || 300;
							const taskId = taskResponse.task_id as string;
							
							// Poll for completion
							const completedTask = await pollTaskStatus(this, taskId, pollInterval, timeout);
							returnData.push(completedTask);
						} else {
							returnData.push(taskResponse);
						}
					}
				}

				// ====================================
				//        TABLE OPERATIONS
				// ====================================
				else if (resource === 'table') {
					if (operation === 'create') {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'POST',
								url: 'https://api.databar.ai/v1/table/create',
								body: {},
							},
						);
						returnData.push(response as IDataObject);
					} else if (operation === 'list') {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: 'https://api.databar.ai/v1/table/',
							},
						);
						if (Array.isArray(response)) {
							returnData.push(...(response as IDataObject[]));
						} else {
							returnData.push(response as IDataObject);
						}
					} else if (operation === 'getRows') {
						const tableUuid = this.getNodeParameter('tableUuid', i) as string;
						const perPage = this.getNodeParameter('perPage', i) as number;
						const page = this.getNodeParameter('page', i) as number;
						
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: `https://api.databar.ai/v1/table/${tableUuid}/rows`,
								qs: { per_page: perPage, page },
							},
						);
						returnData.push(response as IDataObject);
					} else if (operation === 'getColumns') {
						const tableUuid = this.getNodeParameter('tableUuid', i) as string;
						
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: `https://api.databar.ai/v1/table/${tableUuid}/columns`,
							},
						);
						if (Array.isArray(response)) {
							returnData.push(...(response as IDataObject[]));
						} else {
							returnData.push(response as IDataObject);
						}
					} else if (operation === 'getEnrichments') {
						const tableUuid = this.getNodeParameter('tableUuid', i) as string;
						
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: `https://api.databar.ai/v1/table/${tableUuid}/enrichments`,
							},
						);
						if (Array.isArray(response)) {
							returnData.push(...(response as IDataObject[]));
						} else {
							returnData.push(response as IDataObject);
						}
					} else if (operation === 'addEnrichment') {
						const tableUuid = this.getNodeParameter('tableUuid', i) as string;
						const enrichmentIdRaw = this.getNodeParameter('enrichmentId', i);
						const enrichmentId = typeof enrichmentIdRaw === 'string' ? parseInt(enrichmentIdRaw, 10) : enrichmentIdRaw;
						
						if (!enrichmentId || isNaN(enrichmentId as number)) {
							throw new NodeOperationError(
								this.getNode(),
								'Please provide a valid enrichment ID',
								{ itemIndex: i },
							);
						}
						
						const mapping = this.getNodeParameter('mapping', i) as string;
						
						let mappingObj;
						try {
							mappingObj = JSON.parse(mapping);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								'Mapping must be valid JSON object',
								{ itemIndex: i },
							);
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'POST',
								url: `https://api.databar.ai/v1/table/${tableUuid}/add-enrichment`,
								body: {
									enrichment: enrichmentId,
									mapping: mappingObj,
								},
							},
						);
						returnData.push(response as IDataObject);
					} else if (operation === 'runEnrichment') {
						const tableUuid = this.getNodeParameter('tableUuid', i) as string;
						const tableEnrichmentId = this.getNodeParameter('tableEnrichmentId', i) as string;
						
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: `https://api.databar.ai/v1/table/${tableUuid}/run-enrichment/${tableEnrichmentId}`,
							},
						);
						returnData.push(response as IDataObject);
					}
				}

				// ====================================
				//      WATERFALL OPERATIONS
				// ====================================
				else if (resource === 'waterfall') {
					if (operation === 'list') {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: 'https://api.databar.ai/v1/waterfalls/',
							},
						);
						if (Array.isArray(response)) {
							returnData.push(...(response as IDataObject[]));
						} else {
							returnData.push(response as IDataObject);
						}
					} else if (operation === 'get') {
						const waterfallIdentifier = this.getNodeParameter('waterfallIdentifier', i) as string;
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: `https://api.databar.ai/v1/waterfalls/${waterfallIdentifier}`,
							},
						);
						returnData.push(response as IDataObject);
					} else if (operation === 'run') {
						const waterfallIdentifier = this.getNodeParameter('waterfallIdentifier', i) as string;
						const paramsJson = this.getNodeParameter('params', i) as string;
						const enrichmentsStr = this.getNodeParameter('enrichments', i) as string;
						const waitForCompletion = this.getNodeParameter('waitForCompletion', i, true) as boolean;
						
						// Parse JSON parameters
						let params: IDataObject;
						try {
							params = JSON.parse(paramsJson);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								'Parameters must be valid JSON object',
								{ itemIndex: i },
							);
						}

						// Parse enrichment IDs
						const enrichments = enrichmentsStr
							.split(',')
							.map((id) => parseInt(id.trim(), 10))
							.filter((id) => !isNaN(id));

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'POST',
								url: `https://api.databar.ai/v1/waterfalls/${waterfallIdentifier}/run`,
								body: { params, enrichments },
							},
						);

						const taskResponse = response as IDataObject;
						
						if (waitForCompletion) {
							const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
							const pollInterval = (additionalOptions.pollInterval as number) || 3;
							const timeout = (additionalOptions.timeout as number) || 300;
							const taskId = taskResponse.task_id as string;
							
							// Poll for completion
							const completedTask = await pollTaskStatus(this, taskId, pollInterval, timeout);
							returnData.push(completedTask);
						} else {
							returnData.push(taskResponse);
						}
					} else if (operation === 'bulkRun') {
						const waterfallIdentifier = this.getNodeParameter('waterfallIdentifier', i) as string;
						const bulkParams = this.getNodeParameter('bulkParams', i) as string;
						const enrichmentsStr = this.getNodeParameter('enrichments', i) as string;
						const waitForCompletion = this.getNodeParameter('waitForCompletion', i, true) as boolean;
						
						let paramsArray;
						try {
							paramsArray = JSON.parse(bulkParams);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								'Bulk parameters must be valid JSON array',
								{ itemIndex: i },
							);
						}

						// Parse enrichment IDs
						const enrichments = enrichmentsStr
							.split(',')
							.map((id) => parseInt(id.trim(), 10))
							.filter((id) => !isNaN(id));

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'POST',
								url: `https://api.databar.ai/v1/waterfalls/${waterfallIdentifier}/bulk-run`,
								body: { params: paramsArray, enrichments },
							},
						);

						const taskResponse = response as IDataObject;
						
						if (waitForCompletion) {
							const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
							const pollInterval = (additionalOptions.pollInterval as number) || 3;
							const timeout = (additionalOptions.timeout as number) || 300;
							const taskId = taskResponse.task_id as string;
							
							// Poll for completion
							const completedTask = await pollTaskStatus(this, taskId, pollInterval, timeout);
							returnData.push(completedTask);
						} else {
							returnData.push(taskResponse);
						}
					}
				}

				// ====================================
				//        TASK OPERATIONS
				// ====================================
				else if (resource === 'task') {
					if (operation === 'getStatus') {
						const taskId = this.getNodeParameter('taskId', i) as string;
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: `https://api.databar.ai/v1/tasks/${taskId}`,
							},
						);
						returnData.push(response as IDataObject);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					returnData.push({ error: errorMessage });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}

