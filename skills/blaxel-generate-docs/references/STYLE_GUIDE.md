# Style Guide

## Frontmatter

- Include `title` and `description` in every file.
- Add `sidebarTitle` only when the sidebar label needs to differ from `title`.
- Write `description` as a single sentence; make it SEO-friendly and specific.
- Use single quotes for `title` and `description` values.
- Do not include a H1 heading in the page body. The title comes from frontmatter only.

```yaml
---
title: 'Deploy Claude Agent SDK agents on Blaxel'
sidebarTitle: 'Claude Agent SDK'
description: 'Deploy a Claude Agent SDK agent to Blaxel Agents Hosting as a serverless auto-scalable API.'
---
```

---

## Voice and tone

- Write in second person ("you", "your").
- Use present tense.
- Be direct: prefer "Run the following command" over "You can run the following command".
- Keep sentences short. Split compound sentences.
- Use plain English. Avoid filler phrases like "simply", "just", "easy", "straightforward".
- Do not use em dashes (—) in body text.
- Use straight quotes everywhere, not smart quotes.

---

## Page structure

- Open every page with a 1–2 sentence intro paragraph, no heading before it.
- Follow the intro with `## Prerequisites` if the page has dependencies (only for tutorials).
- End every page with a section that links to next steps (see [Page endings](#page-endings)).
- Do not add a H1 anywhere in the page body.
- Avoid using bold, italics, underlines or other special formatting.

---

## Headings

- Use H2 (`##`) for major sections and H3 (`###`) for subsections. Do not go deeper than H3 in body text (H4+ only inside component titles if required).
- Do not use H1 in the page body.
- Write headings as short noun phrases or imperative verbs, not full sentences.
- Do not end headings with punctuation.

**In docs**, use named H2 sections that describe the topic:

```
## Create a sandbox
## Retrieve an existing sandbox
## Delete a sandbox
```

**In tutorials**, number H2 steps sequentially:

```
## Prerequisites
## 1. Install the Blaxel CLI and log in to Blaxel
## 2. Install required dependencies
## 3. Configure the environment
## 4. Build the agent
## Complete example
## Resources
```

---

## Lists

- Use unordered lists for features, options, and non-sequential items.
- Use ordered lists only for sub-steps inside a numbered tutorial step.
- Keep list items parallel in structure (all noun phrases, or all imperative verbs).
- Limit lists to 3–7 items. Split longer lists into subsections.
- Do not nest lists more than one level deep.
- End list items with a semicolon only when items form a grammatical series; otherwise use no punctuation.

---

## Callouts

Use Mintlify callout components. Do not use Markdown blockquotes for callouts.

- `<Note>` — supplementary context the reader should know but that does not block progress.
- `<Warning>` — a constraint, destructive action, or gotcha that can cause problems if missed.
- `<Tip>` — a best practice, shortcut, or helpful hint.
- `<Info>` — external references, pricing implications, or beta notices.

Keep callout text to 1–3 sentences. Do not nest callouts.

---

## Code blocks

- Use a fenced code block with a language identifier for every code sample.
- Use `<CodeGroup>` whenever showing the same example in multiple languages or with multiple package managers.
- Label each block in a CodeGroup with language: `TypeScript`, `Python`.
- If there are multiple package managers for the same language and the instructions differ, label each block in the CodeGroup with language and manager: `TypeScript (npm)`, `TypeScript (pnpm)`, `Python (pip)`.
- Show TypeScript and Python variants at minimum for all SDK examples.
- For TypeScript, show one block per package manager (npm, pnpm, yarn, bun) inside a single CodeGroup.
- Keep code examples minimal. Show only what is needed for the step being explained.
- Use inline code (backticks) for: command names, environment variables, file names, parameter names, and status values.
- Write environment variable names in `ALL_CAPS`.
- Do not add explanatory comments to code unless the line is non-obvious.

---

## Links

- Use descriptive link text that reflects the destination. Never use "click here" or "this link".
- Use relative paths for internal links: `../cli-reference/introduction`, `/Sandboxes/Overview`.
- Use absolute URLs for external links.
- Wrap the link target's name in the link text when referencing another doc: `[Blaxel CLI](../cli-reference/introduction)`.

---

## Images

- Provide both light and dark mode variants for every image.
- Always include a descriptive `alt` attribute.
- Use `.webp` format. Fall back to `.png` only if `.webp` is unavailable.
- Place images in `/img/` organized by topic.

```mdx
<img className="block dark:hidden" src="/img/topic/image-light.webp" alt="Description" />
<img className="hidden dark:block" src="/img/topic/image-dark.webp" alt="Description" />
```

---

## Components

**`<Steps>` / numbered H2 steps**
- Use `<Steps>` for guided quickstarts with a short fixed sequence.
- Use numbered H2 headings (`## 1. ...`) for longer tutorials where each step contains substantial content.
- Do not mix both patterns in the same file.

**`<Accordion>` / `<AccordionGroup>`**
- Use for optional deep-dives, alternative installation methods, and reference tables that would interrupt the main flow.
- Group related accordions inside `<AccordionGroup>`.

**`<Card>` / `<CardGroup>`**
- Use `<Card>` components for navigation links, not Markdown links, only when linking to related pages at the end of a section.
- Default to `<CardGroup cols={2}>`. Use `cols={3}` only when there are six or more cards and the content is short.
- Write card descriptions as a single sentence.

**`<Tabs>` / `<Tab>`**
- Use for content that varies by interface (CLI vs Console vs API) when the user will only follow one path.
- Do not use tabs for language variants — use `<CodeGroup>` instead.

---

## Page endings

- End every page with outbound links to related content.
- Use `## Resources` + individual `<Card>` components in tutorials.
- Use a `<CardGroup>` (no section heading, or a brief sentence before it) in reference docs.
- Do not end a page with a code block or a callout.

---

## Docs-specific rules

These rules apply to all pages that are **not** in the `Tutorials/` directory.

- Use named H2 sections that reflect the topic (not numbered steps).
- Keep code examples focused on a single operation per block.
- Do **not** include a `## Complete example` section. If a full example is needed, link to the relevant tutorial or the Blaxel GitHub repository.
- Do not walk the reader through a sequential workflow. Use a tutorial for that.
- Link to tutorials at the bottom when a deeper walkthrough exists.

---

## Tutorials-specific rules

These rules apply to all pages in the `Tutorials/` directory.

- Number every H2 step sequentially starting from 1, after `## Prerequisites`.
- Include `## Prerequisites` as the first section after the intro, listing all accounts, tools, and API keys required.
- Write each numbered step as an imperative phrase: `## 3. Configure the environment`.
- It is not mandatory to include a `## Complete example` section before `## Resources`. Only include it if a complete example would be useful and all previous steps can be combined into such an example. This section must contain a single, complete, runnable code example that combines all steps. Wrap multi-language examples in `<CodeGroup>`.
- End with `## Resources` containing `<Card>` links to related tutorials and reference docs.
- Do not split a tutorial into multiple files. Cover the full workflow in one page.
