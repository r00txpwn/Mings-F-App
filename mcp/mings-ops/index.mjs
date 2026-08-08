#!/usr/bin/env node
/**
 * Stdio MCP server for Ming's restaurant ops.
 * Talks to Supabase Edge Function `agent-ops` with AGENT_API_KEY.
 *
 * Env:
 *   MINGS_SUPABASE_URL   — https://<ref>.supabase.co
 *   MINGS_AGENT_API_KEY  — same value as Edge secret AGENT_API_KEY
 *   MINGS_AGENT_OPS_URL  — optional full URL override
 *   MINGS_SUPABASE_ANON_KEY — optional; sent as apikey header (some gateways want it)
 */
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SERVER_NAME = 'mings-ops';
const SERVER_VERSION = '1.0.0';

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function opsUrl() {
  if (process.env.MINGS_AGENT_OPS_URL?.trim()) return process.env.MINGS_AGENT_OPS_URL.trim();
  const base = requireEnv('MINGS_SUPABASE_URL').replace(/\/$/, '');
  return `${base}/functions/v1/agent-ops`;
}

async function callAgentOps(action, params = {}) {
  const key = requireEnv('MINGS_AGENT_API_KEY');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  };
  const anon = process.env.MINGS_SUPABASE_ANON_KEY?.trim();
  if (anon) headers.apikey = anon;

  // `action` last so tool args cannot override the intended operation.
  const { action: _ignoredAction, ...rest } = params && typeof params === 'object' ? params : {};
  const res = await fetch(opsUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...rest, action }),
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = { ok: false, error: { message: `Non-JSON response (${res.status})` } };
  }

  if (!res.ok || body?.ok === false) {
    const msg = body?.error?.message || body?.error?.code || `HTTP ${res.status}`;
    const detail = body?.error ? JSON.stringify(body.error) : JSON.stringify(body);
    throw new Error(`${msg} — ${detail}`);
  }
  return body.data;
}

function textResult(data) {
  return {
    content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
  };
}

function envFlag(name) {
  const v = (process.env[name] ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

/** Delete tool is hidden unless MINGS_ENABLE_EXPENSE_DELETE=true (server still requires expenses_delete). */
function buildTools() {
  const tools = [
    {
      name: 'list_capabilities',
      description:
        'List Ming\'s ops capabilities, whether writes are enabled, and safety warnings. Call this first.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'get_sales_summary',
      description:
        'Sum sales revenue for a date range (excludes cancelled). Requires sales_read. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: { type: 'string', description: 'YYYY-MM-DD' },
          end_date: { type: 'string', description: 'YYYY-MM-DD (defaults to start_date)' },
        },
        required: ['start_date'],
        additionalProperties: false,
      },
    },
    {
      name: 'list_sales',
      description: 'List recent sales rows (no customer PII). Requires sales_read. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: { type: 'string' },
          end_date: { type: 'string' },
          limit: { type: 'number', description: 'Max rows (1-100, default 50)' },
        },
        required: ['start_date'],
        additionalProperties: false,
      },
    },
    {
      name: 'get_revenue_run_rate',
      description:
        'MTD sales + projected month revenue pacing (not SaaS MRR). Requires analytics_read. Read-only. Default as_of is today in Asia/Baku.',
      inputSchema: {
        type: 'object',
        properties: {
          as_of: { type: 'string', description: 'YYYY-MM-DD (defaults to today Asia/Baku)' },
        },
        additionalProperties: false,
      },
    },
    {
      name: 'get_period_snapshot',
      description:
        'Revenue + opex + purchase cost + net for a date range. Requires analytics_read. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: { type: 'string' },
          end_date: { type: 'string' },
        },
        required: ['start_date'],
        additionalProperties: false,
      },
    },
    {
      name: 'list_expense_categories',
      description: 'List expense categories/items (IDs for create). Requires expenses_read. Read-only.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'list_expenses',
      description: 'List operational expenses in a date range. Requires expenses_read. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: { type: 'string' },
          end_date: { type: 'string' },
          limit: { type: 'number' },
        },
        required: ['start_date'],
        additionalProperties: false,
      },
    },
    {
      name: 'list_purchases',
      description:
        'List inventory purchase/COGS rows (products, suppliers, categories) for a date range. Requires purchases_read. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: { type: 'string', description: 'YYYY-MM-DD' },
          end_date: { type: 'string', description: 'YYYY-MM-DD (defaults to start_date)' },
          limit: { type: 'number', description: 'Max rows (1-100, default 50)' },
        },
        required: ['start_date'],
        additionalProperties: false,
      },
    },
    {
      name: 'get_purchases_summary',
      description:
        'Purchase/COGS totals by master category for a date range (matches cockpit COGS). Requires purchases_read. Read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: { type: 'string', description: 'YYYY-MM-DD' },
          end_date: { type: 'string', description: 'YYYY-MM-DD (defaults to start_date)' },
        },
        required: ['start_date'],
        additionalProperties: false,
      },
    },
    {
      name: 'create_expense',
      description:
        'Create an operational expense. MUST pass confirm=true. Provide idempotency_key (UUID) or one is generated. payment_method: cash|card|bank_transfer. Requires expenses_write + AGENT_MUTATIONS_ENABLED. Do not invent category IDs — call list_expense_categories first. Prefer asking the owner before writing.',
      inputSchema: {
        type: 'object',
        properties: {
          master_category_id: { type: 'string' },
          expense_item_id: { type: 'string' },
          amount: { type: 'number' },
          expense_date: { type: 'string', description: 'YYYY-MM-DD (not future, Asia/Baku)' },
          payment_method: { type: 'string', enum: ['cash', 'card', 'bank_transfer'] },
          description: { type: 'string' },
          confirm: {
            type: 'boolean',
            description: 'Must be true. Refuses write otherwise.',
          },
          idempotency_key: {
            type: 'string',
            description: 'UUID; retries with the same key return the first row (no double insert).',
          },
        },
        required: [
          'master_category_id',
          'expense_item_id',
          'amount',
          'expense_date',
          'payment_method',
          'confirm',
        ],
        additionalProperties: false,
      },
    },
    {
      name: 'update_expense',
      description:
        'Update an expense by id. MUST pass confirm=true. Cannot edit expenses older than 45 days. Requires expenses_write + AGENT_MUTATIONS_ENABLED. Prefer asking the owner before writing.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          amount: { type: 'number' },
          expense_date: { type: 'string' },
          payment_method: { type: 'string', enum: ['cash', 'card', 'bank_transfer'] },
          description: { type: 'string' },
          master_category_id: { type: 'string' },
          expense_item_id: { type: 'string' },
          confirm: { type: 'boolean', description: 'Must be true' },
        },
        required: ['id', 'confirm'],
        additionalProperties: false,
      },
    },
  ];

  if (envFlag('MINGS_ENABLE_EXPENSE_DELETE')) {
    tools.push({
      name: 'delete_expense',
      description:
        'HARD-DELETE an expense by id. MUST pass confirm=true. Disabled unless MINGS_ENABLE_EXPENSE_DELETE and server expenses_delete. Prefer asking the owner; prefer update over delete.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          confirm: { type: 'boolean', description: 'Must be true' },
        },
        required: ['id', 'confirm'],
        additionalProperties: false,
      },
    });
  }

  return tools;
}

