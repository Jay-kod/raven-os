export interface HandoffInput {
  task: string;
  status: string;
  completedSteps: string[];
  blockedSteps: string[];
  gitLog: string;
}

export function buildHandoffDraft(input: HandoffInput): string {
  const completed = input.completedSteps.length > 0
    ? input.completedSteps.map((step) => `- ${step}`).join('\n')
    : '- None recorded';
  const blocked = input.blockedSteps.length > 0
    ? input.blockedSteps.map((step) => `- ${step}`).join('\n')
    : '- None recorded';
  return `## Raven session handoff

Task: ${input.task}
Status: ${input.status}

### Completed
${completed}

### Blocked or unresolved
${blocked}

### Recent commits
\`\`\`
${input.gitLog.trim() || 'No git history available.'}
\`\`\`
`;
}
