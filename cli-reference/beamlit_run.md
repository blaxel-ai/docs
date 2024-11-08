---
date: 2024-11-06T14:35:20+01:00
title: "beamlit run"
slug: beamlit_run
---
## beamlit run

Run inference

```
beamlit run [model] [flags]
```

### Options

```
      --data string          JSON body data for the inference request
      --header stringArray   Request headers in 'Key: Value' format. Can be specified multiple times
  -h, --help                 help for run
      --method string        HTTP method for the inference request (default "POST")
      --path string          path for the inference request
      --show-headers         Show response headers in output
      --upload-file string   This transfers the specified local file to the remote URL
```

### Options inherited from parent commands

```
  -e, --env string         Environment. One of: development,production
  -o, --output string      Output format. One of: pretty,yaml,json,table
  -w, --workspace string   Specify the workspace name
```

### SEE ALSO

* [beamlit](beamlit.md)	 - Beamlit CLI is a command line tool to interact with Beamlit APIs.

