#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MOTION = join(ROOT, 'film', 'motion-v2');
const SRC = join(MOTION, 'src');
const PUBLIC = join(MOTION, 'public');
const ASSETS = join(PUBLIC, 'assets');
const EDITORIAL = join(SRC, 'editorial');
const VISUAL = join(SRC, 'visual');
const TIMING_SOURCE = join(ROOT, 'lyrics', 'og_timing.json');
const TIMING_COPY = join(PUBLIC, 'data', 'og_timing.json');
const LYRICS_SOURCE = join(ROOT, 'lyrics', 'og_lyrics.txt');
const VERSION_INDEX = process.argv.indexOf('--version');
const VERSION = VERSION_INDEX >= 0 ? process.argv[VERSION_INDEX + 1] : 'AncientEditorialV3';
if (!['AncientEditorialV3', 'AncientEditorialV4'].includes(VERSION)) {
  throw new Error(`Unsupported version ${VERSION}; use AncientEditorialV3 or AncientEditorialV4.`);
}
const OUTPUT = join(ROOT, 'out', 'motion-v2', `${VERSION}.contract.json`);
const SOURCES_OUTPUT = VERSION === 'AncientEditorialV4'
  ? join(ROOT, 'out', 'motion-v2', 'AncientEditorialV4.sources.json')
  : null;
const IMAGE_RE = /["'`]([^"'`]*\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|svg))(?:[?#][^"'`]*)?["'`]/gi;
const DYNAMIC_PORTRAIT_RE = /\$\{\s*who\s*\}_reference_v2\.png/i;
const WIND_LAYER_ASSET_NAMES = ['sky.png', 'land.png', 'flag.png'];

const relativeRoot = (path) => relative(ROOT, path).replaceAll('\\', '/');
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex').toUpperCase();
const readText = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';

function listTsx(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listTsx(path);
    return entry.isFile() && /\.(?:tsx?|jsx?)$/i.test(entry.name) ? [path] : [];
  });
}

function sourceFiles(version = VERSION) {
  const common = [join(SRC, 'Root.tsx'), join(SRC, 'AncientEditorial.tsx'), ...listTsx(EDITORIAL)];
  if (version === 'AncientEditorialV3') common.push(join(VISUAL, 'EditorialStage.tsx'));
  if (version === 'AncientEditorialV4') {
    common.push(
      join(SRC, 'index.ts'),
      join(SRC, 'SubtitlesEditorial.tsx'),
      ...listTsx(VISUAL),
    );
  }
  return [...new Set(common.filter(existsSync))].sort();
}

