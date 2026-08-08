# Hermes ops MCP (Ming's)

Connect [Hermes Agent](https://hermes-agent.nousresearch.com/) to Ming's so it can **read sales / analytics** and **manage operational expenses** — only for capabilities you enable.

```text
You → Hermes
        → stdio MCP: mcp/mings-ops
            → POST /functions/v1/agent-ops
                → Supabase (service role) + admin_audit_log
```

Hermes never receives the Supabase service role. It only holds `AGENT_API_KEY`. The Edge Function enforces the allowlist.

## Capabilities (you choose)

Set Edge secret **`AGENT_CAPABILITIES`** to a comma-separated list:

| Capability | What Hermes can do |
|---|---|
| `sales_read` | `get_sales_summary`, `list_sales` |
| `analytics_read` | `get_revenue_run_rate`, `get_period_snapshot` (includes opex/purchase totals for analysis) |
| `expenses_rw` | `list_expense_categories`, `list_expenses`, `create_expense`, `update_expense`, `delete_expense` |

**Starter (recommended):**

```text
AGENT_CAPABILITIES=sales_read,analytics_read,expenses_rw
```

Turn a capability off by removing it from the secret and redeploying / refreshing secrets. Disabled tools still appear in MCP tool lists but the Edge Function returns `CAPABILITY_DENIED`.

`list_capabilities` always works (with a valid key) so Hermes can see what is enabled.

### Example question: “What does our MRR look like from sales till today?”

With `analytics_read` enabled, Hermes should call **`get_revenue_run_rate`**. That returns MTD revenue and a **linear full-month pacing estimate** (restaurant run-rate). It is **not** SaaS subscription MRR — the API response includes that disclaimer.

## 1. Deploy Edge Function `agent-ops`

```bash
npm run supabase:deploy:agent-ops
```

Or:

```bash
npx supabase functions deploy agent-ops --no-verify-jwt --use-api
```

`verify_jwt = false` in [`supabase/config.toml`](../supabase/config.toml) — auth is **`AGENT_API_KEY`** inside the function (same pattern as `payment-reconcile`).

## 2. Set Edge secrets

In **Supabase Dashboard → Edge Functions → Secrets** (or CLI):

| Secret | Required | Notes |
|---|---|---|
| `AGENT_API_KEY` | Yes | Long random secret; Hermes uses it as Bearer token |
| `AGENT_CAPABILITIES` | Yes | e.g. `sales_read,analytics_read,expenses_rw` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Usually auto | Used for DB reads/writes |

Generate a key:

```bash
openssl rand -hex 32
```

## 3. Point Hermes at the MCP server

On the machine that runs Hermes, add to `~/.hermes/config.yaml` (paths absolute):

```yaml
mcp_servers:
  mings-ops:
    command: "node"
    args:
      - "/ABS/PATH/TO/Mings-F-App/mcp/mings-ops/index.mjs"
    env:
      MINGS_SUPABASE_URL: "https://YOUR_PROJECT.supabase.co"
      MINGS_AGENT_API_KEY: "same-as-AGENT_API_KEY-secret"
      # Optional if your gateway requires it:
      # MINGS_SUPABASE_ANON_KEY: "eyJ..."
```

Example file in-repo: [`mcp/mings-ops/hermes-config.example.yaml`](../mcp/mings-ops/hermes-config.example.yaml).

Reload MCP in Hermes (`/reload-mcp` if available) or restart Hermes.

## 4. Smoke test

```bash
# Pure math / capability parse
npm run mcp:mings-ops:selfcheck

# Live call (after deploy + secrets)
export MINGS_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export MINGS_AGENT_API_KEY="…"
curl -sS "$MINGS_SUPABASE_URL/functions/v1/agent-ops" \
  -H "Authorization: Bearer $MINGS_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"list_capabilities"}'
```

Then in Hermes: *“What capabilities do you have for Ming’s?”* and *“Based on sales MTD, what does monthly revenue pacing look like?”*

## Security notes

- Use a dedicated `AGENT_API_KEY`; rotate if the Hermes host is compromised.
- Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in Hermes env.
- Expense writes are audited in `admin_audit_log` with `actor_role = agent`.
- Prefer confirming money writes with Hermes before `create_expense` / `delete_expense`.
- Expand capabilities only when you need them (purchases/payroll/etc. are not exposed yet).
- `agent-ops` rejects browser `Origin` / CORS preflight — Hermes MCP and curl only.
- Sales list responses omit customer PII (name/phone/address).
- Aggregations paginate past Supabase’s 1000-row default so MTD totals stay correct.
- “Today” / run-rate defaults use **Asia/Baku**, not UTC.

## Local Edge serve

```bash
# .env.local must include AGENT_API_KEY + AGENT_CAPABILITIES
npm run supabase:functions:serve
```

Then set `MINGS_AGENT_OPS_URL=http://127.0.0.1:54321/functions/v1/agent-ops` for the MCP process.
