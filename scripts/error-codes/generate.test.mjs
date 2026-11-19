// Run with: node --test scripts/error-codes/

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PAGE_PATH, apply, beginMarker, check, checkStructure, endMarker, escapeCell, generate } from './generate.mjs';

const entry = (code, extra = {}) => ({
  code,
  status: 400,
  message: 'Something about {name} went wrong',
  action: 'Fix it, then resend.',
  do_not: 'Do not resend unchanged.',
  retryable: false,
  safe_to_retry_request: false,
  dispatch_state: 'not_dispatched',
  docs_url: 'https://docs.blaxel.ai/troubleshooting/error-codes#' + code.toLowerCase().replaceAll('_', '-'),
  docs_anchor: code.toLowerCase().replaceAll('_', '-'),
  ...extra,
});

const registry = (source, ...codes) => ({ version: 1, source, codes });

const blankPage = [
  '## Error codes',
  '',
  '### Gateway',
  '',
  '| Code | HTTP | Retryable | When emitted |',
  '|---|---|---|---|',
  '| <span id="route-not-found-gateway"></span>`ROUTE_NOT_FOUND` | 404 | No | Not a Blaxel route |',
  '',
  '### Control plane',
  '',
  beginMarker('controlplane'),
  endMarker('controlplane'),
  '',
  '### Sandbox API',
  '',
  beginMarker('sandbox-api'),
  endMarker('sandbox-api'),
  '',
].join('\n');

const controlplane = registry(
  'controlplane',
  entry('FEATURE_NOT_ENABLED', { status: 403, extra_fields: ['feature'] }),
  entry('INVALID_REQUEST_BODY'),
  entry('ROUTE_NOT_FOUND', { status: 404 }),
);
const sandbox = registry('sandbox-api', entry('INVALID_REQUEST_BODY'), entry('PROCESS_NOT_FOUND', { status: 404 }));

const render = (registries) => apply(blankPage, generate(blankPage, registries));

test('a generated page passes its own check', () => {
  const page = render({ controlplane, 'sandbox-api': sandbox });
  assert.deepEqual(check(page, { controlplane, 'sandbox-api': sandbox }), []);
  assert.match(page, /<span id="feature-not-enabled"><\/span>`FEATURE_NOT_ENABLED`/);
});

test('the check fails when a registered code is missing from the page', () => {
  const page = render({ controlplane, 'sandbox-api': sandbox });
  const grown = registry('controlplane', ...controlplane.codes, entry('QUOTA_EXCEEDED', { status: 429 }));
  const problems = check(page, { controlplane: grown });
  assert.ok(problems.includes('QUOTA_EXCEEDED (controlplane) is registered but missing from the page'), problems.join('\n'));
});

test('the check fails when a documented code is no longer registered', () => {
  const page = render({ controlplane, 'sandbox-api': sandbox });
  const shrunk = registry('sandbox-api', sandbox.codes[0]);
  const problems = check(page, { 'sandbox-api': shrunk });
  assert.ok(problems.includes('PROCESS_NOT_FOUND (sandbox-api) is on the page but no longer registered'), problems.join('\n'));
});

test('the check fails when a row no longer matches its registry entry', () => {
  const page = render({ controlplane, 'sandbox-api': sandbox });
  const changed = registry('sandbox-api', sandbox.codes[0], { ...sandbox.codes[1], retryable: true });
  assert.deepEqual(check(page, { 'sandbox-api': changed }), ['PROCESS_NOT_FOUND (sandbox-api) has a stale row']);
});

test('a code two services return keeps one bare anchor, on the first generated table', () => {
  const page = render({ controlplane, 'sandbox-api': sandbox });
  assert.match(page, /<span id="invalid-request-body"><\/span>`INVALID_REQUEST_BODY` \| 400/);
  assert.match(page, /<span id="invalid-request-body-sandbox-api"><\/span>`INVALID_REQUEST_BODY`/);
  // The gateway's own row of a shared code keeps its -gateway anchor, and the
  // control plane row links to it.
  assert.match(page, /<span id="route-not-found"><\/span>`ROUTE_NOT_FOUND`.*\[gateway\]\(#route-not-found-gateway\)/);
});

test('a gateway row that takes a registered anchor is reported', () => {
  const taken = blankPage.replace('id="route-not-found-gateway"', 'id="route-not-found"');
  const page = apply(taken, generate(taken, { controlplane }));
  assert.ok(check(page, { controlplane }).some((p) => p.startsWith('ROUTE_NOT_FOUND: the gateway row takes #route-not-found')));
});

test('a limit code links to the page its docs_url names', () => {
  const limits = registry('controlplane', entry('QUOTA_EXCEEDED', { docs_url: 'https://docs.blaxel.ai/Security/Quotas' }));
  const page = render({ controlplane: limits });
  assert.match(page, /<span id="quota-exceeded"><\/span>.* See \[[^\]]+\]\(\/Security\/Quotas\)\. \|$/m);
});

test('cells keep braces, angle brackets and pipes literal', () => {
  assert.equal(escapeCell('Send {"a": 1} as <token> | not `{x} | <y>`'), 'Send \\{"a": 1\\} as &lt;token&gt; \\| not `{x} \\| <y>`');
});

test('the committed page is well formed', () => {
  const page = readFileSync(PAGE_PATH, 'utf8');
  assert.deepEqual(checkStructure(page), []);
  // controlplane FEATURE_NOT_ENABLED already sends this docs_url.
  assert.match(page, /<span id="feature-not-enabled"><\/span>/);
});
