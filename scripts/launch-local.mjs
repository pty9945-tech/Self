import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 12)) {
  console.error('Node.js 24 LTS를 설치한 다음 다시 실행해 주세요.');
  process.exit(1);
}

function run(command, args, shell = false) {
  const result = spawnSync(command, args, { cwd: project, stdio: 'inherit', shell });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(fileURLToPath(new URL('../dist/index.html', import.meta.url)))) {
  console.log('처음 실행할 준비를 합니다. 의존성을 설치하고 사이트를 빌드합니다.');
  const windows = process.platform === 'win32';
  run(windows ? 'npm.cmd' : 'npm', ['ci'], windows);
  run(windows ? 'npm.cmd' : 'npm', ['run', 'build'], windows);
}

run(process.execPath, ['scripts/serve-local.mjs', '--open']);
