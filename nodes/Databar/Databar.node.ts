import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';

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

			// Enrichment: Get/Run/BulkRun - Enrichment ID
			{
				displayName: 'Enrichment ID',
				name: 'enrichmentId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['get', 'run', 'bulkRun'],
					},
				},
				default: 0,
				required: true,
				description: 'The ID of the enrichment',
			},

			// Enrichment: Run - Parameters
			{
				displayName: 'Parameters',
				name: 'params',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['run'],
					},
				},
				default: {},
				options: [
					{
						name: 'parameter',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: 'Parameter name',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Parameter value',
							},
						],
					},
				],
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
				default: '[{"param1": "value1"}, {"param1": "value2"}]',
				description: 'Array of parameter objects for bulk enrichment',
				required: true,
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

			// Table: Get Rows/Columns/Enrichments/Add/Run - Table UUID
			{
				displayName: 'Table UUID',
				name: 'tableUuid',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['getRows', 'getColumns', 'getEnrichments', 'addEnrichment', 'runEnrichment'],
					},
				},
				default: '',
				required: true,
				description: 'The UUID of the table',
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

			// Waterfall: Get/Run/BulkRun - Waterfall Identifier
			{
				displayName: 'Waterfall Identifier',
				name: 'waterfallIdentifier',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['get', 'run', 'bulkRun'],
					},
				},
				default: '',
				required: true,
				description: 'The identifier of the waterfall (e.g., "email_getter")',
			},

			// Waterfall: Run - Parameters
			{
				displayName: 'Parameters',
				name: 'params',
				placeholder: 'Add Parameter',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['waterfall'],
						operation: ['run'],
					},
				},
				default: {},
				options: [
					{
						name: 'parameter',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: 'Parameter name',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Parameter value',
							},
						],
					},
				],
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
								url: '/v1/user/me',
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
								url: '/v1/enrichments/',
								qs,
							},
						);
						if (Array.isArray(response)) {
							returnData.push(...(response as IDataObject[]));
						} else {
							returnData.push(response as IDataObject);
						}
					} else if (operation === 'get') {
						const enrichmentId = this.getNodeParameter('enrichmentId', i) as number;
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'GET',
								url: `/v1/enrichments/${enrichmentId}`,
							},
						);
						returnData.push(response as IDataObject);
					} else if (operation === 'run') {
						const enrichmentId = this.getNodeParameter('enrichmentId', i) as number;
						const paramsCollection = this.getNodeParameter('params', i) as IDataObject;
						
						// Convert fixed collection to object
						const params: IDataObject = {};
						if (paramsCollection.parameter && Array.isArray(paramsCollection.parameter)) {
							for (const param of paramsCollection.parameter as Array<{ key: string; value: string }>) {
								params[param.key] = param.value;
							}
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'databarApi',
							{
								method: 'POST',
								url: `/v1/enrichments/${enrichmentId}/run`,
								body: { params },
							},
						);
						returnData.push(response as IDataObject);
					} else if (operation === 'bulkRun') {
						const enrichmentId = this.getNodeParameter('enrichmentId', i) as number;
						const bulkParams = this.getNodeParameter('bulkParams', i) as string;
						
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
								url: `/v1/enrichments/${enrichmentId}/bulk-run`,
								body: { params: paramsArray },
							},
						);
						returnData.push(response as IDataObject);
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
								url: '/v1/table/create',
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
								url: '/v1/table/',
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
								url: `/v1/table/${tableUuid}/rows`,
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
								url: `/v1/table/${tableUuid}/columns`,
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
								url: `/v1/table/${tableUuid}/enrichments`,
							},
						);
						if (Array.isArray(response)) {
							returnData.push(...(response as IDataObject[]));
						} else {
							returnData.push(response as IDataObject);
						}
					} else if (operation === 'addEnrichment') {
						const tableUuid = this.getNodeParameter('tableUuid', i) as string;
						const enrichmentId = this.getNodeParameter('enrichmentId', i) as number;
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
								url: `/v1/table/${tableUuid}/add-enrichment`,
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
								url: `/v1/table/${tableUuid}/run-enrichment/${tableEnrichmentId}`,
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
								url: '/v1/waterfalls/',
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
								url: `/v1/waterfalls/${waterfallIdentifier}`,
							},
						);
						returnData.push(response as IDataObject);
					} else if (operation === 'run') {
						const waterfallIdentifier = this.getNodeParameter('waterfallIdentifier', i) as string;
						const paramsCollection = this.getNodeParameter('params', i) as IDataObject;
						const enrichmentsStr = this.getNodeParameter('enrichments', i) as string;
						
						// Convert fixed collection to object
						const params: IDataObject = {};
						if (paramsCollection.parameter && Array.isArray(paramsCollection.parameter)) {
							for (const param of paramsCollection.parameter as Array<{ key: string; value: string }>) {
								params[param.key] = param.value;
							}
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
								url: `/v1/waterfalls/${waterfallIdentifier}/run`,
								body: { params, enrichments },
							},
						);
						returnData.push(response as IDataObject);
					} else if (operation === 'bulkRun') {
						const waterfallIdentifier = this.getNodeParameter('waterfallIdentifier', i) as string;
						const bulkParams = this.getNodeParameter('bulkParams', i) as string;
						const enrichmentsStr = this.getNodeParameter('enrichments', i) as string;
						
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
								url: `/v1/waterfalls/${waterfallIdentifier}/bulk-run`,
								body: { params: paramsArray, enrichments },
							},
						);
						returnData.push(response as IDataObject);
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
								url: `/v1/tasks/${taskId}`,
							},
						);
						returnData.push(response as IDataObject);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}

