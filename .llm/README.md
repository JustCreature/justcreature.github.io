# LLM Workflow Documentation

Documentation for AI assistants working on this project.

**Key principle:** Keep all .md files concise (~100-300 lines). Essential info only.

## Structure

- **procedure/** - Reusable workflows
- **features/** - Completed: `done_F-{n}.md`, `done_ISSUE-{n}.md`
- **tasks/todo/** - Planned: `plan_F-{n}.md`, `plan_ISSUE-{n}.md`

## Workflows

Two separate workflows that never mix:

**F-n (Manual):** `plan_F-6.md` → `done_F-6.md`
**ISSUE-n (GitHub):** `plan_ISSUE-42.md` → `done_ISSUE-42.md`

- Numbers stay forever (F-6 never becomes F-5 or ISSUE-42)
- Gaps in numbering expected
- ISSUE-n imported via `procedure{source_github}` (label: `ready_for_dev`)

## Documentation Style

- **Concise:** Essential info only, no fluff
- **Scannable:** Headers, bullets, code blocks
- **Actionable:** What changed, where, why
- **No duplication:** Don't repeat what's in code/commits
