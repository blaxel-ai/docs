---
title: "bl get"
slug: bl_get
---
## bl get

List or retrieve Blaxel resources in your workspace

### Synopsis

Retrieve information about Blaxel resources in your workspace.

A "resource" in Blaxel refers to any deployable or manageable entity:
- agents: AI agent applications
- functions/mcp: Model Context Protocol servers (tool providers)
- jobs: Batch processing tasks
- sandboxes: Isolated execution environments
- models: AI model configurations
- policies: Access control policies
- volumes: Persistent storage
- integrationconnections: External service integrations

Output Formats:
Use -o flag to control output format:
- pretty: Human-readable colored output (default)
- json: Machine-readable JSON (for scripting)
- yaml: YAML format
- table: Tabular format with columns

Watch Mode:
Use --watch to continuously monitor a resource and see updates in real-time.
Useful for tracking deployment status or watching for changes.

The command can list all resources of a type or get details for a specific one.

### Examples

```
  # List all agents
  bl get agents

  # Get specific agent details
  bl get agent my-agent

  # Get in JSON format (useful for scripting)
  bl get agent my-agent -o json

  # Watch agent status in real-time
  bl get agent my-agent --watch

  # List all resources with table output
  bl get agents -o table

  # Get MCP servers (also called functions)
  bl get functions
  bl get mcp

  # List jobs
  bl get jobs

  # Get specific job
  bl get job my-job

  # List executions for a job (nested resource)
  bl get job my-job executions

  # Get specific execution for a job
  bl get job my-job execution EXECUTION_ID

  # Monitor sandbox status
  bl get sandbox my-sandbox --watch

  # List processes in a sandbox
  bl get sandbox my-sandbox process
  bl get sbx my-sandbox ps

  # Get specific process in a sandbox
  bl get sandbox my-sandbox process my-process

  # List previews for a sandbox
  bl get sandbox my-sandbox previews

  # Get a specific preview
  bl get sandbox my-sandbox preview my-preview

  # List tokens for a sandbox preview
  bl get sandbox my-sandbox preview my-preview tokens

  # Get a specific token
  bl get sandbox my-sandbox preview my-preview token my-token

  # --- Filtering with jq ---

  # Get names of all jobs with status DELETING
  bl get jobs -o json | jq -r '.[] | select(.status == "DELETING") | .metadata.name'

  # Get names of all deployed sandboxes
  bl get sandboxes -o json | jq -r '.[] | select(.status == "DEPLOYED") | .metadata.name'

  # Get all agents with name containing "test"
  bl get agents -o json | jq -r '.[] | select(.metadata.name | contains("test")) | .metadata.name'

  # Get sandboxes with specific label (e.g., environment=dev)
  bl get sandboxes -o json | jq -r '.[] | select(.metadata.labels.environment == "dev") | .metadata.name'

  # Get all job names
  bl get jobs -o json | jq -r '.[] | .metadata.name'

  # Count resources by status
  bl get agents -o json | jq 'group_by(.status) | map({status: .[0].status, count: length})'
```

### Options

```
  -h, --help    help for get
      --watch   After listing/getting the requested object, watch for changes.
```

### Options inherited from parent commands

```
  -o, --output string          Output format. One of: pretty,yaml,json,table
      --skip-version-warning   Skip version warning
  -u, --utc                    Enable UTC timezone
  -v, --verbose                Enable verbose output
  -w, --workspace string       Specify the workspace name
```

### SEE ALSO

* [bl](/cli-reference/commands/bl)	 - Blaxel CLI - manage and deploy AI agents, sandboxes, and resources
* [bl get agents](/cli-reference/commands/bl_get_agents)	 - List all agents or get details of a specific one
* [bl get drives](/cli-reference/commands/bl_get_drives)	 - List all drives or get details of a specific one
* [bl get functions](/cli-reference/commands/bl_get_functions)	 - List all functions or get details of a specific one
* [bl get image](/cli-reference/commands/bl_get_image)	 - Get image information
* [bl get integrationconnections](/cli-reference/commands/bl_get_integrationconnections)	 - List all integrationconnections or get details of a specific one
* [bl get jobs](/cli-reference/commands/bl_get_jobs)	 - List all jobs or get details of a specific one
* [bl get models](/cli-reference/commands/bl_get_models)	 - List all models or get details of a specific one
* [bl get policies](/cli-reference/commands/bl_get_policies)	 - List all policies or get details of a specific one
* [bl get previews](/cli-reference/commands/bl_get_previews)	 - List all previews or get details of a specific one
* [bl get previewtokens](/cli-reference/commands/bl_get_previewtokens)	 - List all previewtokens or get details of a specific one
* [bl get sandboxes](/cli-reference/commands/bl_get_sandboxes)	 - List all sandboxes or get details of a specific one
* [bl get volumes](/cli-reference/commands/bl_get_volumes)	 - List all volumes or get details of a specific one
* [bl get volumetemplates](/cli-reference/commands/bl_get_volumetemplates)	 - List all volumetemplates or get details of a specific one

