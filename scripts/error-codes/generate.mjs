#!/usr/bin/env node
// Generates the control plane and sandbox API code tables of the error codes
// reference (troubleshooting/error-codes.mdx) from each service's error
// registry, and checks the page.
//
//   node scripts/error-codes/generate.mjs --controlplane <registry.json> --sandbox-api <registry.json>
//       rewrite the generated tables from the registries given; a table whose
//       registry is not given is left as it is
//   node scripts/error-codes/generate.mjs --check [--controlplane <path>] [--sandbox-api <path>]
//       fail if the page is malformed (a missing marker, a code row without an
//       anchor, an anchor used twice) or if a table given its registry is not
//       what that registry generates
//
// The registries are the registry.json exports the services' tests keep up to
// date:
//   controlplane  api/pkg/apierrors/registry.json (make apierrors_export in api/)
//   sandbox-api   sandbox-api/src/lib/apierrors/registry.json (blaxel-ai/sandbox)
//
// Each service's CI reads this page and fails when its table drifts from its
// registry, so regenerate the page whenever a registry changes.
//
// No dependencies: Node 20 or later.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PAGE_PATH = join(ROOT, 'troubleshooting', 'error-codes.mdx');
export const REFERENCE_URL = 'https://docs.blaxel.ai/troubleshooting/error-codes';
const DOCS_ORIGIN = 'https://docs.blaxel.ai';

// The generated tables, in page order. key is the registry's "source" and the
// name in the page's markers; suffix tells apart the anchor of a code another
// table already anchors.
export const SURFACES = [
  { key: 'controlplane', name: 'control plane', suffix: 'control-plane' },
  { key: 'sandbox-api', name: 'sandbox API', suffix: 'sandbox-api' },
];
const GATEWAY = { key: 'gateway', name: 'gateway', suffix: 'gateway' };

export const HEADER = '| Code | HTTP | Retryable | Dispatch state | Message | What to do |';
const DIVIDER = '|---|---|---|---|---|---|';

export const beginMarker = (key) =>
  '{/* BEGIN GENERATED ' + key + ': scripts/error-codes/generate.mjs writes this table from the ' + key + ' registry.json. Do not edit it by hand. */}';
export const endMarker = (key) => '{/* END GENERATED ' + key + ' */}';

// A code row: the anchor span and the code in the first cell.
const ROW = /^\|\s*<span id="([a-z0-9-]+)"><\/span>`([A-Z0-9_]+)`\s*\|/;
// Any table row whose first cell is a code, with or without an anchor.
const CODE_ROW = /^\|\s*(?:<span id="[^"]*"><\/span>)?`([A-Z][A-Z0-9_]*)`\s*\|/;

// ---------------------------------------------------------------------------
// Reading the page

function section(page, key) {
  const begin = page.indexOf(beginMarker(key));
  const end = page.indexOf(endMarker(key));
  if (begin === -1 || end === -1 || end < begin) return null;
  if (page.indexOf(beginMarker(key), begin + 1) !== -1 || page.indexOf(endMarker(key), end + 1) !== -1) return null;
  return { start: begin + beginMarker(key).length, end };
}

function rowsIn(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    const m = ROW.exec(line);
    if (m) rows.push({ id: m[1], code: m[2], line });
  }
  return rows;
}

// The rows of each table: the generated ones between their markers, the
// gateway's (written by hand) everywhere else.
export function readPage(page) {
  const tables = {};
  let rest = page;
  for (const surface of SURFACES) {
    const s = section(page, surface.key);
    tables[surface.key] = s ? rowsIn(page.slice(s.start, s.end)) : null;
    if (s) rest = rest.replace(page.slice(s.start, s.end), '');
  }
  tables[GATEWAY.key] = rowsIn(rest);
  return tables;
}

