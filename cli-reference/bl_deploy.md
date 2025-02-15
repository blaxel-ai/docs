---
title: "bl deploy"
slug: bl_deploy
---
## bl deploy

Deploy a beamlit agent app

### Synopsis

Deploy a beamlit agent app, you must be in a beamlit agent app directory.

```
bl deploy [flags]
```

### Examples

```
bl deploy
```

### Options

```
  -D, --dependencies       Install dependencies
  -d, --directory string   Directory to deploy, defaults to current directory (default "src")
      --dryrun             Dry run the deployment
  -h, --help               help for deploy
  -m, --module string      Module to serve, can be an agent or a function
  -n, --name string        Optional name for the deployment
```

### Options inherited from parent commands

```
  -o, --output string      Output format. One of: pretty,yaml,json,table
  -u, --utc                Enable UTC timezone
  -v, --verbose            Enable verbose output
  -w, --workspace string   Specify the workspace name
```

### SEE ALSO

* [bl](bl.md)	 - Beamlit CLI is a command line tool to interact with Beamlit APIs.

