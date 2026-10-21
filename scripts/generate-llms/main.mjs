#!/usr/bin/env node
// Builds llms.txt, llms-full.txt and the per-product llms-*.txt files from the
// MDX sources and the docs.json navigation.
//
//   node scripts/generate-llms/main.mjs           write the files
//   node scripts/generate-llms/main.mjs --check   fail if a file is stale, over
//                                                 budget, has a broken link or
//                                                 shows a forbidden delete
//
// Settings (products, core recipes, budgets) live in config.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as config from './config.mjs';
import { createConverter, parseFrontmatter } from './mdx.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECK = process.argv.includes('--check');
const VERBOSE = process.argv.includes('--verbose');
const SITE = config.SITE_URL;
const OUTPUT_PATTERN = /^llms(-[a-z0-9-]+)?\.txt$/;

const kb = (bytes) => `${(bytes / 1024).toFixed(1).replace(/\.0$/, '')} KB`;
const size = (text) => Buffer.byteLength(text, 'utf8');
const matches = (page, list) => list.some((p) => (p.endsWith('/') ? page.startsWith(p) : page === p));
// The docs style guide rules out em dashes; older pages still have a few.
const noEmDash = (text) => text.replace(/[ \t]*\u2014[ \t]*/g, ' - ');

// Every file in the repository, with its real case, so link checks behave the
// same on case-insensitive file systems as on the deployed site.
function listRepoFiles(dir = ROOT, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.github'].includes(entry.name)) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    const isDir = entry.isDirectory() || (entry.isSymbolicLink() && fs.statSync(full).isDirectory());
    if (isDir) out.push(...listRepoFiles(full, rel));
    else out.push(rel);
  }
  return out;
}

