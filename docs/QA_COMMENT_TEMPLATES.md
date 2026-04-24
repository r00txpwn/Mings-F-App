# QA Comment Templates

Standard formats for the two-way handoff between Cursor (implementation) and the Claude Chrome Extension (second-pass QA). Post these as Linear comments on the issue so the workflow is auditable.

**Cursor obligation:** for every issue you send to second-pass QA, add a repo brief **`docs/qa-briefs/<ISSUE>-handoff.md`** (copy structure from `docs/qa-briefs/MIN-9-handoff.md` or `MIN-6-handoff.md`) that includes **both** Template A fields **and** the full **“Claude Extension — QA session (fresh context)”** block with real URLs, credentials, and scenarios. The Extension has no repo context — that block is the instruction set for QA. For **cockpit** features on **local preview**, URLs must use the default admin base path **`/spec-ops`** (e.g. `http://127.0.0.1:4175/spec-ops?screen=…`); fill **`gitSha` in the handoff** after commit so QA can compare to `build-meta.json`.

The helper scripts under `scripts/qa-handoff.ts` and `scripts/qa-result.ts` wrap these shapes and also update the `qa:*` labels on the issue. **`qa-result.ts` with `--status=pass`** also moves the issue to the team’s first **completed** workflow state in Linear (same GraphQL `issueUpdate` an agent would send via the Linear API / MCP), so the board shows **Done** without a separate MCP step. Use **`--no-resolve`** only if you must set `qa:passed` without changing workflow state.

---

## Template A — Cursor → QA (handoff)

Posted when Cursor believes the fix is ready for second-pass QA. Also applies the `qa:ready` label and removes `qa:running`, `qa:passed`, `qa:failed`, `qa:blocked`.

At the **top** of the brief (after the title), add a short callout for the extension, for example:

`> **Claude Extension:** paste this entire handoff file as the first message in a new chat (same text is posted to Linear).`

```markdown
## Cursor → QA handoff

**Status:** ready for second-pass QA

**Summary**
<1–2 sentence summary of the fix>

**Files changed**
- `path/to/file-1`
- `path/to/file-2`

**Surfaces / URLs to test**
- `https://order.mings.az/...`
- `https://sp.mings.az/...`

**Scenarios to verify**
1. <Scenario 1 — clear pass/fail criteria>
2. <Scenario 2>
3. <Scenario 3>

**Known constraints / fixtures**
- Auth: <staff@mings.az via SMS OTP / magic link / none>
- Test data required: <e.g. at least one pending delivery order>
- Viewport(s): desktop 1440x900, mobile 393x852

**Screenshots from Cursor verification**
- `screenshots/fixes/<ISSUE>/01-....png`

**Commit**
- SHA: `<git sha>`
- Branch: `<branch name>`
- Deployed: <yes/no + env — note if production does not include the fix yet>

---

## Claude Extension — fresh-context starter prompt (required on every handoff)

Each QA run in the Claude Chrome Extension starts with **no repo context**. The Linear handoff comment (Template A) **must** include the block below, with every placeholder replaced by real values. Cursor should paste this **verbatim** into the extension (or keep it in the same Linear comment immediately after Template A).

**Copy from here ↓** (fill `<…>` before posting)

