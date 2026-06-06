---
title: "bl drive unmount"
slug: bl_drive_unmount
---
## bl drive unmount

Unmount a drive from a sandbox

### Synopsis

Unmount a previously mounted drive from the specified local path inside a sandbox.

```
bl drive unmount [flags]
```

### Examples

```
  # Unmount a drive
  bl drive unmount --sandbox my-sandbox --mount-path /mnt/data
```

### Options

```
  -h, --help                help for unmount
      --mount-path string   Local path inside the sandbox to unmount (required)
      --sandbox string      Name of the sandbox (required)
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
