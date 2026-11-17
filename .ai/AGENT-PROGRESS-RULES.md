# Raven Progress Rules

After each subtask, update `.ai/progress.json`:

1. Keep `version` at `1`.
2. Set `status` to `working`, `needs-me`, `done`, or `failed`.
3. Keep `completed` between `0` and `total`.
4. Update the matching step status and `currentStep`.
5. List every changed or created project file in that step's `files` array.
6. Use an ISO 8601 timestamp in `updatedAt`.
7. Mark a step `done` only after its files exist and the change is present in `git diff`.
