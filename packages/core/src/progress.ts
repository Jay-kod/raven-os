import { access, readFile } from 'node:fs/promises';
import { watch, type FSWatcher } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, relative } from 'node:path';

const execFileAsync = promisify(execFile);

export type ProgressStatus = 'idle' | 'working' | 'needs-me' | 'done' | 'failed';
export type StepStatus = 'pending' | 'working' | 'done' | 'failed' | 'skipped';

export interface ProgressStep {
  id: string;
  title: string;
  status: StepStatus;
  files?: string[];
}

export interface ProgressDocument {
  version: 1;
  task: string;
  status: ProgressStatus;
  completed: number;
  total: number;
  currentStep?: string;
  steps: ProgressStep[];
  updatedAt: string;
}

export interface ProgressIssue {
  message: string;
  path?: string;
}

export interface ProgressSnapshot {
  document: ProgressDocument | null;
  issues: ProgressIssue[];
  sourcePath: string;
}

export interface ProgressWatcher {
  close(): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStatus(value: unknown): value is ProgressStatus {
  return value === 'idle' || value === 'working' || value === 'needs-me' || value === 'done' || value === 'failed';
}

function isStepStatus(value: unknown): value is StepStatus {
  return value === 'pending' || value === 'working' || value === 'done' || value === 'failed' || value === 'skipped';
}

export function validateProgress(value: unknown): ProgressSnapshot {
  const issues: ProgressIssue[] = [];
  if (!isRecord(value)) {
    return { document: null, issues: [{ message: 'Progress must be a JSON object.' }], sourcePath: '' };
  }
  if (value.version !== 1) issues.push({ message: 'version must be 1.' });
  if (!isString(value.task) || value.task.trim() === '') issues.push({ message: 'task must be a non-empty string.' });
  if (!isStatus(value.status)) issues.push({ message: 'status is invalid.' });
  if (!Number.isInteger(value.completed) || (value.completed as number) < 0) issues.push({ message: 'completed must be a non-negative integer.' });
  if (!Number.isInteger(value.total) || (value.total as number) <= 0) issues.push({ message: 'total must be a positive integer.' });
  if (Number.isInteger(value.completed) && Number.isInteger(value.total) && (value.completed as number) > (value.total as number)) {
    issues.push({ message: 'completed cannot exceed total.' });
  }
  if (!isString(value.updatedAt) || Number.isNaN(Date.parse(value.updatedAt))) issues.push({ message: 'updatedAt must be an ISO date string.' });
  if (!Array.isArray(value.steps) || value.steps.length === 0) {
    issues.push({ message: 'steps must contain at least one step.' });
  }

  const steps: ProgressStep[] = [];
  if (Array.isArray(value.steps)) {
    value.steps.forEach((step, index) => {
      if (!isRecord(step) || !isString(step.id) || !isString(step.title) || !isStepStatus(step.status)) {
        issues.push({ message: `steps[${index}] is invalid.` });
        return;
      }
      if (step.files !== undefined && (!Array.isArray(step.files) || !step.files.every(isString))) {
        issues.push({ message: `steps[${index}].files must be an array of strings.` });
        return;
      }
      steps.push({ id: step.id, title: step.title, status: step.status, files: step.files as string[] | undefined });
    });
  }

  if (issues.length > 0) return { document: null, issues, sourcePath: '' };
  return {
    document: {
      version: 1,
      task: value.task as string,
      status: value.status as ProgressStatus,
      completed: value.completed as number,
      total: value.total as number,
      currentStep: isString(value.currentStep) ? value.currentStep : undefined,
      steps,
      updatedAt: value.updatedAt as string
    },
    issues,
    sourcePath: ''
  };
}

async function gitDiffFiles(projectRoot: string): Promise<Set<string>> {
  const { stdout } = await execFileAsync('git', ['-C', projectRoot, 'diff', '--name-only', 'HEAD'], { windowsHide: true });
  return new Set(stdout.split(/\r?\n/).filter(Boolean).map((file) => file.replace(/\\/g, '/')));
}

export async function crossCheckProgress(document: ProgressDocument, projectRoot: string): Promise<ProgressIssue[]> {
  const issues: ProgressIssue[] = [];
  let changedFiles: Set<string>;
  try {
    changedFiles = await gitDiffFiles(projectRoot);
  } catch (error) {
    return [{ message: `Git cross-check failed: ${error instanceof Error ? error.message : 'unknown error'}` }];
  }

  for (const step of document.steps) {
    for (const file of step.files ?? []) {
      const absolutePath = join(projectRoot, file);
      try {
        await access(absolutePath);
      } catch {
        issues.push({ message: 'Claimed file does not exist.', path: file });
        continue;
      }
      const normalized = relative(projectRoot, absolutePath).replace(/\\/g, '/');
      if (step.status === 'done' && !changedFiles.has(normalized)) {
        issues.push({ message: 'Completed step claims a file not present in git diff.', path: file });
      }
    }
  }
  return issues;
}

export async function readProgress(progressPath: string, projectRoot: string): Promise<ProgressSnapshot> {
  try {
    const raw = await readFile(progressPath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    const result = validateProgress(parsed);
    result.sourcePath = progressPath;
    if (result.document) {
      result.issues.push(...await crossCheckProgress(result.document, projectRoot));
    }
    return result;
  } catch (error) {
    return {
      document: null,
      issues: [{ message: `Progress file could not be read: ${error instanceof Error ? error.message : 'unknown error'}` }],
      sourcePath: progressPath
    };
  }
}

export function watchProgress(
  progressPath: string,
  projectRoot: string,
  onUpdate: (snapshot: ProgressSnapshot) => void,
  onError: (error: Error) => void
): ProgressWatcher {
  let timer: NodeJS.Timeout | undefined;
  const publish = (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void readProgress(progressPath, projectRoot).then(onUpdate, onError);
    }, 100);
  };
  let watcher: FSWatcher;
  try {
    watcher = watch(progressPath, publish);
    publish();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Progress watcher could not start.'));
    return { close: () => undefined };
  }
  return {
    close: () => {
      if (timer) clearTimeout(timer);
      watcher.close();
    }
  };
}
