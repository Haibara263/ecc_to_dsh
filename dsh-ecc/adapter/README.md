# ECC × DSH 适配层（.dsh/）

将 [everything-claude-code (ECC)](https://github.com/Jord5s/everything-claude-code)
适配到 DeepSeek Harness (DSH)。本目录是**项目内适配层**（与 `.codex/`、`.opencode/`
同角色）；**可运行交付**是用户 preset `ecc`（见 `.dsh/preset/` 与下文「安装」）。

## 结构

```
.dsh/
├── AGENTS.md                     # DSH 补充说明（差异表 / 安全 / 边界）
├── README.md                     # 本文件
├── skills/                       # 精选技能（14 个，SKILL.md 原样复制）
│   ├── tdd-workflow-SKILL.md
│   └── …                         # 命名 <skill>-SKILL.md
├── skills-full/                  # 全量 285 技能（258 平铺 + 27 目录包，批量转换产物）
├── agents/                       # 68 个 ECC agent → DSH subagent 提示词
│   ├── planner.md
│   ├── code-reviewer.md
│   └── …                         # node scripts/ecc-to-dsh-convert-agents.js
├── commands/
│   └── command-registry.md       # ECC 命令 → DSH 语义注册表（提示段）
├── rules/                        # 精简规则包（供 preset agent-instructions）
├── mcp/README.md                 # 35 个 MCP server → DSH 宿主注册映射
├── hooks/README.md               # ECC hooks → DSH 事件/提示级纪律映射
└── preset/                       # 可运行 preset 模板（复制到 ~/.dsh/.agent-presets/ecc/）
    ├── preset.yml
    ├── agent.cordis.yml
    └── install-skills.ps1
```

配套脚本：`scripts/ecc-to-dsh-convert-agents.js`（agent 批量转换器骨架）。

> **资产分发**：`skills/`、`agents/`、`commands/` 已复制进 preset
> （`~/.dsh/.agent-presets/ecc/`），**随 preset 全工作区可用**；工作区内的
> `.dsh/` 副本作为贡献回 ECC 的源。persona 引用 preset 内 `agents/` 目录，
> 并允许回退到工作区 `.dsh/agents/`。

## 安装（启用 ECC preset）

```powershell
# 1) 建 preset 目录
New-Item -ItemType Directory -Force "$env:USERPROFILE\.dsh\.agent-presets\ecc\skills" | Out-Null

# 2) 复制 preset 组合与元数据
Copy-Item .dsh\preset\preset.yml        "$env:USERPROFILE\.dsh\.agent-presets\ecc\preset.yml"
Copy-Item .dsh\preset\agent.cordis.yml  "$env:USERPROFILE\.dsh\.agent-presets\ecc\agent.cordis.yml"

# 3) 复制精选技能 + agent 资产 + 命令注册表
#    （用 preset/install-skills.ps1 一键完成：skills/、agents/、commands/）
```

> DSH preset 的 skill 注册需要 `skills/<name>/SKILL.md` 目录结构
> （`dsh-skill-filesystem` 按目录发现），与 ECC 同构。

## 使用

1. DSH GUI 新建会话，选择 preset **ECC**。
2. 直接提需求；ECC 的规则（TDD、安全、验证纪律）已注入。
3. 用 `skill` 工具按需加载技能——preset 内置精选 14 个；全量 285 个在
   `.dsh/skills-full/`（`preset/install-skills.ps1 -IncludeAllSkills` 一键启用）。
4. 需要专门角色时，用 `subagent` 工具 + preset `agents/`（68 个提示词资产）
   委派（planner / code-reviewer / security-reviewer / tdd-guide / 各语言
   reviewer / build-resolver …）。

## 支持矩阵

| 能力 | 状态 |
|---|---|
| 精选技能挂载（preset 内 14） | ✅ 可用（验收通过） |
| 全量技能资产（285，`.dsh/skills-full/`） | ✅ 已转换（258 平铺 + 27 目录包） |
| Agent 提示词资产（68/68，`.dsh/agents/` + preset `agents/`） | ✅ 已批量转换 |
| 规则注入（guardrails + 精选） | ✅ 可用 |
| 命令注册表 | ✅ 可用（提示级） |
| Plan Mode（`dsh-plan-mode`，隔离组） | ✅ 已加入（照抄 standard） |
| Compaction（`dsh-compaction-basic` + 工具结果修剪） | ✅ 已加入（照抄 standard） |
| preset 挂载校验（standingKeyFor） | ✅ mounted OK |
| hooks → 事件插件 | ⏳ 映射文档就绪，插件化待 P3 |
| MCP → 宿主注册 | ⏳ 映射文档就绪，待宿主验证 |
| 安装器 `--target dsh` | ⏳ 待 P3（当前手工安装） |
