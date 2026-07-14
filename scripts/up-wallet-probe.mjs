/**
 * Probe United Payment wallet support: checkout (applePay true/false) + pay-by-link.
 * Usage: node scripts/up-wallet-probe.mjs
 * Writes URLs to test-results/up-wallet-probe.json (no secrets).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://test-vpos.unitedpayment.az/api';
const EMAIL = 'support@unitedpayment.com';
const PASSWORD = 'XP@qJM06W!3@';
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'test-results');
fs.mkdirSync(outDir, { recursive: true });

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

const authRes = await fetch(`${API_BASE}/auth/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const authBody = await readJson(authRes);
const token = String(authBody.token ?? '').replace(/^Bearer\s+/i, '').trim();
if (!authRes.ok || !token) {
  console.error('Auth failed', authRes.status, authBody);
  process.exit(1);
}

const baseCheckout = {
  amount: 0.01,
  language: 'EN',
  currency: 'AZN',
  successUrl: 'https://order.mings.az/track',
  cancelUrl: 'https://order.mings.az/track',
  declineUrl: 'https://order.mings.az/track',
  memberId: 'mings-wallet-probe',
  addCard: false,
};

async function checkout(applePay, label) {
  const clientOrderId = `MINGS-WALLET-${label}-${stamp}`;
  const res = await fetch(`${API_BASE}/transactions/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
    body: JSON.stringify({ ...baseCheckout, clientOrderId, applePay }),
  });
  const body = await readJson(res);
  return { label, applePay, clientOrderId, status: res.status, body };
}

async function payByLink() {
  const orderId = `MINGS-LINK-${stamp}`;
  const res = await fetch(`${API_BASE}/transactions/create-pay-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
    body: JSON.stringify({
      amount: 0.01,
      installment: 1,
      description: 'wallet probe',
      orderId,
      memberId: 'mings-wallet-probe',
      successUrl: 'https://order.mings.az/track',
      cancelUrl: 'https://order.mings.az/track',
      declineUrl: 'https://order.mings.az/track',
    }),
  });
  const text = await res.text();
  const body = text.startsWith('{') ? JSON.parse(text) : { url: text.trim() };
  return { label: 'pay-by-link', orderId, status: res.status, body };
}

const [coFalse, coTrue, link] = await Promise.all([
  checkout(false, 'apple-false'),
  checkout(true, 'apple-true'),
  payByLink(),
]);

const result = {
  probedAt: new Date().toISOString(),
  checkoutAppleFalse: {
    clientOrderId: coFalse.clientOrderId,
    transactionId: coFalse.body.transactionId ?? null,
    url: coFalse.body.url ?? null,
    httpStatus: coFalse.status,
    error: coFalse.body.message ?? null,
  },
  checkoutAppleTrue: {
    clientOrderId: coTrue.clientOrderId,
    transactionId: coTrue.body.transactionId ?? null,
    url: coTrue.body.url ?? null,
    httpStatus: coTrue.status,
    error: coTrue.body.message ?? null,
  },
  payByLink: {
    orderId: link.orderId,
    url: typeof link.body === 'string' ? link.body : link.body.url ?? link.body.rawText ?? null,
    httpStatus: link.status,
    error: link.body.message ?? null,
  },
};

const outPath = path.join(outDir, 'up-wallet-probe.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log('United Payment wallet probe');
console.log('--- checkout applePay=false ---');
console.log(result.checkoutAppleFalse.url ?? JSON.stringify(coFalse.body));
console.log('--- checkout applePay=true ---');
console.log(result.checkoutAppleTrue.url ?? JSON.stringify(coTrue.body));
console.log('--- pay-by-link ---');
console.log(result.payByLink.url ?? JSON.stringify(link.body));
console.log(`\nSaved: ${outPath}`);
