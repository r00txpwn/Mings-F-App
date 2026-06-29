/**
 * Permanent public tunnel for the local staff preview (port 4175) via ngrok.
 *
 * Uses a FIXED ngrok static domain so the public URL never changes and there is
 * no localtunnel-style password interstitial. Auto-restarts if the tunnel drops,
 * always reconnecting to the same domain.
 *
 * Requires a one-time `ngrok config add-authtoken <token>` (already done if this
 * was set up by the assistant). Override the domain/port with env vars:
 *     NGROK_DOMAIN=your-domain.ngrok-free.dev NGROK_PORT=4175 npm run tunnel:ngrok
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const PORT = process.env.NGROK_PORT ?? '4175';
const DOMAIN = (process.env.NGROK_DOMAIN ?? 'putt-context-lazily.ngrok-free.dev').trim();
const RESTART_DELAY_MS = 5000;

// Prefer the locally-installed ngrok binary, fall back to PATH.
const LOCAL_NGROK = path.join(
  process.env.LOCALAPPDATA ?? '',
  'ngrok-bin',
  process.platform === 'win32' ? 'ngrok.exe' : 'ngrok',
);
const NGROK_BIN = existsSync(LOCAL_NGROK) ? LOCAL_NGROK : 'ngrok';

let shuttingDown = false;

function start() {
  const args = ['http', `--url=https://${DOMAIN}`, PORT];
  console.log(`[tunnel:ngrok] Starting ngrok → https://${DOMAIN} (port ${PORT})`);

  const child = spawn(NGROK_BIN, args, { stdio: 'inherit', shell: false });

  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.log(
      `[tunnel:ngrok] ngrok exited (code ${code ?? 'null'}). Restarting in ${RESTART_DELAY_MS / 1000}s with the same URL…`,
    );
    setTimeout(start, RESTART_DELAY_MS);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shuttingDown = true;
    process.exit(0);
  });
}

start();
