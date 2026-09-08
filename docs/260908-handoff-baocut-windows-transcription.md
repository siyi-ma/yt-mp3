# Handoff Document — yt-mp3

**Date**: 2026-09-08
**Branch**: `main` (only observed local working branch)
**Repo**: https://github.com/siyi-ma/yt-mp3
**Live app / service**: No service started this session.

## 1. Current Task Objectives

- ✓ Assess BaoCut as a YouTube transcription fallback.
- ✓ Fix the hardcoded WSL downloader in the user-selected `siyi-fork` clone.
- ✓ Attempt BaoCut setup for https://www.youtube.com/watch?v=qNzvG68F8gE.
- x Produce that video's transcript: startup blocked by a published Windows version mismatch.
- ✓ Document findings and reproducible checks.

## 2. Current Progress

### Completed this session

- Changed `scripts/fetch-youtube-transcripts.mjs`: use script-relative workspace `bin/`, Python invocation, and `--ffmpeg-location` in shared `spawnYtDlp()`.
- Added `--check-downloader` to exercise the real launcher without playlist downloads or output writes.
- Added README usage and dependency-layout guidance.
- Corrected the parent workspace `CLAUDE.md` claim that both clones differ only in README. That file is outside this Git repository.
- Fetched official BaoCut skill source into `C:/Projects/yt-mp3/tmp/baocut-src`, commit `6caf381`.
- Official resolver downloaded Windows CPU CLI 1.1.3 build 50 to `C:/Users/siyima/AppData/Local/BaoCut/cli/1.1.3-build.50/` but rejected it for the current skill.

### Known working

- `node scripts/fetch-youtube-transcripts.mjs --check-downloader` reports `2026.08.19` on native Windows. Initial sandbox EPERM was resolved by an approved outside-sandbox run.
- `node --check scripts/fetch-youtube-transcripts.mjs` and `git diff --check` passed.
- Existing vendored yt-dlp retrieved the requested video's duration: 40:34. Title output had encoding corruption; do not infer the title from that output.
- No full playlist fetch, BaoCut transcription, model download, project creation, or preview server was completed.

## 3. Key Context

### Tech stack

| Layer | Technology |
|---|---|
| Workspace | Windows PowerShell; `C:/Projects/yt-mp3` is not a Git repository |
| User repository | Node ESM scripts in `C:/Projects/yt-mp3/siyi-fork` |
| Downloader | Python zipapp `C:/Projects/yt-mp3/bin/yt-dlp` |
| Media tool | `C:/Projects/yt-mp3/bin/ffmpeg.exe` |
| Proposed ASR | BaoCut external CLI through its official PowerShell resolver |

### Architecture / hierarchy

```mermaid
flowchart LR
  A[YouTube source] --> B[Existing caption extraction]
  B -->|Available| D[Markdown transcript]
  B -. Missing captions: proposed only .-> C[Download media and BaoCut ASR]
  C -. Markdown export .-> D
  D --> E[Existing summary and static site stages]
```

### Important configuration / gotchas

- User explicitly selected `siyi-fork`; `C:/Projects/yt-mp3/yt-mp3` was not edited.
- Normal playlist fetching still resolves data/output from `process.cwd()`; run from the fork root. Tool resolution alone is independent of cwd.
- `../bin/` is outside the Git repository. A standalone checkout needs these tools supplied separately.
- Existing `.venv/` is WSL-only. Python must be available on PATH (`python` on Windows, `python3` otherwise).

## 4. Key Findings

