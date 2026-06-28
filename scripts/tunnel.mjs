/**
 * Stable public tunnel for the local staff preview (port 4175).
 *
 * - Requests a FIXED localtunnel subdomain so the public URL never changes:
 *     https://<subdomain>.loca.lt
 * - Auto-restarts the tunnel if it drops, reusing the same subdomain, so you
 *   don't have to keep sharing a new link.
 *
 * Override the subdomain/port with env vars:
 *     TUNNEL_SUBDOMAIN=my-name TUNNEL_PORT=4175 npm run tunnel
 *
 * Note: the subdomain is only granted if it is free on the public localtunnel
 * server. If it is taken, localtunnel assigns a random one — pick another name.
 */
import { spawn } from 'node:child_process';

const PORT = process.env.TUNNEL_PORT ?? '4175';
const SUBDOMAIN = (process.env.TUNNEL_SUBDOMAIN ?? 'mings-os-cockpit').trim();
// localtunnel's public server keeps a dropped subdomain reserved for a few
// seconds. Wait long enough for it to release before reconnecting, otherwise
// the reconnect is handed a random subdomain instead of the fixed one.
const RESTART_DELAY_MS = 10000;

let shuttingDown = false;

function start() {
  const args = ['--yes', 'localtunnel', '--port', PORT, '--subdomain', SUBDOMAIN];
  console.log(`[tunnel] Starting localtunnel → https://${SUBDOMAIN}.loca.lt (port ${PORT})`);

  const child = spawn('npx', args, { stdio: 'inherit', shell: true });

  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.log(
      `[tunnel] Tunnel exited (code ${code ?? 'null'}). Restarting in ${RESTART_DELAY_MS / 1000}s with the same URL…`,
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
