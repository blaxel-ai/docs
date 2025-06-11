---
title: "bl apply"
slug: bl_apply
---
## bl apply

Apply a configuration to a resource by file

### Synopsis

Apply a configuration to a resource by file

```
bl apply [flags]
```

### Examples

```

			bl apply -f ./my-deployment.yaml
			# Or using stdin
			cat file.yaml | bl apply -f -
		
```

### Options

```
  -e, --env-file strings   Environment file to load (default [.env])
  -f, --filename string    Path to YAML file to apply
  -h, --help               help for apply
  -R, --recursive          Process the directory used in -f, --filename recursively. Useful when you want to manage related manifests organized within the same directory.
  -s, --secrets strings    Secrets to deploy
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

* [bl](bl.md)	 - Blaxel CLI is a command line tool to interact with Blaxel APIs.