```markdown
## Claude Extension — QA session (fresh context)

You are performing **second-pass QA** for **Ming's OS** (Vite + React + TypeScript storefront and staff apps, Supabase backend). You do **not** have the codebase in context unless the user attached it — rely only on this message and the linked Linear issue.

### Linear
- **Issue:** <MIN-XX>
- **Issue URL:** <https://linear.app/.../issue/MIN-XX/...>
- **Expected label:** `qa:ready` (Cursor finished implementation; waiting for you). If the label differs, say so before testing.

### What was implemented (short)
<Same 1–2 sentences as Template A "Summary">

### Where to test
<URLs, one per line — production and/or local preview with exact path>

### Credentials / fixtures
<How to sign in: e.g. staff@mings.az + password from team vault; OTP flows; test orders; nothing assumed>

### Scenarios (check each pass/fail; do not skip)
1. <Scenario 1 — explicit expected UI or behavior>
2. <Scenario 2>
3. <Scenario 3>
(Add more if needed.)

### Evidence to collect
- Note pass/fail per scenario, any console or network errors, and what you observed (browser, viewport size if relevant).
- Screenshots or short screen recording paths if the user asked for artifacts.

### When you are done — record the result (fresh context safe)
1. Write a short markdown report matching **Template B** in the same repo’s `docs/QA_COMMENT_TEMPLATES.md` (section "Template B — QA → Cursor (result)").
2. In the project root, with `LINEAR_API_KEY` set (or in `.env.local`), run **exactly one** of:
   - Pass: `npm run qa:result -- --issue=<MIN-XX> --status=pass --result-file=<path-to-your-template-b.md>`
   - Fail: `npm run qa:result -- --issue=<MIN-XX> --status=fail --result-file=<path>`
   - Blocked: `npm run qa:result -- --issue=<MIN-XX> --status=blocked --result-file=<path>`
   That command updates Linear labels (`qa:passed` / `qa:failed` / `qa:blocked`), posts your report as a comment, and on **pass** moves the issue to the team’s **completed** (Done) workflow state unless you add **`--no-resolve`**.
3. If you cannot run the CLI, paste your Template B markdown as a **new Linear comment** on the issue and ask a human to run `npm run qa:result` with that body in a file.

### Guardrails
- Do **not** push to `main` or change git remotes; QA only.
- Do not treat first-pass Playwright screenshots as proof of production unless the handoff says production is deployed.

### Reference doc (human / Cursor)
Repo file: `docs/QA_COMMENT_TEMPLATES.md` — Templates A and B and agent rules.
```

**Copy to here ↑**

---

## Template B — QA → Cursor (result)

Posted when the Claude Extension finishes testing. Applies `qa:passed`, `qa:failed`, or `qa:blocked` and clears the other QA labels.

```markdown
## QA → Cursor result

**Status:** pass | fail | blocked

**Summary**
<1 sentence outcome>

**Scenarios**
- [x] Scenario 1 — pass
- [ ] Scenario 2 — fail: <what happened>
- [x] Scenario 3 — pass

**Evidence**
- Screenshot / recording: `<path or URL>`
- Console errors: <paste excerpt or "none">
- Network errors: <paste excerpt or "none">

**Blockers (if status = blocked)**
- <e.g. could not reach OTP; test data missing; needs human>

**Next action for Cursor**
- <only set when status = fail; e.g. "ready banner still shows on first load on mobile">
```

---

## Claude Extension — fresh-context prompt for **recording** QA result only

Use when the extension (or a human) is **only** updating Linear after testing, with no implementation context.

```markdown
## Claude Extension — record QA result (fresh context)

Ming's OS repo uses Linear labels `qa:ready` | `qa:running` | `qa:passed` | `qa:failed` | `qa:blocked`.

- **Issue:** <MIN-XX>
- **Issue URL:** <https://linear.app/...>
- You already executed the test plan from the issue’s latest **Cursor → QA handoff** comment (or you are the human reporter).

Write markdown matching **Template B** in `docs/QA_COMMENT_TEMPLATES.md`. Save it to a file, then from repo root run:

`npm run qa:result -- --issue=<MIN-XX> --status=pass|fail|blocked --result-file=<path>`

On **pass**, that command also moves the issue to the team’s **Done** (completed) workflow state unless you add **`--no-resolve`**. Use `LINEAR_API_KEY` in the environment or `.env.local`. Do not push git branches.
```

---

## Rules for agents

- Never skip the handoff comment; the `qa:*` label alone is not enough context.
- **Every Cursor → QA handoff must include the filled "Claude Extension — fresh-context starter prompt" block** (see above) inside the same brief / Linear comment so the extension can run with zero prior chat context.
- Use real file paths, not placeholders, in "Files changed".
- `pass` requires every listed scenario to be checked off.
- `blocked` must include a specific reason that a human can act on.
- On **`pass`**, `npm run qa:result` sets `qa:passed`, posts the report, and moves the Linear issue to the team’s **completed** workflow state (resolved on the board). Use **`--no-resolve`** only if labels/comment must be updated without changing status.
- Cursor does not close the issue on `fail` or `blocked` (workflow stays open). It re-enters the implementation loop, then re-runs the handoff.
