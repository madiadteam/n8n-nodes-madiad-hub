# Changelog

All notable changes to this package. This project follows [semantic versioning](https://semver.org).

## 0.1.2

### Fixed

- The profile dropdown no longer throws while you are editing the node when the API returns a
  malformed row. A `null` entry in the list raised `Cannot read properties of null` straight into
  the editor.
- A profile whose name comes back empty now falls back to its ID instead of rendering a blank,
  unselectable row. The previous check only caught `null` and `undefined`.

### Changed

- Options that apply to one platform (**Subreddit**, **Reddit Title**, **Pinterest Board ID**,
  **Facebook Page ID**) now appear only when that platform is selected. They used to be offered on
  every publish operation, which invited people to fill in fields the request would ignore.
- **Scheduled At** and **Timezone** are hidden once **Add to Queue** is on. Sending both a queue
  flag and a specific time left the outcome to whichever the API read first.
- Action labels dropped their articles (`Publish text post`, not `Publish a text post`) to match
  n8n's UX guidelines.
- The package no longer ships TypeScript declarations or source maps; it was emitting them without
  declaring `types`, so they were dead weight.

### Security

- CI actions are pinned to commit SHAs and npm to an exact version. A moving tag on an action, or
  `npm@latest`, is code running with the publish credential in scope.
- Releases must now come from a tag that is an ancestor of `main`. A manual dispatch could
  previously stage any branch.
- Every release runs the test suite and inspects the packed tarball before staging.

## 0.1.1

### Changed

- Node icon is now the MADIAD **M** mark in the brand red.

### Security

- First release published from CI with a signed [provenance
  statement](https://docs.npmjs.com/generating-provenance-statements).

## 0.1.0

First release. Post, Profile and Usage resources; declarative routing; credential with a working
Test button; profile dropdown loaded from the API.
