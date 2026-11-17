export type RavenCommand =
  | { type: 'toggle-visibility' }
  | { type: 'expand' }
  | { type: 'minimize' }
  | { type: 'set-state'; state: OverlayState }
  | { type: 'advance-progress' }
  | { type: 'reset-progress' }
  | { type: 'run-guardrails' }
  | { type: 'copy-next-task-prompt' }
  | { type: 'draft-handoff' }
  | { type: 'toggle-autostart' }
  | { type: 'close-app' };

export type OverlayState = 'idle' | 'working' | 'needs-me' | 'done' | 'failed';
export type CommandHandler = (command: RavenCommand) => void;

export class CommandBus {
  private readonly handlers = new Set<CommandHandler>();

  subscribe(handler: CommandHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  dispatch(command: RavenCommand): void {
    for (const handler of this.handlers) {
      handler(command);
    }
  }
}
