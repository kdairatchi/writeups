#!/usr/bin/env python3
"""Refresh the local bug bounty writeups/reports library indexes.

By default this rebuilds navigation files from the checked-in mirror. Use
--copy to refresh the mirror from local source corpora before indexing.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REPORTS_ROOT = Path(os.environ.get("BOUNTY_REPORTS_DIR", "/home/anon/bounty-reports-data"))
DEFAULT_WRITEUPS_ROOT = Path(os.environ.get("BOUNTY_WRITEUPS_DIR", "/home/anon/bounty-writeups-data"))
TEXT_SUFFIXES = {".csv", ".md", ".txt"}


def color(text: str, code: str) -> str:
    if os.environ.get("NO_COLOR"):
        return text
    return f"\033[{code}m{text}\033[0m"


def info(message: str) -> None:
    print(color(f"[info] {message}", "36"))


def warn(message: str) -> None:
    print(color(f"[warn] {message}", "33"), file=sys.stderr)


@dataclass(frozen=True)
class Source:
    category: str
    name: str
    source: Path
    dest: Path
    description: str


def sources() -> list[Source]:
    return [
        Source("reports", "google-vrp", DEFAULT_REPORTS_ROOT / "google-vrp", ROOT / "reports/google-vrp", "Google VRP report exports"),
        Source("reports", "h1", DEFAULT_REPORTS_ROOT / "h1", ROOT / "reports/h1", "HackerOne disclosed report exports"),
        Source("reports", "immunefi-boosts", DEFAULT_REPORTS_ROOT / "immunefi-boosts", ROOT / "reports/immunefi-boosts", "Immunefi boost reports"),
        Source("reports", "immunefi-past-audits", DEFAULT_REPORTS_ROOT / "immunefi-past-audits", ROOT / "reports/immunefi-past-audits", "Immunefi past audit reports"),
        Source("writeups", "awesome", DEFAULT_WRITEUPS_ROOT / "awesome", ROOT / "writeups/awesome", "Curated bug bounty writeup list"),
        Source("writeups", "daily", DEFAULT_WRITEUPS_ROOT / "daily", ROOT / "writeups/daily", "Daily writeup notes"),
        Source("writeups", "facebook", DEFAULT_WRITEUPS_ROOT / "facebook", ROOT / "writeups/facebook", "Facebook-focused writeups"),
        Source("writeups", "methodology", DEFAULT_WRITEUPS_ROOT / "methodology", ROOT / "writeups/methodology", "Methodology notes and wordlists"),
    ]


def iter_files(path: Path) -> list[Path]:
    if not path.exists():
        return []
    return sorted(p for p in path.rglob("*") if p.is_file() and ".git" not in p.parts)


def stats_for(path: Path) -> dict[str, object]:
    files = iter_files(path)
    suffixes: dict[str, int] = {}
    total_bytes = 0
    for file_path in files:
        suffix = file_path.suffix.lower() or "[no extension]"
        suffixes[suffix] = suffixes.get(suffix, 0) + 1
        total_bytes += file_path.stat().st_size
    return {
        "bytes": total_bytes,
        "files": len(files),
        "suffixes": dict(sorted(suffixes.items())),
    }


def copy_source(source: Source) -> None:
    if not source.source.exists():
        warn(f"missing source skipped: {source.source}")
        return
    if source.dest.exists():
        shutil.rmtree(source.dest)
    source.dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(
        source.source,
        source.dest,
        ignore=shutil.ignore_patterns(".git", ".DS_Store", "__pycache__"),
    )
    info(f"copied {source.source} -> {source.dest.relative_to(ROOT)}")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def format_bytes(value: object) -> str:
    size = int(value)
    for unit in ("bytes", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            if unit == "bytes":
                return f"{size} bytes"
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size} bytes"


def file_label(value: object) -> str:
    count = int(value)
    suffix = "" if count == 1 else "s"
    return f"{count} file{suffix}"


def source_link(category: str, record: dict[str, object]) -> str:
    dest = str(record["dest"])
    prefix = f"{category}/"
    if dest.startswith(prefix):
        dest = dest[len(prefix) :]
    if not Path(dest).suffix:
        return f"{dest}/"
    return dest


def records_for(manifest: dict[str, object], category: str) -> list[dict[str, object]]:
    records = [
        record
        for record in manifest["sources"].values()
        if record["category"] == category
    ]
    if category == "writeups":
        order = {"medium-feed": 0, "methodology": 1}
        return sorted(records, key=lambda record: (order.get(str(record["name"]), 10), str(record["name"])))
    return sorted(records, key=lambda record: str(record["name"]))


def render_index(category: str, records: list[dict[str, object]], generated_at: str) -> str:
    title = "Reports Index" if category == "reports" else "Writeups Index"
    intro = (
        "Mirrored disclosed report datasets for local research and pattern mining."
        if category == "reports"
        else "Mirrored writeup lists, methodology notes, and the generated Medium feed."
    )
    lines = [
        f"# {title}",
        "",
        intro,
        "",
        f"Generated: `{generated_at}`",
        "",
        "| Source | Files | Size | Types | Notes |",
        "|---|---:|---:|---|---|",
    ]
    for record in records:
        suffixes = record["suffixes"]
        suffix_text = ", ".join(f"`{suffix}` {count}" for suffix, count in suffixes.items()) or "-"
        lines.append(
            f"| [{record['name']}]({source_link(category, record)}) | {record['files']} | {format_bytes(record['bytes'])} | {suffix_text} | {record['description']} |"
        )
    lines.extend(
        [
            "",
            "## Usage",
            "",
            "- Treat this repo as a searchable local corpus for bug patterns, not as a live target list.",
            "- Start with titles and indexes, then open the original report/writeup for proof shape and kill conditions.",
            "- Refresh with `python3 scripts/sync_library.py --copy` when the local source corpora change.",
        ]
    )
    return "\n".join(lines)


def render_category_readme(category: str, records: list[dict[str, object]], manifest: dict[str, object]) -> str:
    title = "Reports Library" if category == "reports" else "Writeups Library"
    total = manifest["totals"][category]
    index_path = "INDEX.md"
    purpose = (
        "Disclosed reports are grouped by source so you can compare proof shape, impact wording, and recurring bug classes without scanning the whole repo."
        if category == "reports"
        else "Writeups are separated from disclosed reports: Medium feed intelligence, methodology notes, and curated writeup lists each have their own entry point."
    )
    lines = [
        f"# {title}",
        "",
        purpose,
        "",
        f"- Files indexed: {total}",
        f"- Generated from: [`MANIFEST.json`](../MANIFEST.json)",
        f"- Full table: [{index_path}]({index_path})",
        "",
        "## Sources",
        "",
    ]
    for record in records:
        lines.append(
            f"- [{record['name']}]({source_link(category, record)}) - {record['description']} ({file_label(record['files'])}, {format_bytes(record['bytes'])})"
        )
    if category == "writeups":
        lines.extend(
            [
                "",
                "## What Counts As The Third Area",
                "",
                "The GitHub Pages home page presents three user-facing areas: Reports, Writeups, and Medium/Methodology/Searchable Library. Medium and methodology live under `writeups/`, while the browser search is powered by the shared manifest.",
            ]
        )
    return "\n".join(lines)


def render_readme(manifest: dict[str, object]) -> str:
    totals = manifest["totals"]
    generated_at = manifest["generated_at"]
    return f"""# Bug Bounty Writeups & Reports Library

