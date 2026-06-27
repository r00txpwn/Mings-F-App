#!/usr/bin/env node
/**
 * Diff docs/TEST_PLAN.md against the repo.
 * Writes test-results/plan-coverage.json and prints a summary.
 * Advisory only — does not fail the build on gaps.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PLAN_PATH = join(ROOT, 'docs/TEST_PLAN.md');
const OUT_PATH = join(ROOT, 'test-results/plan-coverage.json');

const CHECKBOX_RE = /^- \[(x| )\] \*\*([a-z0-9-]+)\*\* (.+)$/;
const COVERAGE_RE = /`((?:tests\/|scripts\/)[^`]+)`/g;
const GAP_RE = /\bGAP\b/;
const PRIORITY_RE = /priority:(critical|major|minor)/;

function readPlan() {
  if (!existsSync(PLAN_PATH)) {
    return { error: 'docs/TEST_PLAN.md not found', items: [] };
  }
  const lines = readFileSync(PLAN_PATH, 'utf8').split(/\r?\n/);
  const items = [];

  for (const line of lines) {
    const m = line.match(CHECKBOX_RE);
    if (!m) continue;

    const checked = m[1] === 'x';
    const id = m[2];
    const rest = m[3];

    const coverages = [...rest.matchAll(COVERAGE_RE)].map((x) => x[1]);
    const isGap = GAP_RE.test(rest) || coverages.length === 0;
    const priority = rest.match(PRIORITY_RE)?.[1] ?? 'minor';
    const title = rest.split('|')[0].trim();

    const filesExist = coverages.map((rel) => {
      const full = join(ROOT, rel);
      return { path: rel, exists: existsSync(full) };
    });

    const missingFiles = filesExist.filter((f) => !f.exists).map((f) => f.path);
    const status =
      checked && !isGap && missingFiles.length === 0
        ? 'covered'
        : checked && missingFiles.length > 0
          ? 'broken-ref'
          : isGap || !checked
            ? 'gap'
            : 'partial';

    items.push({
      id,
      title,
      checked,
      priority,
      status,
      coverages,
      missingFiles,
    });
  }

  return { items };
}

function summarize(items) {
  const byStatus = { covered: 0, gap: 0, 'broken-ref': 0, partial: 0 };
  const gapsByPriority = { critical: [], major: [], minor: [] };

  for (const item of items) {
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    if (item.status === 'gap' || item.status === 'broken-ref') {
      gapsByPriority[item.priority].push(item);
    }
  }

  return {
    total: items.length,
    byStatus,
    gapsByPriority,
    coveragePct:
      items.length === 0 ? 0 : Math.round((byStatus.covered / items.length) * 100),
  };
}

function formatMarkdown(summary, items) {
  const lines = [
    '## Test plan coverage (machine diff)',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Items in plan | ${summary.total} |`,
    `| Covered | ${summary.byStatus.covered} |`,
    `| Gaps | ${summary.byStatus.gap} |`,
    `| Broken refs | ${summary.byStatus['broken-ref']} |`,
    `| Plan coverage | ${summary.coveragePct}% |`,
    '',
  ];

  for (const pri of ['critical', 'major', 'minor']) {
    const gaps = summary.gapsByPriority[pri];
    if (gaps.length === 0) continue;
    lines.push(`### Open gaps (${pri})`, '');
    for (const g of gaps) {
      const refNote =
        g.missingFiles.length > 0 ? ` — missing: ${g.missingFiles.join(', ')}` : '';
      lines.push(`- **${g.id}** ${g.title}${refNote}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  mkdirSync(join(ROOT, 'test-results'), { recursive: true });

  const { error, items } = readPlan();
  if (error) {
    console.error(error);
    process.exit(1);
  }

  const summary = summarize(items);
  const markdown = formatMarkdown(summary, items);

  const report = {
    generatedAt: new Date().toISOString(),
    planPath: 'docs/TEST_PLAN.md',
    summary,
    items,
    markdown,
  };

  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('Test plan coverage');
  console.log(`  Items:    ${summary.total}`);
  console.log(`  Covered:  ${summary.byStatus.covered}`);
  console.log(`  Gaps:     ${summary.byStatus.gap}`);
  console.log(`  Broken:   ${summary.byStatus['broken-ref']}`);
  console.log(`  Coverage: ${summary.coveragePct}%`);
  console.log(`  Report:   ${OUT_PATH}`);

  if (summary.gapsByPriority.critical.length > 0) {
    console.log('\nCritical gaps:');
    for (const g of summary.gapsByPriority.critical) {
      console.log(`  - ${g.id}: ${g.title}`);
    }
  }
}

main();
