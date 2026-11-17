export type ApprovalAction = 'proceed' | 'deny' | 'skip';
export type ApprovalMode = 'full' | 'focus-and-send' | 'notification-only';

export interface ApprovalRequest {
  id: string;
  sourceWindow: string;
  summary: string;
  commandOrPath?: string;
  detectedAt: string;
  dangerous: boolean;
}

export interface ApprovalDecision {
  requestId: string;
  action: ApprovalAction;
  confirmedAt: string;
}

export interface ApprovalBridge {
  readonly mode: ApprovalMode;
  start(onRequest: (request: ApprovalRequest) => void, onError: (error: Error) => void): void;
  stop(): void;
  decide(decision: ApprovalDecision): Promise<void>;
}

const dangerousPatterns: RegExp[] = [
  /\bmigrate:fresh\b/i,
  /\brm\s+-rf\b/i,
  /\bgit\s+push\s+--force(?:-with-lease)?\b/i,
  /(?:^|[\\/])\.env(?:$|[\\/.\s])/i,
  /\bDROP\s+(?:DATABASE|TABLE|SCHEMA)\b/i
];

export function isDangerousApproval(summary: string, commandOrPath?: string): boolean {
  const content = `${summary}\n${commandOrPath ?? ''}`;
  return dangerousPatterns.some((pattern) => pattern.test(content));
}

export class NotificationOnlyApprovalBridge implements ApprovalBridge {
  readonly mode = 'notification-only' as const;

  start(_onRequest: (request: ApprovalRequest) => void, _onError: (error: Error) => void): void {
    // Detection is intentionally disabled until a stable UI Automation target is verified.
  }

  stop(): void {
    // No detection process is running in notification-only mode.
  }

  async decide(_decision: ApprovalDecision): Promise<void> {
    throw new Error('Approval relay is unavailable in notification-only mode.');
  }
}
