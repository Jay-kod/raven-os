export interface TodoTask {
  phase: string;
  title: string;
  completed: boolean;
  line: number;
}

export function parseTodo(content: string): TodoTask[] {
  let phase = 'Uncategorized';
  const tasks: TodoTask[] = [];
  content.split(/\r?\n/).forEach((line, index) => {
    const phaseMatch = line.match(/^##\s+(.+?)\s*$/);
    if (phaseMatch) {
      phase = phaseMatch[1];
      return;
    }
    const taskMatch = line.match(/^\s*-\s+\[([ xX])\]\s+(.+?)\s*$/);
    if (taskMatch) {
      tasks.push({ phase, title: taskMatch[2], completed: taskMatch[1].toLowerCase() === 'x', line: index + 1 });
    }
  });
  return tasks;
}

export function nextTodoTask(content: string): TodoTask | null {
  return parseTodo(content).find((task) => !task.completed) ?? null;
}

export function buildNextTaskPrompt(task: TodoTask, context = ''): string {
  return `Work on the next Raven task from ${task.phase}:

${task.title}

Constraints:
- Do only this task and its directly related changes.
- Preserve Raven's read-only safety boundaries.
- Validate the result with the smallest relevant test, typecheck, or build command.
- Update .ai/progress.json after each subtask.
${context ? `\nRelevant context:\n${context}` : ''}`;
}
