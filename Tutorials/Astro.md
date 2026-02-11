# Setting up Astro with Blaxel Sandboxes

This guide explains how to run an Astro application inside a Blaxel Sandbox and expose it securely using Blaxel Previews.

## Overview

The guide covers:

- Building a sandbox image for Astro
- Creating or reusing a Blaxel sandbox
- Configuring Astro to work behind Blaxel previews
- Launching Astro and accessing it through a preview URL

## Prerequisites

Before starting, ensure you have:

- Blaxel CLI installed and authenticated (bl login)
- Node.js 18+ installed
- @blaxel/core package installed in your project (npm install @blaxel/core)

## Architecture Overview

Running Astro inside a Blaxel sandbox requires a few adjustments compared to local development:

- Astro normally binds to localhost
- Blaxel exposes services via preview URLs
- Astro must be configured to accept external connections and allow all hosts

This is solved by:

- Configuring astro.config.mjs with host: '0.0.0.0' and allowedHosts: true
- Exposing the Astro dev server via a Blaxel Preview

## Sandbox Image for Astro

### Dockerfile

```dockerfile
FROM oven/bun:alpine

RUN apk update && apk add --no-cache \
  git \
  curl \
  netcat-openbsd \
  nodejs \
  npm \
  && rm -rf /var/cache/apk/*

WORKDIR /app

COPY --from=ghcr.io/blaxel-ai/sandbox:latest /sandbox-api /usr/local/bin/sandbox-api

# Create Astro project with npx (more reliable for template downloads), then use bun for deps
RUN npx create-astro@latest /app --template basics --no-install --no-git --yes \
  && bun install

COPY ./astro.config.mjs /app/astro.config.mjs

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

### astro.config.mjs

Create an astro.config.mjs file that allows external connections:

```javascript
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 4321,
    allowedHosts: true
  }
});
```

### entrypoint.sh

Create an entrypoint script that starts the sandbox API and the dev server:

```bash
#!/bin/sh

# Set environment variables
export PATH="/usr/local/bin:$PATH"

# Start sandbox-api in the background
/usr/local/bin/sandbox-api &

# Function to wait for port to be available
wait_for_port() {
    local port=$1
    local timeout=30
    local count=0

    echo "Waiting for port $port to be available..."

    while ! nc -z localhost $port; do
        sleep 1
        count=$((count + 1))
        if [ $count -gt $timeout ]; then
            echo "Timeout waiting for port $port"
            exit 1
        fi
    done

    echo "Port $port is now available"
}

# Wait for port 8080 to be available
wait_for_port 8080

# Execute curl command to start Astro dev server
echo "Running Astro dev server..."
curl http://localhost:8080/process \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dev-server",
    "workingDir": "/app",
    "command": "bun run dev",
    "waitForCompletion": false,
    "restartOnFailure": true,
    "maxRestarts": 25
  }'

wait
```

### blaxel.toml

Create a blaxel.toml file in the same directory as your Dockerfile:

```toml
type = "sandbox"
name = "astro-template"

[runtime]
memory = 4096

[[runtime.ports]]
name = "astro-dev"
target = 4321
protocol = "tcp"
```

### Deploying the Image

Deploy the image by running:

```bash
bl deploy
```

## Creating or Reusing a Sandbox

```typescript
import { SandboxInstance } from "@blaxel/core";

const sandboxName = "my-astro-sandbox";

const sandbox = await SandboxInstance.createIfNotExists({
  name: sandboxName,
  labels: {
    framework: "astro",
  },
  image: "astro-template:latest",
  memory: 4096,
  ports: [
    { name: "preview", target: 4321, protocol: "HTTP" },
  ],
});
```

## Configuring CORS for Astro Preview

Astro dev servers work well with permissive CORS headers when accessed through a preview URL:

```typescript
const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, X-Blaxel-Workspace, X-Blaxel-Preview-Token, X-Blaxel-Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Expose-Headers": "Content-Length, X-Request-Id",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};
```

Alternatively, you can use custom domains to expose previews on your own domain.

## Creating the Blaxel Preview

Astro runs on port 4321, so we expose that port via a preview:

```typescript
const preview = await sandbox.previews.createIfNotExists({
  metadata: { name: "dev-server-preview" },
  spec: {
    responseHeaders,
    public: false,
    port: 4321,
  },
});
```

## Generating a Preview Token

To securely access the preview, a token is required:

```typescript
const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day
const token = await preview.tokens.create(expiresAt);
```

## Starting the Dev Server

If not using the entrypoint script, you can start the dev server programmatically:

```typescript
async function startDevServer(sandbox: SandboxInstance) {
  console.log("Starting Astro dev server...");
  await sandbox.process.exec({
    name: "dev-server",
    command: "bun run dev",
    workingDir: "/app",
    waitForPorts: [4321],
    restartOnFailure: true,
    maxRestarts: 25,
  });
}
```

## Streaming Astro Logs

To monitor the Astro dev server output in real-time:

```typescript
const logStream = sandbox.process.streamLogs("dev-server", {
  onLog(log) {
    console.log(log);
  },
});

// When done monitoring, close the stream:
logStream.close();
```

## Accessing the Astro App

Once everything is running, the app is available at:

```
${preview.spec?.url}?bl_preview_token=${token.value}
```

## Complete Example

Here is a full runnable example combining all the steps:

```typescript
import { SandboxInstance } from "@blaxel/core";

const sandboxName = "my-astro-sandbox";

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, X-Blaxel-Workspace, X-Blaxel-Preview-Token, X-Blaxel-Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Expose-Headers": "Content-Length, X-Request-Id",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

async function startDevServer(sandbox: SandboxInstance) {
  await sandbox.process.exec({
    name: "dev-server",
    command: "bun run dev",
    workingDir: "/app",
    waitForPorts: [4321],
    restartOnFailure: true,
    maxRestarts: 25,
  });
}

async function main() {
  try {
    // Create or reuse the sandbox
    const sandbox = await SandboxInstance.createIfNotExists({
      name: sandboxName,
      labels: {
        framework: "astro",
      },
      image: "astro-template:latest",
      memory: 4096,
      ports: [
        { name: "preview", target: 4321, protocol: "HTTP" },
      ]
    });

    // Create preview
    const preview = await sandbox.previews.createIfNotExists({
      metadata: { name: "preview" },
      spec: {
        responseHeaders,
        public: false,
        port: 4321,
      },
    });

    // Generate preview token
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const token = await preview.tokens.create(expiresAt);

    // Start dev server if not already running
    const processes = await sandbox.process.list();
    if (!processes.find((p) => p.name === "dev-server")) {
      await startDevServer(sandbox);
    }

    // Print access URL
    const webUrl = `${preview.spec?.url}?bl_preview_token=${token.value}`;
    console.log(`Astro Preview URL: ${webUrl}`);

    // Stream logs
    const logStream = sandbox.process.streamLogs("dev-server", {
      onLog(log) {
        console.log(log)
      },
    });

    // Keep running until interrupted
    process.on("SIGINT", () => {
      logStream.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
```

## Summary

This setup allows you to:

- Run Astro fully inside Blaxel sandboxes
- Securely expose the dev server using Blaxel previews
- Support HMR (Hot Module Replacement) correctly through the preview URL
- Use Bun for faster dependency installation and dev server performance
- Leverage Astro's content-focused architecture for static sites, blogs, and documentation

This approach is ideal for preview environments, internal demos, and AI-powered coding workflows built on Blaxel.
