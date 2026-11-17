# Raven Architecture Notes

## Phase 0 status

- Spike target: VS Code and Antigravity
- Safe prompt available: yes
- Current mode decision: `notification-only`
- Date: 2026-11-17

## UI Automation observations

Complete `PHASE-0-SPIKE.md` against each available application. Record stable
properties only; do not copy prompt contents, commands, paths, credentials, or
other private data here.

### VS Code

- Source window: Detected as `Microsoft.VisualStudioCode`; window title was
  `IMPLEMENTATION-PLAN.md - raven - Visual Studio Code`.
- Pending prompt container: Not visible in the current window or retest.
- Prompt text or summary: Not available.
- Command/file field: Not available.
- Proceed control: Not exposed.
- Deny control: Not exposed.
- Skip control: Not exposed.
- Stability notes: The accessibility tree exposes the VS Code workbench, editor,
  explorer, terminal, and Copilot chat. Matches for approval-related words were
  chat transcript text, not actionable controls. No pending approval action card
  was exposed.

### Antigravity

- Source window: Detected as `Google.AntigravityIDE`; window title was
  `candycutz - Antigravity IDE`.
- Pending prompt container: Not visible in the current window or retest.
- Prompt text or summary: Not available.
- Command/file field: Not available.
- Proceed control: Not exposed.
- Deny control: Not exposed.
- Skip control: Not exposed.
- Stability notes: The accessibility tree exposes the Antigravity workbench and
  agent panel. Matches for `proceed` were prior agent transcript text, not an
  actionable control. No pending approval card was exposed.

## Mode decision

Select exactly one after testing:

- [ ] `full` — detection and safe button relay
- [ ] `focus-and-send` — focus source app without relay
- [x] `notification-only` — attention notification only

No relay behavior is authorized. A future prompt-specific retest may change
the mode only after stable controls are observed.

## Risks and follow-up

- Do not implement Proceed, Deny, or Skip relay while the controls remain
  unverified.
- Phase 3 currently exposes an `ApprovalBridge` contract and a
  `NotificationOnlyApprovalBridge`. The latter rejects relay decisions
  explicitly, so unavailable detection cannot become a silent approval path.
