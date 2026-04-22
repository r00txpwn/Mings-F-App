import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type IssueData = {
  issue: {
    id: string;
    identifier: string;
    title: string;
    priority: number;
    labels: { nodes: Array<{ id: string; name: string }> };
    team: {
      id: string;
      labels: { nodes: Array<{ id: string; name: string }> };
      states: { nodes: Array<{ id: string; name: string; type: string }> };
    };
  } | null;
};

type IssueUpdateData = {
  issueUpdate: { success: boolean; issue?: { identifier: string; state?: { id: string; name: string; type: string } } };
};
type CommentCreateData = { commentCreate: { success: boolean } };

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const QA_LABEL_NAMES = ['qa:ready', 'qa:running', 'qa:passed', 'qa:failed', 'qa:blocked'] as const;

type QaLabelName = (typeof QA_LABEL_NAMES)[number];

const STATUS_LABEL: Record<string, QaLabelName> = {
  pass: 'qa:passed',
  passed: 'qa:passed',
  fail: 'qa:failed',
  failed: 'qa:failed',
  block: 'qa:blocked',
  blocked: 'qa:blocked',
  running: 'qa:running',
};

async function linearRequest<T>(apiKey: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`Linear API request failed with HTTP ${response.status}`);
  }
  const payload = (await response.json()) as GraphQLResponse<T>;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message ?? 'Unknown Linear error').join('; '));
  }
  if (!payload.data) {
    throw new Error('Linear API returned no data.');
  }
  return payload.data;
}

function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq === -1) {
      out[raw.slice(2)] = 'true';
    } else {
      out[raw.slice(2, eq)] = raw.slice(eq + 1);
    }
  }
  return out;
}

