#!/usr/bin/env python3
import os
import json
import argparse

EXCLUDE_FILENAMES = {"bl.md"}

PAGES_PREFIX = "cli-reference/commands"


def collect_generated_pages(generated_dir: str) -> list[str]:
    pages: list[str] = []

    for filename in sorted(os.listdir(generated_dir)):
        if not filename.endswith(".md"):
            continue
        if filename in EXCLUDE_FILENAMES:
            continue

        name, _ = os.path.splitext(filename)
        pages.append(f"{PAGES_PREFIX}/{name}")

    return pages


def rewrite_internal_links(generated_dir: str) -> int:
    import re

    pattern = re.compile(r'\[([^\]]+)\]\(([^/)\s]+)\.md\)')

    modified = 0
    for filename in sorted(os.listdir(generated_dir)):
        if not filename.endswith(".md"):
            continue

        filepath = os.path.join(generated_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            original = f.read()

        def _replace(m: re.Match) -> str:
            label, stem = m.group(1), m.group(2)
            return f"[{label}]({PAGES_PREFIX}/{stem})"

        updated = pattern.sub(_replace, original)
        if updated != original:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(updated)
            modified += 1

    return modified


def update_docs_json(docs_json_path: str, generated_pages: list[str]) -> None:
    with open(docs_json_path, "r") as f:
        data = json.load(f)

    navigation = data.get("navigation")
    if not navigation or "tabs" not in navigation:
        raise RuntimeError("docs.json does not contain navigation.tabs")

    tabs = navigation["tabs"]

    cli_tab = next(
        (t for t in tabs if isinstance(t, dict) and t.get("tab") == "CLI Reference"),
        None,
    )
    if cli_tab is None:
        raise RuntimeError("Could not find tab 'CLI Reference' in navigation.tabs")

    overview_group = next(
        (
            g
            for g in cli_tab.get("groups", [])
            if isinstance(g, dict) and g.get("group") == "Overview"
        ),
        None,
    )
    if overview_group is None:
        raise RuntimeError("Could not find group 'Overview' under 'CLI Reference' tab")

    pages_list = overview_group.get("pages", [])
    commands_group = None

    for item in pages_list:
        if isinstance(item, dict) and item.get("group") == "Commands":
            commands_group = item
            break

    if commands_group is None:
        raise RuntimeError(
            "Could not find group 'Commands' under 'CLI Reference' -> 'Overview'"
        )

    commands_group["pages"] = generated_pages

    with open(docs_json_path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Update docs.json CLI Commands submenu from a commands/ directory."
    )
    parser.add_argument(
        "generated_dir",
        help="Path to the commands/ directory containing .md files",
    )
    parser.add_argument(
        "docs_json",
        help="Path to docs.json file to update",
    )

    args = parser.parse_args()

    generated_pages = collect_generated_pages(args.generated_dir)
    modified = rewrite_internal_links(args.generated_dir)
    print(
        f"Rewrote internal links in {modified} file(s)."
    )
    update_docs_json(args.docs_json, generated_pages)
    print(
        f"Updated {args.docs_json} with {len(generated_pages)} pages under "
        f"'CLI Reference' -> 'Overview' -> 'Commands'."
    )


if __name__ == "__main__":
    main()
