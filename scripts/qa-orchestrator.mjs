#!/usr/bin/env node
/**
 * QA Orchestrator — called by GitHub Actions (and manually via `npm run qa`).
 *
 * Modes:
 *   MODE=qa-agent  (default) — full QA: reads test results, asks Claude for
 *                              analysis, writes docs/QA_STATUS.md
 *   MODE=doc-update          — reads changed src files, asks Claude to update
 *                              APP_STRUCTURE.md
 *
 * AI backend (in order of preference):
 *   1. ANTHROPIC_API_KEY set → uses @anthropic-ai/sdk directly
 *   2. `claude` CLI available → uses Claude Code CLI (Pro subscription, free)
 *   3. Neither → writes raw test output to QA_STATUS.md without AI analysis
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { execSync, execFileSync } from 'child_process';
import { join, dirname, relative } from 'path';
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

/** Detect which AI backend is available. */
function detectBackend() {
  if (process.env.ANTHROPIC_API_KEY) return 'sdk';
  // Don't attempt claude CLI as a subprocess — it requires an interactive TTY
  // and will hang/timeout when spawned from Node. Use ANTHROPIC_API_KEY instead.
  return 'none';
}

/**
 * Ask Claude via the Anthropic SDK.
 * Returns null if ANTHROPIC_API_KEY is not set.
 */
async function askClaude(system, userPrompt) {
  const backend = detectBackend();

  if (backend === 'sdk') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return msg.content[0].type === 'text' ? msg.content[0].text : '';
  }

  return null;
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
      const truncated = content.length > 6000 ? content.slice(0, 6000) + '\n… (truncated)' : content;
      return `### ${f}\n\`\`\`typescript\n${truncated}\n\`\`\``;
    })
    .filter(Boolean)
    .join('\n\n');
}

/** Recursively find edge function index.ts files (excludes _shared/). */
function findEdgeFunctionIndexFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_shared') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      findEdgeFunctionIndexFiles(full, out);
    } else if (entry.isFile() && entry.name === 'index.ts') {
      out.push(full);
    }
  }
  return out;
}