function normalizeAssetToken(raw) {
  let token = raw.split(/[?#]/, 1)[0].replaceAll('\\', '/');
  const assetsIndex = token.lastIndexOf('assets/');
  if (assetsIndex >= 0) token = token.slice(assetsIndex + 'assets/'.length);
  else token = token.replace(/^\.\//, '').replace(/^\/+/, '');
  return token;
}

function addReference(map, raw, sourceFile, line, token = raw) {
  const normalized = normalizeAssetToken(raw);
  if (!normalized || normalized.includes('${')) return;
  const fullPath = resolve(ASSETS, normalized);
  const rootPrefix = `${resolve(ASSETS)}\\`;
  if (process.platform === 'win32' && !fullPath.toLowerCase().startsWith(rootPrefix.toLowerCase())) {
    map.set(`escape:${fullPath.toLowerCase()}`, {
      file: fullPath,
      references: [{ source: relativeRoot(sourceFile), line, token }],
      escapedAssetRoot: true,
    });
    return;
  }
  const key = process.platform === 'win32' ? fullPath.toLowerCase() : fullPath;
  const entry = map.get(key) ?? { file: fullPath, references: [] };
  entry.references.push({ source: relativeRoot(sourceFile), line, token });
  map.set(key, entry);
}

function collectAssetReferences(files) {
  const map = new Map();
  for (const sourceFile of files) {
    const lines = readText(sourceFile).split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const match of line.matchAll(IMAGE_RE)) addReference(map, match[1], sourceFile, index + 1);
      if (DYNAMIC_PORTRAIT_RE.test(line)) {
        for (const name of ['dufu_reference_v2.png', 'liubang_reference_v2.png']) {
          addReference(map, name, sourceFile, index + 1, '${who}_reference_v2.png');
        }
      }
    }
  }
  return [...map.values()].sort((a, b) => a.file.localeCompare(b.file));
}

function pngHeader(path) {
  const header = readFileSync(path).subarray(0, 24);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (header.length < 24 || !header.subarray(0, 8).equals(signature) || header.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

function inspectAssets(files) {
  const references = collectAssetReferences(files);
  const checked = references.map((entry) => {
    if (entry.escapedAssetRoot) {
      return { ...entry, exists: false, passed: false, errors: ['Path resolves outside public/assets.'] };
    }
    if (!existsSync(entry.file)) {
      return { ...entry, exists: false, sizeBytes: null, dimensions: null, passed: false, errors: ['Referenced image is missing.'] };
    }
    const sizeBytes = statSync(entry.file).size;
    const dimensions = extname(entry.file).toLowerCase() === '.png' ? pngHeader(entry.file) : null;
    const errors = extname(entry.file).toLowerCase() === '.png' && !dimensions ? ['PNG signature/IHDR could not be read.'] : [];
    return {
      file: relativeRoot(entry.file),
      references: entry.references,
      exists: true,
      sizeBytes,
      dimensions,
      passed: errors.length === 0,
      errors,
    };
  });
  return {
    referencedImageCount: checked.length,
    missingCount: checked.filter((entry) => !entry.exists).length,
    invalidPngCount: checked.filter((entry) => entry.exists && !entry.passed).length,
    passed: checked.every((entry) => entry.passed),
    files: checked,
  };
}

function inspectWindLayerAssets() {
  const files = WIND_LAYER_ASSET_NAMES.map((name) => {
    const file = join(ASSETS, 'wind-study', name);
    if (!existsSync(file)) {
      return { file: relativeRoot(file), exists: false, sizeBytes: null, dimensions: null, passed: false, errors: ['Required V4 wind layer image is missing.'] };
    }
    const sizeBytes = statSync(file).size;
    const dimensions = pngHeader(file);
    const errors = dimensions ? [] : ['PNG signature/IHDR could not be read.'];
    return { file: relativeRoot(file), exists: true, sizeBytes, dimensions, passed: errors.length === 0, errors };
  });
  return {
    expectedCount: WIND_LAYER_ASSET_NAMES.length,
    presentCount: files.filter((entry) => entry.exists).length,
    passed: files.every((entry) => entry.passed),
    note: 'Paths are resolved from public/assets directly; wind-study entries do not receive another assets/ prefix.',
    files,
  };
}

function clipPath(src) {
  if (/^(?:[a-z]+:|\/)/i.test(src)) return resolve(src);
  const normalized = src.replaceAll('\\', '/').replace(/^public\//, '').replace(/^\/+/, '');
  return resolve(PUBLIC, normalized);
}

function inspectClips() {
  const path = join(PUBLIC, 'data', 'editorial_clips.json');
  if (!existsSync(path)) return { file: relativeRoot(path), exists: false, count: 0, pendingNullSourceCount: 0, missingSourceCount: 0, passed: false, entries: [] };
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const entries = Object.entries(data).map(([name, value]) => {
    const src = value?.src;
    if (src === null) return { name, src: null, status: 'pending-upload' };
    if (typeof src !== 'string' || !src.trim()) return { name, src: src ?? null, status: 'invalid-source' };
    const resolved = clipPath(src);
    return { name, src, file: relativeRoot(resolved), status: existsSync(resolved) ? 'present' : 'missing' };
  });
  const pendingNullSourceCount = entries.filter((entry) => entry.status === 'pending-upload').length;
  const missingSourceCount = entries.filter((entry) => entry.status === 'missing' || entry.status === 'invalid-source').length;
  return {
    file: relativeRoot(path),
    exists: true,
    count: entries.length,
    pendingNullSourceCount,
    missingSourceCount,
    pendingIsError: false,
    passed: missingSourceCount === 0,
    entries,
  };
}

function inspectFonts() {
  const paths = ['NotoSerifSC-VF.ttf', 'NotoSansSC-VF.ttf'].map((name) => join(PUBLIC, 'fonts', name));
  const files = paths.map((path) => ({ file: relativeRoot(path), exists: existsSync(path), sizeBytes: existsSync(path) ? statSync(path).size : null }));
  return { requiredCount: 2, presentCount: files.filter((entry) => entry.exists && entry.sizeBytes > 0).length, passed: files.every((entry) => entry.exists && entry.sizeBytes > 0), files };
}

function lyricSourceLines(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) =>
    line && !line.startsWith('#') && !/^\[.*\]$/.test(line) && !line.startsWith('《The OGs》'));
}

function inspectTimingAndSubtitles() {
  const timingSourceExists = existsSync(TIMING_SOURCE);
  const timingCopyExists = existsSync(TIMING_COPY);
  const sourceHash = timingSourceExists ? sha256(readFileSync(TIMING_SOURCE)) : null;
  const copyHash = timingCopyExists ? sha256(readFileSync(TIMING_COPY)) : null;
  let timing = null;
  let timingParseError = null;
  if (timingCopyExists) {
    try { timing = JSON.parse(readFileSync(TIMING_COPY, 'utf8')); }
    catch (error) { timingParseError = error instanceof Error ? error.message : String(error); }
  }
  const timedLines = Array.isArray(timing?.lines) ? timing.lines.map((line) => line.text) : [];
  const sourceLyricsExists = existsSync(LYRICS_SOURCE);
  const sourceLines = sourceLyricsExists ? lyricSourceLines(readFileSync(LYRICS_SOURCE, 'utf8')) : [];
  const subtitlePath = join(SRC, 'SubtitlesEditorial.tsx');
  const ancientPath = join(SRC, 'AncientEditorial.tsx');
  const subtitle = readText(subtitlePath);
  const ancient = readText(ancientPath);
  const subtitleLogic = {
    importsSharedTiming: /\.\.\/public\/data\/og_timing\.json/.test(subtitle),
    ancientCompositionUsesEditorialTrack: /<SubtitleTrackEditorial\s+ancientOnly\s*\/>/.test(ancient),
    selectsCurrentByStartTime: /source\[i\]\.start\s*<=\s*t/.test(subtitle),
    readsCurrentLineFromTiming: /const current\s*=\s*source\[index\]/.test(subtitle),
    rendersNextTwoRows: /\[\s*1\s*,\s*2\s*\]\.map\(\(step\)/.test(subtitle) && /source\[index\s*\+\s*step\]/.test(subtitle),
    rendersTimedTextFields: /current\.text/.test(subtitle) && /line\?\.text/.test(subtitle),
  };
  const textMatches = sourceLines.length === timedLines.length && sourceLines.every((line, index) => line === timedLines[index]);
  return {
    sourceTiming: {
      file: relativeRoot(TIMING_SOURCE),
      exists: timingSourceExists,
      sha256: sourceHash,
    },
    runtimeTiming: {
      file: relativeRoot(TIMING_COPY),
      exists: timingCopyExists,
      sha256: copyHash,
      byteIdenticalToSource: Boolean(sourceHash && copyHash && sourceHash === copyHash),
      parseError: timingParseError,
      lineCount: timedLines.length,
    },
    authoritativeLyrics: {
      file: relativeRoot(LYRICS_SOURCE),
      exists: sourceLyricsExists,
      sha256: sourceLyricsExists ? sha256(readFileSync(LYRICS_SOURCE)) : null,
      parsedLineCount: sourceLines.length,
      timedTextMatchesLineForLine: textMatches,
      mismatchCount: Math.abs(sourceLines.length - timedLines.length) + sourceLines.reduce((count, line, index) => count + (timedLines[index] === line ? 0 : 1), 0),
    },
    subtitleLogic,
    passed: Boolean(sourceHash && copyHash && sourceHash === copyHash && !timingParseError && textMatches && Object.values(subtitleLogic).every(Boolean)),
  };
}

function inspectComposition(version = VERSION) {
  const rootPath = join(SRC, 'Root.tsx');
  const root = readText(rootPath);
  const tagPattern = new RegExp(`<Composition\\b[^>]*id=["']${version}["'][^>]*>`, 's');
  const tag = root.match(tagPattern)?.[0] ?? '';
  const markers = {
    compositionFound: Boolean(tag),
    componentIsAncientEditorial: /component=\{AncientEditorial\}/.test(tag),
    width1920: /width=\{1920\}/.test(tag),
    height1080: /height=\{1080\}/.test(tag),
    fps30: /fps=\{30\}/.test(tag),
    duration4119Frames: /durationInFrames=\{4119\}/.test(tag),
  };
  if (version === 'AncientEditorialV4') {
    const ending = readText(join(EDITORIAL, 'Ending.tsx'));
    markers.enhancedMotionDefaultIsTrue = /defaultProps=\{\{\s*enhancedMotion\s*:\s*true\s*\}\}/.test(tag);
    markers.enhancedMotionUsesWindLayers = /import\s*\{\s*WindScene\s*\}\s*from\s*['"]\.\.\/visual\/WindLayers['"]/.test(ending)
      && /if\s*\(\s*enhancedMotion\s*\)/.test(ending)
      && /<WindScene\b/.test(ending);
  }
  return {
    file: relativeRoot(rootPath),
    id: version,
    expected: { width: 1920, height: 1080, fps: 30, durationFrames: 4119, durationSeconds: 137.3 },
    observed: markers,
    passed: Object.values(markers).every(Boolean),
  };
}

function sourceRole(filePath) {
  const file = relativeRoot(filePath);
  if (file === 'film/motion-v2/src/Root.tsx') return 'composition-root';
  if (file === 'film/motion-v2/src/index.ts') return 'renderer-entry';
  if (file === 'film/motion-v2/src/AncientEditorial.tsx') return 'composition-main';
  if (file === 'film/motion-v2/src/SubtitlesEditorial.tsx') return 'subtitle-renderer';
  if (file === 'film/motion-v2/src/visual/WindLayers.tsx') return 'wind-layer-component';
  if (file === 'film/motion-v2/src/visual/Fonts.tsx') return 'font-loader';
  if (file.startsWith('film/motion-v2/src/editorial/')) return 'editorial-component';
  if (file.startsWith('film/motion-v2/src/visual/')) return 'visual-component';
  if (file === 'film/motion-v2/public/data/editorial_clips.json') return 'clip-map';
  if (file === 'film/motion-v2/public/data/og_timing.json' || file === 'lyrics/og_timing.json') return 'timing-data';
  if (file === 'lyrics/og_lyrics.txt') return 'authoritative-lyrics';
  if (file.startsWith('film/motion-v2/public/audio/')) return 'audio';
  if (file.startsWith('film/motion-v2/public/fonts/')) return 'font-file';
  if (file.startsWith('film/motion-v2/public/assets/')) return 'image-asset';
  if (file === 'film/motion-v2/render.mjs') return 'render-entry';
  if (file === 'film/motion-v2/verify-render.mjs') return 'render-verifier';
  if (file === 'film/motion-v2/package.json') return 'runtime-package';
  if (file === 'tools/check_editorial_contract.mjs') return 'contract-checker';
  return 'source';
}

function createV4SourceSnapshot(files, assets, windLayerAssets, clips) {
  const entries = new Map();
  const addFile = (filePath, role, references = []) => {
    const fullPath = resolve(filePath);
    const key = process.platform === 'win32' ? fullPath.toLowerCase() : fullPath;
    const entry = entries.get(key) ?? { fullPath, roles: new Set(), references: [] };
    entry.roles.add(role);
    entry.references.push(...references);
    entries.set(key, entry);
  };

  for (const file of files) addFile(file, sourceRole(file));
  for (const asset of assets.files) {
    const file = isAbsolute(asset.file) ? asset.file : resolve(ROOT, asset.file);
    addFile(file, 'referenced-image', asset.references ?? []);
  }
  for (const asset of windLayerAssets.files) addFile(resolve(ROOT, asset.file), 'wind-layer-image');

  for (const file of [
    TIMING_SOURCE,
    TIMING_COPY,
    LYRICS_SOURCE,
    join(PUBLIC, 'data', 'editorial_clips.json'),
    join(MOTION, 'render.mjs'),
    join(MOTION, 'package.json'),
    join(MOTION, 'verify-render.mjs'),
    fileURLToPath(import.meta.url),
  ]) addFile(file, sourceRole(file));

  for (const directory of [join(PUBLIC, 'audio'), join(PUBLIC, 'fonts')]) {
    if (!existsSync(directory)) continue;
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      if (item.isFile()) addFile(join(directory, item.name), sourceRole(join(directory, item.name)));
    }
  }
  for (const clip of clips.entries) {
    if (clip.file) addFile(resolve(ROOT, clip.file), 'editorial-video-clip');
  }

  const snapshotFiles = [...entries.values()].map((entry) => {
    const exists = existsSync(entry.fullPath);
    return {
      path: relativeRoot(entry.fullPath),
      roles: [...entry.roles].sort(),
      exists,
      sizeBytes: exists ? statSync(entry.fullPath).size : null,
      sha256: exists ? sha256(readFileSync(entry.fullPath)) : null,
      references: entry.references,
    };
  }).sort((a, b) => a.path.localeCompare(b.path));

  const parsedClipEntries = (() => {
    const file = join(PUBLIC, 'data', 'editorial_clips.json');
    if (!existsSync(file)) return [];
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return Object.entries(data).map(([name, value]) => ({ name, src: value?.src ?? null }));
  })();

  const snapshot = {
    schemaVersion: 1,
    composition: 'AncientEditorialV4',
    generatedAtUtc: new Date().toISOString(),
    hashAlgorithm: 'SHA-256',
    expected: { width: 1920, height: 1080, fps: 30, durationFrames: 4119, durationSeconds: 137.3 },
    timing: {
      original: relativeRoot(TIMING_SOURCE),
      bundled: relativeRoot(TIMING_COPY),
      identical: timingHashesMatch(),
    },
    clipMap: {
      file: relativeRoot(join(PUBLIC, 'data', 'editorial_clips.json')),
      count: parsedClipEntries.length,
      pendingNullSources: parsedClipEntries.filter((entry) => entry.src === null).length,
      entries: parsedClipEntries,
    },
    windLayerAssets: windLayerAssets.files.map(({ file, exists, sizeBytes, dimensions }) => ({ file, exists, sizeBytes, dimensions })),
    fileCount: snapshotFiles.length,
    missingFiles: snapshotFiles.filter((file) => !file.exists).map((file) => file.path),
    files: snapshotFiles,
  };
  mkdirSync(dirname(SOURCES_OUTPUT), { recursive: true });
  writeFileSync(SOURCES_OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  return { file: relativeRoot(SOURCES_OUTPUT), fileCount: snapshot.fileCount, missingCount: snapshot.missingFiles.length };
}

function timingHashesMatch() {
  return existsSync(TIMING_SOURCE) && existsSync(TIMING_COPY)
    && sha256(readFileSync(TIMING_SOURCE)) === sha256(readFileSync(TIMING_COPY));
}

const files = sourceFiles(VERSION);
const assets = inspectAssets(files);
const fonts = inspectFonts();
const clips = inspectClips();
const windLayerAssets = VERSION === 'AncientEditorialV4' ? inspectWindLayerAssets() : null;
const timingAndSubtitles = inspectTimingAndSubtitles();
const composition = inspectComposition(VERSION);
const sourceSnapshot = VERSION === 'AncientEditorialV4'
  ? createV4SourceSnapshot(files, assets, windLayerAssets, clips)
  : null;
const videoPath = join(ROOT, 'out', 'motion-v2', `${VERSION}.mp4`);
const video = {
  file: relativeRoot(videoPath),
  exists: existsSync(videoPath),
  checked: false,
  passed: null,
  status: existsSync(videoPath) ? 'present-not-verified' : 'not-rendered-or-not-found',
  note: 'This contract checker does not inspect or render audio/video.',
};
const errors = [];
if (!assets.passed) errors.push('One or more referenced images are missing or have unreadable PNG headers.');
if (!fonts.passed) errors.push('One or more packaged Noto font files are missing or empty.');
if (!clips.passed) errors.push('One or more declared video clip sources are invalid or missing.');
if (VERSION === 'AncientEditorialV4' && !windLayerAssets.passed) errors.push('One or more V4 wind-layer PNGs are missing or have unreadable headers.');
if (!timingAndSubtitles.passed) errors.push('Timing/lyrics source or the three-line subtitle data contract did not match.');
if (!composition.passed) errors.push(`${VERSION} is missing its required fixed composition or V4 enhanced-motion wiring markers.`);

const report = {
  schemaVersion: 1,
  id: VERSION,
  generatedAt: new Date().toISOString(),
  scope: 'Source assets, packaged fonts, pending/declared clips, original lyrics/timing identity, subtitle indexing, and composition markers. No render or video decode.',
  passed: errors.length === 0,
  errors,
  sourceFilesScanned: files.map(relativeRoot),
  composition,
  assets,
  fonts,
  editorialClips: clips,
  windLayerAssets,
  timingAndSubtitles,
  video,
  sourceSnapshot,
};

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
const status = report.passed ? 'PASS' : 'FAIL';
console.log(`${VERSION} source contract: ${status} | images ${assets.referencedImageCount} (${assets.missingCount} missing, ${assets.invalidPngCount} invalid PNG) | fonts ${fonts.presentCount}/${fonts.requiredCount} | clips ${clips.pendingNullSourceCount} pending/null (not errors), ${clips.missingSourceCount} missing | timing SHA ${timingAndSubtitles.runtimeTiming.byteIdenticalToSource ? 'match' : 'mismatch'} | lyrics ${timingAndSubtitles.authoritativeLyrics.timedTextMatchesLineForLine ? 'match' : 'mismatch'} (${timingAndSubtitles.runtimeTiming.lineCount} lines) | subtitle current+2 ${Object.values(timingAndSubtitles.subtitleLogic).every(Boolean) ? 'present' : 'check'} | video ${video.status}${windLayerAssets ? ` | wind PNGs ${windLayerAssets.presentCount}/${windLayerAssets.expectedCount}` : ''}${sourceSnapshot ? ` | sources ${sourceSnapshot.fileCount} files, ${sourceSnapshot.missingCount} missing` : ''}`);
console.log(`Report: ${relativeRoot(OUTPUT)}`);
if (errors.length) process.exitCode = 1;
