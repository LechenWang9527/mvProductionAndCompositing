import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';

const root = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(root, '../..');
const mode = process.argv[2] ?? 'stills';
const id = process.argv[3] ?? 'IntroProcessV2';
const browserExecutable = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outputDir = path.join(project, 'out/motion-v2');
await fs.mkdir(outputDir, {recursive:true});
// Chrome/FFmpeg subprocesses use the same writable, project-local scratch path.
// The desktop sandbox's default temp path has loader syntax and inherited ACLs.
const scratch = path.join(root, '.tmp');
await fs.mkdir(scratch, {recursive:true});
process.env.TEMP = scratch;
process.env.TMP = scratch;
const serveUrl = await bundle({entryPoint:path.join(root, 'src/index.ts'), publicDir:path.join(root, 'public'), outDir:path.join(root, '.bundle')});
const common = {serveUrl, browserExecutable};
const composition = await selectComposition({...common, id});
console.log(JSON.stringify({id:composition.id, frames:composition.durationInFrames, fps:composition.fps, width:composition.width, height:composition.height}));
if (mode === 'stills') {
  const times = (process.argv[4] ?? '0,0.7,3,4.5,6.5,8.7,12,15.7,18.5,21.3').split(',').map(Number);
  for (const t of times) {
    const output = path.join(outputDir, `${id}_${t.toFixed(2).replace('.', '_')}.png`);
    await renderStill({...common, composition, frame:Math.min(composition.durationInFrames-1,Math.round(t * composition.fps)), output, imageFormat:'png'});
    console.log(output);
  }
} else if (mode === 'video' || mode === 'range') {
  const frameRange = mode === 'range' ? (process.argv[4] ?? '').split(',').map(Number) : undefined;
  if (frameRange && (frameRange.length !== 2 || !frameRange.every(Number.isInteger) || frameRange[0] < 0 || frameRange[1] < frameRange[0] || frameRange[1] >= composition.durationInFrames)) throw new Error('Expected an inclusive start,end frame range within the composition.');
  const suffix = frameRange ? `_frames_${frameRange[0]}_${frameRange[1]}` : '';
  const outputLocation = path.join(outputDir, `${id}${suffix}.mp4`);
  let milestone = -1;
  await renderMedia({...common, composition, outputLocation, frameRange, codec:'h264', audioCodec:'aac', pixelFormat:'yuv420p', colorSpace:'bt709', crf:18, concurrency:2,
    onProgress:({progress}) => {const current = Math.floor(progress*10); if (current > milestone) {milestone = current; console.log(`${current*10}%`);}}});
  console.log(`\n${outputLocation}`);
} else throw new Error(`Unknown mode ${mode}`);
