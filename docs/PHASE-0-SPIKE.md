# Phase 0 UI Automation Spike

## Safety rules

- Use only a harmless test prompt or confirmation.
- Do not approve, deny, skip, submit, or execute a real project operation.
- Raven must remain read-only during this spike.
- Record observations only; do not capture secrets, tokens, or private source text.

## Test matrix

Run each test against the available application and record the result in
`ARCHITECTURE.md`.

| Test | VS Code | Antigravity |
|---|---|---|
| Locate the top-level source window | ☐ | ☐ |
| Detect a visible pending prompt | ☐ | ☐ |
| Read prompt label or summary | ☐ | ☐ |
| Read command/file-path field | ☐ | ☐ |
| Identify Proceed control | ☐ | ☐ |
| Identify Deny control | ☐ | ☐ |
| Identify Skip control | ☐ | ☐ |
| Distinguish disabled/hidden controls | ☐ | ☐ |
| Detect target changes after app update | ☐ | ☐ |

## Procedure

1. Open a harmless approval/confirmation prompt.
2. Identify the application window and its UI Automation properties.
3. Inspect the prompt container and record stable properties:
   - automation id
   - control type
   - accessible name
   - class name
   - process id
4. Inspect the three allowed action controls without clicking them.
5. Repeat after moving or resizing the application window.
6. Close the prompt and confirm the detector reports no pending approval.
7. Mark any unstable, missing, or ambiguous properties.

## Decision rules

- Choose `full` only when the prompt and all three action controls are reliably
  identifiable without guessing.
- Choose `focus-and-send` when the source window is reliable but button relay is
  not reliable.
- Choose `notification-only` when prompt detection or source identification is
  unreliable.
