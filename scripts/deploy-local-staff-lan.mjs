/**
 * Staff local production preview exposed on the LAN — http://<lan-ip>:4175/
 *
 * Same single-port (4175), single-instance contract as deploy:local, but binds to
 * 0.0.0.0 so other devices on the same network can reach it. Use deploy:local for
 * the loopback-only (127.0.0.1) preview.
 */
import { spawnSync } from 'node:child_process';
import { hostname, networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '0.0.0.0';
const PORT = 4175;

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function lanAddresses() {
  const out = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) out.push(addr.address);
    }
  }
  return out;
}

console.log(`[deploy:local:lan] Freeing port ${PORT}…`);
run('node', ['scripts/kill-port.mjs', String(PORT)]);

run('npm', ['run', 'verify-env']);
run('npm', ['run', 'build:staff']);

const ips = lanAddresses();
console.log(`[deploy:local:lan] Starting preview on ${HOST}:${PORT}`);
console.log('[deploy:local:lan] Reachable from other devices on the same network at:');
// Hostname URL first — it survives DHCP IP changes (most stable link to bookmark).
console.log(`  ➜  http://${hostname()}:${PORT}/        (stable — survives IP changes)`);
for (const ip of ips) console.log(`  ➜  http://${ip}:${PORT}/`);
console.log('[deploy:local:lan] Tip: for a permanently fixed IP, set a DHCP reservation on your router.');
console.log('[deploy:local:lan] If a device cannot connect, allow inbound TCP 4175 in Windows Firewall.');

const preview = spawnSync(
  'npx',
  [
    'vite',
    'preview',
    '--mode',
    'staff',
    '--outDir',
    'dist-staff',
    '--host',
    HOST,
    '--port',
    String(PORT),
    '--strictPort',
  ],
  { cwd: root, stdio: 'inherit', shell: true },
);

process.exit(preview.status ?? 1);
