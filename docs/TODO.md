# TODO.md

## Phase 0 — Spike (manual, see PHASE-0-SPIKE.md)
- [x] Run spike, record results in ARCHITECTURE.md
- [x] Decide mode: full / focus-and-send / notification-only

## Phase 1 — Overlay shell
- [x] Electron + TS + Vue 3 scaffold (electron-vite), monorepo with packages/core
- [x] Frameless, transparent, always-on-top window; drag; resize; no focus steal
- [x] Expanded <-> orb states with animations (idle, working, needs-me, done, failed)
- [x] Orb snaps to screen edges; position/size/state persisted
- [x] Global hotkey show/hide
- [x] Mock progress feed to test animations
- [x] Theme file (deep emerald on AMOLED black) + all state styles from REQUIREMENTS.md section 7
- [x] CommandBus in core; all UI actions routed through it

## Phase 2 — Progress pipeline
- [x] `.ai/progress.json` schema + validator in core
- [x] File watcher -> overlay animated bar
- [x] Git cross-check (diff, file existence), flag mismatches
- [x] Generated rules file telling the agent to update progress.json after each subtask

## Phase 3 — Approval bridge (shape depends on spike)
- [x] ApprovalBridge interface + notification-only implementation
- [ ] Detect pending prompt, extract text/command, identify source window
- [ ] Action card with Proceed / Deny / Skip, danger highlighting, press-and-hold
- [ ] Relay click; log to `.ai/overlay.log`
- [x] Degrade to notification-only if detection fails

## Phase 4 — Context + guardrails
- [x] Context pack generator (routes, migrations, models, policies)
- [x] Guardrails scanner + results panel

## Phase 5 — Prompts, tracker, handoff
- [x] Prompt/spec library with variables
- [x] TODO.md parser + "copy next-task prompt"
- [x] Session handoff draft into CHANGELOG.md (review before save)

## Phase 6 — Package
- [x] Windows installer, auto-start option

## Future (not scheduled)
- [ ] Voice wake word + short commands (offline), via CommandBus; never for dangerous-pattern approvals
