/**
 * Cuts a release locally: derives the semver bump from conventional commits
 * since the last tag, lets you edit the generated notes, then bumps
 * package.json, prepends to CHANGELOG.md, commits and tags.
 *
 * It never pushes — it prints the push command so shipping stays a deliberate
 * act (see .cursor/rules/git-first-before-production.mdc).
 *
 * Usage:
 *   npm run release                  # derive the bump from commits
 *   npm run release -- minor         # force a bump level
 *   npm run release -- --dry-run     # show what would happen, change nothing
 *   npm run release -- --skip-checks # skip typecheck/lint/test
 *   npm run release -- --force-branch
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { bumpVersion, renderNotes, summarizeCommits } from './lib/release-notes.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG = path.join(root, 'CHANGELOG.md');
const DRAFT = path.join(root, 'RELEASE_NOTES.draft.md');
const RELEASE_BRANCH = 'main';
const INSERT_MARKER = '<!-- releases -->';
const BUMP_LEVELS = ['major', 'minor', 'patch'];

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
const forcedBump = argv.find((arg) => BUMP_LEVELS.includes(arg)) ?? null;

const dryRun = flags.has('--dry-run');
const skipChecks = flags.has('--skip-checks');
const forceBranch = flags.has('--force-branch');

function fail(message, hint) {
  console.error(`\n[release] ${message}`);
  if (hint) console.error(`          ${hint}`);
  process.exit(1);
}

function git(args) {
  // stderr is piped, not inherited, so probes like `git fetch` on a repo with no
  // remote fail quietly and the script can report it in its own words.
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function step(message) {
  console.log(`[release] ${message}`);
}

// --- Guards -----------------------------------------------------------------

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== RELEASE_BRANCH && !forceBranch) {
  fail(
    `Releases are cut from ${RELEASE_BRANCH}, but you are on "${branch}".`,
    `Merge first, or re-run with --force-branch if you know what you are doing.`,
  );
}

if (git(['status', '--porcelain'])) {
  fail('Working tree is not clean.', 'Commit, stash, or ignore the outstanding changes first.');
}

function gitSucceeds(args) {
  try {
    git(args);
    return true;
  } catch {
    return false;
  }
}

step('Fetching origin…');
if (!gitSucceeds(['fetch', '--quiet', '--tags', 'origin'])) {
  step('Could not reach origin — skipping the sync check.');
} else if (!gitSucceeds(['rev-parse', '--verify', `origin/${branch}`])) {
  step(`No origin/${branch} yet — skipping the sync check.`);
} else {
  const behind = Number(git(['rev-list', '--count', `HEAD..origin/${branch}`]));
  if (behind > 0) {
    fail(
      `Branch is ${behind} commit(s) behind origin/${branch}.`,
      'Run "git pull --ff-only" so the tag points at what will actually ship.',
    );
  }
  const ahead = Number(git(['rev-list', '--count', `origin/${branch}..HEAD`]));
  if (ahead > 0) step(`Note: ${ahead} local commit(s) not yet on origin/${branch}.`);
}

if (!gitSucceeds(['describe', '--tags', '--abbrev=0'])) {
  fail(
    'No git tags exist, so there is no range to build release notes from.',
    'Tag the current release first: git tag -a v1.0.0 -m "v1.0.0" && git push --tags',
  );
}
const lastTag = git(['describe', '--tags', '--abbrev=0']);

// --- Collect commits --------------------------------------------------------

const RECORD = '\u001e';
const FIELD = '\u001f';
const raw = git(['log', `${lastTag}..HEAD`, `--pretty=format:%s${FIELD}%b${RECORD}`]);
const commits = raw
  .split(RECORD)
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [subject, body = ''] = entry.split(FIELD);
    return { subject: subject.trim(), body: body.trim() };
  });

if (commits.length === 0) fail(`No commits since ${lastTag} — nothing to release.`);

// --- Gates (after the cheap checks, so a no-op release fails fast) -----------

if (skipChecks) {
  step('Skipping typecheck/lint/test (--skip-checks).');
} else {
  for (const script of ['typecheck', 'lint', 'test']) {
    step(`Running npm run ${script}…`);
    try {
      execSync(`npm run ${script}`, { cwd: root, stdio: 'inherit' });
    } catch {
      fail(`npm run ${script} failed.`, 'Fix it, or re-run with --skip-checks.');
    }
  }
}

// --- Version and notes ------------------------------------------------------

const { entries, bump } = summarizeCommits(commits);
const level = forcedBump ?? bump;
const currentVersion = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const nextVersion = bumpVersion(currentVersion, level);
const date = new Date().toISOString().slice(0, 10);

console.log(
  `\n[release] ${commits.length} commit(s) since ${lastTag}; ` +
    `${entries.length} noteworthy. Bump: ${level}${forcedBump ? ' (forced)' : ' (derived)'}.`,
);
console.log(`[release] ${currentVersion} → ${nextVersion}\n`);

const notes = renderNotes({ version: nextVersion, date, entries });

if (dryRun) {
  console.log(notes);
  step('Dry run — nothing was changed.');
  process.exit(0);
}

// --- Edit pass --------------------------------------------------------------

writeFileSync(DRAFT, notes);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log(notes);
const answer = await rl.question(
  `Draft written to ${path.relative(root, DRAFT)}.\n` +
    `Edit the wording so it reads like product changes, then press Enter to continue (or type "abort"): `,
);
rl.close();

if (answer.trim().toLowerCase() === 'abort') {
  rmSync(DRAFT, { force: true });
  fail('Aborted. Nothing was changed.');
}

const finalNotes = readFileSync(DRAFT, 'utf8').trim();
if (!finalNotes) {
  rmSync(DRAFT, { force: true });
  fail('Release notes are empty — aborting rather than writing a blank entry.');
}

// --- Apply ------------------------------------------------------------------

if (!existsSync(CHANGELOG)) fail('CHANGELOG.md is missing.');
const changelog = readFileSync(CHANGELOG, 'utf8');
if (!changelog.includes(INSERT_MARKER)) {
  fail(`CHANGELOG.md is missing its "${INSERT_MARKER}" marker.`);
}
writeFileSync(
  CHANGELOG,
  changelog.replace(INSERT_MARKER, `${INSERT_MARKER}\n\n${finalNotes}`),
);
step('Updated CHANGELOG.md');

execSync(`npm version ${nextVersion} --no-git-tag-version --allow-same-version`, {
  cwd: root,
  stdio: 'inherit',
});
step(`Set package version to ${nextVersion}`);

rmSync(DRAFT, { force: true });

const tag = `v${nextVersion}`;
const touched = ['CHANGELOG.md', 'package.json', 'package-lock.json'].filter((file) =>
  existsSync(path.join(root, file)),
);
git(['add', ...touched]);
git(['commit', '-m', `chore(release): ${tag}`]);
git(['tag', '-a', tag, '-m', tag]);

console.log(`\n[release] Committed and tagged ${tag} locally. Nothing was pushed.`);
console.log(`[release] To ship it:\n\n    git push --follow-tags origin ${branch}\n`);