export function slug(heading) {
  return heading
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Every anchor the page defines: id attributes and headings.
export function anchorsOf(page) {
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  let fenced = false;
  for (const line of page.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    const m = !fenced && /^#{1,6}\s+(.+?)\s*$/.exec(line);
    if (m) ids.push(slug(m[1]));
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Rendering

// Markdown that must stay literal in MDX: braces start expressions, angle
// brackets start tags, and a pipe ends a table cell. Code spans keep their
// text, but a pipe still ends the cell there.
export function escapeCell(text) {
  return text
    .split(/(`[^`]*`)/)
    .map((part, i) =>
      i % 2 === 1
        ? part.replace(/\|/g, '\\|')
        : part
            .replace(/\\/g, '\\\\')
            .replace(/[{}]/g, (c) => '\\' + c)
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\|/g, '\\|'),
    )
    .join('');
}

function codeSpan(text) {
  return '`' + text.replace(/\|/g, '\\|') + '`';
}

function pageTitle(path) {
  for (const candidate of [path + '.mdx', path + '.md', join(path, 'index.mdx')]) {
    const file = join(ROOT, candidate);
    if (!existsSync(file)) continue;
    const m = /^title:\s*["']?(.+?)["']?\s*$/m.exec(readFileSync(file, 'utf8'));
    if (m) return m[1];
  }
  return null;
}

// The link for a docs_url that is not this page.
function docsLink(url) {
  if (url.startsWith(DOCS_ORIGIN + '/')) {
    const path = url.slice(DOCS_ORIGIN.length).replace(/\.mdx?$/, '');
    const [page, hash] = path.split('#');
    const title = pageTitle(page.slice(1)) ?? page.slice(1);
    return '[' + title + '](' + page + (hash ? '#' + hash : '') + ')';
  }
  return '[' + url.replace(/^https?:\/\//, '') + '](' + url + ')';
}

function message(entry) {
  const text = /^\{[a-z_]+\}$/.test(entry.message) ? "The failing operation's own error text." : codeSpan(entry.message);
  const extra = entry.extra_fields?.length ? ' The body also carries ' + entry.extra_fields.map(codeSpan).join(', ') + '.' : '';
  return text + extra;
}

function retryable(entry) {
  if (!entry.retryable) return 'No';
  return entry.retry_after ? '**Yes**, after ' + entry.retry_after + ' s (`Retry-After`)' : '**Yes**';
}

function also(others) {
  if (others.length === 0) return '';
  const links = others.map((o) => '[' + o.name + '](#' + o.id + ')');
  const list = links.length === 1 ? links[0] : links.slice(0, -1).join(', ') + ' and ' + links.at(-1);
  return ' Also returned by the ' + list + ', with its own row.';
}

function whatToDo(entry, others) {
  let text = escapeCell(entry.action);
  if (entry.do_not) text += '<br />' + escapeCell(entry.do_not);
  if (!entry.docs_url.startsWith(REFERENCE_URL + '#')) text += ' See ' + docsLink(entry.docs_url) + '.';
  return text + also(others);
}

export function renderRow(entry, id, others = []) {
  const cells = [
    '<span id="' + id + '"></span>' + codeSpan(entry.code),
    String(entry.status),
    retryable(entry),
    codeSpan(entry.dispatch_state),
    message(entry),
    whatToDo(entry, others),
  ];
  return '| ' + cells.join(' | ') + ' |';
}

// ---------------------------------------------------------------------------
// Generating

function loadRegistry(path, key) {
  const registry = JSON.parse(readFileSync(path, 'utf8'));
  if (registry.version !== 1) throw new Error(path + ': unknown registry version ' + registry.version);
  if (registry.source !== key) throw new Error(path + ': registry of "' + registry.source + '", expected "' + key + '"');
  // The control plane's "unchanged" key lists catalog rows reviewed and left as
  // they are. Those rows send no registered code, so the page skips them.
  return registry;
}

// The tables the page should hold: the registries given, and the rows on the
// page for the others. Anchors are the codes' docs_anchor; a code a table
// before it already anchors gets docs_anchor-<suffix> instead.
export function generate(page, registries) {
  const current = readPage(page);
  const taken = new Set(current.gateway.map((r) => r.id));
  const planned = {};
  for (const surface of SURFACES) {
    const registry = registries[surface.key];
    if (!registry) {
      planned[surface.key] = (current[surface.key] ?? []).map((r) => ({ code: r.code, id: r.id }));
    } else {
      planned[surface.key] = registry.codes.map((entry) => {
        const id = taken.has(entry.docs_anchor) ? entry.docs_anchor + '-' + surface.suffix : entry.docs_anchor;
        return { code: entry.code, id, entry };
      });
    }
    planned[surface.key].forEach((r) => taken.add(r.id));
  }
  const occurrences = new Map();
  const note = (surface, rows) =>
    rows.forEach((r) => occurrences.set(r.code, [...(occurrences.get(r.code) ?? []), { name: surface.name, id: r.id }]));
  note(GATEWAY, current.gateway);
  SURFACES.forEach((s) => note(s, planned[s.key]));

  const tables = {};
  for (const surface of SURFACES) {
    if (!registries[surface.key]) continue;
    const rows = planned[surface.key].map((r) =>
      renderRow(r.entry, r.id, occurrences.get(r.code).filter((o) => o.id !== r.id)),
    );
    tables[surface.key] = '\n' + [HEADER, DIVIDER, ...rows].join('\n') + '\n';
  }
  return tables;
}

export function apply(page, tables) {
  let out = page;
  for (const [key, table] of Object.entries(tables)) {
    const s = section(out, key);
    if (!s) throw new Error('the page has no single ' + beginMarker(key) + ' ... ' + endMarker(key) + ' block');
    out = out.slice(0, s.start) + table + out.slice(s.end);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Checking

// Problems with the page itself, whatever the registries hold.
export function checkStructure(page) {
  const problems = [];
  for (const surface of SURFACES) {
    if (!section(page, surface.key)) problems.push('the page needs exactly one ' + surface.key + ' block between its BEGIN and END GENERATED markers');
  }
  const seen = new Set();
  for (const id of anchorsOf(page)) {
    if (seen.has(id)) problems.push('anchor #' + id + ' is defined twice');
    seen.add(id);
  }
  const anchored = new Set(page.split('\n').filter((l) => ROW.test(l)));
  for (const line of page.split('\n')) {
    const m = CODE_ROW.exec(line);
    if (m && !anchored.has(line)) problems.push(m[1] + ': its row has no <span id="..."></span> anchor before the code');
  }
  return problems;
}

// What differs between the page and the registries given: codes missing from
// the page, codes the page lists that are no longer registered, rows that
// changed, and docs_url anchors the page does not define.
export function check(page, registries) {
  const problems = checkStructure(page);
  if (problems.length) return problems;
  const current = readPage(page);
  const expected = apply(page, generate(page, registries));
  const wanted = readPage(expected);
  const anchors = new Set(anchorsOf(expected));
  for (const surface of SURFACES) {
    const registry = registries[surface.key];
    if (!registry) continue;
    const onPage = new Map(current[surface.key].map((r) => [r.code, r]));
    const registered = new Set(registry.codes.map((e) => e.code));
    for (const code of registered) {
      if (!onPage.has(code)) problems.push(code + ' (' + surface.key + ') is registered but missing from the page');
    }
    for (const code of onPage.keys()) {
      if (!registered.has(code)) problems.push(code + ' (' + surface.key + ') is on the page but no longer registered');
    }
    const want = new Map(wanted[surface.key].map((r) => [r.code, r]));
    for (const [code, row] of onPage) {
      if (want.has(code) && want.get(code).line !== row.line) problems.push(code + ' (' + surface.key + ') has a stale row');
    }
    const gatewayIds = new Set(current.gateway.map((r) => r.id));
    for (const entry of registry.codes) {
      if (entry.docs_url.startsWith(REFERENCE_URL + '#') && !anchors.has(entry.docs_url.split('#')[1]))
        problems.push(entry.code + ' (' + surface.key + ') sends docs_url ' + entry.docs_url + ', an anchor the page does not define');
      if (gatewayIds.has(entry.docs_anchor))
        problems.push(entry.code + ': the gateway row takes #' + entry.docs_anchor + ', the anchor the ' + surface.name + ' links to; rename it #' + entry.docs_anchor + '-gateway');
    }
  }
  if (problems.length === 0 && expected !== page) problems.push('the generated tables are stale');
  return problems;
}

// ---------------------------------------------------------------------------
// Command line

function parseArgs(argv) {
  const args = { check: false, registries: {} };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') args.check = true;
    else if (SURFACES.some((s) => '--' + s.key === arg)) {
      const path = argv[++i];
      if (!path) throw new Error(arg + ' needs the path of a registry.json');
      args.registries[arg.slice(2)] = loadRegistry(resolve(path), arg.slice(2));
    } else throw new Error('unknown argument ' + arg);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const page = readFileSync(PAGE_PATH, 'utf8');
  if (args.check) {
    const problems = check(page, args.registries);
    for (const p of problems) console.error('error-codes: ' + p);
    if (problems.length) {
      console.error('error-codes: regenerate with node scripts/error-codes/generate.mjs --controlplane <registry.json> --sandbox-api <registry.json>');
      process.exitCode = 1;
    }
    return;
  }
  if (Object.keys(args.registries).length === 0) throw new Error('give at least one of --controlplane and --sandbox-api');
  const out = apply(page, generate(page, args.registries));
  const problems = checkStructure(out);
  if (problems.length) {
    for (const p of problems) console.error('error-codes: ' + p);
    process.exitCode = 1;
    return;
  }
  writeFileSync(PAGE_PATH, out);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error('error-codes: ' + err.message);
    process.exitCode = 1;
  }
}