function collectEdgeFunctionSignatures() {
  const fnDir = join(ROOT, 'supabase/functions');
  if (!existsSync(fnDir)) return 'No edge functions directory found.';
  const files = findEdgeFunctionIndexFiles(fnDir).sort();
  if (files.length === 0) return 'No edge function index.ts files found.';
  return files
    .map((f) => {
      const rel = relative(ROOT, f).replace(/\\/g, '/');
      const lines = readFile(f).split('\n').slice(0, 80).join('\n');
      return `### ${rel}\n\`\`\`typescript\n${lines}\n\`\`\``;
    })
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Mode: doc-update
// ---------------------------------------------------------------------------

async function runDocUpdate() {
  const diff = runCommand('git diff HEAD~1 HEAD -- src/ supabase/ package.json');
  const appStructure = readFile(join(ROOT, 'APP_STRUCTURE.md'));

  const system = `You are the documentation maintainer for Mings F-App, a React + Supabase restaurant management system.
Your job is to keep APP_STRUCTURE.md accurate and up to date.
Rules:
- Preserve all existing sections; only update what has actually changed.
- Be factual — only document what the diff shows was added/changed/removed.
- Keep descriptions concise (one sentence per component).
- If nothing architecturally significant changed, return the original document unchanged.`;

  const userPrompt = `Here is the current APP_STRUCTURE.md:\n\n${appStructure}\n\n---\n\nHere is the git diff:\n\n\`\`\`diff\n${diff.slice(0, 8000)}\n\`\`\`\n\nReturn the FULL updated APP_STRUCTURE.md. Output only the markdown document, nothing else.`;

  const updated = await askClaude(system, userPrompt);
  if (updated) {
    writeFileSync(join(ROOT, 'APP_STRUCTURE.md'), updated, 'utf8');
    console.log('✅ APP_STRUCTURE.md updated.');
  } else {
    console.log('⚠️  No AI backend available — APP_STRUCTURE.md unchanged.');
  }
}

// ---------------------------------------------------------------------------
// Mode: qa-agent (default)
// ---------------------------------------------------------------------------

function collectPlanCoverage() {
  try {
    execSync('node scripts/qa-plan-coverage.mjs', { encoding: 'utf8', cwd: ROOT, stdio: 'pipe' });
  } catch {
    // advisory — plan diff must not block QA
  }
  return readJsonFile(join(ROOT, 'test-results/plan-coverage.json'));
}

async function runQaAgent() {
  ensureDir(join(ROOT, 'test-results'));
  ensureDir(join(ROOT, 'docs'));

  // In CI, result files are pre-written by the workflow steps.
  // Locally, run the checks now and capture output.
  const isCI = !!process.env.CI;
  if (!isCI) {
    console.log('Running checks locally...\n');

    const checks = [
      { name: 'typecheck', cmd: 'npm run typecheck', out: 'test-results/typecheck.txt', envFlag: 'TYPECHECK_FAILED' },
      { name: 'lint',      cmd: 'npm run lint',      out: 'test-results/lint.txt',      envFlag: 'LINT_FAILED' },
      { name: 'build',     cmd: 'npm run build',     out: 'test-results/build.txt',     envFlag: 'BUILD_FAILED' },
      { name: 'unit',      cmd: 'npm test -- --reporter=verbose --reporter=json --outputFile=test-results/unit-results.json', out: 'test-results/unit-console.txt', envFlag: 'UNIT_FAILED' },
      { name: 'plan',      cmd: 'node scripts/qa-plan-coverage.mjs', out: 'test-results/plan-console.txt', envFlag: 'PLAN_FAILED', advisory: true },
    ];

    for (const c of checks) {
      process.stdout.write(`  ${c.name.padEnd(12)}`);
      try {
        const out = execSync(c.cmd, { encoding: 'utf8', cwd: ROOT, stdio: 'pipe' });
        writeFileSync(join(ROOT, c.out), out, 'utf8');
        process.env[c.envFlag] = 'false';
        console.log(c.advisory ? '📋 OK (advisory)' : '✅ PASSED');
      } catch (e) {
        const out = (e.stdout ?? '') + (e.stderr ?? '');
        writeFileSync(join(ROOT, c.out), out, 'utf8');
        if (c.advisory) {
          process.env[c.envFlag] = 'false';
          console.log('📋 OK (advisory)');
        } else {
          process.env[c.envFlag] = 'true';
          console.log('❌ FAILED');
        }
      }
    }
    console.log('');
  }

  const typecheckOut = readFile(join(ROOT, 'test-results/typecheck.txt'));
  const lintOut      = readFile(join(ROOT, 'test-results/lint.txt'));
  const buildOut     = readFile(join(ROOT, 'test-results/build.txt'));
  const unitConsole  = readFile(join(ROOT, 'test-results/unit-console.txt'));
  const e2eConsole   = readFile(join(ROOT, 'test-results/e2e-console.txt'));
  const unitJson     = readJsonFile(join(ROOT, 'test-results/unit-results.json'));
  const e2eJson      = readJsonFile(join(ROOT, 'test-results/e2e-results.json'));
  const planCoverage = collectPlanCoverage();

  const flags = {
    typecheck: process.env.TYPECHECK_FAILED === 'true' ? 'FAILED' : 'PASSED',
    lint:      process.env.LINT_FAILED      === 'true' ? 'FAILED' : 'PASSED',
    build:     process.env.BUILD_FAILED     === 'true' ? 'FAILED' : 'PASSED',
    unit:      process.env.UNIT_FAILED      === 'true' ? 'FAILED' : 'PASSED',
    e2e:       process.env.E2E_FAILED       === 'true' ? 'FAILED' : (e2eJson ? 'PASSED' : 'SKIPPED'),
  };

  let unitSummary = '';
  if (unitJson?.testResults) {
    const passed = unitJson.testResults.filter((t) => t.status === 'passed').length;
    const failed = unitJson.testResults.filter((t) => t.status === 'failed').length;
    unitSummary = `Unit tests: ${passed} passed, ${failed} failed`;
  }

  const existingStatus = readFile(join(ROOT, 'docs/QA_STATUS.md'));
  const testPlan       = readFile(join(ROOT, 'docs/TEST_PLAN.md'), '(not found)').slice(0, 4000);
  const planMarkdown   = planCoverage?.markdown ?? '(plan coverage not available)';
  const appStructure   = readFile(join(ROOT, 'APP_STRUCTURE.md'), '(not found)').slice(0, 3000);
  const routeChart     = readFile(join(ROOT, 'docs/ROUTE_CHART.md'), '(not found)').slice(0, 2000);
  const comboDoc       = readFile(join(ROOT, 'docs/COMBO_DEALS.md'), '(not found)').slice(0, 1000);
  const sourceSnapshot = collectSourceSnapshot();
  const edgeFunctions  = collectEdgeFunctionSignatures();
  const runUrl         = process.env.GITHUB_RUN_URL ?? 'local run';
  const now            = new Date().toISOString();
  const backend        = detectBackend();

  console.log(`AI backend: ${backend === 'sdk' ? 'Anthropic SDK (API key)' : 'none — set ANTHROPIC_API_KEY for AI analysis'}`);

  const system = 'You are an expert QA engineer and code reviewer. You produce precise, actionable, well-structured QA reports. You never pad reports with generic observations — every finding is specific to the actual code shown.';

  const userPrompt = `You are the Master QA Agent for Mings F-App, a React + Supabase restaurant management system.

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

## Test plan (docs/TEST_PLAN.md excerpt)
${testPlan}

## Plan vs actual (machine diff)
${planMarkdown}

---

Your task: Write a thorough QA report as a Markdown document for docs/QA_STATUS.md.

Structure the report with these sections:
1. **Status Badge** — one-line overall: 🟢 HEALTHY / 🟡 DEGRADED / 🔴 CRITICAL (base this on exit-code gates only: typecheck, lint, build, unit — NOT on open test-plan gaps)
2. **Run Info** — date, run URL, what triggered this
3. **Check Results** — table of all checks with status + key error excerpts
4. **Test Plan Coverage** — summary from plan diff: % covered, critical gaps list; propose new test cases as a backlog (do not auto-mark plan items as done)
5. **Failures & Root Causes** — for each failure: what broke, why, severity (critical/major/minor)
6. **Logic Issues** — from reading the source: anything logically wrong, risky, or inconsistent with documentation
7. **Documentation vs Code Gaps** — things documented but not implemented, or implemented but not documented
8. **Improvements** — prioritised list of concrete improvements (not vague suggestions); reference TEST_PLAN.md gap IDs where relevant
9. **History** — append a one-line summary to the history table (keep existing rows from current QA_STATUS.md)

Rules:
- Be specific: reference file names and function names.
- Severity levels: CRITICAL (blocks production), MAJOR (feature broken), MINOR (cosmetic/warning), INFO (suggestion).
- History table format: | Date | Status | Summary |

Return ONLY the Markdown document. No preamble.`;

  const report = await askClaude(system, userPrompt);

  if (report) {
    writeFileSync(join(ROOT, 'docs/QA_STATUS.md'), report, 'utf8');
    console.log('✅ docs/QA_STATUS.md written.');
  } else {
    // No AI backend — write a plain text summary of results
    const plain = `# QA Status\n\n> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).\n> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.\n\n## Last Run: ${now}\n\n| Check | Status |\n|-------|--------|\n| TypeScript | ${flags.typecheck} |\n| ESLint | ${flags.lint} |\n| Build | ${flags.build} |\n| Unit Tests | ${flags.unit} |\n| E2E | ${flags.e2e} |\n\n## Test Plan Coverage\n\n${planMarkdown}\n\n## Unit Test Output\n\`\`\`\n${unitConsole.slice(0, 3000)}\n\`\`\`\n`;
    writeFileSync(join(ROOT, 'docs/QA_STATUS.md'), plain, 'utf8');
    console.log('⚠️  Written plain report (no AI backend).');
  }

  console.log('\n=== QA SUMMARY ===');
  console.log(`Backend    : ${backend}`);
  console.log(`TypeScript : ${flags.typecheck}`);
  console.log(`ESLint     : ${flags.lint}`);
  console.log(`Build      : ${flags.build}`);
  console.log(`Unit tests : ${flags.unit}`);
  console.log(`E2E        : ${flags.e2e}`);
  if (planCoverage?.summary) {
    console.log(`Plan cov.  : ${planCoverage.summary.coveragePct}% (${planCoverage.summary.byStatus.covered}/${planCoverage.summary.total} covered)`);
  }

  if (flags.build === 'FAILED' || flags.unit === 'FAILED') {
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const mode = process.env.MODE ?? 'qa-agent';
  if (mode === 'doc-update') {
    await runDocUpdate();
  } else {
    await runQaAgent();
  }
}

main().catch((err) => {
  console.error('QA Orchestrator error:', err.message);
  process.exit(1);
});
