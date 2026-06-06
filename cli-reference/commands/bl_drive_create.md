---
title: "bl drive create"
slug: bl_drive_create
---
## bl drive create

Create a new drive

```
bl drive create [flags]
```

### Examples

```
  # Create a drive in a specific region
  bl drive create --name my-drive --region us-was-1

  # Create a drive with a size limit (in GB)
  bl drive create --name my-drive --region us-was-1 --size 10
```

### Options

```
  -h, --help             help for create
      --name string      Name of the drive (required)
      --region string    Deployment region, e.g. us-was-1, eu-lon-1 (required)
      --size int         Size limit in GB (optional, 0 for unlimited)
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