1. `scripts/fetch-youtube-transcripts.mjs:9` now derives `BIN_DIR` from `import.meta.url`; `spawnYtDlp()` at line 30 is shared by playlist listing and subtitle extraction. The fix covers both callers.
2. `scripts/fetch-youtube-transcripts.mjs:156` exposes the runnable launcher check. Its success verifies process launch and zipapp resolution, not subtitle conversion or end-to-end downloading.
3. `scripts/import-youtube-captions.mjs` imports public caption tracks; missing or short tracks are marked unavailable. Neither existing caption script performs speech recognition.
4. BaoCut supports local-media/URL transcription and Markdown export. An optional caption-missing adapter could populate existing transcript paths and episode metadata, then reuse `summarize-transcripts.mjs`. No adapter was implemented. Suggested provenance value `baocut-asr` is a proposal only.
5. The official 1.1.4 skill requires CLI >=1.1.4. The published appcast also reports 1.1.4. The resolver selected the newest available Windows CPU release, 1.1.3 build 50, and failed with: `BaoCut skill v1.1.4 requires BaoCut App >= 1.1.4; found 1.1.3. Update BaoCut.app.`
6. Official GitHub release API was checked twice on 2026-09-08. Release `baocut-v1.1.4-build.51` contained only `appcast.json`, `bcut-1.1.4-build.51-aarch64-apple-darwin.zip`, its SHA-256 file, and `release-manifest.json`. No Windows archive or Windows manifest was published. Release 1.1.3 build 50 contained both CPU and CUDA Windows manifests.
7. BaoCut's skill says to use its resolver and not bypass the compatibility handshake. No guard was weakened and no older skill was substituted.

Sources:

- [Official repository](https://github.com/JimLiu/baocut)
- [1.1.4 release](https://github.com/JimLiu/baocut/releases/tag/baocut-v1.1.4-build.51)
- [1.1.3 release](https://github.com/JimLiu/baocut/releases/tag/baocut-v1.1.3-build.50)
- [Workflows](https://github.com/JimLiu/baocut/blob/main/skills/baocut/references/workflows.md)
- [Exports](https://github.com/JimLiu/baocut/blob/main/skills/baocut/references/exports.md)

## 5. Incomplete Items (priority order)

1. Recheck official releases for a Windows CLI compatible with the current skill. Availability can change; do not assume the recorded release inventory remains current.
2. Once compatible, run the skill's version gate, capability checks, model preparation, and requested transcription for `qNzvG68F8gE`; inspect quality and export Markdown. Report actual media and output paths.
3. Only after a successful local trial, consider an opt-in batch fallback with bounded work, error handling, provenance, and existing-transcript preservation. Batch integration was not requested for implementation in this session.
4. Close-session commit/push, note capture, version bump, and branch-cache update were approved. Inspect Git state for their eventual outcome. Clockify entry `6a9ffe9e0278771c069bd3c1` records 2026-09-08 14:00–15:24:53 Europe/Tallinn under project `68eccd51081d0c2f748cc60a` (ad-hoc); do not log it again.

## 6. Suggested Handoff Path

**Files to review first:** `scripts/fetch-youtube-transcripts.mjs`, `README.md`, this handoff, and the downloaded BaoCut `SKILL.md` plus `references/updates.md`.

**Verify first:** run the downloader check from the fork root; inspect current official Windows release assets.

**Recommended next action:** resume the BaoCut trial only when the resolver passes its version check. Use transcription and original Markdown export; full translation/editing orchestration is outside the requested trial.

## 7. Risks and Notes

- **Release blocker** — no transcript was produced. Documentation review alone does not validate ASR accuracy, performance, or Markdown compatibility on this machine.
- **Preview binary** — Windows CLI is an unsigned preview; resolver checksum verification establishes integrity, not publisher identity.
- **Long input** — source is 40:34; model downloads and CPU inference may take substantial time. No timing estimate was measured.
- **YouTube runtime** — yt-dlp warned that no supported JavaScript runtime was configured; some formats may be unavailable.
- **Repository boundary** — downloaded BaoCut source and cached binary are outside `siyi-fork`; do not accidentally include them in the commit.
- **Version** — approved patch bump to 0.1.1 applied to package.json and the lockfile's root package entries; dependency versions are unchanged.

## Suggested First Step for the Next Agent

```powershell
Set-Location C:/Projects/yt-mp3/siyi-fork
node scripts/fetch-youtube-transcripts.mjs --check-downloader
$release = Invoke-RestMethod 'https://api.github.com/repos/JimLiu/baocut/releases/tags/baocut-v1.1.4-build.51'
$release.assets | Select-Object name, browser_download_url
```
