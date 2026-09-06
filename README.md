# n8n-nodes-madiad-hub

An [n8n](https://n8n.io) community node for [MADIAD Hub](https://hub.madiad.com) — publish text, photos and video to every social platform a brand is connected to, from one workflow step.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Usage](#usage) · [Resources](#resources)

## Installation

Follow n8n's [community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) and install the package `n8n-nodes-madiad-hub`.

On self-hosted n8n you can also install it from **Settings → Community nodes → Install**.

## Credentials

You need a MADIAD Hub account and an API key.

1. Sign in at [hub.madiad.com](https://hub.madiad.com) and open **API Keys**.
2. Create a key. It is shown once — copy it immediately.
3. In n8n, create a **MADIAD Hub API** credential and paste the key.
4. Press **Test**. The node calls `GET /v1/profiles`, which reads nothing but your own account and uses no publishing quota, so a green result means the key works and nothing was published.

Create a **separate key per workflow** so a leaked key can be revoked without breaking anything else.

## Operations

### Post

| Operation | What it does |
| --- | --- |
| **Publish Text** | Publishes a text-only post to every selected platform |
| **Publish Photo** | Publishes one or more images from public HTTPS links (several links become a carousel) |
| **Publish Video** | Publishes a video from a public HTTPS link |
| **Get Status** | Reads the outcome of a post, per platform, by request ID or job ID |
| **Retry** | Re-sends only the platforms a post failed on, reusing the media already stored |
| **Unpublish** | Deletes a live post from Facebook, LinkedIn, Threads, X or YouTube |

The **Platforms** dropdown is filtered per operation: only platforms that accept that kind of content are listed, so a request that the API would reject cannot be built by accident.

**Options** available on the publish operations:

- **Scheduled At** / **Timezone** — publish at a future time instead of immediately.
- **Add to Queue** — publish at the profile's next free queue slot.
- **Idempotency Key** — makes a retry safe. A repeat of the same key returns the original result instead of publishing twice. Use a value that is unique per intended post and constant across retries of that post — never a row number or `$itemIndex`, both of which get reused and would silently suppress a later post.
- **Facebook Page ID** — needed only when the connected account manages more than one Page.
- **Subreddit** / **Reddit Title** — required when posting to Reddit.
- **Pinterest Board ID** — required when posting to Pinterest.

### Profile

| Operation | What it does |
| --- | --- |
| **Get Many** | Returns the brand profiles on the account (`profile_id` and `friendly_name`) |

### Usage

| Operation | What it does |
| --- | --- |
| **Get** | Returns the plan, the current billing period, and how much of each allowance is left |

## Usage

### Publish a post

1. Add the **MADIAD Hub** node, choose **Resource → Post** and an operation.
2. Pick a **Profile** from the dropdown — it is filled from your own account, so there is no ID to copy by hand.
3. Select the **Platforms**, write the **Caption**, and add a media URL for photo or video posts.

### Handle the response

A text or photo post to fast platforms usually returns `status: "completed"` with a `results` object keyed by platform. A video is asynchronous: it returns `status: "processing"` and a `request_id`.

A post can also partially succeed, so branch on the per-platform `success` field rather than on the top-level status alone:

```json
{
  "status": "partial",
  "results": {
    "facebook": { "success": true, "url": "https://facebook.com/12345/posts/67890" },
    "x": { "success": false, "error": "Upload rejected by the platform" }
  },
  "failed_platforms": ["x"]
}
```

To wait for an asynchronous post, add a **Wait** node followed by **Post → Get Status** with the `request_id`, and loop until the status is `completed`, `partial` or `failed`. For high-volume workflows, register a webhook in your dashboard instead of polling.

### Handle errors

The node throws on any non-2xx answer, carrying the API's own error code and message. Set the node's **On Error** to *Continue (using error output)* to route failures instead of aborting the run.

Not every failure is worth retrying:

| Status | Meaning | What the workflow should do |
| --- | --- | --- |
| `400` | The content or the request is wrong (caption over a platform's limit, bad URL) | Stop — retrying the same item cannot succeed |
| `409 platform_not_connected` | The profile has no account connected for that platform | Alert a human |
| `409 idempotency_in_progress` | An earlier attempt with the same key is still running | Wait a few seconds, retry with the **same** key |
| `429` | Rate limited | Back off for `Retry-After` seconds |
| `5xx` | A backend failure | Retry with backoff, always with an **Idempotency Key** |

### Example workflow

A content calendar in Google Sheets, published automatically:

1. **Schedule Trigger** (every 15 minutes) → **Google Sheets**: get rows where `status = ready`.
2. **MADIAD Hub** → *Post: Publish Photo* — profile from the dropdown, platforms and caption from the row, **Idempotency Key** set to a UUID stored on the row.
3. **IF** on the response → on success, update the row to `published`; on failure, send an alert.

## Compatibility

Requires n8n 1.94.0 or later and Node.js 20.15 or later. The package has no runtime dependencies.

## Resources

- [MADIAD Hub documentation](https://docs.madiad.com)
- [API authentication](https://docs.madiad.com/authentication)
- [Using MADIAD Hub from n8n](https://docs.madiad.com/integrations/n8n)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
