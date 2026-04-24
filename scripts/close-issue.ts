import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type IssueQueryData = {
  issue: {
    id: string;
    identifier: string;
    title: string;
    priority: number;
    labels: { nodes: Array<{ id: string; name: string }> };
    team: {
      states: {
        nodes: Array<{ id: string; name: string; type: string }>;
      };
    };
  } | null;
};

type IssueUpdateData = { issueUpdate: { success: boolean } };
type CommentCreateData = { commentCreate: { success: boolean } };

const LINEAR_API_URL = 'https://api.linear.app/graphql';

async function linearRequest<T>(apiKey: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Linear API request failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message ?? 'Unknown Linear error').join('; '));
  }

  if (!payload.data) {
    throw new Error('Linear API returned no data.');
  }

  return payload.data;
}

type CliArgs = {
  issueIdentifier: string;
  force: boolean;
};

function parseArgs(): CliArgs {
  const rest = process.argv.slice(2);
  let issue: string | undefined;
  let force = false;
  for (const arg of rest) {
    if (arg === '--force') {
      force = true;
    } else if (arg.startsWith('--')) {
      // unknown flag — ignore for forward compat
    } else if (!issue) {
      issue = arg.trim().toUpperCase();
    }
  }
  if (!issue) {
    throw new Error('Usage: npx ts-node scripts/close-issue.ts MIN-12 [--force]');
  }
  return { issueIdentifier: issue, force };
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

function getApiKey() {
  mergeEnvLocalIfMissing();
  const apiKey = process.env.LINEAR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing LINEAR_API_KEY in environment (set it or add to .env.local).');
  }
  return apiKey;
}

async function fetchIssue(apiKey: string, identifier: string) {
  return linearRequest<IssueQueryData>(
    apiKey,
    `
      query IssueByIdentifier($identifier: String!) {
        issue(id: $identifier) {
          id
          identifier
          title
          priority
          labels { nodes { id name } }
          team {
            states {
              nodes {
                id
                name
                type
              }
            }
          }
        }
      }
    `,
    { identifier }
  );
}

function getDoneStateId(issue: NonNullable<IssueQueryData['issue']>) {
  const completedState = issue.team.states.nodes.find((state) => state.type === 'completed');
  if (!completedState) {
    throw new Error(`Could not find a completed workflow state for ${issue.identifier}.`);
  }
  return completedState.id;
}

function assertReadyToClose(
  issue: NonNullable<IssueQueryData['issue']>,
  args: CliArgs
) {
  const labelNames = issue.labels.nodes.map((l) => l.name);
  const hasPassed = labelNames.includes('qa:passed');
  const priority = issue.priority;
  const priorityLabel = priorityName(priority);

  if (!hasPassed && !args.force) {
    throw new Error(
      `${issue.identifier} does not have label "qa:passed". ` +
        `Run second-pass QA (via npm run qa:handoff + Claude Extension) before closing, ` +
        `or pass --force to override.`
    );
  }

  if ((priority === 1 || priority === 2) && !args.force) {
    throw new Error(
      `${issue.identifier} is ${priorityLabel} priority. Closing requires explicit --force ` +
        `(run: npm run close:issue -- ${issue.identifier} --force) after human approval.`
    );
  }
}

function priorityName(priority: number): string {
  switch (priority) {
    case 1:
      return 'Urgent';
    case 2:
      return 'High';
    case 3:
      return 'Medium';
    case 4:
      return 'Low';
    default:
      return 'No priority';
  }
}

async function markIssueDone(apiKey: string, issueId: string, stateId: string) {
  return linearRequest<IssueUpdateData>(
    apiKey,
    `
      mutation UpdateIssueState($issueId: String!, $stateId: String!) {
        issueUpdate(id: $issueId, input: { stateId: $stateId }) {
          success
        }
      }
    `,
    { issueId, stateId }
  );
}

async function addCompletionComment(apiKey: string, issueId: string, issueIdentifier: string) {
  const body = [
    `Resolved via \`scripts/close-issue.ts\`.`,
    '',
    `Closed at: ${new Date().toISOString()}`,
    '',
    `Issue ${issueIdentifier} has been marked Done.`,
  ].join('\n');

  return linearRequest<CommentCreateData>(
    apiKey,
    `
      mutation CreateComment($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
        }
      }
    `,
    { issueId, body }
  );
}

async function main() {
  const args = parseArgs();
  const apiKey = getApiKey();
  const issueData = await fetchIssue(apiKey, args.issueIdentifier);
  const issue = issueData.issue;

  if (!issue) {
    throw new Error(`Linear issue ${args.issueIdentifier} was not found.`);
  }

  assertReadyToClose(issue, args);

  const doneStateId = getDoneStateId(issue);
  const updateResult = await markIssueDone(apiKey, issue.id, doneStateId);
  if (!updateResult.issueUpdate.success) {
    throw new Error(`Failed to mark ${issue.identifier} as Done.`);
  }

  const commentResult = await addCompletionComment(apiKey, issue.id, issue.identifier);
  if (!commentResult.commentCreate.success) {
    throw new Error(`Issue ${issue.identifier} was marked Done but comment creation failed.`);
  }

  console.log(`${issue.identifier} marked Done and completion comment added.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
