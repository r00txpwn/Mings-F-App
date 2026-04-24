/**
 * Concatenate Edge shared modules + handler into one file for MCP deploy
 * (one `files[]` entry → smaller JSON than multi-file layout).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fnDir = path.join(__dirname, '..', 'supabase', 'functions');

const read = (rel) => fs.readFileSync(path.join(fnDir, rel), 'utf8').replace(/\r\n/g, '\n');

const cors = read('_shared/cors.ts');
const geo = read('_shared/geo.ts');
const money = read('_shared/money.ts');
const kitchen = read('_shared/kitchenAcceptance.ts');

let index = read('online-order-create/index.ts');
// Drop imports satisfied by inlined modules above
index = index.replace(
  /^import \{ corsPreflightResponse, jsonResponse \} from '\.\.\/_shared\/cors\.ts';\r?\n/m,
  '',
);
index = index.replace(/^import \{ pointInGeoJsonPolygon \} from '\.\.\/_shared\/geo\.ts';\r?\n/m, '');
index = index.replace(/^import \{ roundMoney \} from '\.\.\/_shared\/money\.ts';\r?\n/m, '');
index = index.replace(
  /^import \{\r?\n  acceptingKitchen,\r?\n  getKitchenStatus,\r?\n  isKitchenPaused,\r?\n  type KitchenSettings,\r?\n\} from '\.\.\/_shared\/kitchenAcceptance\.ts';\r?\n/m,
  '',
);

const combined = `${cors}\n\n${geo}\n\n${money}\n\n${kitchen}\n\n${index}`;

const outTs = path.join(__dirname, '..', 'test-results', 'online-order-create-inline.ts');
fs.writeFileSync(outTs, combined, 'utf8');

const payload = {
  name: 'online-order-create',
  entrypoint_path: 'functions/online-order-create/index.ts',
  verify_jwt: false,
  files: [
    {
      name: 'functions/online-order-create/index.ts',
      content: combined,
    },
  ],
};

const outJson = process.argv[2];
const text = JSON.stringify(payload);
if (outJson) {
  fs.writeFileSync(outJson, text, 'utf8');
  process.stderr.write(`Wrote ${outTs} and ${outJson} (${text.length} chars JSON)\n`);
} else {
  process.stdout.write(text);
}
