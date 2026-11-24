// Converts a Mintlify MDX page into plain Markdown for the llms files.
//
// This is not a full MDX parser. It handles the components and syntax used in
// this repository: fenced code is copied verbatim, JSX components are turned
// into Markdown (or dropped when they only matter in a browser), and every
// internal link is made absolute so it still works when the text is read
// outside the docs site.

const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;

// Components that become a Markdown callout.
const CALLOUTS = {
  Note: 'NOTE',
  Info: 'NOTE',
  Tip: 'TIP',
  Check: 'TIP',
  Warning: 'WARNING',
  Danger: 'WARNING',
  Callout: 'NOTE',
};

// Components dropped together with their content: they only carry visuals.
const DROPPED = new Set(['img', 'iframe', 'video', 'Icon', 'Badge']);

// Package-manager variants of one install command. Inside a CodeGroup only
// the first variant is kept, since the others repeat the same command.
const PACKAGE_MANAGER_VARIANT = /^(.*?)\s*\((npm|pnpm|yarn|bun|pip|uv|poetry)\)\s*$/i;

const ATTR_VALUE = String.raw`(?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})`;
const TAG = new RegExp(
  String.raw`<(\/?)([A-Za-z][A-Za-z0-9.]*)((?:\s+[A-Za-z_:][-A-Za-z0-9_:.]*(?:\s*=\s*${ATTR_VALUE})?)*)\s*(\/?)>`,
  'g',
);

