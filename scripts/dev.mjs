import { spawn } from 'node:child_process';
import http from 'node:http';

function waitForBackend(url, retries = 30) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      attempts += 1;
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (attempts >= retries) {
          resolve(false);
        } else {
          setTimeout(check, 250);
        }
      });
    };
    check();
  });
}

const serverProc = spawn(process.execPath, ['server/index.mjs'], {
  stdio: 'inherit',
  env: process.env,
});

await waitForBackend('http://127.0.0.1:4000/api/health/');

const viteBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const viteProc = spawn(viteBin, ['vite'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

function shutdown() {
  try {
    serverProc.kill();
  } catch {}
  try {
    viteProc.kill();
  } catch {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
serverProc.on('exit', (code) => {
  if (code && code !== 0) shutdown();
});
viteProc.on('exit', (code) => {
  shutdown();
  process.exit(code ?? 0);
});

