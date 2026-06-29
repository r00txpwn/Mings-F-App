/** Reads a migration SQL file and prints JSON for MCP apply_migration. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = process.argv[2];
const name = process.argv[3];
if (!file || !name) {
  console.error('Usage: node scripts/mcp-migration-payload.mjs <sql-file> <snake_name>');
  process.exit(1);
}
const query = fs
  .readFileSync(path.resolve(file), 'utf8')
  .replace(/^\/\*[\s\S]*?\*\/\s*/m, '')
  .trim();
console.log(JSON.stringify({ name, query }));
