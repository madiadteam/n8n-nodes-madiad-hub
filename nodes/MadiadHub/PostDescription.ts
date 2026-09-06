import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { PHOTO_PLATFORMS, TEXT_PLATFORMS, UNPUBLISH_PLATFORMS, VIDEO_PLATFORMS } from './Platforms';

const PUBLISH_OPERATIONS = ['publishText', 'publishPhoto', 'publishVideo'];

/**
 * Fields every publish operation shares, plus the options collection.
 *
 * Built by a helper rather than copied three times: the three publish operations differ only in
 * their endpoint, their media field and which platforms can accept them.
 *
 * Platform-specific options are shown ONLY when that platform is actually selected. Offering
 * "Subreddit" to someone publishing to Instagram is not a cosmetic problem: it invites them to
 * fill in a field the request will ignore, and it hides the one case where the field is genuinely
 * required behind a list of ones where it is meaningless.
 */
function additionalFields(
	operation: string,
	platformParam: string,
	available: readonly INodePropertyOptions[],
): INodeProperties {
	const offers = (platform: string) => available.some((o) => o.value === platform);
	// A leading slash addresses a parameter outside this collection - the operation's own
	// Platforms field, whose name differs per operation.
	const whenSelected = (platform: string) => ({ show: { [`/${platformParam}`]: [platform] } });

	const options: INodeProperties[] = [
		{
			displayName: 'Add to Queue',
			name: 'addToQueue',
			type: 'boolean',
			default: false,
			description:
				'Whether to publish at the profile’s next free queue slot instead of immediately. Cannot be combined with a specific time.',
			routing: { request: { body: { add_to_queue: '={{$value}}' } } },
		},
	];

	if (offers('facebook')) {
		options.push({
			displayName: 'Facebook Page ID',
			name: 'facebookPageId',
			type: 'string',
			default: '',
			description:
				'Which Facebook Page to publish to. Only needed when the connected account manages more than one Page. Ignored if a Page is pinned to the profile.',
			displayOptions: whenSelected('facebook'),
			routing: { request: { body: { facebook_page_id: '={{$value}}' } } },
		});
	}

	options.push({
		displayName: 'Idempotency Key',
		name: 'idempotencyKey',
		type: 'string',
		default: '',
		placeholder: 'e.g. contentRow42',
		description:
			'A value that is unique per intended post and constant across retries of that post. A repeat of the same key returns the original result instead of publishing twice. Never use a row number or item index — both get reused and would silently suppress a later post.',
		routing: { request: { headers: { 'Idempotency-Key': '={{$value}}' } } },
	});

	if (offers('pinterest')) {
		options.push({
			displayName: 'Pinterest Board ID',
			name: 'pinterestBoardId',
			type: 'string',
			default: '',
			placeholder: 'e.g. 987654321098765432',
			description: 'Board to pin to. Required when posting to Pinterest.',
			displayOptions: whenSelected('pinterest'),
			routing: { request: { body: { pinterest_board_id: '={{$value}}' } } },
		});
	}

	if (offers('reddit')) {
		options.push(
			{
				displayName: 'Reddit Title',
				name: 'redditTitle',
				type: 'string',
				default: '',
				placeholder: 'e.g. Our new blend is out',
				description:
					'Post title used on Reddit, which requires one. Falls back to ‘Caption’.',
				displayOptions: whenSelected('reddit'),
				routing: { request: { body: { reddit_title: '={{$value}}' } } },
			},
			{
				displayName: 'Subreddit',
				name: 'subreddit',
				type: 'string',
				default: '',
				placeholder: 'e.g. coffee',
				description: 'Subreddit to post into, without the r/ prefix. Required when posting to Reddit.',
				displayOptions: whenSelected('reddit'),
				routing: { request: { body: { subreddit: '={{$value}}' } } },
			},
		);
	}

	options.push(
		{
			displayName: 'Scheduled At',
			name: 'scheduledAt',
			type: 'dateTime',
			default: '',
			description: 'When to publish. Leave empty to publish straight away.',
			// Hidden while the queue is chosen: the two are different answers to the same question,
			// and sending both leaves the outcome to whichever the API happens to read first.
			displayOptions: { hide: { addToQueue: [true] } },
			routing: { request: { body: { scheduled_at: '={{$value}}' } } },
		},
		{
			displayName: 'Timezone',
			name: 'timezone',
			type: 'string',
			default: '',
			placeholder: 'e.g. Asia/Ho_Chi_Minh',
			description: 'IANA timezone that ‘Scheduled At’ is read in',
			displayOptions: { hide: { addToQueue: [true] } },
			routing: { request: { body: { timezone: '={{$value}}' } } },
		},
	);

	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: { resource: ['post'], operation: [operation] } },
		options,
	};
}

