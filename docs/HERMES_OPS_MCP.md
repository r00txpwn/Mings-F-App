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
2. Capability includes `expenses_write` (or `expenses_delete` for deletes)  
3. Edge secret **`AGENT_MUTATIONS_ENABLED=true`**  
4. Request body includes **`confirm: true`**  
5. Create includes **`idempotency_key`** (UUID) — retries replay the first row, no double insert  
6. Expense date is not in the future (Asia/Baku) and not older than **45 days** for mutate/delete  

**Delete is off by default** in three places:

- Not in the recommended `AGENT_CAPABILITIES`  
- Requires separate capability `expenses_delete`  
- MCP hides `delete_expense` unless `MINGS_ENABLE_EXPENSE_DELETE=true`  

Hermes **cannot** touch sales, payroll, menu, purchases, users, or payments through this API — only the actions below.

## Capabilities (you choose)

| Capability | What Hermes can do |
|---|---|
| `sales_read` | `get_sales_summary`, `list_sales` (no customer PII) |
| `analytics_read` | `get_revenue_run_rate`, `get_period_snapshot` |
| `expenses_read` | `list_expense_categories`, `list_expenses` |
| `expenses_write` | `create_expense`, `update_expense` (with confirm + mutations flag) |
| `expenses_delete` | `delete_expense` hard-delete (keep **off**) |

Legacy alias: `expenses_rw` → `expenses_read` + `expenses_write` (**not** delete).

**Recommended starter (analysis + safe expense add/edit, no delete):**

```text
AGENT_CAPABILITIES=sales_read,analytics_read,expenses_read,expenses_write
AGENT_MUTATIONS_ENABLED=true
```

**Read-only first (safest while testing Hermes):**

```text
AGENT_CAPABILITIES=sales_read,analytics_read,expenses_read
# omit AGENT_MUTATIONS_ENABLED or set false
```

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

```yaml
mcp_servers:
  mings-ops:
    command: "node"
    args:
      - "/ABS/PATH/TO/Mings-F-App/mcp/mings-ops/index.mjs"
    env:
      MINGS_SUPABASE_URL: "https://YOUR_PROJECT.supabase.co"
      MINGS_AGENT_API_KEY: "same-as-AGENT_API_KEY-secret"
      # Do NOT set MINGS_ENABLE_EXPENSE_DELETE unless you really want hard deletes
```

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
