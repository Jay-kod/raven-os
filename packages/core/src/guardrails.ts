import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { collectLaravelContext, type ContextFile } from './laravelContext';

export type GuardrailSeverity = 'warning' | 'error';
export type GuardrailCode = 'missing-model-guard' | 'fat-controller' | 'unprotected-route' | 'missing-form-request';

export interface GuardrailFinding {
  code: GuardrailCode;
  severity: GuardrailSeverity;
  message: string;
  file: string;
  line: number;
}

function lineNumber(content: string, position: number): number {
  return content.slice(0, position).split(/\r?\n/).length;
}

function relativePath(projectRoot: string, filePath: string): string {
  return relative(projectRoot, filePath).replace(/\\/g, '/');
}

async function collectControllers(projectRoot: string): Promise<ContextFile[]> {
  const controllerRoot = join(projectRoot, 'app', 'Http', 'Controllers');
  try {
    const entries = await readdir(controllerRoot, { withFileTypes: true });
    const files: ContextFile[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.php')) continue;
      const path = join(controllerRoot, entry.name);
      files.push({ path, content: await readFile(path, 'utf8') });
    }
    return files;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

function scanModel(projectRoot: string, file: ContextFile): GuardrailFinding[] {
  if (/\$fillable\b|\$guarded\b/.test(file.content)) return [];
  return [{
    code: 'missing-model-guard',
    severity: 'warning',
    message: 'Model has neither $fillable nor $guarded defined.',
    file: relativePath(projectRoot, file.path),
    line: 1
  }];
}

function scanController(projectRoot: string, file: ContextFile): GuardrailFinding[] {
  const findings: GuardrailFinding[] = [];
  const methods = [...file.content.matchAll(/public function\s+\w+\s*\(/g)];
  if (methods.length > 5) {
    findings.push({
      code: 'fat-controller',
      severity: 'warning',
      message: 'Controller contains more than five public methods.',
      file: relativePath(projectRoot, file.path),
      line: lineNumber(file.content, methods[5].index ?? 0)
    });
  }
  return findings;
}

function scanRoutes(projectRoot: string, routes: string): GuardrailFinding[] {
  const findings: GuardrailFinding[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(routes);
  } catch {
    return [{
      code: 'unprotected-route',
      severity: 'error',
      message: 'Laravel route:list output is not valid JSON.',
      file: 'artisan',
      line: 1
    }];
  }
  if (!Array.isArray(parsed)) return findings;
  for (const [index, route] of parsed.entries()) {
    if (typeof route !== 'object' || route === null) continue;
    const record = route as Record<string, unknown>;
    const middleware = Array.isArray(record.middleware) ? record.middleware.join('|') : String(record.middleware ?? '');
    if (!/auth|sanctum|passport/i.test(middleware)) {
      findings.push({
        code: 'unprotected-route',
        severity: 'warning',
        message: `Route ${String(record.method ?? '')} ${String(record.uri ?? '')} has no detected auth middleware.`,
        file: 'routes',
        line: index + 1
      });
    }
  }
  return findings;
}

export async function scanGuardrails(projectRoot: string): Promise<GuardrailFinding[]> {
  const context = await collectLaravelContext(projectRoot);
  const controllers = await collectControllers(projectRoot);
  const findings = [
    ...context.models.flatMap((file) => scanModel(projectRoot, file)),
    ...controllers.flatMap((file) => scanController(projectRoot, file)),
    ...scanRoutes(projectRoot, context.routes)
  ];
  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}
