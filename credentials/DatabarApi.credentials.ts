/**
 * Databar.ai API Credentials
 * 
 * This credential type handles authentication for the Databar.ai REST API.
 * 
 * Authentication Method:
 * - Uses API Key authentication via x-apikey header
 * - API Key can be obtained from Databar workspace > Integrations
 * 
 * Testing:
 * - Credentials are tested by calling /v1/user/me endpoint
 * - Successful response indicates valid API key
 */

import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DatabarApi implements ICredentialType {
	name = 'databarApi';
	displayName = 'Databar API';
	documentationUrl = 'https://databar.ai/docs/api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'API Key for authentication. You can find your API key in your Databar workspace under Integrations.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-apikey': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.databar.ai',
			url: '/v1/user/me',
		},
	};
}

