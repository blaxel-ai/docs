// What goes into llms.txt, llms-full.txt and the per-product llms-*.txt files.
// Pages are read from the docs.json navigation, in navigation order.

export const SITE_URL = 'https://docs.blaxel.ai';

// Mintlify serves a custom llms.txt and llms-full.txt from the repository root
// on every plan, but it serves other .txt files only on Enterprise plans
// (https://www.mintlify.com/docs/create/files#supported-file-types).
// Until docs.blaxel.ai serves .txt files, the per-product files are linked
// from the public repository, which always matches the deployed main branch.
// Once it does, set this to `${SITE_URL}/` and regenerate.
export const PRODUCT_FILE_BASE_URL = 'https://raw.githubusercontent.com/blaxel-ai/docs/main/';

// Size budgets, in bytes of UTF-8 text.
//
// A product file is 200 KB at most: about 50k to 65k tokens (prose runs about
// 4 bytes per token, code about 3), so one file fits whole in a 128k-token
// context window with room left for the task. The old single llms-full.txt
// was 1.26 MB, more than 300k tokens, so agents only ever saw a slice of it.
//
// llms.txt is read at the start of many tasks, so it gets 50 KB (about 12k
// tokens), half of the 100,000-character cap Mintlify puts on its own
// generated llms.txt indexes.
export const BUDGETS = {
  'llms.txt': 50 * 1024,
  product: 200 * 1024,
};

// The recipes agents need most, listed first in llms.txt. Each entry names the
// page to read and the answer it holds, written for an agent deciding what to
// fetch. An entry marked `optional` is skipped until its page is in docs.json.
export const CORE_RECIPES = [
  {
    topic: 'Sandbox lifecycle',
    recipes: [
      {
        page: 'Sandboxes/Lifecycle-recipe',
        optional: true,
        title: 'Sandbox lifecycle recipe',
        summary:
          'The canonical answer for create-or-reuse, standby, expiration policies and their minimums (`5m` for `ttl` and `ttl-max-age`, `60s` for `ttl-idle`), keeping a sandbox awake through long commands, recreating after a delete, image updates and pools.',
      },
      {
        page: 'Sandboxes/Overview',
        title: 'Create or reuse a sandbox',
        summary:
          'Call `createIfNotExists` (`create_if_not_exists` in Python) with a stable name to get the same sandbox back on every run; sandboxes go to standby on their own when idle, so you do not need to delete and recreate them.',
      },
      {
        page: 'Sandboxes/Expiration',
        title: 'Expire sandboxes automatically',
        summary: 'Set a TTL or expiration policy at creation, or update or clear it on an existing sandbox, so unused sandboxes delete themselves.',
      },
      {
        page: 'Sandboxes/best-practices',
        title: 'Sandbox best practices',
        summary: 'Lifecycle, storage, cleanup with TTLs, idempotent creation, pre-warmed pools and retries.',
      },
      {
        page: 'Sandboxes/Processes',
        title: 'Run commands in a sandbox',
        summary: 'Execute processes, wait for them, stream output and keep a sandbox active while a process runs.',
      },
    ],
  },
  {
    topic: 'Authentication',
    recipes: [
      {
        page: 'auth',
        optional: true,
        title: 'Authenticate as an agent (auth.md)',
        summary: 'Machine-readable guide to the Blaxel authentication methods an agent can use without asking for long-lived secrets.',
      },
      {
        page: 'Security/Access-tokens',
        title: 'Access tokens and API keys',
        summary: 'Authenticate to the API and CLI with OAuth access tokens or API keys, and set `BL_WORKSPACE` and `BL_API_KEY` for the SDKs.',
      },
    ],
  },
  {
    topic: 'Previews',
    recipes: [
      {
        page: 'Sandboxes/Preview-url',
        title: 'Preview URLs',
        summary: 'Create public or private preview URLs for an app running in a sandbox; `createIfNotExists` with a constant name keeps the URL stable.',
      },
      {
        page: 'Sandboxes/Ports',
        title: 'Expose ports',
        summary: 'Declare ports at creation and reach them with `sandbox.fetch()`; ports 80, 443 and 8080 are reserved.',
      },
    ],
  },
  {
    topic: 'Storage',
    recipes: [
      {
        page: 'Volumes/Overview',
        title: 'Volumes',
        summary: 'Persistent block storage attached at sandbox creation that survives sandbox deletion.',
      },
      {
        page: 'Agent-drive/Overview',
        title: 'Agent Drive',
        summary: 'Shared filesystem that several running sandboxes can mount at the same time (private preview).',
      },
      {
        page: 'Sandboxes/Fork',
        title: 'Snapshots and forks',
        summary: 'Snapshot a sandbox, restore it to a snapshot, or fork it into new sandboxes.',
      },
    ],
  },
  {
    topic: 'Errors',
    recipes: [
      {
        page: 'troubleshooting/error-codes',
        title: 'Error codes',
        summary: 'Structured error codes returned by the Blaxel API, with the JSON body format and headers.',
      },
      {
        page: 'knowledge-base/troubleshooting/resolving-sandbox-creation-race-conditions-and-duplicate-requests',
        title: 'Sandbox already exists (409)',
        summary: 'Avoid duplicate creation requests and handle 409 conflicts with the idempotent `createIfNotExists` methods.',
      },
      {
        page: 'troubleshooting',
        title: 'Troubleshooting',
        summary: 'Fixes for 502 and 504 errors, failed deployments, quota errors, ENOSPC, 403 and 404 errors.',
      },
    ],
  },
  {
    topic: 'Limits',
    recipes: [
      {
        page: 'Security/Quotas',
        title: 'Quotas',
        summary: 'Current quotas for sandboxes, agents, jobs and other resources, and how to request more.',
      },
      {
        page: 'knowledge-base/troubleshooting/sandbox-limits-and-quota-exceeded-errors',
        title: 'Quota exceeded errors',
        summary: 'Resolve `QUOTA_EXCEEDED` errors by checking account tier, memory allocation and sandbox quota.',
      },
    ],
  },
];

