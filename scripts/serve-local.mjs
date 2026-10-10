import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { execFile } from 'node:child_process';

// Keep these bindings explicit: this application is for the current PC only.
const host = '127.0.0.1';
const port = 5173;
const address = `http://${host}:${port}`;
const buildPath = fileURLToPath(new URL('../dist/', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};

let root;
try {
  root = await realpath(buildPath);
  if (!(await stat(resolve(root, 'index.html'))).isFile()) throw new Error('Missing index');
} catch {
  console.error('실행할 사이트가 없습니다. 프로젝트 폴더에서 npm ci와 npm run build를 먼저 실행해 주세요.');
  process.exit(1);
}

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-cache');
  if (![`${host}:${port}`, `localhost:${port}`].includes(request.headers.host)) {
    response.writeHead(403).end('Local access only'); return;
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, address).pathname); }
  catch { response.writeHead(400).end('Invalid path'); return; }
  const candidate = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!candidate.startsWith(`${root}${sep}`)) { response.writeHead(404).end(); return; }
  try {
    const target = await realpath(candidate);
    if (!target.startsWith(`${root}${sep}`)) { response.writeHead(404).end(); return; }
    const info = await stat(target);
    if (!info.isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream', 'Content-Length': info.size });
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = createReadStream(target);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  } catch { response.writeHead(404).end('Not found'); }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? '5173 포트가 이미 사용 중입니다. 기존 코토바 정원이 실행 중인지 확인해 주세요. 학습 기록을 유지하기 위해 포트를 자동 변경하지 않습니다.'
    : `로컬 서버를 시작하지 못했습니다: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`\n코토바 정원 · 내 PC 전용\n브라우저 주소: ${address}\n다른 PC나 스마트폰에서는 접속할 수 없습니다.\n종료하려면 이 창에서 Ctrl+C를 누르세요.\n`);
  if (process.argv.includes('--open')) {
    const command = process.platform === 'win32' ? 'cmd.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/d', '/s', '/c', `start "" "${address}"`] : [address];
    execFile(command, args, error => {
      if (error) console.log(`브라우저를 직접 열고 ${address}를 주소창에 입력해 주세요.`);
    });
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close();
    server.closeAllConnections();
  });
}
