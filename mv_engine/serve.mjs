// Zero-dependency static file server (HTTP Range for audio seeking).
// Root is the PROJECT root, so the page can reach both mv_engine/ and out/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENGINE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.dirname(ENGINE);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.lrc': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.mp4': 'video/mp4',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
};

function sendFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); return; }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        let start = m[1] ? parseInt(m[1], 10) : 0;
        let end = m[2] ? parseInt(m[2], 10) : st.size - 1;
        if (Number.isNaN(start) || Number.isNaN(end) || start > end) { start = 0; end = st.size - 1; }
        end = Math.min(end, st.size - 1);
        res.writeHead(206, {
          'Content-Type': type, 'Content-Length': end - start + 1,
          'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
    }
    res.writeHead(200, {
      'Content-Type': type, 'Content-Length': st.size,
      'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
}

/** @returns {Promise<{server: import('node:http').Server, url: string, close: () => void}>} */
export function startServer({ port = 5177, host = '127.0.0.1' } = {}) {
  const server = http.createServer((req, res) => {
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch {
      res.writeHead(400).end('bad url');
      return;
    }
    if (rel === '/') rel = '/mv_engine/index.html';
    if (rel === '/favicon.ico') { res.writeHead(204).end(); return; }
    const file = path.resolve(ROOT, '.' + rel);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403).end('outside root'); return; }
    sendFile(req, res, file);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const url = `http://${host}:${server.address().port}`;
      resolve({ server, url, close: () => server.close() });
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 5177);
  const { url } = await startServer({ port });
  console.log(`[serve] ${url}/mv_engine/index.html`);
  if (process.argv.includes('--open')) {
    const { spawn } = await import('node:child_process');
    spawn('cmd', ['/c', 'start', '', `${url}/mv_engine/index.html`], { detached: true, stdio: 'ignore' }).unref();
  }
}
