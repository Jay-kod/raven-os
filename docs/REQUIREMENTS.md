# REQUIREMENTS.md — Raven (AI dev overlay)

## 1. Purpose
A Windows desktop helper that floats above all apps and keeps me informed about what
Antigravity (and VS Code) is doing. It brings forward anything that needs my action and
gives me a few minor buttons. It is a HELPER, not a controller.

## 2. Scope boundary (most important section)
The overlay MAY:
- Observe Antigravity/VS Code windows (read-only) and the project's `.ai/` files and git state.
- Show an "action needed" card with the exact text/command the agent is asking about.
- Relay exactly three minor actions to the app's own buttons: **Proceed**, **Deny**, **Skip**.
- Show progress as an animated bar and a minimized orb.
- Copy text to the clipboard (next-task prompt, context pack) for ME to paste.
- Run on-demand scans (guardrails, context pack generation) when I press a button.

The overlay MUST NOT:
- Type or submit prompts to the agent. I write every prompt myself.
- Auto-approve anything, on a timer or by rule.
- Click anything other than Proceed / Deny / Skip, and only after my click on the overlay.
- Edit project source code. It only writes inside `.ai/` and the docs I ask it to update.
- Disable or bypass any security setting in Antigravity.

## 3. User and platform
- Single user (me), Windows 10/11, local only. No backend, no database, no accounts, no network calls.

## 4. Functional requirements

### F1 Overlay window
- Frameless, transparent, always-on-top, draggable, resizable.
- Does not steal keyboard focus when it appears.
- Remembers position, size and state between launches.
- Global hotkey to show/hide.

### F2 States
| State | Behaviour |
|---|---|
| Expanded | Current task, animated progress bar, current step, action card, quick buttons |
| Orb (minimized) | Small icon, snaps to screen edge, draggable |
| Working | Orb has slow pulse/orbit, thin progress arc |
| Needs me | Orb glows and shakes once, optional sound; click expands to the action card |
| Done / Failed | Green check / red state with reason |

### F3 Action card
- Shows: what is being asked, the exact command or file path, which window it came from.
- Dangerous patterns (`migrate:fresh`, `rm -rf`, `git push --force`, `.env`, `DROP`) are
  highlighted red and Proceed requires press-and-hold.
- If the overlay cannot safely locate the target button, it shows "Open Antigravity" instead of guessing.

### F4 Progress
- Source: `.ai/progress.json` written by the agent (via a generated rules file).
- Cross-check against `git diff` and file existence; flag claims with no matching change.
- Animated segmented bar with `done/total`, plus status-bar style summary in the expanded view.

### F5 Context pack generator (on demand)
- Scans a Laravel project (routes via `php artisan route:list --json`, migrations, models, policies)
  and updates PROJECT_CONTEXT.md, DATABASE.md, API.md.

### F6 Prompt/spec library (on demand)
- Templates: new CRUD module, Form Request + Policy, bug fix, security review.
- Variables filled from the project; result copied to clipboard.

### F7 Phase tracker
- Parses TODO.md into phases/tasks. "Copy next-task prompt" bundles task + relevant context.

### F8 Session handoff
- Drafts a CHANGELOG.md entry from `progress.json` and `git log`. I review before it is saved.

### F9 Guardrails check (on demand)
- Missing `$fillable`/`$guarded`, fat controllers, routes without auth middleware, no Form Request.
- Results shown in the overlay with file/line.

### F10 Voice wake (FUTURE, not in the current phases)
- Local wake word and short commands, offline, no audio leaves the machine.
- Voice may trigger only Raven's own UI actions (expand, minimize, show progress, copy next-task prompt).
- Voice must NOT trigger Proceed on a dangerous-pattern card; those stay press-and-hold on screen.
- Design hook now: every UI action goes through one internal `CommandBus` so hotkey, buttons and
  voice share the same actions and voice can be added without refactoring.

## 5. Non-functional
- Idle CPU under 2%, RAM under 250 MB.
- If Antigravity updates and detection breaks, the overlay degrades to notification-only
  mode (tells me something needs attention, no relay buttons) instead of failing silently.
- Every relayed click is logged to `.ai/overlay.log` (time, window, text, action).

## 6. Tech decisions
- Electron + TypeScript, Vue 3 UI (electron-vite).
- Core logic in a separate Node package (`/packages/core`) with no UI imports.
- Approval detection behind one interface (`ApprovalBridge`) so mechanisms can be swapped.
- Windows UI Automation helper as a sidecar process (mechanism confirmed by Phase 0 spike).

## 7. Visual identity
Name: **Raven**. Deep emerald on true AMOLED black. Status colors are separate from the brand green.
Never rely on color alone: every state has its own icon and motion.

```css
:root {
  --bg: #000000;  --surface: #060B08;  --surface-2: #0B1510;  --border: #12301F;
  --brand: #0F7A4D;  --brand-glow: #14A06A;
  --text: #E6F2EA;  --text-dim: #8FA396;
  --in-progress: #38BDF8;  --needs-you: #FBBF24;  --success: #4ADE80;
  --done: #10B981;  --failed: #F87171;  --danger: #EF4444;  --skipped: #6B7C72;
}
```

| State | Color | Icon | Motion |
|---|---|---|---|
| In progress | in-progress | rotating arrow | continuous shimmer / spinning ring |
| Needs you | needs-you | `!` | glow + one shake |
| Success (step) | success | check | brief flash, outline |
| Done (task) | done | check | solid fill, check draws itself, one ring pulse |
| Failed | failed | cross | static |
| Danger command | danger | warning | red border, hold-to-confirm |
| Skipped | skipped | dash | dimmed |

Only "in progress" animates continuously. Avoid pure white text on black.
