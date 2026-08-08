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

  const res = await fetch(opsUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...params }),
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

/** Tools always advertised; server-side AGENT_CAPABILITIES still enforces access. */
const TOOLS = [
  {
    name: 'list_capabilities',
    description:
      'List which Ming\'s ops capabilities are enabled for this agent key (sales_read, analytics_read, expenses_rw).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_sales_summary',
    description:
      'Sum sales revenue for a date range (excludes cancelled). Use for daily/MTD sales totals. Requires sales_read.',
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
    description: 'List recent sales rows in a date range (capped). Requires sales_read.',
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
      'Month-to-date sales + projected full-month revenue pacing (restaurant run-rate, not SaaS MRR). Requires analytics_read. Use when the owner asks what monthly revenue looks like based on sales so far.',
    inputSchema: {
      type: 'object',
      properties: {
        as_of: { type: 'string', description: 'YYYY-MM-DD (defaults to today UTC)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_period_snapshot',
    description:
      'Revenue + operational expenses + purchase cost + net for a date range. Requires analytics_read.',
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
    description:
      'List expense master categories and expense items (IDs needed before create_expense). Requires expenses_rw.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_expenses',
    description: 'List operational expenses in a date range. Requires expenses_rw.',
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
    name: 'create_expense',
    description:
      'Create an operational expense. payment_method: cash | card | bank_transfer. Resolve category/item IDs via list_expense_categories first. Requires expenses_rw.',
    inputSchema: {
      type: 'object',
      properties: {
        master_category_id: { type: 'string' },
        expense_item_id: { type: 'string' },
        amount: { type: 'number' },
        expense_date: { type: 'string', description: 'YYYY-MM-DD' },
        payment_method: { type: 'string', enum: ['cash', 'card', 'bank_transfer'] },
        description: { type: 'string' },
      },
      required: [
        'master_category_id',
        'expense_item_id',
        'amount',
        'expense_date',
        'payment_method',
      ],
      additionalProperties: false,
    },
  },
  {
    name: 'update_expense',
    description: 'Update fields on an operational expense by id. Requires expenses_rw.',
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
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_expense',
    description: 'Delete an operational expense by id. Requires expenses_rw.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
];

async function callTool(name, args = {}) {
  switch (name) {
    case 'list_capabilities':
      return textResult(await callAgentOps('list_capabilities'));
    case 'get_sales_summary':
      return textResult(await callAgentOps('get_sales_summary', args));
    case 'list_sales':
      return textResult(await callAgentOps('list_sales', args));
    case 'get_revenue_run_rate':
      return textResult(await callAgentOps('get_revenue_run_rate', args));
    case 'get_period_snapshot':
      return textResult(await callAgentOps('get_period_snapshot', args));
    case 'list_expense_categories':
      return textResult(await callAgentOps('list_expense_categories'));
    case 'list_expenses':
      return textResult(await callAgentOps('list_expenses', args));
    case 'create_expense':
      return textResult(await callAgentOps('create_expense', args));
    case 'update_expense':
      return textResult(await callAgentOps('update_expense', args));
    case 'delete_expense':
      return textResult(await callAgentOps('delete_expense', args));
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
        sendResult(id, { tools: TOOLS });
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
