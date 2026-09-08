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

### Fetching YouTube captions

Run from this repository's root:

```bash
node scripts/fetch-youtube-transcripts.mjs --check-downloader
npm run fetch:youtube-transcripts
```

The fetcher expects `../bin/yt-dlp` (Python zipapp) and FFmpeg in `../bin/`.
It resolves tools relative to the script and uses `python` on Windows or
`python3` elsewhere. Those tools live outside this Git repository and must be
provided separately in a fresh checkout. Normal fetching still uses the current
directory for `data/sources.json` and output paths. The check prints the downloader
version without accessing YouTube or writing transcripts.

BaoCut audio transcription is not integrated. See the
[Windows trial findings](docs/260908-handoff-baocut-windows-transcription.md)
for the current release blocker and proposed caption fallback.

- Transcripts are plain text with frontmatter where applicable.
- Browser loads transcripts via `fetch()` from `content/transcripts/youtube/cs329a-stanford/`.
- This README describes the fork, not the upstream podcast index.
