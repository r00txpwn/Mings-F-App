---
description: Compact this chat into a copy-paste handoff for a new Agent window (when context is nearly full)
---

# /handoff — context compact for next chat

Use when the conversation context is nearly full and the user needs to continue in a **new** Agent chat.

**Do not** run `npx skills add …` on every `/handoff`. Install is one-time. Just produce the handoff.

## Do this now

1. Summarise **this** conversation so a **fresh** agent can continue without the full history.
2. Save the full document to the OS temp directory (not the workspace), e.g. `%TEMP%\mings-handoff-YYYYMMDD-HHmm.md` on Windows.
3. In the chat reply, put a **single copy-paste-ready fenced block** the user pastes as the first message in a new Agent chat. Lead with: “Copy everything inside the block into a new chat.”
4. Include **Suggested skills** if useful (paths under `.agents/skills/` or `.cursor/skills/`).
5. Do **not** dump content already in specs, plans, ADRs, issues, commits, or diffs — reference by path/URL/SHA.
6. **Redact** secrets: API keys, tokens, passwords, `.env` values, connection strings.
7. If the user passed arguments after `/handoff`, treat them as next-session focus.

## Copy-paste block shape (required)

One markdown fence containing:

```markdown
# Handoff — continue from prior chat

## Goal
<one paragraph>

## Repo / branch / env
- Branch:
- Relevant SHA / preview:
- Supabase: sandbox vs prod (which)
- Local preview: http://127.0.0.1:4175/ if relevant

## Done this session
- …

## In progress / next actions
1. …

## Important decisions & constraints
- …

## Key files
- `path` — why

## Bugs / trackers
- Trello / TestSprite / Linear links if any

## Suggested skills to invoke
- …

## Do not
- …
```

Keep the paste block tight (aim under ~80 lines).

## Ming's extras (when relevant)

- Surfaces: `/spec-ops`, `/order`, KDS, kiosk
- TestSprite ↔ Trello: `.cursor/rules/testsprite-trello-bug-tracker.mdc`
- Stats/finance: prefer sandbox; no TRUNCATE unless asked