Single repo for kdairatchi's local bug bounty writeups, disclosed reports, methodology notes, and Medium feed tracking.

## Start Here

- [Reports](reports/) - disclosed report datasets from `/home/anon/bounty-reports-data`.
- [Writeups](writeups/) - curated writeup lists and target/platform collections.
- [Medium/Methodology/Searchable Library](index.html) - the GitHub Pages view for the Medium feed, methodology notes, and manifest-backed search.
- [reports/INDEX.md](reports/INDEX.md) - source-by-source report inventory.
- [writeups/INDEX.md](writeups/INDEX.md) - source-by-source writeup inventory.
- [MANIFEST.json](MANIFEST.json) - machine-readable counts, byte totals, suffix breakdowns, and source mapping.

## Current Counts

- Report files mirrored: {totals["reports"]}
- Writeup files mirrored: {totals["writeups"]}
- Total files mirrored: {totals["all"]}
- Generated: `{generated_at}`

## Layout

```text
reports/
  google-vrp/
  h1/
  immunefi-boosts/
  immunefi-past-audits/
writeups/
  README.md
  INDEX.md
  medium-feed.md
  awesome/
  daily/
  facebook/
  methodology/
scripts/
  sync_library.py
```

## Refresh

```bash
# Rebuild indexes from the checked-in mirror.
python3 scripts/sync_library.py

# Refresh mirrored files from local corpora, then rebuild indexes.
python3 scripts/sync_library.py --copy
```

The GitHub Action writes the Medium feed to `writeups/medium-feed.md`, then regenerates this README and the category indexes from `MANIFEST.json`. It should never pipe feed output directly over the root README.

