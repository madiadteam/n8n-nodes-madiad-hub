# Security policy

## Reporting a vulnerability

Email **info@madiad.com** with `n8n-nodes-madiad-hub` in the subject. Please include what you found,
how to reproduce it, and what an attacker could do with it.

Please report privately first rather than opening a public issue, so a fix can ship before the
details are public. We aim to acknowledge within three working days.

## What this package can reach

The node authenticates with a MADIAD Hub API key and talks to `https://api.madiad.com` and nothing
else. It reads no environment variables and touches no files. It has no runtime dependencies.

An API key can publish, retry and unpublish posts for the account it belongs to, so treat it as a
credential with real reach: create a separate key per workflow, and revoke a key rather than sharing
one.

## Supported versions

Only the latest published version receives fixes.
