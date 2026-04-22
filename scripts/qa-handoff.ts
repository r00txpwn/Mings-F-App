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
    };
  } | null;
};

type IssueUpdateData = { issueUpdate: { success: boolean } };
type CommentCreateData = { commentCreate: { success: boolean } };

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const QA_LABEL_NAMES = ['qa:ready', 'qa:running', 'qa:passed', 'qa:failed', 'qa:blocked'] as const;

type QaLabelName = (typeof QA_LABEL_NAMES)[number];

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
  if (!key) {
    throw new Error('Missing LINEAR_API_KEY in environment (set it or add to .env.local).');
  }
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
         }
       }
     }`,
    { identifier }
  );
}

async function setLabels(apiKey: string, issueId: string, labelIds: string[]) {
  return linearRequest<IssueUpdateData>(
    apiKey,
    `mutation SetLabels($issueId: String!, $labelIds: [String!]!) {
       issueUpdate(id: $issueId, input: { labelIds: $labelIds }) { success }
     }`,
    { issueId, labelIds }
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
  const briefFile = getFlag(flags, 'brief-file', 'QA_BRIEF_FILE');
  if (!issueIdentifier) {
    throw new Error('Usage: ts-node scripts/qa-handoff.ts --issue=MIN-12 --brief-file=path/to/brief.md');
  }
  if (!briefFile) {
    throw new Error('Missing --brief-file=<path>; prepare the handoff brief as markdown first.');
  }

  const body = (await readFile(briefFile, 'utf8')).trim();
  if (!body) {
    throw new Error(`Brief file ${briefFile} is empty.`);
  }

  const apiKey = getApiKey();
  const issueData = await fetchIssue(apiKey, issueIdentifier);
  const issue = issueData.issue;
  if (!issue) {
    throw new Error(`Linear issue ${issueIdentifier} was not found.`);
  }

  const labelIds = nextLabelIds(issue, 'qa:ready');
  const updateResult = await setLabels(apiKey, issue.id, labelIds);
  if (!updateResult.issueUpdate.success) {
    throw new Error(`Failed to set labels on ${issue.identifier}.`);
  }

  const commentResult = await postComment(apiKey, issue.id, body);
  if (!commentResult.commentCreate.success) {
    throw new Error(`Labels updated on ${issue.identifier} but handoff comment failed.`);
  }

  console.log(`${issue.identifier} handed off to QA. Label set to qa:ready and comment posted.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
