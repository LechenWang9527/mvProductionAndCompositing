// LRC parser: "[mm:ss.xx]text" lines, several time tags per line allowed, metadata tags skipped.
// Only the timestamps are taken from the file - the text is used verbatim.

const TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

export function parseLRC(text) {
  const out = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    TAG.lastIndex = 0;
    const times = [];
    let m;
    let lastEnd = 0;
    while ((m = TAG.exec(line))) {
      times.push(+m[1] * 60 + +m[2] + (+(m[3] || 0)) / (m[3] && m[3].length === 3 ? 1000 : 100));
      lastEnd = TAG.lastIndex;
    }
    if (!times.length) continue;                       // [ar:] / [ti:] metadata, or plain text
    const body = line.slice(lastEnd).trim();
    if (!body) continue;
    for (const t of times) out.push({ t, text: body });
  }
  out.sort((a, b) => a.t - b.t);
  // de-duplicate identical timestamps that a doubled tag would produce
  const uniq = [];
  for (const l of out) {
    if (uniq.length && Math.abs(uniq[uniq.length - 1].t - l.t) < 1e-3) continue;
    uniq.push(l);
  }
  return uniq;
}

/** Index of the line showing at time t, plus the [0,1] progress through it. */
export function lyricState(lines, t) {
  if (!lines || !lines.length) return { index: -1, progress: 0 };
  let lo = 0, hi = lines.length - 1, idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].t <= t) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  if (idx < 0) return { index: -1, progress: 0 };
  const next = lines[idx + 1];
  const span = next ? next.t - lines[idx].t : 4;
  const p = span > 0 ? Math.min(1, Math.max(0, (t - lines[idx].t) / span)) : 0;
  return { index: idx, progress: p };
}
