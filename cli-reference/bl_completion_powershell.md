---
title: "bl completion powershell"
slug: bl_completion_powershell
---
## bl completion powershell

Generate the autocompletion script for powershell

### Synopsis

Generate the autocompletion script for powershell.

To load completions in your current shell session:

	bl completion powershell | Out-String | Invoke-Expression

To load completions for every new session, add the output of the above command
to your powershell profile.


```
bl completion powershell [flags]
```

### Options

```
  -h, --help              help for powershell
      --no-descriptions   disable completion descriptions
```

### Options inherited from parent commands

```
  -e, --env string         Environment. One of: development,production
  -o, --output string      Output format. One of: pretty,yaml,json,table
  -v, --verbose            Enable verbose output
  -w, --workspace string   Specify the workspace name
```

### SEE ALSO

* [bl completion](bl_completion.md)	 - Generate the autocompletion script for the specified shell

