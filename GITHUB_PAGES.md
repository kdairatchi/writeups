# GitHub Pages Setup

This repo includes a static landing page at `index.html` with assets in `assets/`.

## Manual enable step (GitHub UI)

1. Open repository **Settings** -> **Pages**.
2. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
3. Select branch `main` and folder `/ (root)`.
4. Save, then wait for the first Pages build.

After deployment, the site will serve:

- `index.html` - the three-area UI plus searchable library, **documentation** section, and speech controls.
- `reports/index.html` and `writeups/index.html` - category hubs (avoid 404s on bare `/reports/` paths on static hosting).
- `writeups/methodology/index.html` - methodology file picker (folder has `.txt` files only).
- `MANIFEST.json` - includes a `browse_url` per source and the UI routes Markdown through `md-viewer.html` for readable static rendering.

The "all three" areas are GitHub Pages presentation areas, not three separate root folders. Medium and methodology are intentionally grouped under `writeups/` because they are research/writeup inputs, while the browser search spans the manifest across both reports and writeups.
