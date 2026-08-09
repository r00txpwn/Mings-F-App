# Hermes ops MCP (Ming's)

Connect [Hermes Agent](https://hermes-agent.nousresearch.com/) to Ming's so it can **read sales / analytics** and **optionally add/update expenses** — only for capabilities you enable, with writes **fail-closed**.

```text
You → Hermes
        → stdio MCP: mcp/mings-ops
            → POST /functions/v1/agent-ops
                → Supabase (service role) + admin_audit_log
```

Hermes never receives the Supabase service role. It only holds `AGENT_API_KEY`. The Edge Function enforces the allowlist.

## Safety model (DB protection)

Writes cannot happen unless **all** of these are true:

1. `AGENT_API_KEY` is valid  
2. Capability includes the needed write flag (`expenses_write`, `sales_write`, or `expenses_delete` for deletes)  
3. Edge secret **`AGENT_MUTATIONS_ENABLED=true`**  
4. Request body includes **`confirm: true`**  
5. Create includes **`idempotency_key`** (UUID) — retries replay the first row, no double insert  
6. Expense/sale dates are not in the future (Asia/Baku) and not older than **45 days** for mutate  

**Delete is off by default** in three places:

- Not in the recommended `AGENT_CAPABILITIES`  
- Requires separate capability `expenses_delete`  
- MCP hides `delete_expense` unless `MINGS_ENABLE_EXPENSE_DELETE=true`  

Hermes **cannot** touch payroll, menu, purchases/writes, users, cards/payments, or kitchen/online order rows through this API. Manual **partner sales** (Wolt/Bolt/ChoiceQR) are writeable only with **`sales_write`** + mutations on.

## Capabilities (you choose)

| Capability | What Hermes can do |
|---|---|
| `sales_read` | `get_sales_summary`, `list_sales` (no customer PII) |
| `sales_write` | `create_sale`, `update_sale` for **manual partner** channels only (Wolt / Bolt / ChoiceQR; confirm + mutations flag). **Off by default.** |
| `analytics_read` | `get_revenue_run_rate`, `get_period_snapshot` |
| `expenses_read` | `list_expense_categories`, `list_expenses` |
| `purchases_read` | `list_purchases`, `get_purchases_summary` (COGS / inventory cost) |
| `expenses_write` | `create_expense`, `update_expense` (with confirm + mutations flag) |
| `expenses_delete` | `delete_expense` hard-delete (keep **off**) |

Legacy alias: `expenses_rw` → `expenses_read` + `expenses_write` (**not** delete).

**Read-only first (safest while testing Hermes):**

```text
AGENT_CAPABILITIES=sales_read,analytics_read,expenses_read,purchases_read
# omit AGENT_MUTATIONS_ENABLED or set false
```

**Recommended starter (analysis + COGS + safe expense add/edit, no sales write, no delete):**

```text
AGENT_CAPABILITIES=sales_read,analytics_read,expenses_read,purchases_read,expenses_write
AGENT_MUTATIONS_ENABLED=true
```

**Partner sales entry (only after owner Max approves):**

```text
AGENT_CAPABILITIES=sales_read,analytics_read,expenses_read,purchases_read,expenses_write,sales_write
AGENT_MUTATIONS_ENABLED=true
```

Ask Max before any write. No `sales_delete`.

### Example: “What does our MRR look like from sales till today?”

With `analytics_read`, Hermes calls **`get_revenue_run_rate`**. That is read-only and cannot change the DB.

## 1. Deploy Edge Function `agent-ops`

```bash
npm run supabase:deploy:agent-ops
```

`verify_jwt = false` in [`supabase/config.toml`](../supabase/config.toml) — auth is **`AGENT_API_KEY`** inside the function.

## 2. Set Edge secrets

| Secret | Required | Notes |
|---|---|---|
| `AGENT_API_KEY` | Yes | Long random Bearer secret |
| `AGENT_CAPABILITIES` | Yes | See recommended starter above |
| `AGENT_MUTATIONS_ENABLED` | For writes | Must be `true` to create/update/delete; omit/`false` = read-only |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Usually auto | |

```bash
openssl rand -hex 32
```

## 3. Point Hermes at the MCP server

`mcp/mings-ops` is a **stdio** process Hermes spawns on the **same host** as Hermes. It only needs Node 18+ (no `npm install`). It does **not** live inside Supabase — Edge Function `agent-ops` stays remote; the MCP is a thin local client.

### Windows / local Hermes

```yaml
mcp_servers:
  mings-ops:
    command: "node"
    args:
      - "C:/Users/YOU/Mings/Mings-f-app/mcp/mings-ops/index.mjs"
    env:
      MINGS_SUPABASE_URL: "https://YOUR_PROJECT.supabase.co"
      MINGS_AGENT_API_KEY: "same-as-AGENT_API_KEY-secret"
      # Do NOT set MINGS_ENABLE_EXPENSE_DELETE unless you really want hard deletes
```

### Linux cloud Hermes (container has no Windows path)

Put the MCP **on the cloud host**, then point config at **that** absolute path.

```bash
# On the Hermes Linux host (Node 18+ already required)
mkdir -p ~/mings-mcp && cd ~/mings-mcp

# Option A — private repo (use a PAT or SSH key):
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/r00txpwn/Mings-F-App.git
cd Mings-F-App
git sparse-checkout set mcp/mings-ops
# MCP entry: $(pwd)/mcp/mings-ops/index.mjs

# Option B — single file if you already have index.mjs on another machine:
# scp / path from Windows; no extra packages needed
```

```yaml
mcp_servers:
  mings-ops:
    command: "node"
    args:
      - "/home/YOU/mings-mcp/Mings-F-App/mcp/mings-ops/index.mjs"
    env:
      MINGS_SUPABASE_URL: "https://YOUR_PROJECT.supabase.co"
      MINGS_AGENT_API_KEY: "same-as-AGENT_API_KEY-secret"
```

Secrets can stay in Hermes `.env` (mode 600); the `env:` block is optional if Hermes already injects `MINGS_*`. Never put the Supabase **service role** on the Hermes host.

Example: [`mcp/mings-ops/hermes-config.example.yaml`](../mcp/mings-ops/hermes-config.example.yaml).

## 4. Smoke test

```bash
npm run mcp:mings-ops:selfcheck

curl -sS "$MINGS_SUPABASE_URL/functions/v1/agent-ops" \
  -H "Authorization: Bearer $MINGS_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"list_capabilities"}'
```

Confirm `mutations_enabled` and `warnings` look right before enabling writes.

## Security notes

- Start **read-only**; turn on `AGENT_MUTATIONS_ENABLED` only after Hermes answers analysis questions correctly.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in Hermes env.
- Expense writes audit as `actor_role = agent`.
- Prefer asking Hermes to confirm with you before any write.
- `agent-ops` rejects browser `Origin` / CORS preflight.
- Aggregations paginate past the 1000-row Supabase cap.
- “Today” uses **Asia/Baku**.

## Local Edge serve

```bash
# .env.local: AGENT_API_KEY, AGENT_CAPABILITIES, optional AGENT_MUTATIONS_ENABLED
npm run supabase:functions:serve
```

Set `MINGS_AGENT_OPS_URL=http://127.0.0.1:54321/functions/v1/agent-ops` for the MCP process.
