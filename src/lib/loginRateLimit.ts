const STORAGE_KEY = 'auth_login_rate_limit_v1';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOCK_MS = 15 * 60 * 1000; // 15 minutes

type AttemptRecord = {
  count: number;
  firstFailedAt: number;
  lockedUntil: number;
};

type AttemptStore = Record<string, AttemptRecord>;

function nowMs() {
  return Date.now();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readStore(): AttemptStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AttemptStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: AttemptStore) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function cleanupRecord(record: AttemptRecord): AttemptRecord | null {
  const now = nowMs();
  if (record.lockedUntil > now) {
    return record;
  }
  if (now - record.firstFailedAt > WINDOW_MS) {
    return null;
  }
  return {
    count: record.count,
    firstFailedAt: record.firstFailedAt,
    lockedUntil: 0,
  };
}

export function getLockRemainingMs(email: string): number {
  const key = normalizeEmail(email);
  if (!key) return 0;
  const store = readStore();
  const record = store[key];
  if (!record) return 0;
  const cleaned = cleanupRecord(record);
  if (!cleaned) {
    delete store[key];
    writeStore(store);
    return 0;
  }
  if (cleaned.lockedUntil <= nowMs()) return 0;
  return cleaned.lockedUntil - nowMs();
}

export function registerLoginFailure(email: string): number {
  const key = normalizeEmail(email);
  if (!key) return 0;
  const store = readStore();
  const now = nowMs();
  const existing = store[key];
  const cleaned = existing ? cleanupRecord(existing) : null;

  const base: AttemptRecord = cleaned ?? {
    count: 0,
    firstFailedAt: now,
    lockedUntil: 0,
  };

  const withinWindow = now - base.firstFailedAt <= WINDOW_MS;
  const nextCount = withinWindow ? base.count + 1 : 1;
  const nextFirstFailedAt = withinWindow ? base.firstFailedAt : now;
  const lockedUntil = nextCount >= MAX_ATTEMPTS ? now + LOCK_MS : 0;

  store[key] = {
    count: nextCount,
    firstFailedAt: nextFirstFailedAt,
    lockedUntil,
  };
  writeStore(store);
  return Math.max(lockedUntil - now, 0);
}

export function clearLoginFailures(email: string) {
  const key = normalizeEmail(email);
  if (!key) return;
  const store = readStore();
  if (store[key]) {
    delete store[key];
    writeStore(store);
  }
}

export function formatLockout(ms: number): string {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