export const postOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['post'] } },
		options: [
			{
				name: 'Get Status',
				value: 'getStatus',
				action: 'Get post status',
				description: 'Check whether an asynchronous post finished, and how each platform answered',
				routing: { request: { method: 'GET', url: '/posts/status' } },
			},
			{
				name: 'Publish Photo',
				value: 'publishPhoto',
				action: 'Publish photo post',
				description: 'Publish one or more images from public URLs',
				routing: { request: { method: 'POST', url: '/posts/photos' } },
			},
			{
				name: 'Publish Text',
				value: 'publishText',
				action: 'Publish text post',
				description: 'Publish a text-only post',
				routing: { request: { method: 'POST', url: '/posts/text' } },
			},
			{
				name: 'Publish Video',
				value: 'publishVideo',
				action: 'Publish video post',
				description: 'Publish a video from a public URL',
				routing: { request: { method: 'POST', url: '/posts/video' } },
			},
			{
				name: 'Retry',
				value: 'retry',
				action: 'Retry post',
				description: 'Re-send only the platforms a post failed on, reusing the media already stored',
				routing: { request: { method: 'POST', url: '/posts/retry' } },
			},
			{
				name: 'Unpublish',
				value: 'unpublish',
				action: 'Unpublish post',
				description: 'Delete a live post from the platform it was published to',
				routing: { request: { method: 'POST', url: '/posts/unpublish' } },
			},
		],
		default: 'publishText',
	},
];

