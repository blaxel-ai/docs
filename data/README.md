# Limits, quotas, regions and pricing data

`limits.json` is the single source for the numbers these docs publish about tier quotas, request and rate limits, sandbox settings, CPU allocation, regions and prices. Pages don't hard-code these numbers: they include tables generated from this file.

## Update a value

1. Edit `limits.json`.
2. Set `source` and `verified` on every entry you add or change, and update `reviewed` to today's date.
3. Run `npm run limits:generate` (Node 20 or later, no install needed).
4. Commit the data file together with the regenerated files in `snippets/limits/` and `pricing.mdx`.

Never edit `snippets/limits/*.mdx` or `pricing.mdx` by hand: the next run overwrites them.

## Fields

- `source`: where the value comes from. Use a public docs path (`/Sandboxes/Filesystem`), a public blaxel.ai page (`https://blaxel.ai/pricing`), or `platform config` for a value read from the platform's configuration. Several sources are separated with `;`. Don't cite private repositories, tickets or chats: the check rejects them.
- `verified`: `true` when the value was confirmed against the platform's configuration or behavior, `false` when it is only taken from existing docs and still needs confirmation by the owning team.
- `tiers.quotas[].values`: one value per tier, from tier 0 up. `null` means the feature is not available on that tier, and is shown with `null_label`.
- `limits[].group`: `requests`, `rate` or `sandbox`, which decides the table the limit appears in. `display` overrides the formatted value.
- `unit`: `count`, `bytes`, `MB` (shown in GB and TB of 1,024), `seconds`, `minutes`, `days` or `usd`.
- `snippets` and `scan`: which limits go in the upload table, and which limits the consistency scan checks pages against.

## Use a table in a page

Import the snippet after the frontmatter, then place it where the table belongs:

```mdx
import UploadLimits from '/snippets/limits/upload-limits.mdx';

<UploadLimits />
```

`pricing.mdx` is generated in full, with every table inline as plain Markdown, so agents can read all values from one page or its `.md` export.

## Checks

`npm run limits:check` fails when:

- the data file is invalid or cites a private source;
- a generated file is out of date or no longer generated;
- a docs page states a number that disagrees with the data file. The scan covers upload limits next to a `413`, multipart part sizes, volume size limits, TTL minimums (each against its own policy), the sandbox creation concurrency limit and the CPU allocated to a memory size.

The `Limits, quotas and pricing` workflow runs the check on every pull request that touches a page, the data file, the script or the snippets. To fix a scan finding, correct the page, or update the data file if the page is right.
