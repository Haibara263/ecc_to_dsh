# ECC 组件清单（Inventory）

> 来源：`ecc-src/`（[everything-claude-code](https://github.com/Jord5s/everything-claude-code)，v2.2.0，MIT）
> 目的：为「ECC → DSH 适配」提供清点依据。配套文档见 [`MIGRATION-MAP.md`](./MIGRATION-MAP.md)。

## 总览

| 组件 | 数量 | 位置 | 格式 |
|---|---|---|---|
| Skills（技能） | **285** 个目录 | `skills/<name>/SKILL.md` | Markdown + YAML frontmatter（`name`, `description`, `metadata`） |
| Agents（子代理） | **68** 个 | `agents/<name>.md` | Markdown + YAML frontmatter（`name`, `description`, `tools`, `model`） |
| Skills 附带代理 | 89 个文件 | `.agents/skills/<name>/agents/openai.yaml` 等 | YAML 接口元数据（Codex 侧） |
| Commands（斜杠命令） | **94** 个 | `commands/<name>.md`（另有 `.claude/commands/`、`legacy-command-shims/commands/`） | Markdown + frontmatter（`description`, `argument-hint`） |
| Rules（常驻规则） | 22 组 / **122** 篇 | `rules/<lang>/…`、`.claude/rules/` | Markdown |
| Hooks（事件钩子） | 5 个文件 | `hooks/hooks.json`、`hooks/codex-hooks.json`、`hooks/memory-persistence/hooks.json` | JSON（Claude Code hook schema） |
| MCP servers | **35** 个 | `mcp-configs/mcp-servers.json` | JSON（`mcpServers` 对象） |
| Docs（文档） | 1499 篇 md | `docs/**` | Markdown（含 13 种语言） |
| 全部 md 文件 | 2511 篇 | 全仓库 | Markdown |
| 其他 | — | `schemas/`(11)、`manifests/`(3)、`config/`(2)、`contexts/`(3)、`workflows/`(2)、`plugins/`、`.claude-plugin/`、`scripts/`(48)、`ecc2/`(Rust TUI) | 见下 |

## 一、Skills（285）

- 每个技能一个目录，内含单个 `SKILL.md`（少数带 `references/`、`agents/` 子目录）。
- Frontmatter 样例（`skills/git-workflow/SKILL.md`）：

```yaml
---
name: git-workflow
description: Git workflow patterns including branching strategies, commit conventions, …
metadata:
  origin: ECC
---
```

- 正文结构：`When to Activate` / 工作流步骤 / 示例 / 反模式 / 快速参考表。
- **关键发现：该 frontmatter 与 DSH 的 skill 格式（`name` + `description`）逐字节兼容**，DSH 官方 `cordis` preset 的 SKILL.md 使用同样结构。
- 分类概览（按目录前缀）：语言/框架模式（python-、typescript-、react-、django-、rust-、golang-、kotlin-、springboot-、quarkus-、laravel-、vue-、swift-、dotnet-、cpp-、fsharp-、perl-…）、工作流（tdd-workflow、verification-loop、plan-orchestrate、intent-driven-development…）、安全（security-review、security-scan、hipaa-compliance…）、领域（healthcare-、ito-、logistics-、energy-、finance-…）、研究（deep-research、market-research…）、内容（article-writing、content-engine、crosspost…）。

## 二、Agents（68）

- 位置：`agents/<name>.md`。Frontmatter 样例（`agents/code-reviewer.md`）：

```yaml
---
name: code-reviewer
description: Expert code review specialist. …
tools: Read, Grep, Glob, Bash
model: sonnet
---
```

- 每个 agent 正文是完整的角色提示词：人格、工作流、清单、输出格式、批准标准。
- 覆盖：planner、architect、tdd-guide、code-reviewer、security-reviewer、spec-miner、build-error-resolver、e2e-runner、refactor-cleaner、doc-updater、loop-operator、harness-optimizer，以及各语言 review/build 专家（go/python/java/kotlin/rust/cpp/django/fsharp…）。
- 附带：`.agents/skills/<name>/agents/openai.yaml` 提供 Codex 界面元数据（`interface.display_name`、`policy.allow_implicit_invocation`）——说明 ECC 已有「skill → 各 harness 代理接口」的适配先例。

## 三、Commands（94）

- 位置：`commands/<name>.md`，frontmatter 为 `description` + `argument-hint`。
- 正文用 `$ARGUMENTS` 占位，含完整的分阶段流程（如 `/code-review` 有 Local/PR 双模式、8 个阶段）。
- 另有 `.claude/commands/`（7 个）与 `legacy-command-shims/commands/`（兼容垫片）。`AGENTS.md` 明确：`skills/` 是规范工作流面，`commands/` 是遗留斜杠入口，仅作跨 harness 兼容保留。

## 四、Rules（122 篇 / 22 组）

- `rules/common/` 通用规则 + `rules/<lang>/` 各语言规则（angular、arkts、cpp、csharp、dart、fsharp、golang、java、kotlin、nuxt、perl、php、python、react、react-native、ruby、rust、swift、typescript、vue、web）。
- `.claude/rules/everything-claude-code-guardrails.md` 为总护栏。

## 五、Hooks（5 文件）

- `hooks/hooks.json`：Claude Code hook schema（`PreToolUse`/`PostToolUse`/`PostToolUseFailure`/`PreCompact`/`SessionStart`/`Stop`/`SessionEnd`），每个 hook 是 `matcher` + 命令（Node 脚本，经 `scripts/hooks/*.js` 分派）。
- 功能示例：pre:bash 质量闸、pre:write 文档告警、gateguard 事实强制、config-protection、mcp-health-check、stop:format-typecheck、stop:cost-tracker、session-end 记忆持久化、desktop-notify。
- `hooks/codex-hooks.json`：Codex 变体。`hooks/memory-persistence/hooks.json`：记忆持久化专用。

## 六、MCP servers（35）

- `mcp-configs/mcp-servers.json` 单个文件声明 35 个 server：
  - 本地/CLI：nexus、ito-compute、ecc-memory-vault、memory、omega-memory、longhand、sequential-thinking、filesystem、devfleet、squish
  - 云端/HTTP：vercel、railway、cloudflare-*（4）、clickhouse、parallel-search、browser-use、memxus、laraplugins
  - npx/uvx：github、firecrawl、supabase、jira、exa-web-search、context7、codescene、magic、playwright、fal-ai、browserbase、token-optimizer、confluence、evalview
  - 注释建议：默认启用 ≤10 个以节省上下文。

## 七、其他

- `.claude-plugin/`：Claude Code 插件打包（`plugin.json`、`marketplace.json`）。
- `schemas/`（11）：install-config、hooks、install-components/modules/profiles/state、memory、package-manager、plugin、provenance、state-store 的 JSON Schema。
- `manifests/`（3）：install-components/modules/profiles。
- `contexts/`（3）：dev / research / review 三种上下文包。
- `workflows/`：orch-review.workflow.js。
- `scripts/`（48）：CLI（ecc.js）、安装器（install-apply/install-plan/install-guided）、hooks 分派、记忆（memory.js、memory-mcp.mjs）、plan-canvas、控制面板等。
- `ecc2/`：Rust 重写（session daemon、TUI dashboard）。
- 安装目标注册表：`scripts/lib/install-manifests.js` 的 `SUPPORTED_INSTALL_TARGETS = ['claude','claude-project','cursor','antigravity','codex','gemini','opencode','codebuddy','joycode','qwen','zed','hermes','openclaw','kimi']`。

## 八、跨 harness 适配先例（本仓库自带）

| 目录 | 适配方式 |
|---|---|
| `.codex/` | `config.toml`（模型/沙箱/MCP/agents）+ `AGENTS.md` 补充说明 + `agents/*.toml` 角色 |
| `.opencode/` | 完整移植：`commands/*.md`、`prompts/agents/*.txt`（agent 提示词）、`plugins/*.ts`（hooks）、`tools/*.ts`、`opencode.json` |
| `.cursor/` | rules + hook adapter（DRY：stdin JSON 转换复用 `scripts/hooks/*.js`） |
| `.gemini/`、`.zed/`、`.kimi/`、`.qwen/`、`.trae/`、`.pi/`、`.hermes/`、`.openclaw/`、`.kiro/`、`.codebuddy/` | 各自配置层 + 选择性安装器 |

**结论**：ECC 的设计是「根目录为唯一事实源，各 harness 用适配层映射而非复制维护」。DSH 适配遵循同一模式即可。
