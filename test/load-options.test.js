const test = require('node:test');
const assert = require('node:assert/strict');

const { MadiadHub } = require('../dist/nodes/MadiadHub/MadiadHub.node.js');
const { SOURCE_HEADER } = require('../dist/nodes/MadiadHub/GenericFunctions.js');

// The dropdown is the one piece of imperative code in the package, so it is the one piece that can
// throw at the user while they are editing. These drive it with a stubbed HTTP layer.

function ctx(respond) {
	return {
		getNode: () => ({ name: 'MADIAD Hub', type: 'madiadHub', typeVersion: 1 }),
		helpers: {
			httpRequestWithAuthentication: async function (_cred, opts) {
				return respond(opts);
			},
		},
	};
}
const getProfiles = (c) => new MadiadHub().methods.loadOptions.getProfiles.call(c);

test('profiles are listed by name, sorted', async () => {
	const out = await getProfiles(
		ctx(() => ({
			profiles: [
				{ profile_id: 'b', friendly_name: 'Zeta' },
				{ profile_id: 'a', friendly_name: 'alpha' },
			],
		})),
	);
	assert.deepEqual(out, [
		{ name: 'alpha', value: 'a' },
		{ name: 'Zeta', value: 'b' },
	]);
});

test('a profile with an empty name falls back to its ID, not a blank row', async () => {
	// The reason this test exists: the code used `??`, which only catches null and undefined, while
	// the case it claimed to guard against — the API returning "" — sailed straight through and
	// rendered a row nobody could tell apart or click on.
	for (const bad of ['', '   ', null, undefined, 42]) {
		const out = await getProfiles(ctx(() => ({ profiles: [{ profile_id: 'p1', friendly_name: bad }] })));
		assert.deepEqual(out, [{ name: 'p1', value: 'p1' }], `friendly_name ${JSON.stringify(bad)}`);
	}
});

test('a row with no usable ID is dropped rather than rendered as an unselectable option', async () => {
	const out = await getProfiles(
		ctx(() => ({ profiles: [{ friendly_name: 'no id' }, { profile_id: '', friendly_name: 'blank' }, null] })),
	);
	assert.deepEqual(out, []);
});

test('an unexpected response shape yields an empty list instead of throwing at the user', async () => {
	for (const body of [{}, { profiles: null }, { profiles: 'nope' }, null]) {
		assert.deepEqual(await getProfiles(ctx(() => body)), [], JSON.stringify(body));
	}
});

test('the attribution header is sent on the dropdown call too', async () => {
	let seen;
	await getProfiles(ctx((opts) => ((seen = opts), { profiles: [] })));
	assert.equal(seen.method, 'GET');
	assert.match(seen.url, /^https:\/\/api\.madiad\.com\/v1\/profiles$/);
	assert.equal(seen.headers['X-Madiad-Source'], SOURCE_HEADER);
});

test('an API failure is reported as an API error, not swallowed', async () => {
	await assert.rejects(
		() =>
			getProfiles(
				ctx(() => {
					throw Object.assign(new Error('unauthorized'), { statusCode: 401 });
				}),
			),
		(e) => e.constructor.name === 'NodeApiError',
	);
});
