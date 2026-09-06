import type { INodeProperties } from 'n8n-workflow';

export const profileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['profile'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many profiles',
				description: 'Retrieve the brand profiles on the account',
				routing: {
					request: { method: 'GET', url: '/profiles' },
					output: {
						postReceive: [
							{
								// The API answers `{ "profiles": [...] }`; emit one n8n item per profile.
								type: 'rootProperty',
								properties: { property: 'profiles' },
							},
						],
					},
				},
			},
		],
		default: 'getAll',
	},
];

export const profileFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['profile'], operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: { resource: ['profile'], operation: ['getAll'], returnAll: [false] },
		},
		routing: {
			output: {
				postReceive: [{ type: 'limit', properties: { maxResults: '={{$value}}' } }],
			},
		},
	},
];
