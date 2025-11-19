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

## Deployment to production

Changes will be deployed to production automatically after pushing to the `main` branch.