// Product files, in the order llms.txt lists them. A page goes to the first
// product whose `pages` list names it (exact page, or a prefix ending in "/");
// otherwise to the product that claims the outermost of its navigation labels
// (tab first, then group). Each product becomes llms-<id>.txt.
export const PRODUCTS = [
  {
    id: 'get-started',
    title: 'Get started',
    description: 'What Blaxel is, the quickstart, and the Blaxel skills and MCP servers for coding agents.',
    groups: ['Get Started'],
    pages: [],
  },
  {
    id: 'sandboxes',
    title: 'Sandboxes',
    description: 'Create, reuse, expire, snapshot and archive sandboxes; run processes, use the file system, stream logs and schedule work.',
    groups: ['Sandboxes'],
    pages: [
      'knowledge-base/configuration-and-operation/understanding-sandbox-ttl-and-expiration-policies',
      'knowledge-base/configuration-and-operation/understanding-sandbox-active-vs-standby-states-and-billing',
      'knowledge-base/configuration-and-operation/sandbox-inactivity-with-long-running-processes',
    ],
  },
  {
    id: 'sandbox-images',
    title: 'Sandbox images and templates',
    description: 'Pre-built and custom sandbox images, environment variables and secrets, non-root users and infrastructure generations.',
    groups: [],
    pages: [
      'Sandboxes/Templates',
      'Sandboxes/Non-root-user',
      'Sandboxes/Variables-and-secrets',
      'Infrastructure/Gens',
      'knowledge-base/configuration-and-operation/use-template-names-instead-of-image-id-when-creating-sandboxes',
      'knowledge-base/configuration-and-operation/ensure-sandboxes-use-the-latest-deployed-image',
    ],
  },
  {
    id: 'networking',
    title: 'Networking and previews',
    description: 'Ports, preview URLs, dev server setup for previews, CORS, sessions, standby control, the outbound proxy, regions, egress gateways and custom domains.',
    groups: [],
    pages: [
      'Sandboxes/Ports',
      'Sandboxes/Preview-url',
      'Sandboxes/CORS',
      'Sandboxes/Sessions',
      'Sandboxes/Standby-control',
      'Sandboxes/Proxy',
      'Sandboxes/Proxy-secrets-injection',
      'Sandboxes/Proxy-domains',
      'Infrastructure/',
      'knowledge-base/integrations/',
      'knowledge-base/configuration-and-operation/using-custom-domains-with-sandboxes',
      'knowledge-base/configuration-and-operation/getting-static-ip-addresses-for-blaxel-sandboxes',
    ],
  },
  {
    id: 'storage',
    title: 'Storage',
    description: 'Volumes, volume templates and Agent Drive.',
    groups: ['Agent Drive', 'Volumes'],
    pages: ['Sandboxes/Volumes', 'knowledge-base/configuration-and-operation/volume-resizing-for-running-sandboxes'],
  },
  {
    id: 'agents-jobs',
    title: 'Agents, MCP servers and jobs',
    description: 'Deploy agents and other applications, host MCP servers, run batch jobs, and configure deployments with blaxel.toml.',
    groups: ['Batch Jobs', 'Applications', 'MCP Servers Hosting', 'Observability', 'Deployment Reference'],
    pages: ['knowledge-base/security-and-authentication/setting-up-mcp-servers-with-authentication-on-blaxel'],
  },
  {
    id: 'models',
    title: 'Models and integrations',
    description: 'The Model Gateway, model provider integrations, MCP server integrations and agent framework integrations.',
    groups: ['Model Gateway', 'Integrations'],
    pages: [],
  },
  {
    id: 'troubleshooting',
    title: 'Errors, limits and troubleshooting',
    description: 'Error codes, quotas and fixes for common errors.',
    groups: ['Troubleshooting'],
    pages: ['Security/Quotas'],
  },
  {
    id: 'api',
    title: 'API, SDK and CLI reference',
    description: 'Authentication, the REST APIs, the Management API endpoint index, and the SDK and CLI overviews.',
    groups: ['Platform APIs Reference', 'SDK Reference', 'CLI Reference'],
    // Lists every endpoint of the local OpenAPI spec in this product's file.
    endpointIndex: true,
    pages: [
      'auth',
      'Security/Access-tokens',
      'Security/Service-accounts',
      'knowledge-base/security-and-authentication/how-to-authenticate-the-bl-cli-in-ci-environments',
    ],
  },
  {
    id: 'admin',
    title: 'Administration and security',
    description: 'Workspace access control, data collection and privacy, and model governance policies.',
    groups: ['Administration & security'],
    pages: [],
  },
  {
    id: 'tutorials',
    title: 'Tutorials',
    description: 'Step-by-step guides for coding agents, agent frameworks and app frameworks on Blaxel. Each one is listed in llms.txt and fetched on its own.',
    groups: ['Tutorials and Examples'],
    pages: [],
  },
];

