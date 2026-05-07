# GitHub Pages Setup

This repo includes a static landing page at `index.html` with assets in `assets/`.

## Manual enable step (GitHub UI)

1. Open repository **Settings** -> **Pages**.
2. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
3. Select branch `main` and folder `/ (root)`.
4. Save, then wait for the first Pages build.

After deployment, the site will serve:

- `index.html` - the visible three-area UI: Reports, Writeups, and Medium/Methodology/Searchable Library.
- `MANIFEST.json` - the single data source for counts and source descriptions used by the page and generated markdown indexes.
- `reports/` - reports hub plus `reports/INDEX.md` for source-by-source drill-down.
- `writeups/` - writeups hub plus `writeups/INDEX.md`, `writeups/medium-feed.md`, and methodology notes.

The "all three" areas are GitHub Pages presentation areas, not three separate root folders. Medium and methodology are intentionally grouped under `writeups/` because they are research/writeup inputs, while the browser search spans the manifest across both reports and writeups.
