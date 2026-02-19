# Bootstrap: LLM Ways of Working

**Invocation:** `bootstrap ways of working from bootstrap-llm-wow.md`

## Creates

```
.llm/
├── README.md
├── bootstrap-llm-wow.md (self-copy)
├── procedure/import-tasks-github.md
├── features/ (empty)
└── tasks/todo/ (empty)
CLAUDE.md (root)
```

## Steps

### 1. Check Existing
`ls -la .llm/` → if exists, ask: Merge | Override | Cancel

### 2. Create Structure
```bash
mkdir -p .llm/{procedure,features,tasks/todo}
```

### 3. Create .llm/README.md
```markdown
# LLM Workflow Documentation

## Structure
- **procedure/** - Reusable workflows
- **features/** - Completed: `done_F-{n}.md`, `done_ISSUE-{n}.md`
- **tasks/todo/** - Planned: `plan_F-{n}.md`, `plan_ISSUE-{n}.md`

## Workflows
**F-n (Manual):** `plan_F-6.md` → `done_F-6.md`
**ISSUE-n (GitHub):** `plan_ISSUE-42.md` → `done_ISSUE-42.md`

Numbers stay forever. Gaps expected. ISSUE-n via `procedure{source_github}` (label: `ready_for_dev`).
```

### 4. Self-Replicate
Copy this file to `.llm/bootstrap-llm-wow.md`

### 5. Create .llm/procedure/import-tasks-github.md
```markdown
# Procedure: Import GitHub Issues as Tasks

**Invocation:** `procedure{source_github}`

## Steps
1. Get repo: `git remote get-url origin` → parse owner/name
2. Fetch: `gh issue list --label "ready_for_dev" --state open --json number,title,body,labels`
3. Create: `.llm/tasks/todo/plan_ISSUE-{n}.md` for each

## Template
# ISSUE-{n}: {Title}
**GitHub:** #{n} | {url}
**Created:** {date}
## Problem/Solution/Steps/Notes
{from issue or TBD}

## Rules
- `plan_ISSUE-42.md` → `done_ISSUE-42.md`
- Skip if exists
- ISSUE-n ≠ F-n
- Report: count, files, skipped
```

### 6. CLAUDE.md

**If missing:** Create with template below + `[PROJECT-SPECIFIC]` placeholders
**If exists:** Check for "Feature Documentation Process" → add if missing, preserve rest

```markdown
# CLAUDE.md

## Project Overview
[PROJECT-SPECIFIC]

## Feature Documentation Process

### Completed Features
1. Document in `.llm/features/done_F-{n}.md` (same n as plan)
2. Include: overview, files changed, tests, commits, migrations
3. Delete plan from `.llm/tasks/todo/`

### Planned Features
1. Create `.llm/tasks/todo/plan_F-{n}.md`
2. Include: problem, solution, steps, benefits, effort
3. Move to `done_F-{n}.md` when done (KEEP NUMBER)

**Plan mode:** Write to `.llm/tasks/todo/plan_F-{n}.md` (NOT `~/.claude/plans/`)

### Feature Numbering
- Numbers = plan date, not implement date
- `plan_F-6.md` → `done_F-6.md` (never renumber)
- Gaps expected

### GitHub Integration
- ISSUE-n: `plan_ISSUE-42.md` → `done_ISSUE-42.md`
- Invoke: `procedure{source_github}` (label: `ready_for_dev`)
- F-n ≠ ISSUE-n (never mix)

## LLM Procedures
See `.llm/procedure/` for workflows (e.g., `import-tasks-github.md`)

## [PROJECT-SPECIFIC SECTIONS]
[Add: Best Practices, Commands, Structure, Architecture, Patterns]
```

### 7. Optional .gitignore
Ask user to add:
```
# .claude/
# .agents/
```
(`.llm/` stays tracked)

### 8. Report
```
✅ Bootstrap Complete!

Created: .llm/{README,bootstrap,procedure/import-tasks-github,features/,tasks/todo/}
Updated: CLAUDE.md [new/merged]

Next:
- Customize CLAUDE.md
- Create plan_F-1.md or run procedure{source_github}
- Commit .llm/
```

## Replication
Copy this file to new repo → run invocation → done
