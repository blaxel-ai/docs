---
title: 'auth.md'
sidebarTitle: 'Agent auth discovery (auth.md)'
description: 'Machine-readable guide that tells AI agents which Blaxel authentication methods exist today and how to use them without asking users to paste long-lived secrets.'
---

You are an agent. This file tells you how to authenticate to Blaxel for a user. Blaxel supports discovery only: pick one of the existing methods below. Blaxel does not support agentic registration. There is no `/agent/identity` endpoint and no `agent_auth` block in the authorization server metadata, so do not try to register yourself.

## Protected resources

| Resource | URL | Credentials accepted |
| --- | --- | --- |
| Blaxel API | `https://api.blaxel.ai/v0` | OAuth access token or API key |
| Blaxel MCP server (workspace management) | `https://api.blaxel.ai/v0/mcp` | OAuth access token or API key |
| Sandbox, agent, MCP server and job endpoints | `https://run.blaxel.ai` and `https://*.bl.run` | Same credential as the Blaxel API |
| Blaxel docs MCP server | `https://docs.blaxel.ai/mcp` | None |

## Step 1: Discover

| Document | URL |
| --- | --- |
| Docs index for agents | https://docs.blaxel.ai/llms.txt |
| OpenID Connect configuration | https://api.blaxel.ai/.well-known/openid-configuration |
| OAuth authorization server metadata | https://api.blaxel.ai/.well-known/oauth-authorization-server |
| MCP server protected resource metadata | https://api.blaxel.ai/.well-known/oauth-protected-resource/v0/mcp |

Current behavior to plan around:

- The MCP server answers `401` with `WWW-Authenticate: Bearer realm="Blaxel MCP", resource_metadata="..."`. Follow it.
- The Blaxel API answers `401` with `{"code":401,"error":"Unauthorized"}` and no `WWW-Authenticate` header. Come back to this file.
- `https://api.blaxel.ai/.well-known/oauth-protected-resource` describes the MCP server (`resource` is `https://api.blaxel.ai/v0/mcp`). The Blaxel API has no protected resource metadata of its own yet.
- The metadata only advertises the `openid`, `email`, `profile` and `offline_access` scopes. Access follows the role of the user or service account in each workspace, not the token scope.
- The CLI device login and the client credentials grant are not advertised in the metadata. Use them as described below.

## Step 2: Pick a method

1. You can run the Blaxel CLI and a human can open a URL: use [CLI login](#cli-login).
2. You are an MCP client: use [MCP OAuth](#mcp-oauth).
3. You run unattended (CI, backend, scheduled job) and a workspace admin created a service account for you: use [service account client credentials](#service-account-client-credentials).
4. None of the above: use the [API key fallback](#api-key-fallback).

Prefer short-lived OAuth tokens (methods 1 to 3). Never ask the user to paste a password, client secret or API key into the conversation. Ask them to set an environment variable in your runtime instead.

## Step 3: Get a credential

### CLI login

```bash
bl login my-workspace
```

- The user confirms the login in a browser. The CLI waits about 3 minutes for that confirmation.
- Without a terminal (for example when a coding agent runs the command), `bl login` asks nothing. It prints the login URL on its own line and how long it waits. Show that URL to the user and wait for the command to exit. This needs CLI version 0.1.123 or later.
- Without a workspace argument, `bl login` picks the current workspace if the login can use it, or else the first workspace by name, and says which one.
- With a workspace argument, `bl login` uses `BL_CLIENT_CREDENTIALS` or `BL_API_KEY` when one is set.
- The CLI saves the credential in its local configuration and refreshes it. The Blaxel SDKs reuse it. `bl token` prints a current access token.
- The login token reaches every workspace of the user. Select one per request (see [Step 4](#step-4-call-the-api)).

Reference: https://docs.blaxel.ai/cli-reference/commands/bl_login

### MCP OAuth

Connect to `https://api.blaxel.ai/v0/mcp` and let your MCP client run the OAuth flow. The authorization server is `https://signin.blaxel.ai`. It supports authorization code with PKCE (`S256`), public clients, dynamic client registration and Client ID Metadata Documents. The user signs in to Blaxel in a browser and approves the client.

Reference: https://docs.blaxel.ai/skills-mcp

### Service account client credentials

A workspace admin creates a service account in the Blaxel console and gives you its client ID and client secret through your environment. Exchange them for a short-lived access token:

```bash
curl -X POST https://api.blaxel.ai/v0/oauth/token \
  -H 'Content-Type: application/json' \
  -d '{"grant_type":"client_credentials","client_id":"'"$CLIENT_ID"'","client_secret":"'"$CLIENT_SECRET"'"}'
```

- The token is valid for 2 hours. Request a new one when it expires. There is no refresh token.
- The token only works in the service account's workspace, with the service account's role.
- The CLI and SDKs read the same credentials from `BL_CLIENT_CREDENTIALS`, set to the base64 encoding of `client_id:client_secret`, with `BL_WORKSPACE`.

Reference: https://docs.blaxel.ai/Security/Service-accounts

### API key fallback

Use an API key only when no OAuth method fits. A human creates it in the Blaxel console (Profile > Security for a personal key, workspace settings for a service account key) and sets it in your environment:

```bash
export BL_WORKSPACE=my-workspace
export BL_API_KEY=...
```

- An API key never expires unless an expiry was set when it was created.
- A personal API key reaches every workspace of its user. Prefer a service account key, which only reaches one workspace.

Reference: https://docs.blaxel.ai/Security/Access-tokens

## Step 4: Call the API

```http
GET /v0/sandboxes HTTP/1.1
Host: api.blaxel.ai
Authorization: Bearer <access token or API key>
X-Blaxel-Workspace: my-workspace
```

- `X-Blaxel-Authorization: Bearer ...` is accepted in place of `Authorization`.
- Send `X-Blaxel-Workspace` when the identity belongs to more than one workspace. Without it, those requests fail with `400`.

## Errors

| Status | Meaning | What to do |
| --- | --- | --- |
| `401` | Missing, expired or invalid credential | Get a new token with the same method. For CLI login, run `bl login` again. |
| `403` | Valid credential without access to this workspace or action | Check `X-Blaxel-Workspace` and the role of the user or service account. |
| `400` at `/v0/oauth/token` | Missing or invalid `grant_type`, `client_id` or `client_secret` | Fix the request. Do not retry the same body. |

## Revocation

- There is no token revocation endpoint. Access tokens expire after 2 hours.
- Users delete their API keys in the Blaxel console. Workspace admins delete service account keys and service accounts.
- `bl logout` removes the credential saved by the CLI. It does not revoke tokens on the server.

## Not supported

Do not attempt these flows. Blaxel does not offer them today:

- agentic registration (`/agent/identity`), including anonymous registration
- verified-email claim ceremonies (`service_auth`)
- ID-JAG identity assertions and the JWT-bearer grant
- token exchange
- revocation events (Security Event Tokens)
- issuing a credential to an agent before a human signs in to Blaxel or a workspace admin creates it

Full documentation index: https://docs.blaxel.ai/llms.txt
