import { contextBridge, ipcRenderer } from 'electron';
import type { GuardrailFinding, IdeStatus, ProgressSnapshot, RavenCommand } from '@core/index';

contextBridge.exposeInMainWorld('raven', {
  dispatch(command: RavenCommand): void {
    ipcRenderer.send('dispatch-command', command);
  },
  onCommand(handler: (command: RavenCommand) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, command: RavenCommand) => handler(command);
    ipcRenderer.on('command', listener);
    return () => ipcRenderer.removeListener('command', listener);
  },
  onWindowMode(handler: (mode: 'orb' | 'expanded') => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, mode: 'orb' | 'expanded') => handler(mode);
    ipcRenderer.on('window-mode', listener);
    return () => ipcRenderer.removeListener('window-mode', listener);
  },
  onProgress(handler: (snapshot: ProgressSnapshot) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: ProgressSnapshot) => handler(snapshot);
    ipcRenderer.on('progress-update', listener);
    return () => ipcRenderer.removeListener('progress-update', listener);
  },
  onProgressError(handler: (message: string) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => handler(message);
    ipcRenderer.on('progress-update-error', listener);
    return () => ipcRenderer.removeListener('progress-update-error', listener);
  },
  onGuardrails(handler: (findings: GuardrailFinding[]) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, findings: GuardrailFinding[]) => handler(findings);
    ipcRenderer.on('guardrails-update', listener);
    return () => ipcRenderer.removeListener('guardrails-update', listener);
  },
  onGuardrailsError(handler: (message: string) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => handler(message);
    ipcRenderer.on('guardrails-error', listener);
    return () => ipcRenderer.removeListener('guardrails-error', listener);
  },
  onTaskResult(handler: (message: string) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => handler(message);
    ipcRenderer.on('task-result', listener);
    return () => ipcRenderer.removeListener('task-result', listener);
  },
  onTaskError(handler: (message: string) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => handler(message);
    ipcRenderer.on('task-error', listener);
    return () => ipcRenderer.removeListener('task-error', listener);
  },
  onAutostartStatus(handler: (enabled: boolean) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, enabled: boolean) => handler(enabled);
    ipcRenderer.on('autostart-status', listener);
    return () => ipcRenderer.removeListener('autostart-status', listener);
  },
  onIdeStatus(handler: (status: IdeStatus[]) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, status: IdeStatus[]) => handler(status);
    ipcRenderer.on('ide-status', listener);
    return () => ipcRenderer.removeListener('ide-status', listener);
  },
  onIdeStatusError(handler: (message: string) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => handler(message);
    ipcRenderer.on('ide-status-error', listener);
    return () => ipcRenderer.removeListener('ide-status-error', listener);
  }
});
