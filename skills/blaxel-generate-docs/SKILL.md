---
name: blaxel-generate-docs
description: Generate, write, review, or lint Blaxel documentation pages. Use when asked to write a new doc, create a tutorial, add or update a docs page, check docs against the Blaxel style guide, review MDX/Mintlify content, or prepare docs changes.
metadata:
  short-description: Generate or review Blaxel documentation with current docs repo context and style rules
  version: "0.1.2"
---

# Blaxel Docs Generation Skill

Generate or review MDX documentation pages for the Blaxel platform. Pages live in the `blaxel-ai/docs` repository and are rendered by Mintlify.

## Source of truth

The canonical style guide lives in `blaxel-ai/docs` at `STYLE_GUIDE.md`. The local copy below is vendored for offline/reference use only:

- `./references/STYLE_GUIDE.md`

Read the current `STYLE_GUIDE.md` from the docs repo resolved in step 1 of the workflow, including when that repo is the current workspace, before falling back to the vendored copy. If the two conflict, follow the docs repo.

## Workflow

1. Locate the docs repo, in this order. Stop at the first match and never clone a second copy once one is found.
   1. The current workspace, when it already is the docs repo. Treat it as the docs repo when its git root has an `origin` remote pointing at `blaxel-ai/docs`, or when its git root contains both `docs.json` and `STYLE_GUIDE.md`. Edit that checkout in place so changes land on the active branch.
   2. `$BLAXEL_GITS_ROOT/docs` when `BLAXEL_GITS_ROOT` is set, otherwise `$HOME/gits/blaxel/docs`.
   3. A fresh clone of `https://github.com/blaxel-ai/docs.git` under the Blaxel git root, only when no checkout exists and network access is available.
2. Refresh current docs state before citing or editing: run a safe `git fetch --prune origin`, identify the default branch, and inspect `git status --short --branch`. Do not overwrite unrelated local work.
3. Read the current docs style guide and relevant neighboring pages from the default branch or the active docs branch. Match the local page shape, components, naming, links, and navigation patterns.
4. Verify facts against primary sources before writing: Blaxel SDKs, CLI docs/reference, API/OpenAPI definitions, product docs, linked Linear/GitHub/Slack context, or live web sources when behavior may have changed.
5. For new pages, check and update `docs.json` navigation when the page should be published in the sidebar.
6. Write concise MDX that follows the current style guide. Keep claims verifiable and avoid invented limits, regions, pricing, or behavior.
7. Validate when practical: run Mintlify validation or preview from the docs repo (`npx mint dev` or repo-provided checks), inspect generated or changed MDX, and report skipped checks with the reason.

## FAQ guidance

Do not add FAQ sections by default. Add `## FAQ` only when the docs style guide, issue, or reviewer explicitly asks for one, or when the existing page section pattern already uses it. When adding FAQ content, place it before `## Resources` and keep each answer to 1-3 prose sentences grounded in information already on the page.