function parseAttrs(source) {
  const attrs = {};
  const re = new RegExp(String.raw`([A-Za-z_:][-A-Za-z0-9_:.]*)(?:\s*=\s*(${ATTR_VALUE}))?`, 'g');
  let m;
  while ((m = re.exec(source))) {
    let value = m[2];
    if (value === undefined) value = true;
    else if (value.startsWith('{')) value = value.slice(1, -1).trim().replace(/^["'`](.*)["'`]$/s, '$1');
    else value = value.slice(1, -1);
    attrs[m[1]] = value;
  }
  return attrs;
}

// Split a document into code blocks and text, so nothing inside a code block
// is ever touched.
function splitFences(text) {
  const lines = text.split('\n');
  const parts = [];
  let buffer = [];
  let fence = null;
  const flush = (type) => {
    if (buffer.length) parts.push({ type, text: buffer.join('\n') });
    buffer = [];
  };
  for (const line of lines) {
    if (!fence) {
      const m = line.match(FENCE);
      if (m) {
        flush('text');
        fence = { marker: m[2], indent: m[1].length };
        buffer.push(line);
        continue;
      }
      buffer.push(line);
    } else {
      buffer.push(line);
      const trimmed = line.trim();
      if (trimmed.startsWith(fence.marker[0].repeat(fence.marker.length)) && /^(`+|~+)$/.test(trimmed)) {
        flush('code');
        fence = null;
      }
    }
  }
  flush(fence ? 'code' : 'text');
  return parts;
}

// Tokenize text (outside code blocks) into strings and tags. Inline code spans
// are protected so placeholders such as `<TOKEN>` are not read as tags.
function tokenizeText(text) {
  const tokens = [];
  const protectedSpans = [];
  const shielded = text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/`[^`\n]+`/g, (span) => {
      protectedSpans.push(span);
      return `\u0000${protectedSpans.length - 1}\u0000`;
    });
  const restore = (s) => s.replace(/\u0000(\d+)\u0000/g, (_, i) => protectedSpans[Number(i)]);
  let last = 0;
  TAG.lastIndex = 0;
  let m;
  while ((m = TAG.exec(shielded))) {
    const name = m[2];
    const isComponent = /^[A-Z]/.test(name);
    const isKnownHtml = DROPPED.has(name) || name === 'br' || name === 'a' || name === 'div' || name === 'span' || name === 'p';
    if (!isComponent && !isKnownHtml) continue;
    if (m.index > last) tokens.push({ type: 'text', text: restore(shielded.slice(last, m.index)) });
    tokens.push({
      type: m[1] ? 'close' : m[4] ? 'self' : 'open',
      name,
      attrs: parseAttrs(m[3] || ''),
    });
    last = m.index + m[0].length;
  }
  if (last < shielded.length) tokens.push({ type: 'text', text: restore(shielded.slice(last)) });
  return tokens;
}

function buildTree(text) {
  const root = { name: '#root', attrs: {}, children: [] };
  const stack = [root];
  for (const part of splitFences(text)) {
    if (part.type === 'code') {
      stack[stack.length - 1].children.push({ type: 'code', text: part.text });
      continue;
    }
    for (const token of tokenizeText(part.text)) {
      const top = stack[stack.length - 1];
      if (token.type === 'text') top.children.push({ type: 'text', text: token.text });
      else if (token.type === 'self') top.children.push({ type: 'element', name: token.name, attrs: token.attrs, children: [] });
      else if (token.type === 'open') {
        const el = { type: 'element', name: token.name, attrs: token.attrs, children: [] };
        top.children.push(el);
        stack.push(el);
      } else {
        // Close the nearest matching open element; ignore stray closing tags.
        const index = stack.map((e) => e.name).lastIndexOf(token.name);
        if (index > 0) stack.length = index;
      }
    }
  }
  return root;
}

function dedent(text) {
  const lines = text.split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return min ? lines.map((l) => l.slice(Math.min(min, l.match(/^ */)[0].length))).join('\n') : text;
}

function blockquote(text) {
  return text
    .trim()
    .split('\n')
    .map((l) => (l.trim() ? `> ${l}` : '>'))
    .join('\n');
}

function inline(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function codeTitle(code) {
  const info = code.split('\n')[0].trim().replace(/^(`{3,}|~{3,})/, '').trim();
  const words = info.split(/\s+/).slice(1).filter((w) => !/[={}]/.test(w) && w !== 'expandable' && w !== 'wrap');
  return words.join(' ');
}

export function createConverter({ resolveLink, loadSnippet, onUnknown = () => {} }) {
  function renderChildren(node, ctx) {
    let out = '';
    let stepNumber = 0;
    let seenVariants = new Set();
    for (const child of node.children) {
      if (child.type === 'text') out += child.text;
      else if (child.type === 'code') {
        if (node.name === 'CodeGroup') {
          const m = codeTitle(child.text).match(PACKAGE_MANAGER_VARIANT);
          if (m) {
            const key = m[1].toLowerCase();
            if (seenVariants.has(key)) continue;
            seenVariants.add(key);
          }
        }
        out += `\n${child.text}\n`;
      } else {
        if (child.name === 'Step') stepNumber += 1;
        out += renderElement(child, { ...ctx, stepNumber });
      }
    }
    return out;
  }

  function renderElement(el, ctx) {
    const { name, attrs } = el;
    const body = () => dedent(renderChildren(el, ctx)).trim();
    if (DROPPED.has(name)) return '';
    if (ctx.snippets[name]) return `\n\n${ctx.snippets[name]}\n\n`;
    if (name === 'br') return '\n';
    if (CALLOUTS[name]) {
      const content = body();
      return content ? `\n\n${blockquote(`[!${CALLOUTS[name]}]\n\n${content}`)}\n\n` : '';
    }
    switch (name) {
      case 'Accordion':
      case 'Expandable':
      case 'Tab': {
        const title = attrs.title ? `**${inline(attrs.title)}**\n\n` : '';
        return `\n\n${title}${body()}\n\n`;
      }
      case 'Step': {
        const title = attrs.title ? `**${ctx.stepNumber}. ${inline(attrs.title)}**\n\n` : '';
        return `\n\n${title}${body()}\n\n`;
      }
      case 'Card': {
        const title = inline(attrs.title || '');
        const desc = inline(body());
        const href = typeof attrs.href === 'string' ? resolveLink(attrs.href) : null;
        const label = href ? `[${title}](${href})` : title;
        return `\n- ${label}${desc ? `: ${desc}` : ''}\n`;
      }
      case 'Update': {
        const label = inline(attrs.label || attrs.description || '');
        return `\n\n## ${label}\n\n${body()}\n\n`;
      }
      case 'a': {
        const text = inline(body());
        return typeof attrs.href === 'string' ? `[${text}](${resolveLink(attrs.href)})` : text;
      }
      case 'CodeGroup':
      case 'CardGroup':
      case 'AccordionGroup':
      case 'Tabs':
      case 'Steps':
      case 'Columns':
      case 'Frame':
      case 'div':
      case 'p':
        return `\n\n${body()}\n\n`;
      case 'span':
      case 'Tooltip':
        return renderChildren(el, ctx);
      default:
        onUnknown(name);
        return `\n\n${body()}\n\n`;
    }
  }

  function rewriteLinks(text) {
    // Rewrite Markdown links in prose and drop images; code is left alone.
    return splitFences(text)
      .map((part) => {
        if (part.type === 'code') return part.text;
        return part.text.replace(/(!?)\[((?:[^\[\]]|\[[^\]]*\])*)\]\(\s*<?([^)\s>]+)>?(\s+"[^"]*")?\s*\)/g, (all, bang, label, href, title) => {
          if (bang) return '';
          return `[${label}](${resolveLink(href)}${title || ''})`;
        });
      })
      .join('\n');
  }

  function tidy(text) {
    return splitFences(text)
      .map((part) => {
        if (part.type === 'code') return part.text;
        return part.text
          .replace(/[ \t]+$/gm, '')
          .replace(/^(#{1,6} .*?)\s*\{#[^}]+\}$/gm, '$1');
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function convert(source, { snippets = {} } = {}) {
    const imports = {};
    // Drop MDX import/export statements that sit outside code blocks.
    const body = splitFences(source)
      .map((part) => {
        if (part.type === 'code') return part.text;
        return part.text.replace(/^(import|export)\s.*$/gm, (line) => {
          const m = line.match(/^import\s+([A-Za-z0-9_]+)\s+from\s+['"]([^'"]+)['"]/);
          if (m) imports[m[1]] = m[2];
          return '';
        });
      })
      .join('\n');
    const resolvedSnippets = { ...snippets };
    for (const [name, path] of Object.entries(imports)) {
      resolvedSnippets[name] = convert(loadSnippet(path)).trim();
    }
    const tree = buildTree(body);
    const markdown = renderChildren(tree, { snippets: resolvedSnippets, stepNumber: 0 });
    return tidy(rewriteLinks(markdown));
  }

  return { convert };
}

export function parseFrontmatter(source) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: source };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w:-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1).replace(/''/g, "'");
    else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).replace(/\\"/g, '"');
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    data[kv[1]] = value;
  }
  return { data, body: source.slice(m[0].length) };
}
