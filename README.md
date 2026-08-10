# yt-mp3

Local-first repo for browsing YouTube transcripts from a curated source list, starting with Stanford CS329A.

Current entry point: `cs329a-browser.html`
Local server: `npm run serve` → `http://localhost:4173/cs329a-browser.html`

## What this repo contains

- `data/sources.json` — curated sources and transcript strategy
- `content/transcripts/youtube/cs329a-stanford/` — CS329A playlist transcripts
- `cs329a-browser.html` — simple localhost browser for episode transcripts
- `scripts/fetch-youtube-transcripts.mjs` — YouTube playlist transcript fetcher
- `scripts/build-site.mjs`, `validate-data.mjs` — upstream static site tooling, preserved but not required for the local browser

## Removed upstream pieces

- All `getnote-*.mjs` scripts and npm entries
- China-only transcript dependencies

## Quick start

```bash
npm install
npm run serve
# open http://localhost:4173/cs329a-browser.html
```

## Notes

- Transcripts are plain text with frontmatter where applicable.
- Browser loads transcripts via `fetch()` from `content/transcripts/youtube/cs329a-stanford/`.
- This README describes the fork, not the upstream podcast index.
