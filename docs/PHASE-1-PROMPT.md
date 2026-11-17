# Paste this into Antigravity for Phase 1

Read REQUIREMENTS.md, TODO.md and PHASE-0-SPIKE.md first. Do ONLY Phase 1 from TODO.md,
then stop. Do not start Phase 2.

Project: Raven, a Windows-only Electron overlay app. It is a helper, not a controller: it must never
type prompts or auto-approve anything (see section 2 of REQUIREMENTS.md).

Build:
1. Scaffold with electron-vite: Electron + TypeScript + Vue 3. Monorepo layout: `apps/overlay`
   and `packages/core` (core must not import UI code).
2. A frameless, transparent, always-on-top window that can be dragged and resized and does not
   steal focus when shown.
3. Two modes: expanded panel and a minimized orb. Orb is draggable and snaps to the nearest screen edge.
4. Animated states for the orb and panel: idle, working (pulse + progress arc), needs-me
   (glow + one shake), done, failed. Use CSS animations only, no heavy libraries.
5. An animated segmented progress bar component fed by a mock data service I can drive from
   a dev-only control (buttons to advance steps, trigger needs-me, done, failed).
6. Persist window position, size and mode between launches. Global hotkey to show/hide.
7. Theme: implement the CSS variables and the state table from section 7 of REQUIREMENTS.md as a
   single theme file. True black (#000000) background, deep emerald brand, no pure white text.
   Every state must have its own icon and motion, not just a color.
8. Create a small internal `CommandBus` in packages/core. Every UI action (expand, minimize, toggle,
   hotkey, dev-control buttons) must go through it. Voice commands will be added later and must
   reuse the same actions. Do NOT implement voice now.
9. Add README with run instructions (`npm install`, `npm run dev`).

Rules: strict TypeScript, no `any`, keep components small, no network calls, no telemetry.
When done, list the files you created, how to run it, and anything you were unsure about.
Update TODO.md checkboxes for Phase 1 only.
