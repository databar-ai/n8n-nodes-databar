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
 * - User: Get account info
 * - Enrichment: Run, Bulk Run (with async polling)
 * - Table: Insert Rows, Upsert Rows
 * - Waterfall: Run (with async polling)
 */

import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeConnectionTypes,
	NodeOperationError,
	ResourceMapperFields,
	ResourceMapperField,
	sleep,
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
		await sleep(pollIntervalMs);
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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
					name: 'Other',
					value: 'user',
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
						name: 'Get Account Info',
						value: 'getMe',
						description: 'Get information about your current account',
						action: 'Get account info',
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
					name: 'Run',
					value: 'run',
					description: 'Run an enrichment task',
					action: 'Run enrichment',
				},
				// Bulk Run hidden for v1 - re-add to enable:
				// { name: 'Bulk Run', value: 'bulkRun', description: 'Run enrichment on multiple records', action: 'Bulk run enrichment' },
			],
			default: 'run',
		},

		// Enrichment: Run/BulkRun - Enrichment Selection
		{
			displayName: 'Enrichment',
			name: 'enrichmentId',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getEnrichments',
				searchable: true,
			},
			displayOptions: {
				show: {
					resource: ['enrichment'],
					operation: ['run', 'bulkRun'],
				},
			},
			default: '',
			required: true,
			description: 'Select the enrichment to use. Switch to Expression mode to pass a dynamic enrichment ID.',
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
						supportAutoMap: false,
					},
				},
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['run'],
					},
				},
				description: 'Fill in the enrichment parameters',
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
						displayName: 'Poll Interval (Seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'How often to check for completion (in seconds)',
					},
					{
						displayName: 'Timeout (Seconds)',
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
						name: 'Insert Rows',
						value: 'insertRows',
						description: 'Insert one or more rows into a table',
						action: 'Insert rows into table',
					},
					{
						name: 'Upsert Rows',
						value: 'upsertRows',
						description: 'Update rows by key or create new ones if no match is found',
						action: 'Upsert rows in table',
					},
				],
				default: 'insertRows',
			},

			// Table: Selection from List
			{
				displayName: 'Table',
				name: 'tableId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTables',
					searchable: true,
				},
				displayOptions: {
					show: {
						resource: ['table'],
					},
				},
				default: '',
				required: true,
				description: 'Select the table to use. Switch to Expression mode to pass a dynamic table ID.',
			},

			// Table: Insert Rows - Fields (Resource Mapper)
			{
				displayName: 'Fields',
				name: 'rowFields',
				type: 'resourceMapper',
				noDataExpression: true,
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				required: true,
				typeOptions: {
					loadOptionsDependsOn: ['tableId'],
					resourceMapper: {
						resourceMapperMethod: 'getTableFields',
						mode: 'add',
						valuesLabel: 'Column',
						addAllFields: true,
						multiKeyMatch: false,
						supportAutoMap: false,
					},
				},
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['insertRows'],
					},
				},
				description: 'Column values for the row to insert. Each input item creates one row.',
			},

			// Table: Insert Rows - Additional Options
			{
				displayName: 'Options',
				name: 'insertOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['insertRows'],
					},
				},
				options: [
					{
						displayName: 'Allow New Columns',
						name: 'allowNewColumns',
						type: 'boolean',
						default: false,
						description: 'Whether to automatically create columns that don\'t exist yet (created as text columns)',
					},
					{
						displayName: 'Dedupe',
						name: 'dedupeEnabled',
						type: 'boolean',
						default: false,
						description: 'Whether to skip rows that match existing rows on the specified keys',
					},
					{
						displayName: 'Dedupe Keys',
						name: 'dedupeKeys',
						type: 'string',
						default: '',
						placeholder: 'domain, email',
						description: 'Comma-separated column names used for duplicate detection',
						displayOptions: {
							show: {
								dedupeEnabled: [true],
							},
						},
					},
				],
			},

			// Table: Upsert Rows - Key Column
			{
				displayName: 'Column to Match On',
				name: 'upsertKeyColumn',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTableColumns',
					loadOptionsDependsOn: ['tableId'],
				},
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['upsertRows'],
					},
				},
				default: '',
				required: true,
				description: 'The column used to find an existing row. If a match is found, that row is updated; otherwise a new row is created.',
			},

			// Table: Upsert Rows - Value to Search
			{
				displayName: 'Value to Search',
				name: 'upsertKeyValue',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['upsertRows'],
					},
				},
				default: '',
				required: true,
				placeholder: 'e.g. openai.com',
				description: 'The value to look for in the selected column. Databar will search for a row where the column matches this value exactly. If found, that row\'s fields are updated; if not, a new row is inserted with this value and the fields you provide.',
			},

			// Table: Upsert Rows - Fields (Resource Mapper)
			{
				displayName: 'Fields',
				name: 'upsertFields',
				type: 'resourceMapper',
				noDataExpression: true,
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				required: true,
				typeOptions: {
					loadOptionsDependsOn: ['tableId'],
					resourceMapper: {
						resourceMapperMethod: 'getTableFields',
						mode: 'add',
						valuesLabel: 'Column',
						addAllFields: true,
						multiKeyMatch: false,
						supportAutoMap: false,
					},
				},
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['upsertRows'],
					},
				},
				description: 'Column values to set on the matched or newly created row',
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
					name: 'Run',
					value: 'run',
					description: 'Run a waterfall task',
					action: 'Run waterfall',
				},
			],
			default: 'run',
			},

			// Waterfall: Run - Waterfall Selection
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
					operation: ['run'],
				},
			},
				default: '',
				required: true,
				description: 'Select the waterfall to use',
			},

			// Waterfall: Run - Parameters as Resource Mapper (Guided Fields)
			{
				displayName: 'Parameters',
				name: 'waterfallParamsFields',
				type: 'resourceMapper',
				noDataExpression: true,
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				required: true,
				typeOptions: {
					loadOptionsDependsOn: ['waterfallIdentifier'],
					resourceMapper: {
						resourceMapperMethod: 'getWaterfallFields',
						mode: 'add',
						valuesLabel: 'Parameters',
						addAllFields: true,
						multiKeyMatch: false,
						supportAutoMap: false,
					},
				},
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['run'],
					},
				},
				description: 'Fill in the waterfall parameters',
			},

			// Waterfall: Run - Enrichments (Multi-select)
			{
				displayName: 'Data Providers',
				name: 'enrichments',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getWaterfallEnrichments',
					loadOptionsDependsOn: ['waterfallIdentifier'],
				},
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['run'],
					},
				},
				default: [],
				required: true,
				description: 'Select which data providers to use in the waterfall. The waterfall will try each provider in order until a successful result is returned.',
			},

			// Waterfall: Run - Wait for Completion
			{
				displayName: 'Wait for Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['run'],
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
						operation: ['run'],
						waitForCompletion: [true],
					},
				},
				options: [
					{
						displayName: 'Poll Interval (Seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 3,
						description: 'How often to check for completion (in seconds)',
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						default: 300,
						description: 'Maximum time to wait for completion (in seconds)',
					},
				],
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
						name: `Error: ${errorMessage}`,
						value: '',
						description: 'Could not load enrichments. Check your API key and try again.',
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

			// Load waterfall enrichments (data providers for a specific waterfall)
			async getWaterfallEnrichments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				try {
					// Get waterfall identifier
					let waterfallIdentifier: string | undefined;
					
					try {
						const waterfallIdRaw = this.getCurrentNodeParameter('waterfallIdentifier');
						if (waterfallIdRaw) {
							waterfallIdentifier = waterfallIdRaw as string;
						}
					} catch (error) {
						// Parameter might not be set yet
					}
					
					if (!waterfallIdentifier) {
						return [{
							name: '👆 Select a Waterfall Above First',
							value: '',
							description: 'Choose a waterfall from the dropdown above to see available data providers.',
						}];
					}

					// Fetch waterfall details
					const waterfall = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: `https://api.databar.ai/v1/waterfalls/${waterfallIdentifier}`,
						},
					);

					const waterfallData = waterfall as IDataObject;
					const availableEnrichments = (waterfallData.available_enrichments as IDataObject[]) || [];

					if (availableEnrichments.length === 0) {
						return [{
							name: 'No Data Providers Available',
							value: '',
							description: 'This waterfall has no available data providers configured.',
						}];
					}

					// Build options from available enrichments
					for (const enrichment of availableEnrichments) {
						const id = enrichment.id as number;
						const name = enrichment.name as string;
						const description = enrichment.description as string || 'No description';
						const price = enrichment.price as string || '0';
						
						returnData.push({
							name: name,
							value: id,
							description: `${description} · ${price} Credits`,
						});
					}

					// Sort by name
					returnData.sort((a, b) => a.name.localeCompare(b.name));
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					return [{
						name: 'Error Loading Data Providers',
						value: '',
						description: `Could not fetch waterfall data providers. Error: ${errorMessage}`,
					}];
				}
				return returnData;
			},

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
								description: `Created: ${tableData.created_at as string}`,
							});
						}
					}

					returnData.sort((a, b) => a.name.localeCompare(b.name));
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Failed to load tables';
					returnData.push({
						name: `Error: ${errorMessage}`,
						value: '',
						description: 'Could not load tables. Check your API key and try again.',
					});
				}
				return returnData;
			},

			async getTableColumns(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				try {
					let tableId: string | undefined;
					try {
						const tableIdRaw = this.getCurrentNodeParameter('tableId');
						if (tableIdRaw) {
							tableId = tableIdRaw as string;
						}
					} catch (error) {
						// Parameter might not be set yet
					}

					if (!tableId) {
						return [{
							name: 'Select a Table First',
							value: '',
						}];
					}

					const columns = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: `https://api.databar.ai/v1/table/${tableId}/columns`,
						},
					);

					if (Array.isArray(columns)) {
						for (const column of columns) {
							const colData = column as IDataObject;
							if (colData.data_processor_id) continue;
							returnData.push({
								name: colData.name as string,
								value: colData.internal_name as string,
								description: `Type: ${colData.type_of_value as string || 'unknown'}`,
							});
						}
					}

					returnData.sort((a, b) => a.name.localeCompare(b.name));
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Failed to load columns';
					returnData.push({
						name: `Error: ${errorMessage}`,
						value: '',
					});
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
							name: '👆 Select an Enrichment Above First',
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
							name: '✅ No Parameters Required',
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
						name: 'Template Loaded',
						value: singleLineJson,
						description: `Required Parameters:\n${paramList}\n\nJSON Template:\n${templateJson}`,
					}];

				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					return [{
						name: 'Error Loading Template',
						value: '{}',
						description: `Could not fetch enrichment parameters: ${errorMessage}`,
					}];
				}
			},

			/**
			 * Get parameter template for selected waterfall
			 * 
			 * Fetches waterfall details and generates a JSON template showing
			 * required and optional parameters with their types and descriptions.
			 */
			async getWaterfallTemplate(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					// Get waterfall identifier
					let waterfallIdentifier: string | undefined;
					
					try {
						const waterfallIdRaw = this.getCurrentNodeParameter('waterfallIdentifier');
						if (waterfallIdRaw) {
							waterfallIdentifier = waterfallIdRaw as string;
						}
					} catch (error) {
						// Parameter might not be set yet
					}
					
					if (!waterfallIdentifier) {
						return [{
							name: '👆 Select a Waterfall Above First',
							value: '{}',
							description: 'Choose a waterfall from the dropdown above to see its parameter template here.',
						}];
					}

					// Fetch waterfall details
					const waterfall = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: `https://api.databar.ai/v1/waterfalls/${waterfallIdentifier}`,
						},
					);

					const waterfallData = waterfall as IDataObject;
					const inputParams = (waterfallData.input_params as IDataObject[]) || [];

					if (inputParams.length === 0) {
						return [{
							name: '✅ No Parameters Required',
							value: '{}',
							description: 'This waterfall does not require any parameters. You can leave the Parameters field empty.',
						}];
					}

					// Build template object
					const template: IDataObject = {};
					const paramDescriptions: string[] = [];

					for (const param of inputParams) {
						const paramName = param.name as string;
						const isRequired = param.required as boolean;
						const typeField = param.type as string;
						const description = 'Waterfall input parameter';
						
						// Add to template with placeholder
						template[paramName] = `<${typeField}>`;
						
						// Add to description list
						const requiredLabel = isRequired ? '🔴 REQUIRED' : '⚪ optional';
						paramDescriptions.push(`${requiredLabel} • ${paramName} (${typeField})`);
					}

					// Format as readable JSON
					const templateJson = JSON.stringify(template, null, 2);
					const singleLineJson = JSON.stringify(template);  // Single line for expression
					const paramList = paramDescriptions.join('\n');

					return [{
						name: 'Template Loaded',
						value: singleLineJson,
						description: `Required Parameters:\n${paramList}\n\nJSON Template:\n${templateJson}`,
					}];

				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					return [{
						name: 'Error Loading Template',
						value: '{}',
						description: `Could not fetch waterfall parameters: ${errorMessage}`,
					}];
				}
			},
		},

		resourceMapping: {
			/**
			 * Get table column definitions for the resource mapper.
			 * Fetches columns from the API and maps them to ResourceMapperField entries
			 * so n8n renders a per-column form UI.
			 */
			async getTableFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				try {
					let tableId: string | undefined;
					try {
						const tableIdRaw = this.getCurrentNodeParameter('tableId');
						if (tableIdRaw) {
							tableId = tableIdRaw as string;
						}
					} catch (_error) {
						// Parameter might not be set yet
					}

					if (!tableId) {
						return { fields: [] };
					}

					const columns = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: `https://api.databar.ai/v1/table/${tableId}/columns`,
						},
					);

					if (!Array.isArray(columns) || columns.length === 0) {
						return { fields: [] };
					}

					const typeMap: Record<string, 'string' | 'number' | 'boolean'> = {
						text: 'string',
						longtext: 'string',
						number: 'number',
						integer: 'number',
						float: 'number',
						boolean: 'boolean',
						bool: 'boolean',
					};

					const userColumns = columns.filter((column) => {
						const col = column as IDataObject;
						return !col.data_processor_id;
					});

					const fields: ResourceMapperField[] = userColumns.map((column) => {
						const col = column as IDataObject;
						const internalName = col.internal_name as string;
						const displayName = col.name as string;
						const colType = (col.type_of_value as string) || 'text';

						return {
							id: internalName,
							displayName: `${displayName} (${colType})`,
							required: false,
							defaultMatch: false,
							display: true,
							type: typeMap[colType] || 'string',
							canBeUsedToMatch: true,
						};
					});

					return { fields };
				} catch (_error) {
					return { fields: [] };
				}
			},

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

			/**
			 * Get waterfall fields for resource mapper
			 * 
			 * Fetches waterfall details and returns field definitions for the resource mapper.
			 * This allows users to fill in parameters using individual input fields.
			 */
			async getWaterfallFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				try {
					// Get waterfall identifier
					let waterfallIdentifier: string | undefined;
					
					try {
						const waterfallIdRaw = this.getCurrentNodeParameter('waterfallIdentifier');
						if (waterfallIdRaw) {
							waterfallIdentifier = waterfallIdRaw as string;
						}
					} catch (error) {
						// Parameter might not be set yet
					}
					
					if (!waterfallIdentifier) {
						// Return empty fields if no waterfall selected
						return {
							fields: [],
						};
					}

					// Fetch waterfall details
					const waterfall = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'databarApi',
						{
							method: 'GET',
							url: `https://api.databar.ai/v1/waterfalls/${waterfallIdentifier}`,
						},
					);

					const waterfallData = waterfall as IDataObject;
					const inputParams = (waterfallData.input_params as IDataObject[]) || [];

					if (inputParams.length === 0) {
						return {
							fields: [],
						};
					}

					// Build field definitions for resource mapper
					const fields: ResourceMapperField[] = inputParams.map((param) => {
						const paramName = param.name as string;
						const isRequired = param.required as boolean;
						const typeField = param.type as string;
						
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
							description: `Waterfall input parameter (${typeField})`,
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
		const returnData: INodeExecutionData[] = [];
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
						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					}
				}

				// ====================================
				//      ENRICHMENT OPERATIONS
				// ====================================
				else if (resource === 'enrichment') {
					if (operation === 'run') {
						const enrichmentIdRaw = this.getNodeParameter('enrichmentId', i);
						const enrichmentId = typeof enrichmentIdRaw === 'string' ? parseInt(enrichmentIdRaw, 10) : enrichmentIdRaw;
						
						if (!enrichmentId || isNaN(enrichmentId as number)) {
							throw new NodeOperationError(
								this.getNode(),
								'Please provide a valid enrichment ID',
								{ itemIndex: i },
							);
						}
						
						const waitForCompletion = this.getNodeParameter('waitForCompletion', i, true) as boolean;
						
						const paramsFields = this.getNodeParameter('paramsFields', i) as IDataObject;
						const params: IDataObject = (paramsFields.value as IDataObject) || {};

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
							returnData.push({
								json: completedTask,
								pairedItem: { item: i },
							});
						} else {
							returnData.push({
								json: taskResponse,
								pairedItem: { item: i },
							});
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
							returnData.push({
								json: completedTask,
								pairedItem: { item: i },
							});
						} else {
							returnData.push({
								json: taskResponse,
								pairedItem: { item: i },
							});
						}
					}
				}

				// ====================================
				//        TABLE OPERATIONS
				// ====================================
				else if (resource === 'table') {
					const tableId = this.getNodeParameter('tableId', i) as string;

					if (!tableId) {
						throw new NodeOperationError(
							this.getNode(),
							'Please provide a valid table ID',
							{ itemIndex: i },
						);
					}

					if (operation === 'insertRows') {
						const rowFieldsMapper = this.getNodeParameter('rowFields', i) as IDataObject;
						const insertOptions = this.getNodeParameter('insertOptions', i, {}) as IDataObject;

						const fields: IDataObject = (rowFieldsMapper.value as IDataObject) || {};

						const row: IDataObject = { fields };

						const options: IDataObject = {};
						if (insertOptions.allowNewColumns !== undefined) {
							options.allow_new_columns = insertOptions.allowNewColumns;
						}
						if (insertOptions.dedupeEnabled) {
							const keysStr = (insertOptions.dedupeKeys as string) || '';
							options.dedupe = {
								enabled: true,
								keys: keysStr.split(',').map((k: string) => k.trim()).filter((k: string) => k),
							};
						}

						const body: IDataObject = { rows: [row] };
						if (Object.keys(options).length > 0) {
							body.options = options;
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'POST',
								url: `https://api.databar.ai/v1/table/${tableId}/rows`,
								body,
							},
						);

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});

					} else if (operation === 'upsertRows') {
						const keyColumn = this.getNodeParameter('upsertKeyColumn', i) as string;
						const keyValue = this.getNodeParameter('upsertKeyValue', i) as string;
						const upsertFieldsMapper = this.getNodeParameter('upsertFields', i) as IDataObject;

						if (!keyColumn) {
							throw new NodeOperationError(
								this.getNode(),
								'Please provide a key column name',
								{ itemIndex: i },
							);
						}

						const fields: IDataObject = (upsertFieldsMapper.value as IDataObject) || {};

						const row: IDataObject = {
							key: { [keyColumn]: keyValue },
							fields,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'POST',
								url: `https://api.databar.ai/v1/table/${tableId}/rows/upsert`,
								body: { rows: [row] },
							},
						);

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					}
				}

				// ====================================
				//      WATERFALL OPERATIONS
				// ====================================
			else if (resource === 'waterfall') {
				if (operation === 'run') {
						const waterfallIdentifier = this.getNodeParameter('waterfallIdentifier', i) as string;
						const enrichmentsRaw = this.getNodeParameter('enrichments', i, []) as (string | number)[];
						const waitForCompletion = this.getNodeParameter('waitForCompletion', i, true) as boolean;
						
						const paramsFields = this.getNodeParameter('waterfallParamsFields', i) as IDataObject;
						const params: IDataObject = (paramsFields.value as IDataObject) || {};

						// Convert enrichment IDs to numbers (multiOptions returns array of selected values)
						const enrichments = enrichmentsRaw.map((id) => {
							return typeof id === 'string' ? parseInt(id, 10) : id;
						}).filter((id) => !isNaN(id));

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
							returnData.push({
								json: completedTask,
								pairedItem: { item: i },
							});
						} else {
							returnData.push({
								json: taskResponse,
								pairedItem: { item: i },
							});
						}
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					returnData.push({
						json: { error: errorMessage },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