export const postFields: INodeProperties[] = [
	// ---------------------------------------------------------------------------------------
	// post: publishText / publishPhoto / publishVideo
	// ---------------------------------------------------------------------------------------
	{
		displayName: 'Profile Name or ID',
		name: 'profileId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getProfiles' },
		default: '',
		required: true,
		description:
			'The brand profile to publish as. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { resource: ['post'], operation: PUBLISH_OPERATIONS } },
		routing: { request: { body: { profile_id: '={{$value}}' } } },
	},
	{
		displayName: 'Platforms',
		name: 'platformsText',
		type: 'multiOptions',
		options: TEXT_PLATFORMS,
		default: [],
		required: true,
		description: 'Platforms to publish to. Only those that accept a text post are listed.',
		displayOptions: { show: { resource: ['post'], operation: ['publishText'] } },
		routing: { request: { body: { platforms: '={{$value}}' } } },
	},
	{
		displayName: 'Platforms',
		name: 'platformsPhoto',
		type: 'multiOptions',
		options: PHOTO_PLATFORMS,
		default: [],
		required: true,
		description: 'Platforms to publish to. Only those that accept a photo post are listed.',
		displayOptions: { show: { resource: ['post'], operation: ['publishPhoto'] } },
		routing: { request: { body: { platforms: '={{$value}}' } } },
	},
	{
		displayName: 'Platforms',
		name: 'platformsVideo',
		type: 'multiOptions',
		options: VIDEO_PLATFORMS,
		default: [],
		required: true,
		description: 'Platforms to publish to. Only those that accept a video post are listed.',
		displayOptions: { show: { resource: ['post'], operation: ['publishVideo'] } },
		routing: { request: { body: { platforms: '={{$value}}' } } },
	},
	{
		displayName: 'Caption',
		name: 'caption',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		description: 'Text of the post. On YouTube and Reddit it becomes the title.',
		displayOptions: { show: { resource: ['post'], operation: ['publishText'] } },
		routing: { request: { body: { caption: '={{$value}}' } } },
	},
	{
		displayName: 'Caption',
		name: 'caption',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		description: 'Text shown with the media. On YouTube and Reddit it becomes the title.',
		displayOptions: {
			show: { resource: ['post'], operation: ['publishPhoto', 'publishVideo'] },
		},
		routing: { request: { body: { caption: '={{$value}}' } } },
	},
	{
		displayName: 'Photo URLs',
		name: 'photoUrls',
		type: 'string',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Photo URL' },
		default: [],
		required: true,
		placeholder: 'e.g. https://example.com/image.png',
		description:
			'Public HTTPS links to the images. Several links make a carousel, published in the order given.',
		displayOptions: { show: { resource: ['post'], operation: ['publishPhoto'] } },
		routing: { request: { body: { photo_urls: '={{$value}}' } } },
	},
	{
		displayName: 'Video URL',
		name: 'videoUrl',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. https://example.com/video.mp4',
		description: 'Public HTTPS link to the video file',
		displayOptions: { show: { resource: ['post'], operation: ['publishVideo'] } },
		routing: { request: { body: { video_url: '={{$value}}' } } },
	},
	additionalFields('publishText', 'platformsText', TEXT_PLATFORMS),
	additionalFields('publishPhoto', 'platformsPhoto', PHOTO_PLATFORMS),
	additionalFields('publishVideo', 'platformsVideo', VIDEO_PLATFORMS),

	// ---------------------------------------------------------------------------------------
	// post: getStatus / retry
	// ---------------------------------------------------------------------------------------
	{
		displayName: 'Identifier Type',
		name: 'identifierType',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Job ID',
				value: 'job_id',
				description: 'The identifier returned when a post was queued for a later time',
			},
			{
				name: 'Request ID',
				value: 'request_id',
				description: 'The identifier returned when a post was accepted for publishing',
			},
		],
		default: 'request_id',
		description: 'Which identifier the post is being looked up by',
		displayOptions: { show: { resource: ['post'], operation: ['getStatus', 'retry'] } },
	},
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. req01hzx9f2k4m7n6qr8t0v2w4y6z',
		description: 'Identifier returned by the publish operation',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['getStatus'],
				identifierType: ['request_id'],
			},
		},
		routing: { request: { qs: { request_id: '={{$value}}' } } },
	},
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. job01hzx9f2k4m7n6qr8t0v2w4y6z',
		description: 'Identifier returned when the post was scheduled',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['getStatus'],
				identifierType: ['job_id'],
			},
		},
		routing: { request: { qs: { job_id: '={{$value}}' } } },
	},
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. req01hzx9f2k4m7n6qr8t0v2w4y6z',
		description: 'Identifier of the post to retry',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['retry'],
				identifierType: ['request_id'],
			},
		},
		routing: { request: { body: { request_id: '={{$value}}' } } },
	},
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. job01hzx9f2k4m7n6qr8t0v2w4y6z',
		description: 'Identifier of the scheduled post to retry',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['retry'],
				identifierType: ['job_id'],
			},
		},
		routing: { request: { body: { job_id: '={{$value}}' } } },
	},

	// ---------------------------------------------------------------------------------------
	// post: unpublish
	// ---------------------------------------------------------------------------------------
	{
		displayName: 'Profile Name or ID',
		name: 'profileId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getProfiles' },
		default: '',
		required: true,
		description:
			'The brand profile that owns the post. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { resource: ['post'], operation: ['unpublish'] } },
		routing: { request: { body: { profile_id: '={{$value}}' } } },
	},
	{
		displayName: 'Platform',
		name: 'platform',
		type: 'options',
		options: UNPUBLISH_PLATFORMS,
		default: 'facebook',
		required: true,
		description: 'Platform to delete the post from. Only platforms that allow deletion are listed.',
		displayOptions: { show: { resource: ['post'], operation: ['unpublish'] } },
		routing: { request: { body: { platform: '={{$value}}' } } },
	},
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 12345_67890',
		description:
			'The platform’s own ID for the post, as returned in the publish result. This is not the request ID.',
		displayOptions: { show: { resource: ['post'], operation: ['unpublish'] } },
		routing: { request: { body: { post_id: '={{$value}}' } } },
	},
];
