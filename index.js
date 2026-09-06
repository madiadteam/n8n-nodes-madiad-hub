// n8n loads the node and credential through the `n8n` block in package.json, not through this
// entry point, so there is nothing to export here. The file exists because npm expects `main` to
// resolve; requiring this package from your own code is not a supported use.
module.exports = {};
