---
date: 2024-11-25T14:23:03+01:00
title: "beamlit apply"
slug: beamlit_apply
---
## beamlit apply

Apply a configuration to a resource by file

### Synopsis

Apply a configuration to a resource by file

```
beamlit apply [flags]
```

### Examples

```

			beamlit apply -f ./my-deployment.yaml
			# Or using stdin
			cat file.yaml | beamlit apply -f -
		
```

### Options

```
  -f, --file string   Path to YAML file to apply
  -h, --help          help for apply
```

### Options inherited from parent commands

```
  -e, --env string         Environment. One of: development,production
  -o, --output string      Output format. One of: pretty,yaml,json,table
  -v, --verbose            Enable verbose output
  -w, --workspace string   Specify the workspace name
```

### SEE ALSO

* [beamlit](beamlit.md)	 - Beamlit CLI is a command line tool to interact with Beamlit APIs.

