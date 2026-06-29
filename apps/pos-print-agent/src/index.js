import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import http from 'node:http';
import net from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadConfig() {
  const configPath = path.join(root, 'config.json');
  const examplePath = path.join(root, 'config.example.json');
  const raw = fs.existsSync(configPath)
    ? fs.readFileSync(configPath, 'utf8')
    : fs.readFileSync(examplePath, 'utf8');
  return JSON.parse(raw);
}

const config = loadConfig();
const dbPath = path.join(root, 'queue.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS print_jobs (
    id TEXT PRIMARY KEY,
    profile TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const insertJob = db.prepare(`
  INSERT INTO print_jobs (id, profile, payload, status, attempts, created_at, updated_at)
  VALUES (@id, @profile, @payload, 'pending', 0, @created_at, @updated_at)
`);
const getJob = db.prepare('SELECT * FROM print_jobs WHERE id = ?');
const listPending = db.prepare(`SELECT * FROM print_jobs WHERE status = 'pending' ORDER BY created_at ASC`);
const markDone = db.prepare(`UPDATE print_jobs SET status = 'done', updated_at = ? WHERE id = ?`);
const markFailed = db.prepare(
  `UPDATE print_jobs SET status = 'pending', attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?`
);

function corsHeaders(origin) {
  const allowed = config.corsOrigins ?? [];
  const ok = !origin || allowed.some((o) => origin.startsWith(o) || o === '*');
  return {
    'Access-Control-Allow-Origin': ok ? origin || '*' : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function escposLabel(item) {
  const lines = [
    item.displayNumber,
    item.platformBadge,
    `${item.quantity}× ${item.productName}`,
    item.modifiers?.length ? item.modifiers.join(' · ') : '',
    item.note ? `Note: ${item.note}` : '',
    item.printedAt,
  ].filter(Boolean);
  const text = lines.join('\n') + '\n\n';
  return Buffer.from(
    '\x1b\x40' + text.split('').map((ch) => ch).join('') + '\n\x1d\x56\x00',
    'utf8'
  );
}

function zplLabel(item, profile) {
  const isSmall = profile === 'zpl_40x30';
  const pw = isSmall ? 320 : 464;
  const ll = isSmall ? 240 : 320;
  const lines = [
    `^FO20,20^A0N,28,28^FD${item.displayNumber}^FS`,
    `^FO20,55^A0N,20,20^FD${item.platformBadge}^FS`,
    `^FO20,85^A0N,24,24^FD${item.quantity}x ${item.productName}^FS`,
  ];
  if (item.modifiers?.length) {
    lines.push(`^FO20,120^A0N,18,18^FD${item.modifiers.join(' · ')}^FS`);
  }
  if (item.note) {
    lines.push(`^FO20,150^A0N,18,18^FD${item.note}^FS`);
  }
  lines.push(`^FO20,${isSmall ? 180 : 200}^A0N,18,18^FD${item.printedAt}^FS`);
  return `^XA^PW${pw}^LL${ll}${lines.join('')}^XZ\n`;
}

function encodeItem(item, profile) {
  if (profile === 'escpos_80mm') return escposLabel(item);
  return Buffer.from(zplLabel(item, profile), 'utf8');
}

function sendToPrinter(buffer) {
  const printer = config.printer ?? {};
  if (printer.mode === 'spooler' && printer.windowsSpoolerName) {
    return Promise.reject(new Error('Windows spooler mode requires optional native module; use TCP mode'));
  }
  const host = printer.host ?? '127.0.0.1';
  const port = Number(printer.port ?? 9100);
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.write(buffer, (err) => {
        socket.end();
        if (err) reject(err);
        else resolve();
      });
    });
    socket.on('error', reject);
    socket.setTimeout(8000, () => {
      socket.destroy();
      reject(new Error('Printer TCP timeout'));
    });
  });
}

async function processJob(row) {
  const payload = JSON.parse(row.payload);
  const items = payload.items ?? [];
  for (const item of items) {
    const buf = encodeItem(item, row.profile);
    await sendToPrinter(buf);
  }
  markDone.run(new Date().toISOString(), row.id);
}

async function flushQueue() {
  const pending = listPending.all();
  for (const row of pending) {
    try {
      await processJob(row);
    } catch (e) {
      markFailed.run(e instanceof Error ? e.message : String(e), new Date().toISOString(), row.id);
    }
  }
}

setInterval(() => void flushQueue(), config.retryIntervalMs ?? 5000);

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin ?? '';
  const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    res.writeHead(200, headers);
    res.end('ok');
    return;
  }

  try {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ ok: true, service: 'pos-print-agent' }));
      return;
    }

    if (req.method === 'GET' && req.url === '/queue') {
      const rows = db.prepare('SELECT id, status, attempts, created_at FROM print_jobs ORDER BY created_at DESC LIMIT 50').all();
      res.writeHead(200, headers);
      res.end(JSON.stringify({ jobs: rows }));
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/queue/')) {
      const id = req.url.slice('/queue/'.length);
      const row = getJob.get(id);
      res.writeHead(row ? 200 : 404, headers);
      res.end(JSON.stringify(row ?? { error: 'not found' }));
      return;
    }

    if (req.method === 'POST' && req.url === '/test-print') {
      const body = await readBody(req);
      const profile = body.profile ?? 'escpos_80mm';
      const sample = {
        displayNumber: 'M001',
        platformBadge: 'POS · Test',
        productName: 'Test Item',
        quantity: 1,
        modifiers: ['Spicy'],
        note: 'pos-print-agent',
        printedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      };
      await sendToPrinter(encodeItem(sample, profile));
      res.writeHead(200, headers);
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === 'POST' && req.url === '/print') {
      const body = await readBody(req);
      const jobId = body.jobId ?? crypto.randomUUID();
      const profile = body.profile ?? 'escpos_80mm';
      const now = new Date().toISOString();
      insertJob.run({
        id: jobId,
        profile,
        payload: JSON.stringify({ items: body.items ?? [] }),
        created_at: now,
        updated_at: now,
      });
      void flushQueue();
      res.writeHead(202, headers);
      res.end(JSON.stringify({ ok: true, jobId, status: 'queued' }));
      return;
    }

    res.writeHead(404, headers);
    res.end(JSON.stringify({ error: 'not found' }));
  } catch (e) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
  }
});

const port = Number(config.port ?? 9310);
const host = config.host ?? '0.0.0.0';
server.listen(port, host, () => {
  console.log(`pos-print-agent listening on http://${host}:${port}`);
});
