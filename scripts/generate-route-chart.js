#!/usr/bin/env node
// Reads src/lib/surfaceRouting.ts + kiosk/order source files to produce docs/ROUTE_CHART.md
// Run manually: node scripts/generate-route-chart.js
// Runs automatically: .githooks/pre-commit stages the output on every commit

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function read(rel) {
  try { return readFileSync(resolve(root, rel), 'utf8'); }
  catch { return ''; }
}

// --- Parse STAFF_SCREEN_PATHS from surfaceRouting.ts ---
function parseStaffScreenPaths(src) {
  const block = src.match(/STAFF_SCREEN_PATHS[^=]*=\s*\{([^}]+)\}/s);
  if (!block) return [];
  // Matches both   home: '/'   and   'kiosk-orders': '/kiosk-orders'
  return [...block[1].matchAll(/['"]?([a-z][a-z0-9-]*)['"]?\s*:\s*'([^']+)'/g)]
    .map(([, screen, path]) => ({ screen, path }));
}

// --- Parse kiosk flow states ---
function parseKioskFlows(src) {
  const match = src.match(/KioskFlow[^=\n]*=\s*([^;]+);/s) ||
                src.match(/type KioskFlow\s*=\s*([^;]+);/s);
  if (!match) return ['idle', 'menu', 'cart', 'checkout', 'confirmation'];
  return [...match[1].matchAll(/'([^']+)'/g)].map(([, v]) => v);
}

// --- Parse order flow states ---
function parseOrderFlows(src) {
  // Matches:  type Flow = 'browse' | 'checkout' | 'done';
  const match = src.match(/^type Flow\s*=\s*([^;]+);/m) ||
                src.match(/OrderFlow[^=\n]*=\s*([^;]+);/s);
  if (!match) return ['browse', 'checkout', 'done'];
  return [...match[1].matchAll(/'([^']+)'/g)].map(([, v]) => v);
}

const surfaceSrc  = read('src/lib/surfaceRouting.ts');
const kioskSrc    = read('src/kiosk/KioskApp.tsx');
const orderSrc    = read('src/order/OrderApp.tsx');
const mainSrc     = read('src/main.tsx');

const staffScreens = parseStaffScreenPaths(surfaceSrc);
const kioskFlows   = parseKioskFlows(kioskSrc);
const orderFlows   = parseOrderFlows(orderSrc);

// Detect optional surfaces from main.tsx
const hasKiosk    = mainSrc.includes('/kiosk');
const hasKds      = mainSrc.includes('/kds');
const hasTracking = mainSrc.includes('TrackingApp') || mainSrc.includes('/track');

// --- Build Mermaid diagram ---
const lines = [];

lines.push('flowchart TD');
lines.push('');
lines.push('  Browser(["Browser Request"])');
lines.push('  Browser --> SD{"Surface Detection\\nmain.tsx"}');
lines.push('');

// Surface branches
lines.push('  SD -->|"order.hostname\\nor VITE_APP_SURFACE=order"| OS["Order App"]');
if (hasKiosk)    lines.push('  SD -->|"path = /kiosk"| KK["Kiosk App"]');
if (hasKds)      lines.push('  SD -->|"path = /kds"| KS["KDS"]');
lines.push('  SD -->|"sp.hostname or default"| SP["Staff Panel"]');
lines.push('');

// --- Order App subgraph ---
lines.push('  subgraph OrderApp["Order App  (order.*)"]');
lines.push('    direction TB');
lines.push('    ORoot["/"]');

// Flow states
const flowLabels = { browse: 'Browse\\n(menu / cart / account)', checkout: 'Checkout', done: 'Order Placed' };
for (const f of orderFlows) {
  const label = flowLabels[f] ?? f;
  lines.push(`    OF_${f}["${label}"]`);
}
if (orderFlows.includes('browse'))   lines.push('    ORoot --> OF_browse');
if (orderFlows.includes('browse') && orderFlows.includes('checkout'))  lines.push('    OF_browse -->|"Proceed to checkout"| OF_checkout');
if (orderFlows.includes('checkout') && orderFlows.includes('browse'))  lines.push('    OF_checkout -->|"Back"| OF_browse');
if (orderFlows.includes('checkout') && orderFlows.includes('done'))    lines.push('    OF_checkout -->|"Order submitted"| OF_done');

if (hasTracking) {
  lines.push('    OTrack["/track?token="]');
  lines.push('    TrackView["Order Tracking"]');
  lines.push('    OTrack --> TrackView');
  if (orderFlows.includes('done')) lines.push('    OF_done -->|"Track link"| OTrack');
}
lines.push('  end');
lines.push('');
lines.push('  OS --> OrderApp');
lines.push('');

// --- Kiosk App subgraph ---
if (hasKiosk && kioskFlows.length) {
  lines.push('  subgraph KioskApp["/kiosk"]');
  lines.push('    direction TB');
  const kioskLabels = { idle: 'Idle / Welcome', menu: 'Menu Browse', cart: 'Cart', checkout: 'Checkout', confirmation: 'Order Confirmed' };
  for (const f of kioskFlows) {
    lines.push(`    KF_${f}["${kioskLabels[f] ?? f}"]`);
  }
  const kioskSeq = kioskFlows;
  for (let i = 0; i < kioskSeq.length - 1; i++) {
    lines.push(`    KF_${kioskSeq[i]} --> KF_${kioskSeq[i + 1]}`);
  }
  if (kioskFlows.includes('confirmation') && kioskFlows.includes('idle')) {
    lines.push('    KF_confirmation -->|"Done / timeout"| KF_idle');
  }
  if (kioskFlows.includes('menu') && kioskFlows.includes('idle')) {
    lines.push('    KF_menu -->|"60 s inactivity"| KF_idle');
  }
  lines.push('  end');
  lines.push('  KK --> KioskApp');
  lines.push('');
}

// --- KDS subgraph ---
if (hasKds) {
  lines.push('  subgraph KDSApp["/kds"]');
  lines.push('    KDS_View["Kitchen Display\\nReal-time order grid\\npending → preparing → ready"]');
  lines.push('  end');
  lines.push('  KS --> KDSApp');
  lines.push('');
}

// --- Staff Panel subgraph ---
lines.push('  subgraph StaffPanel["Staff Panel  (sp.*)"]');
lines.push('    direction TB');
lines.push('    SAuth{"Auth Check"}');
lines.push('    SAuth -->|"not logged in"| SLogin["LoginScreen"]');
lines.push('    SAuth -->|"not staff"| SDenied["StaffAccessDeniedScreen"]');
lines.push('    SAuth -->|"staff ✓"| SNav["Nav"]');
lines.push('');
for (const { screen, path } of staffScreens) {
  const id = `SS_${screen.replace(/-/g, '_')}`;
  lines.push(`    SNav --> ${id}["${path}\\n${screen}"]`);
}
lines.push('  end');
lines.push('  SP --> StaffPanel');

const diagram = lines.join('\n');

// --- Compose markdown ---
const now = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const staffTable = staffScreens
  .map(({ screen, path }) => `| \`${path}\` | ${screen} |`)
  .join('\n');

const md = `# Route Chart

> Auto-generated by \`scripts/generate-route-chart.js\` — do not edit by hand.
> Last updated: **${now}**

## Architecture Overview

| Surface | Entry Hostname / Path | Auth |
|---|---|---|
| Order App | \`order.*\` or \`VITE_APP_SURFACE=order\` | Public |
| Kiosk | any host \`/kiosk\` | Secret key |
| KDS | any host \`/kds\` | Secret key |
| Staff Panel | \`sp.*\` or default | Staff login |

## Visual Diagram

\`\`\`mermaid
${diagram}
\`\`\`

## Staff Panel Routes

| Path | Screen |
|---|---|
${staffTable}

## Order App Flow

| State | Description |
|---|---|
${orderFlows.map(f => `| \`${f}\` | ${f === 'browse' ? 'Menu / cart / account tabs' : f === 'checkout' ? 'Address, phone, fulfillment form' : 'Confirmation + tracking link'} |`).join('\n')}

${hasTracking ? `## Tracking\n\n- Path: \`/track?token={trackToken}\`\n- Public, no auth\n- Real-time status updates via Supabase subscription\n\n` : ''}${hasKiosk ? `## Kiosk Flow\n\n${kioskFlows.map((f, i) => `${i + 1}. **${f}**`).join(' → ')}\n\nInactivity timeout: 60 s → resets to **idle**\n\n` : ''}${hasKds ? `## Kitchen Display\n\n- Single persistent view at \`/kds\`\n- Real-time order grid: pending → preparing → ready\n` : ''}`;

writeFileSync(resolve(root, 'docs/ROUTE_CHART.md'), md);
console.log('docs/ROUTE_CHART.md updated (' + now + ')');
