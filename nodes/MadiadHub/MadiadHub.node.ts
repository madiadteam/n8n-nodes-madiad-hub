import type {
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { API_BASE_URL, fetchProfiles, SOURCE_HEADER } from './GenericFunctions';
import { postFields, postOperations } from './PostDescription';
import { profileFields, profileOperations } from './ProfileDescription';
import { usageFields, usageOperations } from './UsageDescription';

export class MadiadHub implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MADIAD Hub',
		name: 'madiadHub',
		icon: { light: 'file:madiadHub.svg', dark: 'file:madiadHub.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Publish to every connected social platform through MADIAD Hub',
		defaults: {
			name: 'MADIAD Hub',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'madiadHubApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: API_BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				// Attribution: lets the Hub tell traffic from this node apart from hand-built
				// HTTP Request nodes. The credential test and the profile dropdown send it too.
				'X-Madiad-Source': SOURCE_HEADER,
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Post',
						value: 'post',
					},
					{
						name: 'Profile',
						value: 'profile',
					},
					{
						name: 'Usage',
						value: 'usage',
					},
				],
				default: 'post',
			},
			...postOperations,
			...postFields,
			...profileOperations,
			...profileFields,
			...usageOperations,
			...usageFields,
		],
	};

	methods = {
		loadOptions: {
			/**
			 * Fills the Profile dropdown from the account's own profiles, so nobody has to copy a
			 * `prof_…` ID out of the dashboard by hand.
			 */
			async getProfiles(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const profiles = await fetchProfiles.call(this);

				return profiles
					.filter((profile) => typeof profile.profile_id === 'string' && profile.profile_id !== '')
					.map((profile) => ({
						// A profile is always created with a name, but fall back to the ID rather than
						// rendering an empty, unselectable row if one ever arrives without.
						name: profile.friendly_name ?? (profile.profile_id as string),
						value: profile.profile_id as string,
					}))
					.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
			},
		},
	};
}
