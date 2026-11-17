import type { GuardrailFinding, IdeStatus, ProgressSnapshot, RavenCommand } from '@core/index';

declare global {
  interface Window {
    raven: {
      dispatch(command: RavenCommand): void;
      onCommand(handler: (command: RavenCommand) => void): () => void;
      onWindowMode(handler: (mode: 'orb' | 'expanded') => void): () => void;
      onProgress(handler: (snapshot: ProgressSnapshot) => void): () => void;
      onProgressError(handler: (message: string) => void): () => void;
      onGuardrails(handler: (findings: GuardrailFinding[]) => void): () => void;
      onGuardrailsError(handler: (message: string) => void): () => void;
      onTaskResult(handler: (message: string) => void): () => void;
      onTaskError(handler: (message: string) => void): () => void;
      onAutostartStatus(handler: (enabled: boolean) => void): () => void;
      onIdeStatus(handler: (status: IdeStatus[]) => void): () => void;
      onIdeStatusError(handler: (message: string) => void): () => void;
    };
  }
}

export {};
