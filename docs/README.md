# Raven

Raven is a local Windows Electron overlay helper for showing AI development progress. It is read-only and does not type or submit prompts.

## Run

```powershell
npm install
npm run dev
```

`Ctrl+Shift+R` toggles the overlay. The development controls exercise the Phase 1 mock progress and state feed.

The X button closes Raven completely. Launch the portable executable again to activate it.
Only one Raven instance can run at a time; launching it while Raven is already open focuses the existing instance.

## Windows package

```powershell
npm run dist
```

This creates a portable executable in `release/`. Auto-start is off by default and can be enabled from the overlay.
