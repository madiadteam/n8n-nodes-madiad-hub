import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * MADIAD Hub authenticates with a single account-wide API key, sent as a bearer token.
 * One key manages every profile on the account, so there is nothing else to configure.
 */
export class MadiadHubApi implements ICredentialType {
	name = 'madiadHubApi';

	displayName = 'MADIAD Hub API';

	icon: Icon = { light: 'file:madiadHub.svg', dark: 'file:madiadHub.dark.svg' };

	documentationUrl = 'https://docs.madiad.com/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Create one at hub.madiad.com under API Keys. The key is shown only once, so copy it immediately.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	/**
	 * Powers the "Test" button in the credential dialog.
	 *
	 * GET /v1/profiles is the cheapest authenticated call the API has: it reads one indexed table
	 * owned by the account, contacts no publishing backend, and consumes no upload quota. It also
	 * answers 200 for an account that has no profiles yet, so a brand-new key still tests green
	 * instead of failing for a reason that has nothing to do with the key.
	 */
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.madiad.com/v1',
			url: '/profiles',
			method: 'GET',
			headers: {
				'X-Madiad-Source': 'n8n-node-v1',
			},
		},
	};
}
