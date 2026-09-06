const test = require('node:test');
const assert = require('node:assert/strict');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');

// These run against dist/, the code that actually ships, not the sources it was built from.
const { MadiadHub } = require('../dist/nodes/MadiadHub/MadiadHub.node.js');
const { MadiadHubApi } = require('../dist/credentials/MadiadHubApi.credentials.js');

const node = new MadiadHub();
const d = node.description;
const cred = new MadiadHubApi();
const prop = (name) => d.properties.find((p) => p.name === name);

// ---- whitelabel -------------------------------------------------------------
// The package is public on npm and GitHub. The platform this product resells must not be named
// anywhere in it — not in code, not in a comment, not in a URL.

function walk(dir) {
	return readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});
}

test('the upstream vendor is named nowhere in the shipped package', () => {
	const offenders = [];
	for (const dir of ['dist', 'nodes', 'credentials']) {
		for (const f of walk(join(__dirname, '..', dir))) {
			if (/\.(js|ts|json|svg|md)$/.test(f) && /upload[-_. ]?post/i.test(readFileSync(f, 'utf8'))) {
				offenders.push(f);
			}
		}
	}
	assert.deepEqual(offenders, []);
});

test('every request goes to our own API and nowhere else', () => {
	assert.equal(d.requestDefaults.baseURL, 'https://api.madiad.com/v1');
	const hosts = new Set();
	for (const f of walk(join(__dirname, '..', 'dist'))) {
		if (!/\.js$/.test(f)) continue;
		for (const m of readFileSync(f, 'utf8').matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) hosts.add(m[1]);
	}
	for (const h of hosts) {
		assert.ok(
			// example.com is IANA-reserved for documentation; it only appears in a placeholder.
			/(^|\.)madiad\.com$/.test(h) ||
				h === 'docs.n8n.io' ||
				h === 'www.w3.org' ||
				h === 'example.com',
			`unexpected host in the shipped code: ${h}`,
		);
	}
});

// ---- the credential ---------------------------------------------------------

test('the API key is a password field and is sent as a Bearer token', () => {
	const key = cred.properties.find((p) => p.name === 'apiKey');
	assert.equal(key.typeOptions?.password, true, 'the key must never render in clear text');
	const header = cred.authenticate?.properties?.headers ?? {};
	// n8n expressions are prefixed with '='; the header value is an expression, not a literal.
	const auth = String(header.Authorization ?? '');
	assert.match(auth, /^=?Bearer /, 'must be a Bearer header');
	assert.match(auth, /\{\{\s*\$credentials\.apiKey\s*\}\}/, 'must read the key from the credential');
	assert.doesNotMatch(auth, /mdc_live_[A-Za-z0-9]/, 'no real key may be baked in');
});

test('the credential Test button calls a read-only endpoint', () => {
	assert.ok(cred.test, 'without a test request the Test button silently does nothing');
	const url = String(cred.test.request.url);
	assert.equal(cred.test.request.method ?? 'GET', 'GET', 'Test must not write anything');
	assert.match(url, /profiles/, 'a listing is the cheapest authenticated call we have');
});

// ---- platform-specific options ---------------------------------------------
// Regression guard. These three were offered on every publish operation regardless of the
// platforms chosen, so a user publishing to Instagram was invited to fill in "Subreddit".

const GATED = {
	facebookPageId: 'facebook',
	pinterestBoardId: 'pinterest',
	redditTitle: 'reddit',
	subreddit: 'reddit',
};

test('a platform-specific option only appears when that platform is selected', () => {
	const collections = d.properties.filter((p) => p.type === 'collection' && p.name === 'options');
	assert.ok(collections.length >= 3, 'expected one options collection per publish operation');

	for (const c of collections) {
		for (const opt of c.options) {
			const platform = GATED[opt.name];
			if (!platform) continue;
			const show = opt.displayOptions?.show ?? {};
			const key = Object.keys(show).find((k) => k.startsWith('/platforms'));
			assert.ok(key, `${opt.name} is not gated on any Platforms field`);
			assert.deepEqual(show[key], [platform], `${opt.name} must require ${platform}`);
		}
	}
});

test('an option is never offered for a platform the operation cannot post to', () => {
	for (const c of d.properties.filter((p) => p.name === 'options')) {
		const op = c.displayOptions.show.operation[0];
		const platformsProp = prop(
			{ publishText: 'platformsText', publishPhoto: 'platformsPhoto', publishVideo: 'platformsVideo' }[op],
		);
		const allowed = new Set(platformsProp.options.map((o) => o.value));
		for (const opt of c.options) {
			const platform = GATED[opt.name];
			if (platform) assert.ok(allowed.has(platform), `${op} offers ${opt.name} but cannot post to ${platform}`);
		}
	}
});

test('a specific time and the queue are never offered together', () => {
	for (const c of d.properties.filter((p) => p.name === 'options')) {
		for (const name of ['scheduledAt', 'timezone']) {
			const opt = c.options.find((o) => o.name === name);
			if (!opt) continue;
			assert.deepEqual(
				opt.displayOptions?.hide?.addToQueue,
				[true],
				`${name} must disappear once the queue is chosen — sending both leaves the outcome to chance`,
			);
		}
	}
});

// ---- n8n UX conventions -----------------------------------------------------

test('action labels carry no article, as n8n asks', () => {
	for (const p of d.properties.filter((x) => x.name === 'operation')) {
		for (const o of p.options) {
			assert.doesNotMatch(o.action, /\b(a|an|the)\b/i, `"${o.action}" contains an article`);
		}
	}
});

test('every operation has an action and a description', () => {
	for (const p of d.properties.filter((x) => x.name === 'operation')) {
		for (const o of p.options) {
			assert.ok(o.action, `${o.value} has no action label`);
			assert.ok(o.description, `${o.value} has no description`);
		}
	}
});

test('the profile dropdown is wired to a loadOptions method that exists', () => {
	const ids = d.properties.filter((p) => p.name === 'profileId');
	assert.ok(ids.length > 0);
	for (const p of ids) {
		const m = p.typeOptions?.loadOptionsMethod;
		assert.ok(m, 'profileId must be a dropdown, not a field to paste an ID into');
		assert.ok(node.methods.loadOptions[m], `loadOptions.${m} is referenced but not implemented`);
	}
});

// ---- the platform matrices --------------------------------------------------

test('platform lists are non-empty and free of duplicates', () => {
	for (const name of ['platformsText', 'platformsPhoto', 'platformsVideo']) {
		const opts = prop(name).options;
		assert.ok(opts.length > 0, `${name} lists no platform`);
		const values = opts.map((o) => o.value);
		assert.equal(new Set(values).size, values.length, `${name} repeats a platform`);
	}
});
