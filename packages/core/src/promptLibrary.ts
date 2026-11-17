export type PromptTemplateId = 'crud' | 'form-request-policy' | 'bug-fix' | 'security-review';

export interface PromptVariables {
  projectName?: string;
  task?: string;
  model?: string;
  details?: string;
}

const templates: Record<PromptTemplateId, (variables: PromptVariables) => string> = {
  crud: (v) => `Implement a new CRUD module${v.model ? ` for ${v.model}` : ''} in ${v.projectName ?? 'the project'}.

Requirements:
- Add the model, migration, Form Request, policy, controller, and routes.
- Follow existing project conventions.
- Add focused tests.
- Update .ai/progress.json after each subtask.
${v.details ?? ''}`,
  'form-request-policy': (v) => `Add a Form Request and Policy for ${v.model ?? 'the requested resource'} in ${v.projectName ?? 'the project'}.

Requirements:
- Validate all write inputs.
- Enforce authorization in the policy and route/controller boundary.
- Add focused tests for authorized and unauthorized cases.
- Update .ai/progress.json after each subtask.
${v.details ?? ''}`,
  'bug-fix': (v) => `Investigate and fix this bug in ${v.projectName ?? 'the project'}:

${v.details ?? v.task ?? 'Describe the bug before starting.'}

Requirements:
- Reproduce the issue first.
- Make the smallest safe fix.
- Add or update a regression test.
- Update .ai/progress.json after each subtask.`,
  'security-review': (v) => `Perform a focused security review of ${v.projectName ?? 'the project'}.

Focus:
${v.details ?? 'authorization boundaries, input validation, sensitive data exposure, and unsafe commands'}

Requirements:
- Report file and line references.
- Do not modify source files during the review.
- Update .ai/progress.json with findings only.`
};

export function renderPrompt(template: PromptTemplateId, variables: PromptVariables): string {
  return templates[template](variables).trim();
}
