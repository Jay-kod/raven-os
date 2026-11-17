import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type IdeId = 'vscode' | 'antigravity';

export interface IdeStatus {
  id: IdeId;
  name: string;
  connected: boolean;
  processName?: string;
}

const ideProcesses: Record<IdeId, { name: string; processes: string[] }> = {
  vscode: { name: 'VS Code', processes: ['code.exe'] },
  antigravity: { name: 'Antigravity', processes: ['antigravity.exe', 'antigravity ide.exe'] }
};

export async function detectIdeStatus(): Promise<IdeStatus[]> {
  const { stdout } = await execFileAsync('tasklist', ['/FO', 'CSV', '/NH'], { windowsHide: true });
  const processes = stdout.split(/\r?\n/).map((line) => line.split(',')[0]?.replace(/^"|"$/g, '').toLowerCase());
  return (Object.keys(ideProcesses) as IdeId[]).map((id) => {
    const match = ideProcesses[id].processes.find((processName) => processes.includes(processName));
    return {
      id,
      name: ideProcesses[id].name,
      connected: match !== undefined,
      processName: match
    };
  });
}