async function callTool(name, args = {}) {
  const a = args && typeof args === 'object' ? { ...args } : {};

  switch (name) {
    case 'list_capabilities':
      return textResult(await callAgentOps('list_capabilities'));
    case 'get_sales_summary':
      return textResult(await callAgentOps('get_sales_summary', a));
    case 'list_sales':
      return textResult(await callAgentOps('list_sales', a));
    case 'get_revenue_run_rate':
      return textResult(await callAgentOps('get_revenue_run_rate', a));
    case 'get_period_snapshot':
      return textResult(await callAgentOps('get_period_snapshot', a));
    case 'list_expense_categories':
      return textResult(await callAgentOps('list_expense_categories'));
    case 'list_expenses':
      return textResult(await callAgentOps('list_expenses', a));
    case 'list_purchases':
      return textResult(await callAgentOps('list_purchases', a));
    case 'get_purchases_summary':
      return textResult(await callAgentOps('get_purchases_summary', a));
    case 'create_expense': {
      if (!a.idempotency_key) a.idempotency_key = crypto.randomUUID();
      return textResult(await callAgentOps('create_expense', a));
    }
    case 'update_expense':
      return textResult(await callAgentOps('update_expense', a));
    case 'delete_expense': {
      if (!envFlag('MINGS_ENABLE_EXPENSE_DELETE')) {
        throw new Error('delete_expense is disabled on this MCP host (MINGS_ENABLE_EXPENSE_DELETE)');
      }
      return textResult(await callAgentOps('delete_expense', a));
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return;
  const { id, method, params } = msg;

  // Notifications (no id) — ignore silently except initialized
  if (id === undefined) return;

  try {
    switch (method) {
      case 'initialize':
        sendResult(id, {
          protocolVersion: params?.protocolVersion || '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        });
        return;
      case 'ping':
        sendResult(id, {});
        return;
      case 'tools/list':
        sendResult(id, { tools: buildTools() });
        return;
      case 'tools/call': {
        const name = params?.name;
        const args = params?.arguments ?? {};
        try {
          const result = await callTool(name, args);
          sendResult(id, result);
        } catch (err) {
          sendResult(id, {
            isError: true,
            content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],
          });
        }
        return;
      }
      default:
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    sendError(id, -32000, err instanceof Error ? err.message : String(err));
  }
}

function main() {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      return;
    }
    void handleMessage(msg);
  });

  // Keep alive; Hermes closes stdin when done.
  rl.on('close', () => process.exit(0));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