// Pages listed in llms.txt but left out of the product files: they are read
// by people in the Console, or each one is a long walkthrough for a single
// framework that an agent fetches on its own when it needs it.
export const INDEX_ONLY = [
  'Community',
  'Tutorials/',
  'Examples/',
  'Security/Domain-capture',
  'Security/SSO-Directory-sync',
  'Security/Baseten-managed-workspaces',
  'Security/Billing-Explorer-API',
  'knowledge-base/security-and-authentication/multi-factor-authentication-mfa-and-compliance-requirements',
  'knowledge-base/overview',
];

// Pages left out of every llms file. Each CLI command has its own page; agents
// get the same text from `bl <command> --help` and the Blaxel skills.
export const DROPPED = [
  {
    prefix: 'cli-reference/commands/',
    reason: 'one page per CLI command; run `bl <command> --help` or use the Blaxel skills',
  },
  {
    prefix: 'knowledge-base/configuration-and-operation/batch-delete-sandboxes-from-the-cli',
    reason: 'bulk deletes for people; the Blaxel skills tell agents to delete one resource at a time',
  },
];

// Delete commands the Blaxel skills tell agents never to run. No llms file may
// show one: drop the page above or reword it.
export const AGENT_FORBIDDEN = [
  { pattern: /\bbl delete\b.*\$\(/, reason: 'deletes names taken from a listing' },
  { pattern: /\bxargs\b.*\bbl delete\b/, reason: 'deletes names taken from a listing' },
  { pattern: /\bbl delete\s+[a-z-]+\s+[\w.-]+\s+[a-z0-9][\w.-]*\s*$/, reason: 'deletes several resources in one command' },
];

// Pages generated by Mintlify from the remote Sandbox API spec. They cannot be
// listed offline, so links to them are accepted without a check.
export const SANDBOX_API_PAGE = /^api-reference\/(archive|codegen|drive|fastapply|filesystem|network|process|system)(\/|$)/;
