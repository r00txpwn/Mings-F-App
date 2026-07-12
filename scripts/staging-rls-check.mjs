/**
 * Staging RLS + admin-api smoke checks (uses .env — does not print secrets).
 * Usage: node scripts/staging-rls-check.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const env = { ...parseEnv(path.join(root, '.env')), ...parseEnv(path.join(root, '.env.local')) };
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const staffEmail = env.STAFF_EMAIL ?? 'staff@mings.az';
const staffPassword = env.STAFF_PASSWORD ?? '';

if (!supabaseUrl || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

async function getProductId() {
  const res = await fetch(`${supabaseUrl}/rest/v1/products?select=id&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!res.ok) {
    console.error(JSON.stringify({ error: 'products SELECT failed', status: res.status }));
    process.exit(1);
  }
  const rows = await res.json();
  if (!Array.isArray(rows)) {
    console.error(JSON.stringify({ error: 'Unexpected products response', rows }));
    process.exit(1);
  }
  return rows[0]?.id ?? null;
}

async function anonPatchProduct(productId) {
  const res = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
    method: 'PATCH',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ selling_price: 0.01 }),
  });
  const text = await res.text();
  let rows = [];
  try {
    rows = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, rowCount: Array.isArray(rows) ? rows.length : 0, body: text.slice(0, 200) };
}

async function staffSignIn() {
  if (!staffPassword) return null;
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staffEmail, password: staffPassword }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

async function staffPatchProduct(token, productId) {
  const res = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`, {
    method: 'PATCH',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ selling_price: 0.01 }),
  });
  const text = await res.text();
  let rows = [];
  try {
    rows = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, rowCount: Array.isArray(rows) ? rows.length : 0, body: text.slice(0, 200) };
}

async function adminApiMutate(token) {
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      table: 'products',
      operation: 'update',
      id: '00000000-0000-0000-0000-000000000000',
      payload: { selling_price: 1 },
    }),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 300) };
}

async function kdsWithoutSecret() {
  const res = await fetch(`${supabaseUrl}/functions/v1/kds-order-status-update`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saleId: '00000000-0000-0000-0000-000000000000', nextStatus: 'ready' }),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 200) };
}

async function anonInsertSaleItem() {
  const res = await fetch(`${supabaseUrl}/rest/v1/sale_items`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      sale_id: '00000000-0000-0000-0000-000000000001',
      product_name: 'rls-probe',
      quantity: 1,
      unit_price: 1,
      total_price: 1,
    }),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 200) };
}

async function anonAllocateDirectNumber() {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/allocate_direct_display_number`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 200) };
}

async function staffSalesFinancialPatch(token) {
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      table: 'sales',
      operation: 'update',
      id: '00000000-0000-0000-0000-000000000001',
      payload: { total_price: 0.01 },
    }),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 300) };
}

const productId = await getProductId();
const results = [];

if (!productId) {
  console.log(JSON.stringify({ error: 'No product row found for PATCH test' }, null, 2));
  process.exit(1);
}

const anonPatch = await anonPatchProduct(productId);
results.push({
  check: 'anon PATCH products',
  pass: anonPatch.rowCount === 0 || anonPatch.status >= 400,
  status: anonPatch.status,
  detail: anonPatch.rowCount === 0 ? 'zero rows (RLS ok)' : anonPatch.body,
});

const staffToken = await staffSignIn();
if (staffToken) {
  const staffPatch = await staffPatchProduct(staffToken, productId);
  results.push({
    check: 'staff PATCH products (direct PostgREST)',
    pass: staffPatch.rowCount === 0 || staffPatch.status >= 400,
    status: staffPatch.status,
    detail: staffPatch.rowCount === 0 ? 'zero rows (use admin-api)' : staffPatch.body,
  });

  const adminApi = await adminApiMutate(staffToken);
  results.push({
    check: 'staff admin-api mutate (bogus id)',
    pass: adminApi.status === 200 || adminApi.status === 400,
    status: adminApi.status,
    detail: adminApi.body,
  });

  const salesFinancial = await staffSalesFinancialPatch(staffToken);
  results.push({
    check: 'staff admin-api rejects crafted sales financial patch',
    pass: salesFinancial.status === 403 || salesFinancial.status === 404,
    status: salesFinancial.status,
    detail: salesFinancial.body,
  });
} else {
  results.push({
    check: 'staff JWT checks',
    pass: false,
    detail: 'Set STAFF_PASSWORD in .env to run staff/admin-api checks',
  });
}

const kds = await kdsWithoutSecret();
results.push({
  check: 'KDS status without staff JWT',
  pass:
    kds.status === 401 ||
    kds.status === 403 ||
    kds.body.includes('UNAUTHORIZED') ||
    kds.body.includes('FORBIDDEN') ||
    kds.body.includes('Staff access'),
  status: kds.status,
  detail: kds.body,
});

const anonSaleItem = await anonInsertSaleItem();
results.push({
  check: 'anon INSERT sale_items',
  pass: anonSaleItem.status >= 400,
  status: anonSaleItem.status,
  detail: anonSaleItem.body,
});

const anonAllocator = await anonAllocateDirectNumber();
results.push({
  check: 'anon EXECUTE allocate_direct_display_number',
  pass: anonAllocator.status >= 400 || anonAllocator.body.toLowerCase().includes('permission'),
  status: anonAllocator.status,
  detail: anonAllocator.body,
});

console.log(JSON.stringify({ productId, results }, null, 2));
const failed = results.filter((r) => !r.pass);
process.exit(failed.length ? 1 : 0);
