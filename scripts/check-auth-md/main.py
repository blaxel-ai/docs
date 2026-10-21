#!/usr/bin/env python3
"""Check that auth.md is published, linked and points at live discovery documents.

Static mode (default) checks the repository: the page exists with frontmatter, is in
the navigation (so Mintlify serves it and lists it in llms.txt), is linked from the
access tokens page, and references every discovery document agents need.

Live mode (--live) fetches the published page and the discovery documents it lists.
"""
import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

PAGE = "auth.md"
PAGE_SLUG = "auth"
PUBLISHED_URL = "https://docs.blaxel.ai/auth.md"
LINKING_PAGES = ["Security/Access-tokens.mdx"]

REQUIRED_REFERENCES = [
    "https://docs.blaxel.ai/llms.txt",
    "https://api.blaxel.ai/.well-known/openid-configuration",
    "https://api.blaxel.ai/.well-known/oauth-authorization-server",
    "https://api.blaxel.ai/.well-known/oauth-protected-resource/v0/mcp",
    "https://docs.blaxel.ai/cli-reference/commands/bl_login",
    "https://docs.blaxel.ai/Security/Service-accounts",
    "https://docs.blaxel.ai/Security/Access-tokens",
]

JSON_DOCUMENTS = [url for url in REQUIRED_REFERENCES if "/.well-known/" in url]


def nav_pages(node) -> list[str]:
    pages: list[str] = []
    if isinstance(node, dict):
        for value in node.values():
            pages.extend(nav_pages(value))
    elif isinstance(node, list):
        for item in node:
            if isinstance(item, str):
                pages.append(item.lstrip("/"))
            else:
                pages.extend(nav_pages(item))
    return pages


def check_static(root: Path) -> list[str]:
    errors: list[str] = []
    page = root / PAGE
    if not page.is_file():
        return [f"{PAGE} is missing"]

    text = page.read_text(encoding="utf-8")
    frontmatter = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not frontmatter:
        errors.append(f"{PAGE} has no frontmatter")
    else:
        for field in ("title", "description"):
            if not re.search(rf"^{field}:\s*\S", frontmatter.group(1), re.M):
                errors.append(f"{PAGE} frontmatter has no {field}")

    for url in REQUIRED_REFERENCES:
        if url not in text:
            errors.append(f"{PAGE} does not reference {url}")

    if "\u2014" in text:
        errors.append(f"{PAGE} contains an em dash")

    navigation = json.loads((root / "docs.json").read_text(encoding="utf-8")).get("navigation", {})
    if PAGE_SLUG not in nav_pages(navigation):
        errors.append(f"docs.json navigation does not include {PAGE_SLUG}")

    for linking_page in LINKING_PAGES:
        content = (root / linking_page).read_text(encoding="utf-8")
        if f"]({PUBLISHED_URL})" not in content and f"](/{PAGE_SLUG})" not in content:
            errors.append(f"{linking_page} does not link to {PUBLISHED_URL}")

    return errors


def fetch(url: str) -> tuple[int, str, str]:
    request = urllib.request.Request(url, headers={"User-Agent": "blaxel-docs-auth-md-check"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status, response.headers.get("Content-Type", ""), response.read().decode("utf-8")


def check_live() -> list[str]:
    errors: list[str] = []
    try:
        status, content_type, body = fetch(PUBLISHED_URL)
        if status != 200 or "text/markdown" not in content_type:
            errors.append(f"{PUBLISHED_URL} returned {status} {content_type}")
        if "You are an agent" not in body:
            errors.append(f"{PUBLISHED_URL} does not contain the auth.md body")
    except Exception as error:  # noqa: BLE001
        errors.append(f"{PUBLISHED_URL} failed: {error}")

    for url in JSON_DOCUMENTS:
        try:
            status, _, body = fetch(url)
            json.loads(body)
            if status != 200:
                errors.append(f"{url} returned {status}")
        except Exception as error:  # noqa: BLE001
            errors.append(f"{url} failed: {error}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="docs repository root")
    parser.add_argument("--live", action="store_true", help="check the published page and discovery documents")
    args = parser.parse_args()

    errors = check_live() if args.live else check_static(Path(args.root))
    for error in errors:
        print(f"error: {error}", file=sys.stderr)
    if not errors:
        print("auth.md checks passed" + (" (live)" if args.live else ""))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
