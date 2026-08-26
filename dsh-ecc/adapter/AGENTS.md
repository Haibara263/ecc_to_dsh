# ECC for DSH (DeepSeek Harness)

This supplements the root `AGENTS.md` with DSH-specific guidance.

DSH (DeepSeek Harness) is a Cordis-composed agent harness: every capability is a
plugin row in a `cordis.yml`, and a session's behavior is defined by an **agent
preset** mounted under `~/.dsh/.agent-presets/<id>/`. This `.dsh/` directory is
the project-local adapter (same role as `.codex/` or `.opencode/`); the runnable
preset lives in the user preset root and consumes the assets here.

## Quick Start

```text
# 1. Create the runnable preset (one-time):
#    copy this repo's .dsh/ skills into ~/.dsh/.agent-presets/ecc/skills/
#    and install the agent.cordis.yml from .dsh/preset/ (see README.md)

# 2. In DSH GUI, start a new session with preset "ECC".

# 3. Ask for any ECC workflow, e.g. "use tdd-workflow for this change".
```

## Model Recommendations

| Task Type | Recommended Tier |
|-----------|------------------|
| Routine coding, tests, formatting | Default session model |
| Complex features, architecture | Higher-capability model (route per session) |
| Debugging, refactoring | Default |
| Security review | Higher-capability model |

DSH uses the session model route; ECC agent `model:` fields are advisory only.

## Skills Discovery

Skills are loaded from the preset's `skills/` directory via
`@deepseek-ai/dsh-skill-filesystem` + `@deepseek-ai/dsh-tool-skill` and are
triggered through the `skill` tool by their `description`. The frontmatter
(`name` + `description`) is byte-compatible with ECC's `SKILL.md` format.

Pilot skills loaded into the preset (14 curated): tdd-workflow,
security-review, verification-loop, git-workflow, coding-standards, api-design,
backend-patterns, error-handling, architecture-decision-records,
strategic-compact, deep-research, code-tour, python-patterns, frontend-patterns.

The full 285-skill catalog is converted into `.dsh/skills-full/` (258 flat
`<name>-SKILL.md` + 27 directory bundles preserving references/); copy any or
all of them into the preset's `skills/` to extend the mounted set
(`preset/install-skills.ps1 -IncludeAllSkills` does it in one step).

Full catalog remains in `skills/` (285); convert on demand with
`node scripts/ecc-to-dsh-convert-agents.js` (agents) or copy `SKILL.md` files
(skills).

## Agents

ECC's 68 subagents become **prompt assets** in `.dsh/agents/` (workspace source)
and are copied into the preset at `~/.dsh/.agent-presets/ecc/agents/`, so they
follow the preset across workspaces. They are used as prompts for DSH's
`subagent` / `subagent_fork` tools (DSH has no native slash-command or
agent-definition system; delegation is prompt-driven). Convert with:

```bash
node scripts/ecc-to-dsh-convert-agents.js                     # all 68
node scripts/ecc-to-dsh-convert-agents.js --agents planner,code-reviewer
```

The main agent uses the registry in `.dsh/commands/command-registry.md` to pick
the right prompt asset for a task.

## Key Differences from Claude Code

| Feature | Claude Code | DSH |
|---------|------------|-----|
| Hooks | 8+ event types (hooks.json) | Cordis events; prompt-level discipline in preset; plugin route for automation |
| Context file | CLAUDE.md + rules/ | preset `agent-instructions` (maxBytes 64K) |
| Skills | `.claude/skills/` via plugin | preset `skills/` via `dsh-skill-filesystem` + `skill` tool |
| Commands | `/slash` commands | Command registry prompt section (`.dsh/commands/command-registry.md`) |
| Agents | Subagent `Task` tool | `subagent` / `subagent_fork` with prompt assets |
| Security | Hook-based enforcement | DSH sandbox (workspace-write) + approval stack + prompt discipline |
| MCP | `.mcp.json` | Host composition MCP registration (verify with `cordis_inspect_list`) |
| Memory | hooks + memory servers | Native Hindsight / viking |

## Security Without Native ECC Hooks

Since DSH does not run Claude-Code-format hooks, ECC's security discipline is
carried as prompt-level standing rules (see `.dsh/rules/` and the preset
`agent-instructions`):

1. Always validate inputs at system boundaries.
2. Never hardcode secrets — use environment variables.
3. Review `git diff` before every push.
4. Use the `security-review` skill before committing sensitive code.
5. Prefer tests before implementation (tdd-workflow).
6. Verify before claiming completion (verification-loop).

The DSH sandbox (`workspace-write`) and per-operation approval stack enforce the
mechanical boundary; ECC rules steer the judgment.

## External Action Boundaries

Treat networked tools as read-only by default. Search, inspect, and draft freely
within the user's requested scope, but require explicit user approval before
posting, publishing, pushing, merging, opening paid jobs, dispatching remote
agents, changing third-party resources, or modifying credentials.
