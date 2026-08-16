# Finopsy Agent Guide

Read `docs/ARCHITECTURE.md` before modifying shared contracts.

## Ownership

- `frontend/**` — frontend
- `backend/app/financial/**`, API and schemas — core
- `backend/app/parsers/**`, `backend/app/categorization/**` — data
- `backend/tests/**` — QA

Every task must specify objective, files allowed, files prohibited, dependencies, acceptance criteria, and tests. Keep `main` deployable; do not make unrelated changes.
