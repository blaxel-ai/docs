---
title: "bl drive mounts"
slug: bl_drive_mounts
---
## bl drive mounts

List drives mounted in a sandbox

```
bl drive mounts [flags]
```

### Examples

```
  # List all mounted drives in a sandbox
  bl drive mounts --sandbox my-sandbox

  # List mounted drives in JSON format
  bl drive mounts --sandbox my-sandbox -o json
```

### Options

```
  -h, --help               help for mounts
      --sandbox string     Name of the sandbox (required)
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

* [bl drive](/cli-reference/commands/bl_drive)	 - Manage drives and drive mounts on sandboxes
