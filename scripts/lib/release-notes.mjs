/**
 * Pure helpers for `scripts/release.mjs`: parsing conventional commits,
 * deriving the semver bump, and rendering the CHANGELOG section.
 *
 * Kept free of git/fs so it can be unit tested (tests/unit/releaseNotes.test.ts).
 */

const SUBJECT_RE = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?: (?<description>.+)$/;

/** Types that reach the changelog, in render order. */
export const CHANGELOG_SECTIONS = [
  { type: 'feat', heading: 'Features' },
  { type: 'fix', heading: 'Fixes' },
  { type: 'perf', heading: 'Performance' },
];

/**
 * @param {{ subject: string, body?: string }} commit
 * @returns {{ type: string, scope: string|null, description: string, breaking: boolean }|null}
 *          `null` when the subject is not a conventional commit.
 */
export function parseCommit({ subject, body = '' }) {
  const match = SUBJECT_RE.exec(subject.trim());
  if (!match?.groups) return null;
  const { type, scope, bang, description } = match.groups;
  return {
    type,
    scope: scope ?? null,
    description,
    breaking: Boolean(bang) || /^BREAKING[ -]CHANGE:/m.test(body),
  };
}

/** Bot and CI commits never describe a product change. */
export function isReleaseNoteworthy(commit, parsed) {
  if (!parsed) return false;
  if (commit.subject.includes('[skip ci]')) return false;
  return CHANGELOG_SECTIONS.some((section) => section.type === parsed.type);
}

/**
 * Splits raw commits into the entries that land in the changelog and the
 * bump level implied by *all* of them (a breaking chore still forces a major).
 * @param {Array<{ subject: string, body?: string }>} commits
 */
export function summarizeCommits(commits) {
  const entries = [];
  let breaking = false;
  let feature = false;

  for (const commit of commits) {
    const parsed = parseCommit(commit);
    if (!parsed) continue;
    if (parsed.breaking) breaking = true;
    if (parsed.type === 'feat') feature = true;
    if (isReleaseNoteworthy(commit, parsed)) entries.push(parsed);
  }

  return { entries, bump: breaking ? 'major' : feature ? 'minor' : 'patch' };
}

/**
 * @param {string} version plain `major.minor.patch`
 * @param {'major'|'minor'|'patch'} level
 */
export function bumpVersion(version, level) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Cannot bump non-plain semver version "${version}"`);
  const [major, minor, patch] = match.slice(1).map(Number);
  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  if (level === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(`Unknown bump level "${level}"`);
}

/**
 * Renders one CHANGELOG section. Entries keep their commit wording; the release
 * script hands the result to the user to edit before anything is committed.
 * @param {{ version: string, date: string, entries: ReturnType<typeof parseCommit>[] }} input
 */
export function renderNotes({ version, date, entries }) {
  const lines = [`## ${version} — ${date}`];

  for (const { type, heading } of CHANGELOG_SECTIONS) {
    const matching = entries.filter((entry) => entry.type === type);
    if (matching.length === 0) continue;
    lines.push('', `### ${heading}`);
    for (const entry of matching) {
      const prefix = entry.scope ? `**${entry.scope}:** ` : '';
      lines.push(`- ${prefix}${entry.description}${entry.breaking ? ' **(breaking)**' : ''}`);
    }
  }

  if (entries.length === 0) lines.push('', '- _No user-facing changes._');
  return `${lines.join('\n')}\n`;
}
