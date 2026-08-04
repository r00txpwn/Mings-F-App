import { describe, expect, it } from 'vitest';

// @ts-expect-error — plain .mjs helper shared with scripts/release.mjs
import {
  bumpVersion,
  localDateStamp,
  parseCommit,
  renderNotes,
  summarizeCommits,
} from '../../scripts/lib/release-notes.mjs';

describe('parseCommit', () => {
  it('reads type, scope and description', () => {
    expect(parseCommit({ subject: 'feat(cockpit): add Task Master board' })).toEqual({
      type: 'feat',
      scope: 'cockpit',
      description: 'add Task Master board',
      breaking: false,
    });
  });

  it('treats a scopeless subject as scope null', () => {
    expect(parseCommit({ subject: 'fix: stop double submit' })?.scope).toBeNull();
  });

  it('returns null for non-conventional subjects', () => {
    expect(parseCommit({ subject: 'Reliability pass on payments' })).toBeNull();
  });

  it('detects breaking changes from both the bang and the body', () => {
    expect(parseCommit({ subject: 'feat(api)!: drop legacy route' })?.breaking).toBe(true);
    expect(
      parseCommit({ subject: 'feat(api): rework route', body: 'BREAKING CHANGE: /v1 is gone' })
        ?.breaking,
    ).toBe(true);
  });
});

describe('summarizeCommits', () => {
  it('keeps only feat/fix/perf and drops chore, docs and bot commits', () => {
    const { entries } = summarizeCommits([
      { subject: 'feat(payroll): month attendance' },
      { subject: 'fix(auth): stop network blips' },
      { subject: 'perf(kds): cut board re-renders' },
      { subject: 'chore(qa): auto-update QA status [skip ci]' },
      { subject: 'docs: auto-update structure docs [skip ci]' },
      { subject: 'refactor(sales): tidy helpers' },
      { subject: 'merged STATS-FIXING' },
    ]);

    expect(entries.map((e) => e.type)).toEqual(['feat', 'fix', 'perf']);
  });

  it('drops a feat that is marked [skip ci]', () => {
    const { entries } = summarizeCommits([{ subject: 'feat(bot): generated [skip ci]' }]);
    expect(entries).toEqual([]);
  });

  it('derives patch when there are only fixes', () => {
    expect(summarizeCommits([{ subject: 'fix(auth): retry once' }]).bump).toBe('patch');
  });

  it('derives minor when any feat is present', () => {
    expect(
      summarizeCommits([{ subject: 'fix(auth): retry once' }, { subject: 'feat(kds): new lane' }])
        .bump,
    ).toBe('minor');
  });

  it('derives major from a breaking change even on a filtered-out type', () => {
    expect(summarizeCommits([{ subject: 'chore(db)!: drop sales.legacy_total' }]).bump).toBe(
      'major',
    );
  });
});

describe('bumpVersion', () => {
  it('increments each level and resets the lower ones', () => {
    expect(bumpVersion('1.4.2', 'patch')).toBe('1.4.3');
    expect(bumpVersion('1.4.2', 'minor')).toBe('1.5.0');
    expect(bumpVersion('1.4.2', 'major')).toBe('2.0.0');
  });

  it('refuses versions it cannot safely bump', () => {
    expect(() => bumpVersion('1.4.2-beta.1', 'patch')).toThrow();
  });
});

describe('localDateStamp', () => {
  // Dates are built from local components so the assertions hold in any timezone.
  it('uses the local calendar day, not the UTC one', () => {
    expect(localDateStamp(new Date(2026, 7, 5, 23, 30))).toBe('2026-08-05');
    expect(localDateStamp(new Date(2026, 7, 5, 0, 30))).toBe('2026-08-05');
  });

  it('zero-pads single-digit months and days', () => {
    expect(localDateStamp(new Date(2026, 0, 9, 12, 0))).toBe('2026-01-09');
  });
});

describe('renderNotes', () => {
  it('groups entries under their headings with bolded scopes', () => {
    const notes = renderNotes({
      version: '1.1.0',
      date: '2026-08-05',
      entries: [
        { type: 'feat', scope: 'cockpit', description: 'add Task Master board', breaking: false },
        { type: 'fix', scope: null, description: 'stop double submit', breaking: false },
      ],
    });

    expect(notes).toBe(
      [
        '## 1.1.0 — 2026-08-05',
        '',
        '### Features',
        '- **cockpit:** add Task Master board',
        '',
        '### Fixes',
        '- stop double submit',
        '',
      ].join('\n'),
    );
  });

  it('still produces a valid section when nothing is noteworthy', () => {
    const notes = renderNotes({ version: '1.0.1', date: '2026-08-05', entries: [] });
    expect(notes).toContain('_No user-facing changes._');
  });
});