function mergeEnvLocalIfMissing(): void {
  if (process.env.LINEAR_API_KEY?.trim()) return;
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function getApiKey(): string {
  mergeEnvLocalIfMissing();
  const key = process.env.LINEAR_API_KEY?.trim();
  if (!key) throw new Error('Missing LINEAR_API_KEY in environment (set it or add to .env.local).');
  return key;
}

function getFlag(flags: Record<string, string>, name: string, envName?: string): string | undefined {
  const direct = flags[name]?.trim();
  if (direct) return direct;
  if (envName) {
    const env = process.env[envName]?.trim();
    if (env) return env;
  }
  const npmEnv = process.env[`npm_config_${name}`]?.trim();
  if (npmEnv) return npmEnv;
  return undefined;
}

async function fetchIssue(apiKey: string, identifier: string) {
  return linearRequest<IssueData>(
    apiKey,
    `query IssueByIdentifier($identifier: String!) {
       issue(id: $identifier) {
         id identifier title priority
         labels { nodes { id name } }
         team {
           id
           labels(first: 250) { nodes { id name } }
           states {
             nodes { id name type }
           }
         }
       }
     }`,
    { identifier }
  );
}

/** Same shape as `scripts/close-issue.ts` — first workflow state with type `completed`. */
function getCompletedWorkflowStateId(issue: NonNullable<IssueData['issue']>): string | null {
  const completed = issue.team.states.nodes.find((s) => s.type === 'completed');
  return completed?.id ?? null;
}

async function updateIssueLabelsAndOptionalState(
  apiKey: string,
  issueId: string,
  labelIds: string[],
  stateId: string | undefined
) {
  const input: { labelIds: string[]; stateId?: string } = { labelIds };
  if (stateId) input.stateId = stateId;

  return linearRequest<IssueUpdateData>(
    apiKey,
    `mutation UpdateIssueQa($issueId: String!, $input: IssueUpdateInput!) {
       issueUpdate(id: $issueId, input: $input) {
         success
         issue { identifier state { id name type } }
       }
     }`,
    { issueId, input }
  );
}

async function postComment(apiKey: string, issueId: string, body: string) {
  return linearRequest<CommentCreateData>(
    apiKey,
    `mutation CreateComment($issueId: String!, $body: String!) {
       commentCreate(input: { issueId: $issueId, body: $body }) { success }
     }`,
    { issueId, body }
  );
}

function nextLabelIds(
  issue: NonNullable<IssueData['issue']>,
  targetQaLabel: QaLabelName
): string[] {
  const teamLabels = issue.team.labels.nodes;
  const currentLabelIds = new Set(issue.labels.nodes.map((l) => l.id));
  const qaIdsByName = new Map<string, string>();
  for (const label of teamLabels) {
    if ((QA_LABEL_NAMES as readonly string[]).includes(label.name)) {
      qaIdsByName.set(label.name, label.id);
    }
  }
  for (const name of QA_LABEL_NAMES) {
    const id = qaIdsByName.get(name);
    if (id) currentLabelIds.delete(id);
  }
  const targetId = qaIdsByName.get(targetQaLabel);
  if (!targetId) {
    throw new Error(
      `Label "${targetQaLabel}" not found on team ${issue.team.id}. Create the qa:* labels first.`
    );
  }
  currentLabelIds.add(targetId);
  return Array.from(currentLabelIds);
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const issueIdentifier = getFlag(flags, 'issue', 'ISSUE')?.toUpperCase();
  const statusInputRaw = getFlag(flags, 'status', 'QA_STATUS');
  const resultFile = getFlag(flags, 'result-file', 'QA_RESULT_FILE');

  if (!issueIdentifier) {
    throw new Error(
      'Usage: ts-node scripts/qa-result.ts --issue=MIN-12 --status=pass|fail|blocked [--result-file=path] [--no-resolve]\n' +
        '  --no-resolve  On pass only: set qa:passed label + comment but do not move the issue to a completed workflow state.'
    );
  }
  const statusInput = statusInputRaw?.toLowerCase();
  if (!statusInput || !STATUS_LABEL[statusInput]) {
    throw new Error('Missing or invalid --status. Use one of: pass, fail, blocked, running.');
  }
  const targetLabel = STATUS_LABEL[statusInput];

  let body = '';
  if (resultFile) {
    body = (await readFile(resultFile, 'utf8')).trim();
  }

  const apiKey = getApiKey();
  const issueData = await fetchIssue(apiKey, issueIdentifier);
  const issue = issueData.issue;
  if (!issue) {
    throw new Error(`Linear issue ${issueIdentifier} was not found.`);
  }

  const labelIds = nextLabelIds(issue, targetLabel);

  let completedStateId: string | undefined;
  const skipResolve = flags['no-resolve'] === 'true' || flags['no-resolve'] === '';
  if (targetLabel === 'qa:passed' && !skipResolve) {
    completedStateId = getCompletedWorkflowStateId(issue) ?? undefined;
    if (!completedStateId) {
      console.warn(
        `[qa-result] No workflow state with type "completed" found for team; only labels will be updated. ` +
          `Add a Done/completed state or pass --no-resolve to silence this.`
      );
    }
  }

  const updateResult = await updateIssueLabelsAndOptionalState(apiKey, issue.id, labelIds, completedStateId);
  if (!updateResult.issueUpdate.success) {
    throw new Error(`Failed to update ${issue.identifier} (labels${completedStateId ? ' + state' : ''}).`);
  }

  if (body) {
    const commentResult = await postComment(apiKey, issue.id, body);
    if (!commentResult.commentCreate.success) {
      throw new Error(`Issue updated on ${issue.identifier} but QA result comment failed.`);
    }
  }

  const stateNote =
    targetLabel === 'qa:passed' && !skipResolve && completedStateId
      ? `; state → ${updateResult.issueUpdate.issue?.state?.name ?? 'completed'}`
      : '';
  console.log(`${issue.identifier} label set to ${targetLabel}${stateNote}${body ? ' and result comment posted' : ''}.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
