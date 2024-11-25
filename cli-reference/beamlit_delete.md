---
date: 2024-11-25T14:23:03+01:00
title: "beamlit delete"
slug: beamlit_delete
---
## beamlit delete

Delete a resource

```
beamlit delete [flags]
```

### Examples

```

			beamlit delete -f ./my-resource.yaml
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

* [beamlit](beamlit.md)	 - Beamlit CLI is a command line tool to interact with Beamlit APIs.
* [beamlit delete environment](beamlit_delete_environment.md)	 - Delete a Environment
* [beamlit delete function](beamlit_delete_function.md)	 - Delete a Function
* [beamlit delete location](beamlit_delete_location.md)	 - Delete a Location
* [beamlit delete model](beamlit_delete_model.md)	 - Delete a Model
* [beamlit delete modelprovider](beamlit_delete_modelprovider.md)	 - Delete a ModelProvider
* [beamlit delete policy](beamlit_delete_policy.md)	 - Delete a Policy

