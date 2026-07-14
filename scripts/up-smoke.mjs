/**
 * United Payment test-gateway smoke: auth → checkout → CheckStatus (order + trx).
 *
 * Usage:
 *   npm run up:smoke
 *   npm run up:smoke -- --public          # use Postman public sandbox creds
 *   node scripts/up-smoke.mjs --checkout-only
 *
 * Reads UNITED_PAYMENT_* from .env / .env.local unless --public is passed.
 * Does not print tokens or passwords.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const usePublic = args.has('--public');
const checkoutOnly = args.has('--checkout-only');

const PUBLIC_EMAIL = 'support@unitedpayment.com';
const PUBLIC_PASSWORD = 'XP@qJM06W!3@';
const API_BASE = 'https://test-vpos.unitedpayment.az/api';

function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[trimmed.slice(0, eq).trim()] = val;
  }
  return out;
}

const fileEnv = {
  ...parseEnv(path.join(root, '.env')),
  ...parseEnv(path.join(root, '.env.local')),
};

const email = usePublic ? PUBLIC_EMAIL : fileEnv.UNITED_PAYMENT_EMAIL || fileEnv.UNITED_PAYMENT_USERNAME;
const password = usePublic ? PUBLIC_PASSWORD : fileEnv.UNITED_PAYMENT_PASSWORD;
const apiBase = (fileEnv.UNITED_PAYMENT_API_BASE || API_BASE).replace(/\/$/, '');
const webhookUrl =
  fileEnv.UNITED_PAYMENT_WEBHOOK_URL ||
  (fileEnv.UNITED_PAYMENT_FUNCTIONS_PUBLIC_URL
    ? `${fileEnv.UNITED_PAYMENT_FUNCTIONS_PUBLIC_URL.replace(/\/$/, '')}/united-payment-webhook`
    : 'https://example.com/united-payment-webhook');

if (!email || !password) {
  console.error(
    'Missing UNITED_PAYMENT_EMAIL + UNITED_PAYMENT_PASSWORD in .env.local, or pass --public for Postman sandbox creds.'
  );
  process.exit(1);
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

function pass(step, detail) {
  console.log(`PASS  ${step}${detail ? ` — ${detail}` : ''}`);
}

function fail(step, detail) {
  console.error(`FAIL  ${step}${detail ? ` — ${detail}` : ''}`);
  process.exit(1);
}

const clientOrderId = `MINGS-SMOKE-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;

console.log(`United Payment smoke — ${apiBase}`);
console.log(`clientOrderId: ${clientOrderId}`);
if (usePublic) console.log('creds: Postman public sandbox (--public)');

const authRes = await fetch(`${apiBase}/auth/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const authBody = await readJson(authRes);
const token = String(authBody.token ?? '').replace(/^Bearer\s+/i, '').trim();
if (!authRes.ok || !token) {
  fail('auth', `HTTP ${authRes.status} ${authBody.message ?? authBody.rawText ?? ''}`);
}
pass('auth', `HTTP ${authRes.status}`);

const checkoutPayload = {
  amount: 0.01,
  language: 'EN',
  currency: 'AZN',
  successUrl: 'https://order.mings.az/track',
  cancelUrl: 'https://order.mings.az/track',
  declineUrl: 'https://order.mings.az/track',
  webhookUrl,
  clientOrderId,
  memberId: 'mings-smoke',
  applePay: false,
  addCard: false,
};

const checkoutRes = await fetch(`${apiBase}/transactions/checkout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
  body: JSON.stringify(checkoutPayload),
});
const checkoutBody = await readJson(checkoutRes);
const transactionId = checkoutBody.transactionId;
const checkoutUrl = checkoutBody.url;
if (!checkoutRes.ok || !transactionId || !checkoutUrl) {
  fail('checkout', `HTTP ${checkoutRes.status} ${checkoutBody.message ?? JSON.stringify(checkoutBody)}`);
}
pass('checkout', `HTTP ${checkoutRes.status}, transactionId=${transactionId}, status=${checkoutBody.status ?? '?'}`);
console.log(`       pay page: ${checkoutUrl}`);

if (checkoutOnly) {
  console.log('\nAll requested checks passed (checkout-only).');
  process.exit(0);
}

async function postStatus(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
    body: JSON.stringify(body),
  });
  return { res, body: await readJson(res) };
}

const byOrder = await postStatus(`${apiBase}/transactions/transaction-status-by-order-id-detailed`, {
  clientOrderId,
});
if (!byOrder.res.ok || byOrder.body.clientOrderId !== clientOrderId) {
  fail('status-by-order-id-detailed', `HTTP ${byOrder.res.status}`);
}
pass(
  'status-by-order-id-detailed',
  `HTTP ${byOrder.res.status}, status=${byOrder.body.status}, isSuccess=${byOrder.body.isSuccess}`
);

const byTrx = await postStatus(`${apiBase}/transactions/transaction-status-by-trx-id-detailed`, {
  transactionId: Number(transactionId),
});
if (!byTrx.res.ok || String(byTrx.body.transactionId) !== String(transactionId)) {
  fail('status-by-trx-id-detailed', `HTTP ${byTrx.res.status}`);
}
pass(
  'status-by-trx-id-detailed',
  `HTTP ${byTrx.res.status}, status=${byTrx.body.status}, isSuccess=${byTrx.body.isSuccess}`
);

console.log('\nAll smoke checks passed.');
console.log('Next: open the pay page URL above and use the test card from docs/UNITED_PAYMENT_INTEGRATION.md to reach APPROVED/DECLINED.');
