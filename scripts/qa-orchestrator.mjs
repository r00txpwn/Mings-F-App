#!/usr/bin/env node
/**
 * QA Orchestrator — called by GitHub Actions (and manually via `npm run qa`).
 *
 * Modes:
 *   MODE=qa-agent  (default) — full QA: reads test results, asks Claude for
 *                              analysis, writes docs/QA_STATUS.md
 *   MODE=doc-update          — reads changed src files, asks Claude to update
 *                              APP_STRUCTURE.md
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFile(path, fallback = '') {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return fallback;
  }
}

function readJsonFile(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function runCommand(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: ROOT, ...options }).trim();
  } catch (e) {
    return e.stdout ?? '';
  }
}

function collectSourceSnapshot() {
  const files = [
    'src/main.tsx',
    'src/App.tsx',
    'src/lib/supabase.ts',
    'src/translations.ts',
    'src/services/analytics/kpiCalculations.ts',
    'src/services/analytics/validation.ts',
    'src/services/analytics/financeService.ts',
    'src/services/deliveryZones.ts',
  ];

  return files
    .map((f) => {
      const full = join(ROOT, f);
      const content = readFile(full);
      if (!content) return null;
      // Truncate very long files to keep context manageable
      const truncated = content.length > 6000
        ? content.slice(0, 6000) + '\n… (truncated)'
        : content;
      return `### ${f}\n\`\`\`typescript\n${truncated}\n\`\`\``;
    })
    .filter(Boolean)
    .join('\n\n');
}

function collectEdgeFunctionSignatures() {
  const fnDir = join(ROOT, 'supabase/functions');
  if (!existsSync(fnDir)) return 'No edge functions directory found.';

  const result = runCommand(`find ${fnDir} -name "index.ts" -not -path "*/_shared/*"`)
    .split('\n')
    .filter(Boolean)
    .map((f) => {
      const rel = f.replace(ROOT + '/', '');
      const content = readFile(f);
      // Just grab the first 80 lines for contract checking
      const lines = content.split('\n').slice(0, 80).join('\n');
      return `### ${rel}\n\`\`\`typescript\n${lines}\n\`\`\``;
    })
    .join('\n\n');

  return result || 'Could not read edge functions.';
}

function collectMigrationCount() {
  const dir = join(ROOT, 'supabase/migrations');
  if (!existsSync(dir)) return 0;
  try {
    return readFileSync(dir).toString().split('\n').filter(Boolean).length;
  } catch {
    return runCommand(`ls ${dir} | wc -l`);
  }
}

// ---------------------------------------------------------------------------
// Mode: doc-update
// ---------------------------------------------------------------------------

async function runDocUpdate(client) {
  const diff = runCommand('git diff HEAD~1 HEAD -- src/ supabase/ package.json');
  const appStructure = readFile(join(ROOT, 'APP_STRUCTURE.md'));

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are the documentation maintainer for Mings F-App, a React + Supabase restaurant management system.
Your job is to keep APP_STRUCTURE.md accurate and up to date.
Rules:
- Preserve all existing sections; only update what has actually changed.
- Be factual — only document what the diff shows was added/changed/removed.
- Keep descriptions concise (one sentence per component).
- If nothing architecturally significant changed, return the original document unchanged.`,
    messages: [
      {
        role: 'user',
        content: `Here is the current APP_STRUCTURE.md:\n\n${appStructure}\n\n---\n\nHere is the git diff of the latest push:\n\n\`\`\`diff\n${diff.slice(0, 8000)}\n\`\`\`\n\nReturn the FULL updated APP_STRUCTURE.md. Output only the markdown document, nothing else.`,
      },
    ],
  });

  const updated = message.content[0].type === 'text' ? message.content[0].text : appStructure;
  writeFileSync(join(ROOT, 'APP_STRUCTURE.md'), updated, 'utf8');
  console.log('✅ APP_STRUCTURE.md updated.');
}

// ---------------------------------------------------------------------------
// Mode: qa-agent (default)
// ---------------------------------------------------------------------------

async function runQaAgent(client) {
  ensureDir(join(ROOT, 'test-results'));
  ensureDir(join(ROOT, 'docs'));

  // Collect all check results
  const typecheckOut  = readFile(join(ROOT, 'test-results/typecheck.txt'));
  const lintOut       = readFile(join(ROOT, 'test-results/lint.txt'));
  const buildOut      = readFile(join(ROOT, 'test-results/build.txt'));
  const unitConsole   = readFile(join(ROOT, 'test-results/unit-console.txt'));
  const e2eConsole    = readFile(join(ROOT, 'test-results/e2e-console.txt'));
  const unitJson      = readJsonFile(join(ROOT, 'test-results/unit-results.json'));
  const e2eJson       = readJsonFile(join(ROOT, 'test-results/e2e-results.json'));

  // Status flags from env (set by GH Actions)
  const flags = {
    typecheck: process.env.TYPECHECK_FAILED === 'true' ? 'FAILED' : 'PASSED',
    lint:      process.env.LINT_FAILED      === 'true' ? 'FAILED' : 'PASSED',
    build:     process.env.BUILD_FAILED     === 'true' ? 'FAILED' : 'PASSED',
    unit:      process.env.UNIT_FAILED      === 'true' ? 'FAILED' : 'PASSED',
    e2e:       process.env.E2E_FAILED       === 'true' ? 'FAILED' : (e2eJson ? 'PASSED' : 'SKIPPED'),
  };

  // Summarise unit test results
  let unitSummary = '';
  if (unitJson?.testResults) {
    const passed = unitJson.testResults.filter((t) => t.status === 'passed').length;
    const failed = unitJson.testResults.filter((t) => t.status === 'failed').length;
    unitSummary = `Unit tests: ${passed} passed, ${failed} failed`;
  }

  // Current docs
  const existingStatus = readFile(join(ROOT, 'docs/QA_STATUS.md'));
  const appStructure   = readFile(join(ROOT, 'APP_STRUCTURE.md'), '(not found)').slice(0, 3000);
  const routeChart     = readFile(join(ROOT, 'docs/ROUTE_CHART.md'), '(not found)').slice(0, 2000);
  const comboDoc       = readFile(join(ROOT, 'docs/COMBO_DEALS.md'), '(not found)').slice(0, 1000);

  // Source snapshot for logic analysis
  const sourceSnapshot = collectSourceSnapshot();
  const edgeFunctions  = collectEdgeFunctionSignatures();

  const runUrl = process.env.GITHUB_RUN_URL ?? 'local run';
  const now = new Date().toISOString();

  const prompt = `You are the Master QA Agent for Mings F-App, a React + Supabase restaurant management system.

## Check Results (${now})
| Check | Status |
|-------|--------|
| TypeScript | ${flags.typecheck} |
| ESLint | ${flags.lint} |
| Build | ${flags.build} |
| Unit Tests | ${flags.unit} |
| E2E Smoke | ${flags.e2e} |

${unitSummary}

## TypeScript Output
\`\`\`
${typecheckOut.slice(0, 2000) || '(clean)'}
\`\`\`

## ESLint Output
\`\`\`
${lintOut.slice(0, 2000) || '(clean)'}
\`\`\`

## Build Output
\`\`\`
${buildOut.slice(0, 2000) || '(clean)'}
\`\`\`

## Unit Test Console
\`\`\`
${unitConsole.slice(0, 2000) || '(no output)'}
\`\`\`

## E2E Test Console
\`\`\`
${e2eConsole.slice(0, 2000) || '(skipped or no output)'}
\`\`\`

## Current APP_STRUCTURE.md (excerpt)
${appStructure}

## Route Chart (excerpt)
${routeChart}

## Feature Doc: Combo Deals (excerpt)
${comboDoc}

## Key Source Files
${sourceSnapshot}

## Edge Function Signatures (first 80 lines each)
${edgeFunctions.slice(0, 4000)}

---

Your task: Write a thorough QA report as a Markdown document for \`docs/QA_STATUS.md\`.

Structure the report with these sections:
1. **Status Badge** — one-line overall: 🟢 HEALTHY / 🟡 DEGRADED / 🔴 CRITICAL
2. **Run Info** — date, run URL, what triggered this
3. **Check Results** — table of all checks with status + key error excerpts
4. **Failures & Root Causes** — for each failure: what broke, why, severity (critical/major/minor)
5. **Logic Issues** — from reading the source: anything that looks logically wrong, risky, or inconsistent with the documentation
6. **Documentation vs Code Gaps** — things documented but not implemented, or implemented but not documented
7. **Improvements** — prioritised list of concrete improvements (not vague suggestions)
8. **History** — append a one-line summary to the history table (keep existing history rows from the current QA_STATUS.md)

Rules:
- Be specific: reference file names and function names.
- Don't repeat the full source code back — just reference by name.
- Severity levels: CRITICAL (blocks production), MAJOR (feature broken), MINOR (cosmetic/warning), INFO (suggestion).
- If all checks passed, still look for logic issues and improvement opportunities in the source.
- The history table format: | Date | Status | Summary |

Return ONLY the Markdown document. No preamble, no explanation.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: 'You are an expert QA engineer and code reviewer. You produce precise, actionable, well-structured QA reports. You never pad reports with generic observations — every finding is specific to the actual code shown.',
    messages: [{ role: 'user', content: prompt }],
  });

  const report = message.content[0].type === 'text' ? message.content[0].text : '';
  writeFileSync(join(ROOT, 'docs/QA_STATUS.md'), report, 'utf8');

  console.log('✅ docs/QA_STATUS.md written.');
  console.log('');
  console.log('=== QA SUMMARY ===');
  console.log(`TypeScript : ${flags.typecheck}`);
  console.log(`ESLint     : ${flags.lint}`);
  console.log(`Build      : ${flags.build}`);
  console.log(`Unit tests : ${flags.unit}`);
  console.log(`E2E        : ${flags.e2e}`);

  // Exit 1 only on hard failures (build or tests broken)
  if (flags.build === 'FAILED' || flags.unit === 'FAILED') {
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set. Skipping Claude analysis.');
    // Write a placeholder so the commit step doesn't fail
    ensureDir(join(ROOT, 'docs'));
    const placeholder = `# QA Status\n\n> No ANTHROPIC_API_KEY — Claude analysis skipped.\n\nRun at: ${new Date().toISOString()}\n`;
    writeFileSync(join(ROOT, 'docs/QA_STATUS.md'), placeholder, 'utf8');
    process.exit(0);
  }

  const client = new Anthropic({ apiKey });
  const mode = process.env.MODE ?? 'qa-agent';

  if (mode === 'doc-update') {
    await runDocUpdate(client);
  } else {
    await runQaAgent(client);
  }
}

main().catch((err) => {
  console.error('QA Orchestrator error:', err.message);
  process.exit(1);
});
