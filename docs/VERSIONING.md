# Versioning and changelog

Ming's OS carries a single repo-wide semver version. Staff and storefront build
separately but share the number; `build-meta.json` records `buildTarget` and
`gitSha` so you can still tell which surface is stale.

## Where the version lives

| Place | How it gets there |
|---|---|
| `package.json` `version` | Source of truth. Bumped by `npm run release`. |
| `import.meta.env.VITE_APP_VERSION` | Inlined at build time by `vite.config.ts`. |
| Staff cockpit sidebar | Muted `v1.2.3` under Sign out; hidden when collapsed. |
| `build-meta.json` | Written by `scripts/write-build-meta.mjs` after each build. |
| Git tag `vX.Y.Z` | Annotated tag created by `npm run release`. |
| `CHANGELOG.md` | One section per release. |

## Cutting a release

```bash
npm run release
```

It runs in this order:

1. **Guards** — must be on `main`, clean working tree, not behind `origin/main`.
   Override the branch check with `--force-branch`.
2. **Fails fast** if there are no commits since the last tag.
3. **Gates** — `npm run typecheck`, `npm run lint`, `npm run test` must pass.
   Override with `--skip-checks`.
4. **Derives the bump** from conventional commits since the last tag: any
   `BREAKING CHANGE` or `!` → major, any `feat` → minor, otherwise patch.
   Force it with `npm run release -- minor`.
5. **Drafts the notes** into `RELEASE_NOTES.draft.md` (gitignored), grouped into
   Features / Fixes / Performance. Only `feat`, `fix` and `perf` are included;
   `chore`, `docs`, `refactor` and anything marked `[skip ci]` are dropped, which
   is what keeps the QA and doc bots out of the changelog.
6. **Pauses** so you can rewrite the wording as product changes rather than
   commit subjects. Press Enter to continue, or type `abort`.
7. **Applies** — bumps `package.json` and `package-lock.json`, prepends the
   section to `CHANGELOG.md`, commits `chore(release): vX.Y.Z`, creates the
   annotated tag.
8. **Stops.** It never pushes. It prints the command:

```bash
git push --follow-tags origin main
```

Preview any of this without changing a file:

```bash
npm run release -- --dry-run
```

## Commit format

`.githooks/commit-msg` rejects subjects that are not conventional commits:

```
type(scope): description
```

`type` is one of `feat fix perf refactor docs test style build ci chore revert`.
Append `!` for a breaking change (`feat(api)!: drop the legacy order route`).
Merge, revert, `fixup!` and `squash!` subjects are allowed through. Bypass once
with `git commit --no-verify`.

The hook is active where `core.hooksPath` points at `.githooks`, which the
`prepare` script sets on `npm install`. Hooks are per-clone, so a fresh clone
needs an install (or `git config core.hooksPath .githooks`) before it applies.

## Notes

- The bump logic lives in `scripts/lib/release-notes.mjs` and is covered by
  `tests/unit/releaseNotes.test.ts`.
- `npm run release` refuses to run when no tags exist, because it would
  otherwise treat all of history as one release.
