---
name: work-on-feature
description: "Full-cycle feature development pipeline: brainstorm → design → plan → review → parallel BE+FE implementation → QA → deploy → archive. Use when the user wants to work on a feature from backlog, implement a feature end-to-end, or says 'work on feature', 'implement feature', 'start feature', 'давай сделаем фичу', 'работаем над фичей'. Triggers on any mention of working on a backlog feature or running the full development pipeline. Even if the user just points to a feature folder - use this skill."
---

# Work on Feature

Full-cycle feature pipeline that takes a feature from idea to production. Orchestrates the entire development process through 8 phases, delegating work to specialized subagents (backend-developer, frontend-developer, qa-engineer, devops) while keeping the user in the loop at key decision points.

This pipeline was battle-tested on feature 004-incident-descriptions and captures the exact workflow that proved effective: brainstorm with visual mocks → write design spec → create detailed plan with code → review plan → implement BE+FE in parallel → optional QA on localhost → deploy → archive.

## Input

The skill takes a path to a feature folder as argument:
```
/work-on-feature docs/backlog/active/NNN-feature-name/
```

The folder must contain at least `readme.md` with feature context (goal, scope, dependencies). The skill reads ALL files in the folder to gather context. If `design.md` or `plan.md` already exist, the skill skips to the appropriate phase — so you can resume interrupted work.

---

## Phase 1: Load Context

1. Read ALL files in the feature folder
2. Read `CLAUDE.md` for project conventions
3. Read `docs/roadmap.md` for project context
4. Summarize to the user: what feature, what's the goal, what files already exist

**Smart resume:**
- If `design.md` already exists → skip to Phase 3 (Implementation Plan)
- If `plan.md` already exists → skip to Phase 5 (Implementation)

---

## Phase 2: Brainstorming & Design

The goal here is to explore the problem space interactively with the user before writing any code. Good design prevents wasted implementation effort.

Enter the role of Designer + Implementation Plan Architect:
1. Read `.claude/agents/designer.md` and `.claude/agents/implementation-plan-architect.md` to adopt their expertise
2. Invoke `Skill: superpowers:brainstorming` for structured exploration
3. Offer visual companion for UI/UX features (HTML mockups in browser)
4. Ask 5-7 clarifying questions one at a time:
   - Scope and boundaries (what's in, what's out)
   - User experience (admin UX, public UX, mobile)
   - Data model (entities, relationships, constraints)
   - Edge cases (error states, empty states, limits)
   - Constraints (performance, compatibility, deadlines)
5. Propose 2-3 approaches with trade-offs and your recommendation
6. Present design section by section, get user approval after each

**Output:** Write `design.md` in the feature folder covering: data model, API endpoints, business logic, frontend components (admin + public), edge cases, out of scope.

**Gate:** Ask user: "Design approved? Ready to write implementation plan?"

---

## Phase 3: Implementation Plan

Transform the approved design into an executable, step-by-step plan with exact code.

1. Invoke `Skill: superpowers:writing-plans`
2. Research the codebase thoroughly using Grep/Glob:
   - Existing models, schemas, CRUD functions
   - Current routes and their patterns
   - Frontend components, types, hooks
   - Test structure and helpers
3. Write detailed plan with:
   - Phases grouped by dependency (BE model → migration → CRUD → routes → tests, FE types → components → pages)
   - Tasks with exact file paths and code snippets
   - Checkbox steps (`- [ ]`) for tracking
   - Dependency graph showing parallel opportunities
4. Separate BE and FE tasks clearly — they go to different subagents
5. Include verification commands for each phase

**Output:** Write `plan.md` in the feature folder.

---

## Phase 4: Plan Review

Quality gate to catch issues before implementation begins.

1. Launch `implementation-plan-reviewer` subagent:
   ```
   Agent tool → subagent_type: implementation-plan-reviewer
   Prompt: "Review plan at <folder>/plan.md against design at <folder>/design.md"
   ```
2. Apply fixes from reviewer feedback (naming collisions, missing imports, frozen model issues, etc.)
3. Re-run reviewer if critical issues were found (max 2 iterations)

**Gate:** Ask user: "Plan reviewed and fixed. Ready to implement?"

---

## Phase 5: Implementation

Launch backend and frontend subagents in parallel for maximum speed.

**Backend Developer** (Agent tool, subagent_type: backend-developer):
- Execute all BE tasks from plan.md sequentially
- Run `cd backend && uv run pytest -v` at the end
- Run `cd backend && uv run ruff check app/ tests/ --fix`
- DO NOT commit — just implement and verify

**Frontend Developer** (Agent tool, subagent_type: frontend-developer):
- Execute all FE tasks from plan.md sequentially
- Run `cd frontend && bun run build` at the end
- Run `cd frontend && bun run lint`
- DO NOT commit — just implement and verify

Both subagents receive in their prompt:
- Path to plan.md and design.md
- Instruction to read `docs/conventions/git.md` and `docs/conventions/testing.md`
- Instruction to check `docs/ADR/README.md` for relevant ADRs
- Explicit warning: DO NOT commit, just implement and verify
- Instruction to log learnings to `docs/agent-learnings/` if workarounds found

**Gate:** Both subagents must report success (all tests pass, build succeeds).

---

## Phase 6: QA Gate

**ASK THE USER:** "Implementation complete, tests and build pass. Do you want QA engineer to test on localhost via Playwright MCP, or skip QA and go straight to deploy?"

This question is mandatory — never assume the answer.

**If user wants QA:**
1. Verify services are running (backend :8000, frontend :5173)
2. Launch `qa-engineer` subagent (subagent_type: qa-engineer):
   - Test all new functionality through Playwright MCP browser testing
   - Run backend tests and frontend build
   - Deliver QA sign-off report: PASS or FAIL with issues
3. If FAIL — report issues, fix via appropriate subagent, re-test
4. If PASS — proceed to deploy

**If user skips QA:** Proceed directly to Phase 7.

---

## Phase 7: Deploy

Launch `devops` subagent (subagent_type: devops) to handle all git and deployment:

1. **Commit backend changes** — stage only feature-related files
   - Message: `feat(backend): <summary from readme.md>`
2. **Commit frontend changes** — stage only feature-related files
   - Message: `feat(frontend): <summary from readme.md>`
3. **Commit docs** — design.md, plan.md, session-history
   - Message: `docs(backlog): add <NNN>-<feature-name> design and plan`
4. **Push to origin master**
5. **Verify deployments:**
   - Frontend → Vercel (auto-deploy on push)
   - Backend → Railway (auto-deploy, verify migration ran)
6. **Update `status-process.md`** with changelog entry

---

## Phase 8: Archive

1. Move feature folder: `docs/backlog/active/<NNN-feature>/ → docs/backlog/archived/`
2. Update `docs/roadmap.md` if feature is referenced (path active → archived)
3. Commit archive via DevOps subagent

**Report to user:** Feature complete! Summary of what was built, deployed, and archived.

---

## Error Handling

- If any subagent fails → report to user with details, ask how to proceed
- If tests fail → show failures, ask user whether to fix or abort
- If deploy fails → report error, do NOT retry automatically
- Never force through blockers → stop and ask

## Conventions

- All git operations through DevOps subagent (never directly)
- All code changes through specialized subagents (never directly from orchestrator)
- Read `docs/conventions/` before each phase
- Check `docs/ADR/README.md` for architectural decisions
- Log learnings to `docs/agent-learnings/` if workarounds discovered
