# Procedure: Import GitHub Issues as Tasks

**Invocation:** `procedure{source_github}`

## Steps

1. **Get repo info:** `git remote get-url origin` → parse owner/name
2. **Fetch issues:** `gh issue list --label "ready_for_dev" --state open --json number,title,body,labels`
3. **Create plans:** For each issue → `.llm/tasks/todo/plan_ISSUE-{n}.md`

## Plan Template

```markdown
# ISSUE-{n}: {Title}

**GitHub:** #{n} | https://github.com/{owner}/{repo}/issues/{n}
**Created:** {date}

## Problem
{from issue body or TBD}

## Solution
{from issue body or TBD}

## Steps
{from issue body or TBD}

## Notes
{additional context}
```

## Rules

- Naming: `plan_ISSUE-42.md` → `done_ISSUE-42.md`
- Skip if plan exists
- ISSUE-n separate from F-n (never mix)
- Report: count, titles, files created, skipped

## Edge Cases
- No `gh` CLI: provide install instructions
- Not authenticated: run `gh auth login`
- Empty issue body: use TBD placeholders