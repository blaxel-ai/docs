---
title: "bl drive get"
slug: bl_drive_get
---
## bl drive get

Get details of a specific drive

```
bl drive get <name> [flags]
```

### Examples

```
  # Get drive details
  bl drive get my-drive

  # Get drive details in JSON format
  bl drive get my-drive -o json
```

### Options

```
  -h, --help   help for get
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