Do not delete the old source data until this repo has been reviewed, committed, pushed, and checked on GitHub.
"""


def build_manifest(copy: bool, generated_at: str | None = None) -> dict[str, object]:
    generated_at = generated_at or datetime.now(timezone.utc).isoformat()
    source_records: dict[str, dict[str, object]] = {}
    report_records: list[dict[str, object]] = []
    writeup_records: list[dict[str, object]] = []

    for source in sources():
        if copy:
            copy_source(source)
        stat = stats_for(source.dest)
        record = {
            "name": source.name,
            "category": source.category,
            "source": str(source.source),
            "dest": str(source.dest.relative_to(ROOT)),
            "description": source.description,
            **stat,
        }
        source_records[f"{source.category}/{source.name}"] = record
        if source.category == "reports":
            report_records.append(record)
        else:
            writeup_records.append(record)

    medium_feed = ROOT / "writeups/medium-feed.md"
    medium_record = {
        "name": "medium-feed",
        "category": "writeups",
        "source": "generated by main.go",
        "dest": "writeups/medium-feed.md",
        "description": "Generated Medium RSS feed preserved from the original repo",
        **stats_for(medium_feed if medium_feed.exists() else ROOT / "__missing__"),
    }
    if medium_feed.exists():
        medium_record["files"] = 1
        medium_record["bytes"] = medium_feed.stat().st_size
        medium_record["suffixes"] = {".md": 1}
    source_records["writeups/medium-feed"] = medium_record
    writeup_records.insert(0, medium_record)

    totals = {
        "reports": sum(int(record["files"]) for record in report_records),
        "writeups": sum(int(record["files"]) for record in writeup_records),
    }
    totals["all"] = totals["reports"] + totals["writeups"]

    manifest = {
        "generated_at": generated_at,
        "sources": source_records,
        "totals": totals,
    }
    return manifest


def render_outputs(manifest: dict[str, object]) -> dict[Path, str]:
    report_records = records_for(manifest, "reports")
    writeup_records = records_for(manifest, "writeups")
    generated_at = str(manifest["generated_at"])
    return {
        ROOT / "README.md": render_readme(manifest),
        ROOT / "reports/README.md": render_category_readme("reports", report_records, manifest),
        ROOT / "reports/INDEX.md": render_index("reports", report_records, generated_at),
        ROOT / "writeups/README.md": render_category_readme("writeups", writeup_records, manifest),
        ROOT / "writeups/INDEX.md": render_index("writeups", writeup_records, generated_at),
        ROOT / "MANIFEST.json": json.dumps(manifest, indent=2, sort_keys=True),
    }


def write_outputs(outputs: dict[Path, str]) -> None:
    for path, content in outputs.items():
        write_text(path, content)


def normalized_existing_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def load_existing_manifest() -> dict[str, object] | None:
    manifest_path = ROOT / "MANIFEST.json"
    if not manifest_path.exists():
        return None
    try:
        return json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def same_manifest_inventory(left: dict[str, object], right: dict[str, object]) -> bool:
    return left.get("sources") == right.get("sources") and left.get("totals") == right.get("totals")


def main() -> int:
    parser = argparse.ArgumentParser(description="Refresh the bug bounty writeups/reports mirror indexes.")
    parser.add_argument("--copy", action="store_true", help="refresh mirrored files from local source corpora before indexing")
    parser.add_argument("--check", action="store_true", help="rebuild indexes and fail if tracked files changed")
    args = parser.parse_args()

    tracked_outputs = [
        ROOT / "README.md",
        ROOT / "reports/README.md",
        ROOT / "reports/INDEX.md",
        ROOT / "writeups/README.md",
        ROOT / "writeups/INDEX.md",
        ROOT / "MANIFEST.json",
    ]
    existing_generated_at: str | None = None
    existing_manifest = load_existing_manifest()
    if args.check:
        if existing_manifest:
            existing_generated_at = existing_manifest.get("generated_at")

    manifest = build_manifest(copy=args.copy, generated_at=existing_generated_at)
    if not args.check and existing_manifest and same_manifest_inventory(existing_manifest, manifest):
        manifest["generated_at"] = existing_manifest.get("generated_at", manifest["generated_at"])
    outputs = render_outputs(manifest)
    info(f"indexed {manifest['totals']['all']} files")
    if args.check:
        changed = [
            output
            for output in tracked_outputs
            if normalized_existing_text(output) != outputs[output].rstrip() + "\n"
        ]
        if changed:
            warn("generated indexes are out of date")
            return 1
    else:
        write_outputs(outputs)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
