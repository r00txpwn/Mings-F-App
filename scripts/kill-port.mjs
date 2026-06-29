/**
 * Free a TCP port by killing the process that is LISTENING on it.
 * Usage: node scripts/kill-port.mjs 4175
 */
import { execSync } from 'node:child_process';

const port = Number(process.argv[2]);
if (!Number.isFinite(port) || port < 1 || port > 65535) {
  console.error('Usage: node scripts/kill-port.mjs <port>');
  process.exit(1);
}

function killPortWindows(targetPort) {
  let out = '';
  try {
    out = execSync(`netstat -ano | findstr ":${targetPort}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.includes('LISTENING')) continue;
    if (!trimmed.includes(`127.0.0.1:${targetPort}`) && !trimmed.includes(`0.0.0.0:${targetPort}`) && !trimmed.includes(`[::]:${targetPort}`)) {
      continue;
    }
    const parts = trimmed.split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
      console.log(`[kill-port] Stopped PID ${pid} on port ${targetPort}`);
    } catch {
      // already gone
    }
  }
}

function killPortUnix(targetPort) {
  try {
    execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN | xargs -r kill -9`, {
      stdio: 'inherit',
      shell: true,
    });
    console.log(`[kill-port] Cleared port ${targetPort}`);
  } catch {
    // no listener
  }
}

if (process.platform === 'win32') {
  killPortWindows(port);
} else {
  killPortUnix(port);
}
