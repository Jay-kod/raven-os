import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ContextFile {
  path: string;
  content: string;
}

export interface LaravelContext {
  projectRoot: string;
  routes: string;
  migrations: ContextFile[];
  models: ContextFile[];
  policies: ContextFile[];
}

export interface ContextPackPaths {
  projectContext: string;
  database: string;
  api: string;
}

async function collectPhpFiles(directory: string): Promise<ContextFile[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: ContextFile[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectPhpFiles(path));
    } else if (entry.isFile() && entry.name.endsWith('.php')) {
      files.push({ path, content: await readFile(path, 'utf8') });
    }
  }
  return files;
}

async function readDirectoryOrEmpty(directory: string): Promise<ContextFile[]> {
  try {
    return await collectPhpFiles(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export async function collectLaravelContext(projectRoot: string): Promise<LaravelContext> {
  const artisan = join(projectRoot, 'artisan');
  const artisanStats = await stat(artisan);
  if (!artisanStats.isFile()) throw new Error('The selected project does not contain a Laravel artisan file.');

  const { stdout } = await execFileAsync('php', ['artisan', 'route:list', '--json'], {
    cwd: projectRoot,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024
  });
  return {
    projectRoot,
    routes: stdout,
    migrations: await readDirectoryOrEmpty(join(projectRoot, 'database', 'migrations')),
    models: await readDirectoryOrEmpty(join(projectRoot, 'app', 'Models')),
    policies: await readDirectoryOrEmpty(join(projectRoot, 'app', 'Policies'))
  };
}

function relativePath(projectRoot: string, filePath: string): string {
  return relative(projectRoot, filePath).replace(/\\/g, '/');
}

function fileList(title: string, projectRoot: string, files: ContextFile[]): string {
  const lines = files.map((file) => `- \`${relativePath(projectRoot, file.path)}\``);
  return `## ${title}\n\n${lines.length > 0 ? lines.join('\n') : '_None found._'}\n`;
}

export async function writeContextPack(context: LaravelContext, paths: ContextPackPaths): Promise<void> {
  const projectSummary = [
    '# Project Context',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    fileList('Migrations', context.projectRoot, context.migrations),
    fileList('Models', context.projectRoot, context.models),
    fileList('Policies', context.projectRoot, context.policies)
  ].join('\n');
  const database = ['# Database Context', '', fileList('Migrations', context.projectRoot, context.migrations)].join('\n');
  const api = ['# API Context', '', '## Routes', '', '```json', context.routes.trim(), '```', ''].join('\n');

  await Promise.all([
    writeFile(paths.projectContext, projectSummary, 'utf8'),
    writeFile(paths.database, database, 'utf8'),
    writeFile(paths.api, api, 'utf8')
  ]);
}
