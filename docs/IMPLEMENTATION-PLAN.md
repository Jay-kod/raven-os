# Raven Implementation Plan

This plan follows the phases in [TODO.md](./TODO.md). Each phase should be completed and
validated before the next phase begins.

## Guiding constraints

- Raven is a local Windows helper, not an agent controller.
- Never type or submit prompts.
- Never auto-approve actions.
- Relay only Proceed, Deny, or Skip after an explicit user action.
- Keep core logic independent from Vue and Electron UI code.
- Use no network calls, accounts, telemetry, or backend services.

## Phase 0 — Spike and architecture decision

### Work

1. Run the manual UI Automation spike described by `PHASE-0-SPIKE.md`.
2. Test detection of:
   - Antigravity or VS Code source window
   - Pending approval prompt
   - Prompt text and command/file path
   - Proceed, Deny, and Skip controls
3. Record results, limitations, and permission requirements in `ARCHITECTURE.md`.
4. Choose one mode:
   - `full`: detection and safe button relay work
   - `focus-and-send`: focus the source app but do not relay clicks
   - `notification-only`: display attention notifications only

### Exit criteria

- `ARCHITECTURE.md` documents the observed UIA tree and failure cases.
- The selected mode is explicit.
- Unsafe or unreliable automation paths are excluded from later implementation.

## Phase 2 — Progress pipeline

### Work

1. Define the `.ai/progress.json` schema in `packages/core`.
2. Validate required fields, task status, step counts, and malformed input.
3. Add a file watcher for the project `.ai/progress.json`.
4. Send validated progress events to the overlay through the existing `CommandBus`.
5. Add git cross-checking:
   - Claimed files exist.
   - Claimed changes appear in `git diff`.
   - Mismatches are visible and never silently ignored.
6. Generate an agent rules file explaining when and how to update progress.

### Exit criteria

- Valid progress updates animate the existing progress UI.
- Invalid updates produce an explicit error state.
- File and git mismatches are displayed.
- No Phase 3 approval behavior is introduced.

## Phase 3 — Approval bridge

### Work

1. Define an `ApprovalBridge` interface in `packages/core`.
2. Implement the selected Phase 0 mechanism behind that interface.
3. Add a Windows UI Automation sidecar only if the spike supports it.
4. Detect pending prompts and extract:
   - Exact request text
   - Command or file path
   - Source window
5. Detect dangerous patterns:
   - `migrate:fresh`
   - `rm -rf`
   - `git push --force`
   - `.env`
   - `DROP`
6. Build the action card with Proceed, Deny, and Skip.
7. Require press-and-hold for dangerous Proceed actions.
8. Relay only the explicitly selected action.
9. Log every relay to `.ai/overlay.log`.
10. Fall back to notification-only mode when detection is unavailable or ambiguous.

### Exit criteria

- No action occurs without a direct overlay interaction.
- Dangerous actions cannot be confirmed with a normal click.
- Ambiguous targets show “Open Antigravity” rather than guessing.
- Relay failures are visible and logged.

## Phase 4 — Context and guardrails

### Work

1. Implement a Laravel context scanner for:
   - Routes
   - Migrations
   - Models
   - Policies
2. Run `php artisan route:list --json` only on explicit user request.
3. Generate or update:
   - `PROJECT_CONTEXT.md`
   - `DATABASE.md`
   - `API.md`
4. Implement guardrail checks:
   - Missing `$fillable` or `$guarded`
   - Fat controllers
   - Routes without auth middleware
   - Missing Form Requests
5. Display findings with file and line references.

### Exit criteria

- Scans are on-demand and do not modify application source code.
- Generated documentation is deterministic and reviewable.
- Findings identify severity, file, line, and remediation context.

## Phase 5 — Prompts, tracker, and handoff

### Work

1. Add prompt templates for:
   - New CRUD module
   - Form Request and Policy
   - Bug fix
   - Security review
2. Support safe variable substitution from scanned project context.
3. Parse `TODO.md` into phases and tasks.
4. Implement “copy next-task prompt” using the first incomplete task.
5. Include relevant context without automatically submitting anything.
6. Draft a `CHANGELOG.md` handoff from:
   - `progress.json`
   - `git log`
   - Completed and blocked work
7. Require review before saving the handoff.

### Exit criteria

- Copied prompts are complete but never submitted automatically.
- TODO parsing handles unchecked, checked, and phase headings.
- Handoff content is previewed before writing.

## Phase 6 — Packaging

### Work

1. Choose and configure a Windows Electron packaging tool.
2. Produce an installer for the current architecture.
3. Add optional auto-start with an explicit user choice.
4. Verify persisted preferences and `.ai` paths after installation.
5. Document uninstall and data locations.

### Exit criteria

- A clean Windows machine can install and launch Raven.
- Auto-start is opt-in and reversible.
- The packaged app preserves the same safety boundaries as development mode.

## Verification strategy

Every phase should include:

1. Focused unit tests for new core logic.
2. A manual acceptance checklist for Windows-only behavior.
3. A failure-path test for malformed input or unavailable dependencies.
4. A review of scope boundaries to ensure no prompt typing or automatic approval was added.

Before calling a phase complete:

- Run the smallest relevant test/typecheck/build command.
- Exercise the new behavior manually when it depends on Electron or Windows.
- Update only that phase's checkboxes in `TODO.md`.
- Record unresolved limitations in `ARCHITECTURE.md` or the relevant phase notes.

## Recommended execution order

1. Phase 0 spike and mode decision
2. Phase 2 progress pipeline
3. Phase 3 approval bridge
4. Phase 4 context and guardrails
5. Phase 5 prompts, tracker, and handoff
6. Phase 6 packaging

Phase 3 must not begin until Phase 0 establishes whether reliable UI Automation is possible.
