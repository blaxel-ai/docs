# Blaxel Documentation

## Commit messages

Commit messages in this repository should follow the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/).

Commonly-used types are:

- `docs:` update existing content
- `feat:` add new content
- `fix:` fix bugs
- `chore:` maintenance
- `refactor:` improve the codebase
- `style:` update formatting and styles
- `ci:` update CI

## Local development

Use the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally. Run the following command at the root of your documentation (where `docs.json` is):


```
npx mint dev
```

## Files for AI agents

`llms.txt`, `llms-full.txt` and the `llms-*.txt` product files at the root are generated from the pages and `docs.json`. Mintlify serves the repository's `llms.txt` and `llms-full.txt` in place of the ones it generates. After you add, move or edit a page, regenerate them and commit the result:

```
npm run llms
```

CI runs `npm run llms:check`, which fails when the files are stale, over their size budget or contain a broken internal link. Products, core recipes and budgets are set in `scripts/generate-llms/config.mjs`.

## Deployment to production

Changes will be deployed to production automatically after pushing to the `main` branch.