// Flatten the docs.json navigation into pages, keeping the tab and group
// labels each page sits under, plus any OpenAPI specs.
function readNavigation(docs) {
  const entries = [];
  const specs = [];
  const walk = (node, trail) => {
    if (typeof node === 'string') {
      entries.push({ page: node.replace(/^\//, ''), trail });
      return;
    }
    if (!node || typeof node !== 'object') return;
    const label = node.tab || node.group || node.anchor || node.dropdown;
    const next = label ? [...trail, label] : trail;
    if (node.openapi) specs.push({ source: typeof node.openapi === 'string' ? node.openapi : node.openapi.source, trail: next });
    for (const key of ['tabs', 'anchors', 'dropdowns', 'groups', 'pages']) {
      for (const child of node[key] || []) walk(child, next);
    }
  };
  walk(docs.navigation, []);
  const seen = new Set();
  return { entries: entries.filter((e) => !seen.has(e.page) && seen.add(e.page)), specs };
}

// Minimal reader for the generated OpenAPI YAML: method, path, summary and
// tags of each operation. The file is machine-written with a fixed layout.
function readOpenApiOperations(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const ops = [];
  let inPaths = false;
  let currentPath = null;
  let op = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) {
      inPaths = line === 'paths:';
      continue;
    }
    if (!inPaths) continue;
    let m;
    if ((m = line.match(/^ {2}(\/\S*):$/))) currentPath = m[1].replace(/^'|'$/g, '');
    else if ((m = line.match(/^ {4}(get|post|put|patch|delete|head|options):$/))) {
      op = { method: m[1].toUpperCase(), path: currentPath, tags: [], summary: '' };
      ops.push(op);
    } else if (op && (m = line.match(/^ {6}summary: (.*)$/))) {
      let summary = m[1];
      while (/^ {8}\S/.test(lines[i + 1] || '')) summary += ` ${lines[++i].trim()}`;
      op.summary = summary.replace(/^(['"])(.*)\1$/, '$2');
    } else if (op && /^ {6}tags:$/.test(line)) {
      while (/^ {6}- /.test(lines[i + 1] || '')) op.tags.push(lines[++i].replace(/^ {6}- /, '').trim());
    }
  }
  // Mintlify builds endpoint page slugs as <tag>/<summary>.
  for (const o of ops) {
    const tag = (o.tags[0] || '').toLowerCase().trim().replace(/\s+/g, '-');
    const summary = o.summary.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
    o.tag = tag;
    o.page = `api-reference/${tag}/${summary}`;
  }
  return ops;
}

function build() {
  const docs = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs.json'), 'utf8'));
  const repoFiles = new Set(listRepoFiles());
  const { entries, specs } = readNavigation(docs);
  const errors = [];
  const warnings = new Set();

  const pageFile = (page) => [`${page}.mdx`, `${page}.md`].find((f) => repoFiles.has(f));

  // Redirects in docs.json, so links to old paths point at the current page.
  const redirects = (docs.redirects || []).map((r) => {
    const source = r.source.replace(/^\//, '');
    const pattern = new RegExp(`^${source.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:slug\*/g, '(.*)')}$`);
    return { pattern, destination: r.destination.replace(/^\//, '') };
  });
  const redirect = (p) => {
    for (const r of redirects) {
      const m = p.match(r.pattern);
      if (m) return r.destination.replace(/:slug\*/g, m[1] || '');
    }
    return p;
  };

  const sitePath = (url) => {
    if (!url.startsWith(`${SITE}/`) && url !== SITE) return null;
    return decodeURI(url.slice(SITE.length).replace(/[?#].*$/, '')).replace(/^\/+|\/+$/g, '');
  };

  const resolveLink = (pagePath) => (href) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      const p = sitePath(href);
      if (p === null) return href;
      return `${SITE}/${redirect(p)}${href.match(/#.*$/)?.[0] || ''}`;
    }
    const url = new URL(href, `${SITE}/${pagePath}`);
    const p = decodeURI(url.pathname).replace(/^\/+|\/+$/g, '').replace(/\.mdx?$/, '');
    return `${SITE}/${redirect(p)}${url.hash}`;
  };

  // Pages from the navigation, with their product.
  const pages = [];
  const dropped = [];
  for (const { page, trail } of entries) {
    const drop = config.DROPPED.find((d) => page.startsWith(d.prefix));
    if (drop) {
      dropped.push({ page, reason: drop.reason });
      continue;
    }
    const file = pageFile(page);
    if (!file) {
      errors.push(`docs.json lists ${page}, but neither ${page}.mdx nor ${page}.md exists`);
      continue;
    }
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const { data, body } = parseFrontmatter(source);
    if (data.noindex === true || data.hidden === true) continue;
    const product =
      config.PRODUCTS.find((p) => matches(page, p.pages)) ||
      // The outermost navigation label that a product claims wins, so a
      // "Sandboxes" group under the Tutorials tab stays with the tutorials.
      trail.map((label) => config.PRODUCTS.find((p) => p.groups.includes(label))).find(Boolean);
    if (!product) {
      errors.push(`${page} (navigation: ${trail.join(' > ')}) belongs to no product; add its group or page to PRODUCTS in config.mjs`);
      continue;
    }
    if (!data.description) warnings.add(`${page} has no description in its frontmatter`);
    pages.push({
      page,
      trail,
      body,
      product: product.id,
      indexOnly: matches(page, config.INDEX_ONLY),
      title: noEmDash(String(data.title || data.sidebarTitle || page)),
      description: noEmDash(String(data.description || '')),
    });
  }

  // Management API endpoints from local OpenAPI specs; remote specs are linked.
  const operations = [];
  const remoteSpecs = [];
  for (const spec of specs) {
    if (/^https?:/.test(spec.source)) remoteSpecs.push(spec);
    else operations.push(...readOpenApiOperations(path.join(ROOT, spec.source.replace(/^\//, ''))));
  }
  if (specs.some((s) => !/^https?:/.test(s.source)) && !operations.length) errors.push('Found no operations in the OpenAPI spec; the YAML layout may have changed');
  const operationPages = new Set(operations.flatMap((o) => [o.page, `api-reference/${o.tag}`]));

  // Convert pages.
  const loadSnippet = (p) => parseFrontmatter(fs.readFileSync(path.join(ROOT, p.replace(/^\//, '')), 'utf8')).body;
  for (const p of pages) {
    if (p.indexOnly) continue;
    const { convert } = createConverter({
      resolveLink: resolveLink(p.page),
      loadSnippet,
      onUnknown: (name) => warnings.add(`${p.page}: unknown component <${name}> rendered as plain content`),
    });
    p.markdown = noEmDash(convert(p.body));
  }

  const fileUrl = (name) => (name === 'llms.txt' || name === 'llms-full.txt' ? `${SITE}/${name}` : `${config.PRODUCT_FILE_BASE_URL}${name}`);
  const pageUrl = (page) => `${SITE}/${page}`;
  const pageBlock = (p) => [`# ${p.title}`, `Source: ${pageUrl(p.page)}`, '', p.description, '', p.markdown].join('\n').replace(/\n{3,}/g, '\n\n').trim();

  const apiIndex = () => {
    if (!operations.length) return '';
    const byTag = new Map();
    for (const o of operations) byTag.set(o.tag, [...(byTag.get(o.tag) || []), o]);
    const lines = [
      '# Management API endpoints',
      `Source: ${pageUrl('api-reference/introduction')}`,
      '',
      `All ${operations.length} endpoints of the Blaxel Management API at https://api.blaxel.ai/v0, by tag. Each endpoint page has the parameters, request body and responses. The full OpenAPI spec is at https://api.blaxel.ai/v0/openapi/controlplane.yml.`,
    ];
    for (const [tag, ops] of [...byTag.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      lines.push('', `## ${tag}`, '');
      for (const o of ops) lines.push(`- [${o.method} ${o.path}](${pageUrl(o.page)}.md): ${noEmDash(o.summary)}`);
    }
    for (const spec of remoteSpecs) {
      lines.push('', `## ${spec.trail[spec.trail.length - 1]}`, '', `Endpoints served by the API inside each sandbox (processes, filesystem, network, drives). The SDK pages on processes, the file system, log streaming and ports cover the same operations with examples. OpenAPI spec: ${spec.source}`);
    }
    return lines.join('\n');
  };

  // Product files.
  const outputs = new Map();
  const productStats = [];
  const fullText = [];
  for (const product of config.PRODUCTS) {
    const included = pages.filter((p) => p.product === product.id && !p.indexOnly);
    const withEndpoints = product.endpointIndex && operations.length > 0;
    const blocks = included.map(pageBlock);
    if (withEndpoints) blocks.push(apiIndex());
    if (!blocks.length) continue;
    const name = `llms-${product.id}.txt`;
    const toc = included.map((p) => `- [${p.title}](${pageUrl(p.page)})`);
    if (withEndpoints) toc.push(`- [Management API endpoints](${pageUrl('api-reference/introduction')}): ${operations.length} endpoints`);
    const text = [
      `# Blaxel docs: ${product.title}`,
      '',
      `> ${product.description}`,
      '',
      `This file has the full text of ${included.length} pages from ${SITE}${withEndpoints ? ', plus an index of the Management API endpoints' : ''}. The other product files are listed in ${fileUrl('llms-full.txt')}, and ${fileUrl('llms.txt')} lists every page with a one-line description.`,
      '',
      'Pages in this file:',
      '',
      ...toc,
      '',
      ...blocks.flatMap((b) => [b, '']),
    ].join('\n');
    outputs.set(name, `${text.trim()}\n`);
    productStats.push({ product, name, pages: included.length, bytes: size(outputs.get(name)) });
    fullText.push(...blocks);
  }

  // llms-full.txt: everything in one file if it fits the budget, else an index.
  const fullSingle = [`# Blaxel documentation`, '', `> ${noEmDash(docs.description)}`, '', ...fullText.flatMap((b) => [b, ''])].join('\n');
  const fullBytes = size(fullSingle);
  const split = fullBytes > config.BUDGETS.product;
  let full;
  if (!split) {
    full = fullSingle;
    for (const s of productStats) outputs.delete(s.name);
  } else {
    full = [
      '# Blaxel documentation, full text',
      '',
      `> ${noEmDash(docs.description)}`,
      '',
      `The full text of the Blaxel docs is ${kb(fullBytes)}, more than fits in most context windows, so it is split by product into files of at most ${kb(config.BUDGETS.product)}. Fetch the file for your task, not all of them.`,
      '',
      `- ${fileUrl('llms.txt')} lists every page with a one-line description and starts with the most-used recipes.`,
      `- Each page is also available on its own as Markdown: add .md to its URL, for example ${SITE}/Sandboxes/Overview.md.`,
      '',
      '## Product files',
      '',
      ...productStats.map((s) => `- [${s.product.title}](${fileUrl(s.name)}): ${s.product.description} ${s.pages} pages, ${kb(s.bytes)}.`),
      '',
      '## Not in these files',
      '',
      '- CLI commands: run `bl <command> --help`, or install the Blaxel skills described in ' + `${pageUrl('skills-mcp')}. The CLI overview is in the API, SDK and CLI reference file.`,
      `- Tutorials, the community page and Console-only administration pages: they are listed in ${fileUrl('llms.txt')}; fetch each page as Markdown.`,
      `- Release notes: ${pageUrl('changelog')}.`,
    ].join('\n');
  }
  outputs.set('llms-full.txt', `${full.trim()}\n`);
  const productFileUrl = (stat) => fileUrl(split ? stat.name : 'llms-full.txt');

  // llms.txt
  const pageLine = (p) => `- [${p.title}](${pageUrl(p.page)}.md)${p.description ? `: ${p.description}` : ''}`;
  const lines = [
    '# Blaxel',
    '',
    `> ${noEmDash(docs.description)}`,
    '',
    'How to use this index:',
    '',
    '- Each link opens the Markdown version of a page. Fetch only the pages you need.',
    split
      ? `- For the full text of a product, use the files listed in ${fileUrl('llms-full.txt')} (at most ${kb(config.BUDGETS.product)} each).`
      : `- For the full text of every page, use ${fileUrl('llms-full.txt')}.`,
    '- To search these docs from a coding agent, connect to the docs MCP server at `' + `${SITE}/mcp` + '`.',
    `- CLI commands do not have one entry each: run \`bl <command> --help\`, or install the Blaxel skills (${pageUrl('skills-mcp')}.md).`,
    '',
    '## Core recipes',
    '',
    'Start here. These pages answer the most common sandbox tasks.',
  ];
  for (const group of config.CORE_RECIPES) {
    lines.push('', `### ${group.topic}`, '');
    for (const r of group.recipes) {
      if (!pages.some((p) => p.page === r.page)) {
        if (!r.optional) errors.push(`config.mjs: core recipe "${r.title}" points to ${r.page}, which is not a page in the navigation`);
        continue;
      }
      lines.push(`- [${r.title}](${pageUrl(r.page)}.md): ${r.summary}`);
    }
  }
  for (const product of config.PRODUCTS) {
    const listed = pages.filter((p) => p.product === product.id);
    if (!listed.length) continue;
    const stat = productStats.find((s) => s.product.id === product.id);
    lines.push('', `## ${product.title}`, '', product.description);
    if (stat && split) lines.push(`Full text: ${fileUrl(stat.name)} (${kb(stat.bytes)})`);
    lines.push('', ...listed.map(pageLine));
    if (product.endpointIndex && operations.length) {
      lines.push(`- [Management API endpoints](${productFileUrl(stat)}): ${operations.length} endpoints with method, path and summary, each linked to its reference page.`);
      for (const spec of remoteSpecs) lines.push(`- [${spec.trail[spec.trail.length - 1]} OpenAPI spec](${spec.source}): API served inside each sandbox for processes, files and networking.`);
    }
  }
  // Navbar links not covered above, such as the changelog.
  lines.push('', '## Optional', '');
  for (const link of docs.navbar?.links || []) {
    if (/^https?:/.test(link.href)) {
      lines.push(`- [${link.label}](${link.href})`);
      continue;
    }
    const page = link.href.replace(/^\//, '');
    const file = pageFile(page);
    if (!file || pages.some((p) => p.page === page)) continue;
    const { data } = parseFrontmatter(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    lines.push(`- [${link.label}](${pageUrl(page)}.md)${data.description ? `: ${noEmDash(String(data.description))}` : ''}`);
  }
  outputs.set('llms.txt', `${lines.join('\n').trim()}\n`);

  // Budgets.
  for (const [name, text] of outputs) {
    const budget = config.BUDGETS[name] ?? config.BUDGETS.product;
    if (size(text) > budget) {
      const largest = pages
        .filter((p) => p.markdown && name === `llms-${p.product}.txt`)
        .sort((a, b) => size(b.markdown) - size(a.markdown))
        .slice(0, 3)
        .map((p) => `${p.page} (${kb(size(p.markdown))})`);
      errors.push(`${name} is ${kb(size(text))}, over its ${kb(budget)} budget${largest.length ? `; largest pages: ${largest.join(', ')}` : ''}. Split the product in config.mjs or move pages to INDEX_ONLY`);
    }
  }

  // Delete commands agents must not run, code blocks included.
  for (const [name, text] of outputs) {
    text.split('\n').forEach((line, i) => {
      for (const rule of config.AGENT_FORBIDDEN) {
        if (rule.pattern.test(line)) errors.push(`${name}:${i + 1}: \`${line.trim()}\` ${rule.reason}; the Blaxel skills tell agents never to run it. Reword the page or add it to DROPPED in config.mjs`);
      }
    });
  }

  // Links. Code blocks are skipped: their URLs are examples.
  const validPath = (p) =>
    p === '' ||
    outputs.has(p) && (p === 'llms.txt' || p === 'llms-full.txt') ||
    !!pageFile(p.replace(/\.md$/, '')) ||
    repoFiles.has(p) ||
    operationPages.has(p.replace(/\.md$/, '')) ||
    config.SANDBOX_API_PAGE.test(p);
  for (const [name, text] of outputs) {
    let inCode = false;
    const broken = new Set();
    for (const line of text.split('\n')) {
      if (/^\s*(`{3,}|~{3,})/.test(line)) inCode = !inCode;
      if (inCode) continue;
      for (const m of line.replace(/`[^`]*`/g, '').matchAll(/https?:\/\/[^\s)<>\]"'`]+/g)) {
        const url = m[0].replace(/[.,;:]+$/, '');
        if (url.startsWith(config.PRODUCT_FILE_BASE_URL)) {
          if (!outputs.has(url.slice(config.PRODUCT_FILE_BASE_URL.length))) broken.add(url);
          continue;
        }
        const p = sitePath(url);
        if (p !== null && !validPath(p)) broken.add(url);
      }
    }
    for (const url of broken) errors.push(`${name}: broken link ${url}`);
  }

  return { outputs, pages, dropped, productStats, fullBytes, operations, errors, warnings };
}

function main() {
  const { outputs, pages, dropped, productStats, fullBytes, operations, errors, warnings } = build();
  const existing = fs.readdirSync(ROOT).filter((f) => OUTPUT_PATTERN.test(f));

  if (CHECK) {
    for (const [name, text] of outputs) {
      const file = path.join(ROOT, name);
      if (!fs.existsSync(file)) errors.push(`${name} is missing`);
      else if (fs.readFileSync(file, 'utf8') !== text) errors.push(`${name} is out of date`);
    }
    for (const name of existing) if (!outputs.has(name)) errors.push(`${name} is no longer generated; delete it`);
  } else if (!errors.length) {
    for (const [name, text] of outputs) fs.writeFileSync(path.join(ROOT, name), text);
    for (const name of existing) if (!outputs.has(name)) fs.unlinkSync(path.join(ROOT, name));
  }

  const indexOnly = pages.filter((p) => p.indexOnly);
  console.log(`${pages.length} pages from docs.json; ${indexOnly.length} listed in llms.txt only; ${dropped.length} dropped; ${operations.length} API endpoints indexed`);
  console.log(`Full text: ${kb(fullBytes)}`);
  for (const [name, text] of outputs) {
    const budget = config.BUDGETS[name] ?? config.BUDGETS.product;
    const stat = productStats.find((s) => s.name === name);
    console.log(`  ${name.padEnd(28)} ${kb(size(text)).padStart(10)} of ${kb(budget)}${stat ? `, ${stat.pages} pages` : ''}`);
  }
  if (VERBOSE) {
    for (const product of config.PRODUCTS) {
      console.log(`\n${product.title}:`);
      for (const p of pages.filter((x) => x.product === product.id)) {
        console.log(`  ${(p.markdown ? kb(size(p.markdown)) : 'index only').padStart(10)}  ${p.page}`);
      }
    }
    console.log('\nDropped:');
    for (const reason of new Set(dropped.map((d) => d.reason))) {
      const list = dropped.filter((d) => d.reason === reason);
      console.log(`  ${list.length} pages (${reason}): ${list.map((d) => d.page).join(', ')}`);
    }
  }
  for (const w of warnings) console.log(`warning: ${w}`);

  if (errors.length) {
    console.error(`\n${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    if (CHECK) console.error('\nRun `npm run llms` (or `node scripts/generate-llms/main.mjs`) and commit the result.');
    process.exit(1);
  }
  console.log(CHECK ? '\nllms files are up to date.' : '\nWrote the llms files.');
}

main();
