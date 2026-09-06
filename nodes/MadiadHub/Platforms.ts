import type { INodePropertyOptions } from 'n8n-workflow';

/**
 * Which platforms accept which kind of post.
 *
 * These lists mirror the API's own validation: sending a platform that cannot take a given kind of
 * content (YouTube cannot take a plain text post, Instagram cannot take one either) is rejected
 * with a 400. Filtering the dropdown per operation means the user never builds that request.
 *
 * Options are sorted alphabetically by display name, as n8n's node linter requires.
 */

export const TEXT_PLATFORMS: INodePropertyOptions[] = [
	{ name: 'Bluesky', value: 'bluesky' },
	{ name: 'DEV.to', value: 'devto' },
	{ name: 'Discord', value: 'discord' },
	{ name: 'Facebook', value: 'facebook' },
	{ name: 'Google Business Profile', value: 'google_business' },
	{ name: 'Hashnode', value: 'hashnode' },
	{ name: 'Lemmy', value: 'lemmy' },
	{ name: 'LinkedIn', value: 'linkedin' },
	{ name: 'Listmonk', value: 'listmonk' },
	{ name: 'Mastodon', value: 'mastodon' },
	{ name: 'Nostr', value: 'nostr' },
	{ name: 'Reddit', value: 'reddit' },
	{ name: 'Slack', value: 'slack' },
	{ name: 'Telegram', value: 'telegram' },
	{ name: 'Threads', value: 'threads' },
	{ name: 'Whop', value: 'whop' },
	{ name: 'WordPress', value: 'wordpress' },
	{ name: 'X', value: 'x' },
];

export const PHOTO_PLATFORMS: INodePropertyOptions[] = [
	{ name: 'Bluesky', value: 'bluesky' },
	{ name: 'Discord', value: 'discord' },
	{ name: 'Facebook', value: 'facebook' },
	{ name: 'Google Business Profile', value: 'google_business' },
	{ name: 'Instagram', value: 'instagram' },
	{ name: 'Lemmy', value: 'lemmy' },
	{ name: 'LinkedIn', value: 'linkedin' },
	{ name: 'Mastodon', value: 'mastodon' },
	{ name: 'Pinterest', value: 'pinterest' },
	{ name: 'Reddit', value: 'reddit' },
	{ name: 'Telegram', value: 'telegram' },
	{ name: 'Threads', value: 'threads' },
	{ name: 'TikTok', value: 'tiktok' },
	{ name: 'WordPress', value: 'wordpress' },
	{ name: 'X', value: 'x' },
];

export const VIDEO_PLATFORMS: INodePropertyOptions[] = [
	{ name: 'Bluesky', value: 'bluesky' },
	{ name: 'Discord', value: 'discord' },
	{ name: 'Facebook', value: 'facebook' },
	{ name: 'Google Business Profile', value: 'google_business' },
	{ name: 'Instagram', value: 'instagram' },
	{ name: 'LinkedIn', value: 'linkedin' },
	{ name: 'Mastodon', value: 'mastodon' },
	{ name: 'Pinterest', value: 'pinterest' },
	{ name: 'Reddit', value: 'reddit' },
	{ name: 'Telegram', value: 'telegram' },
	{ name: 'Threads', value: 'threads' },
	{ name: 'TikTok', value: 'tiktok' },
	{ name: 'WordPress', value: 'wordpress' },
	{ name: 'X', value: 'x' },
	{ name: 'YouTube', value: 'youtube' },
];

/**
 * Deleting a live post is only possible where the platform's own API allows it. Everything else is
 * refused by the API with a 400, so it is left out of the dropdown.
 */
export const UNPUBLISH_PLATFORMS: INodePropertyOptions[] = [
	{ name: 'Facebook', value: 'facebook' },
	{ name: 'LinkedIn', value: 'linkedin' },
	{ name: 'Threads', value: 'threads' },
	{ name: 'X', value: 'x' },
	{ name: 'YouTube', value: 'youtube' },
];
