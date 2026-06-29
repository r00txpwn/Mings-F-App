import type { PrintLabelItem } from './posLabelPayload';
import { getPosPrintAgentUrl, getPosPrinterProfile } from './posSettings';

const DB_NAME = 'pos-print-queue';
const STORE_NAME = 'outbound';
const DB_VERSION = 1;

type QueuedPrintJob = {
  id: string;
  items: PrintLabelItem[];
  profile: string;
  createdAt: string;
  attempts: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function enqueueJob(job: QueuedPrintJob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(job);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function listQueuedJobs(): Promise<QueuedPrintJob[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result ?? []) as QueuedPrintJob[]);
    req.onerror = () => reject(req.error);
  });
}

async function removeJob(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function sendLabelsToPrintAgent(
  items: PrintLabelItem[],
  opts?: { agentUrl?: string; profile?: string }
): Promise<{ ok: boolean; queued?: boolean }> {
  if (!items.length) return { ok: true };

  const agentUrl = (opts?.agentUrl ?? getPosPrintAgentUrl()).replace(/\/$/, '');
  const profile = opts?.profile ?? getPosPrinterProfile();
  const jobId = crypto.randomUUID();

  try {
    const res = await fetch(`${agentUrl}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, profile, items }),
    });
    if (res.ok || res.status === 202) {
      return { ok: true };
    }
  } catch {
    // fall through to queue
  }

  await enqueueJob({
    id: jobId,
    items,
    profile,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
  return { ok: false, queued: true };
}

let flushTimer: ReturnType<typeof setInterval> | null = null;

export function startPrintQueueFlusher(onPending?: (count: number) => void): () => void {
  if (flushTimer) clearInterval(flushTimer);

  const flush = async () => {
    const jobs = await listQueuedJobs();
    onPending?.(jobs.length);
    if (!jobs.length) return;

    const agentUrl = getPosPrintAgentUrl().replace(/\/$/, '');
    for (const job of jobs) {
      try {
        const res = await fetch(`${agentUrl}/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            profile: job.profile,
            items: job.items,
          }),
        });
        if (res.ok || res.status === 202) {
          await removeJob(job.id);
        }
      } catch {
        // retry next interval
      }
    }
    const remaining = await listQueuedJobs();
    onPending?.(remaining.length);
  };

  void flush();
  flushTimer = setInterval(() => void flush(), 10_000);

  return () => {
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = null;
  };
}
