import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.cwd());
const SOURCES_PATH = path.join(ROOT, 'data', 'sources.json');
const TRANSCRIPTS_ROOT = path.join(ROOT, 'content', 'transcripts');
const BIN_DIR = fileURLToPath(new URL('../../bin/', import.meta.url));
const YT_DLP_BIN = path.join(BIN_DIR, 'yt-dlp');

async function loadSources() {
  const data = JSON.parse(await fs.readFile(SOURCES_PATH, 'utf8'));
  return Array.isArray(data) ? data : [data];
}

function safeSlug(input = '', max = 60) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max) || 'untitled';
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function spawnYtDlp(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'python' : 'python3',
      [YT_DLP_BIN, '--ffmpeg-location', BIN_DIR, ...args], { shell: false });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += String(data); });
    child.stderr.on('data', (data) => { stderr += String(data); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolve(stdout);
      return reject(new Error(`yt-dlp failed with code ${code}: ${stderr || stdout}`));
    });
  });
}

async function listPlaylistVideos(playlistId) {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const stdout = await spawnYtDlp([
    '--flat-playlist',
    '--print', '%(id)s\t%(title)s',
    url
  ]);
  return stdout.split('\n').filter(Boolean).map((line) => {
    const [id, ...titleParts] = line.split('\t');
    return { id: String(id), title: titleParts.join('\t').trim() };
  });
}

async function fetchTranscriptText(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const tempPrefix = path.join(ROOT, 'tmp', `yt-${videoId}`);
  await ensureDir(path.dirname(tempPrefix));
  const args = [
    '--write-subs',
    '--all-subs',
    '--convert-subs', 'srt',
    '--skip-download',
    '-o', `${tempPrefix}.%(ext)s`,
    url
  ];
  let stdout = '';
  try {
    stdout = await spawnYtDlp(args);
  } catch (error) {
    return { text: '', error: String(error) };
  }
  const candidates = await fs.readdir(path.dirname(tempPrefix)).then((entries) =>
    entries.filter((entry) => entry.startsWith(`yt-${videoId}`) && entry.endsWith('.srt'))
  );
  const chosen = candidates.find((entry) => entry.includes('.en')) || candidates[0];
  if (!chosen) {
    return { text: '', error: `no srt for ${videoId}: ${stdout}` };
  }
  const srtPath = path.join(path.dirname(tempPrefix), chosen);
  try {
    const raw = await fs.readFile(srtPath, 'utf8');
    const text = raw
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((line) => line.trim() !== '' && !/^\d+$/.test(line.trim()) && !line.includes('-->'))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { text, error: null };
  } catch (error) {
    return { text: '', error: String(error) };
  }
}

async function processSource(source) {
  if (source.kind !== 'youtube-playlist') {
    console.log(`SKIP ${source.id}: unsupported kind ${source.kind}`);
    return;
  }

  const outDir = path.join(TRANSCRIPTS_ROOT, 'youtube', source.id);
  await ensureDir(outDir);

  console.log(`FETCH playlist=${source.id} title=${source.title}`);
  const videos = await listPlaylistVideos(source.playlistId);
  console.log(`LIST ${source.id}: ${videos.length} videos`);

  let written = 0;
  let skipped = 0;
  let empty = 0;

  for (const video of videos) {
    const slug = safeSlug(`${source.id} - ${video.title}`, 96);
    const filePath = path.join(outDir, `${slug}.md`);
    try {
      const stat = await fs.stat(filePath);
      skipped += 1;
      console.log(`SKIP ${video.id}: ${filePath}`);
      continue;
    } catch {
      // proceed
    }

    const result = await fetchTranscriptText(video.id);
    if (!result.text) {
      empty += 1;
      console.log(`EMPTY ${video.id}: ${result.error}`);
      continue;
    }

    const escapedTitle = video.title.replace(/"/g, '\\"');
    const frontmatter = [
      '---',
      `source: youtube`,
      `videoId: ${video.id}`,
      `title: "${escapedTitle}"`,
      `sourceUrl: https://www.youtube.com/watch?v=${video.id}`,
      '---',
      '',
      result.text
    ].join('\n');

    await fs.writeFile(filePath, frontmatter, 'utf8');
    written += 1;
    console.log(`WROTE ${video.id}: ${filePath}`);
  }

  console.log(`DONE playlist=${source.id} written=${written} skipped=${skipped} empty=${empty}`);
}

async function main() {
  if (process.argv.includes('--check-downloader')) {
    console.log((await spawnYtDlp(['--version'])).trim());
    return;
  }
  const sources = await loadSources();
  for (const source of sources) {
    await processSource(source);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
