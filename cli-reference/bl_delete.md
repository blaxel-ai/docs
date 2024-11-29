---
date: 2024-11-29T16:27:20+01:00
title: "bl delete"
slug: bl_delete
---
## bl delete

Delete a resource

```
bl delete [flags]
```

### Examples

```

			bl delete -f ./my-resource.yaml
			# Or using stdin
			cat file.yaml | beamlit delete -f -
		
```

### Options

```
  -f, --file string   Path to YAML file to apply
  -h, --help          help for delete
```

### Options inherited from parent commands

```
  -e, --env string         Environment. One of: development,production
  -o, --output string      Output format. One of: pretty,yaml,json,table
  -v, --verbose            Enable verbose output
  -w, --workspace string   Specify the workspace name
```

### SEE ALSO

* [bl](bl.md)	 - Beamlit CLI is a command line tool to interact with Beamlit APIs.
* [bl delete environment](bl_delete_environment.md)	 - Delete a Environment
* [bl delete function](bl_delete_function.md)	 - Delete a Function
* [bl delete location](bl_delete_location.md)	 - Delete a Location
* [bl delete model](bl_delete_model.md)	 - Delete a Model
* [bl delete modelprovider](bl_delete_modelprovider.md)	 - Delete a ModelProvider
* [bl delete policy](bl_delete_policy.md)	 - Delete a Policy

