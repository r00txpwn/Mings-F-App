# Agent Brief Template

Use this when starting a Cursor/Codex task to reduce guessing and token usage.

```text
Surface:
Example: /order, /order-manager, staff cockpit, KDS, kiosk

Goal:
One sentence only.

Mode:
Plan only / Implement / Review only / Debug only

Scope:
Files or phase allowed:

Do not touch:

Validation required:
Example: npm.cmd run typecheck, npm.cmd run build, manual /order checkout

Shipping:
Do not commit / commit only / push branch / push main / deploy edge function

Owner QA:
Tell me exactly what to click after the change.
```

## Example

```text
Surface: /order
Goal: Fix the Place Order button so customers see why it is disabled.
Mode: Implement
Scope: OrderApp.tsx, OrderCheckoutView.tsx, translations.ts
Do not touch: Edge functions, database, payment contracts
Validation required: npm.cmd run typecheck, npm.cmd run build
Shipping: commit only, do not push
Owner QA: Tell me what to click in checkout to verify.
```

