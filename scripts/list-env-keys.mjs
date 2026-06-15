import fs from 'node:fs';
const file = process.argv[2] ?? '.env.vercel.mings-f-app';
if (!fs.existsSync(file)) {
  console.error('missing', file);
  process.exit(1);
}
for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=/);
  if (m) console.log(m[1], line.endsWith('=') ? '(empty)' : '(set)');
}
