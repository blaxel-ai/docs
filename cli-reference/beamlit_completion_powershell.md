---
date: 2024-11-06T14:35:20+01:00
title: "beamlit completion powershell"
slug: beamlit_completion_powershell
---
## beamlit completion powershell

Generate the autocompletion script for powershell

### Synopsis

Generate the autocompletion script for powershell.

To load completions in your current shell session:

	beamlit completion powershell | Out-String | Invoke-Expression

To load completions for every new session, add the output of the above command
to your powershell profile.


```
beamlit completion powershell [flags]
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
  -w, --workspace string   Specify the workspace name
```

### SEE ALSO

* [beamlit completion](beamlit_completion.md)	 - Generate the autocompletion script for the specified shell

