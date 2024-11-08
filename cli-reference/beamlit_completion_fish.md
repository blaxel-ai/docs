---
date: 2024-11-06T14:35:20+01:00
title: "beamlit completion fish"
slug: beamlit_completion_fish
---
## beamlit completion fish

Generate the autocompletion script for fish

### Synopsis

Generate the autocompletion script for the fish shell.

To load completions in your current shell session:

	beamlit completion fish | source

To load completions for every new session, execute once:

	beamlit completion fish > ~/.config/fish/completions/beamlit.fish

You will need to start a new shell for this setup to take effect.


```
beamlit completion fish [flags]
```

### Options

```
  -h, --help              help for fish
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

