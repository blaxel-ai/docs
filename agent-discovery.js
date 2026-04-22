(function () {
  function injectLinkTags() {
    var links = [
      { rel: 'service-doc', href: '/api-reference/introduction' },
      { rel: 'describedby', href: '/api-reference/controlplane.yml', type: 'application/openapi+yaml' },
      { rel: 'api-catalog', href: '/.well-known/api-catalog', type: 'application/linkset+json' },
      { rel: 'mcp-server-card', href: '/.well-known/mcp/server-card.json', type: 'application/json' },
    ];
    links.forEach(function (def) {
      var el = document.createElement('link');
      el.rel = def.rel;
      el.href = def.href;
      if (def.type) el.type = def.type;
      document.head.appendChild(el);
    });
  }

  function registerWebMCP() {
    if (!navigator.modelContext) return;
    navigator.modelContext.provideContext({
      name: 'blaxel-docs',
      description: 'Blaxel documentation: sandboxes, AI agent hosting, MCP servers, batch jobs, and model gateway.',
      tools: [
        {
          name: 'search-docs',
          description: 'Search the Blaxel documentation.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Search query' } },
            required: ['query'],
          },
          execute: function (input) {
            var searchBtn = document.querySelector('[data-search-trigger], [aria-label*="search" i]');
            if (searchBtn) searchBtn.click();
            return { result: 'Search interface opened' };
          },
        },
        {
          name: 'navigate-to-section',
          description: 'Navigate to a documentation section by path (e.g. /Sandboxes/Overview).',
          inputSchema: {
            type: 'object',
            properties: { path: { type: 'string', description: 'Doc path, e.g. /Sandboxes/Overview' } },
            required: ['path'],
          },
          execute: function (input) {
            window.location.pathname = input.path;
            return { result: 'Navigating to ' + input.path };
          },
        },
      ],
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { injectLinkTags(); registerWebMCP(); });
  } else {
    injectLinkTags();
    registerWebMCP();
  }
})();
