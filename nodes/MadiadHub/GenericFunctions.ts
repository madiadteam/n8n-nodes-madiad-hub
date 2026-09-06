import type { IDataObject, ILoadOptionsFunctions, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/** Base URL of the MADIAD Hub REST API. */
export const API_BASE_URL = 'https://api.madiad.com/v1';

/** Credential type this node authenticates with. */
export const CREDENTIAL_NAME = 'madiadHubApi';

/**
 * Attribution header sent on every request this package makes, including the credential test and
 * the profile dropdown. It tells the Hub which integration a call came from, so traffic from this
 * node can be told apart from a hand-rolled HTTP Request node.
 */
export const SOURCE_HEADER = 'n8n-node-v1';

interface ProfileRow {
	profile_id?: string;
	friendly_name?: string;
}

/**
 * Read the account's profiles for the profile dropdown.
 *
 * Kept out of the declarative routing on purpose: `loadOptions` runs while the user is editing the
 * node, long before an execution exists, so it has to make its own authenticated call.
 */
export async function fetchProfiles(this: ILoadOptionsFunctions): Promise<ProfileRow[]> {
	try {
		const response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			CREDENTIAL_NAME,
			{
				method: 'GET',
				url: `${API_BASE_URL}/profiles`,
				headers: {
					Accept: 'application/json',
					'X-Madiad-Source': SOURCE_HEADER,
				},
				json: true,
			},
		)) as IDataObject;

		const profiles = response?.profiles;
		return Array.isArray(profiles) ? (profiles as ProfileRow[]) : [];
	} catch (error) {
		// Surface the Hub's own error code and message rather than a bare "request failed" —
		// an expired or revoked key is the most common cause and says so in the body.
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
