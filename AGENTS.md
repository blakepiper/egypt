# Repository workflow

- Work directly on `main` in this repository. Do not create or switch branches unless the user explicitly asks.
- Stage changes intentionally: inspect `git diff` and `git status`, and stage only files that belong to the requested change. Keep unrelated worktree changes untouched and group commits by coherent user-facing outcome.
- This repository needs no CI; do not add or restore CI workflows.
