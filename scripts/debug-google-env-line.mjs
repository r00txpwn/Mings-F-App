import fs from 'node:fs';
const file = '.env.vercel.mings-f-app';
const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((x) => x.includes('GOOGLE'));
if (!line) {
  console.log('none');
  process.exit(0);
}
console.log('prefix', JSON.stringify(line.slice(0, 40)));
console.log('len', line.length);
console.log('starts', line.startsWith('VITE_GOOGLE_MAPS_API_KEY='));
