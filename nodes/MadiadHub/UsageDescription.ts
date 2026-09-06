import type { INodeProperties } from 'n8n-workflow';

export const usageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['usage'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get account usage',
				description:
					'Retrieve the plan, the current period and how much of each allowance is left',
				routing: { request: { method: 'GET', url: '/usage' } },
			},
		],
		default: 'get',
	},
];

/**
 * Usage takes no parameters — it always reports on the account the API key belongs to.
 */
export const usageFields: INodeProperties[] = [];
