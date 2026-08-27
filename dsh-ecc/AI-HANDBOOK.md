# ECC × DSH 安装与使用手册（AI 版）

> **读者对象**：AI agent（或把本文档交给 AI 执行的用户）。
> **目标**：仅凭本文档，一个 AI 就能完成 ECC preset 的安装、验证与日常使用。
> **配套文档**：`docs/ECC-INVENTORY.md`（组件清单）、`docs/MIGRATION-MAP.md`（迁移映射 + 决策记录 + 冲突审计）。

---

## 1. 这是什么

**everything-claude-code (ECC) 对 DeepSeek Harness (DSH) 的适配包。** 把 ECC 的 285 个技能、68 个专业子代理、命令注册表、TDD/安全/验证纪律搬进 DSH，以**用户 agent preset** 的形式运行。

本包交付的内容与关键事实：

| 资产 | 数量 | 在 DSH 里的形态 |
|---|---|---|
| 精选技能（preset 默认挂载） | 14 | `skill` 工具按 description 触发（SKILL.md frontmatter 与 DSH **逐字节兼容**） |
| 全量技能（按需启用） | 285 | `.dsh/skills-full/`（258 平铺 + 27 目录包） |
| 子代理提示词 | 68 | `subagent`/`subagent_fork` 的 prompt 资产（按需读取，零固定开销） |
| 命令注册表 | 12 条语义触发 | persona 提示段（非真实斜杠命令） |
| 纪律层 | — | persona 注入：TDD、安全优先、不可变性、先计划后执行、置信度过滤、上下文纪律 |
| Plan Mode | 1 | DSH 原生 `/plan`（手动开启）+ `exit_plan_mode` 审批 |
| Compaction | 1 | 自动压缩 + 工具结果修剪（照抄 standard） |

**关键理解**：
- ECC 的 SKILL.md 格式与 DSH 同构 → 技能几乎零转换。
- ECC 的 agents（Claude Code 子代理）在 DSH 里没有原生定义系统 → 变成 **subagent 提示词资产**（与 ECC 官方 `.opencode/prompts/agents/` 同法）。
- ECC 的 hooks / MCP → DSH 无对应运行时，按「提示级纪律 + 映射文档」处理（见 `adapter/hooks/README.md`、`adapter/mcp/README.md`）。

---

## 2. 文件布局（本包）

```
dsh-ecc/
├── AI-HANDBOOK.md               # 本文件
├── README.md                    # 包说明
├── adapter/                     # DSH 适配层（= ECC 仓库 .dsh/ 目录的内容）
│   ├── AGENTS.md                # DSH 补充说明（差异表 / 安全 / 边界）
│   ├── README.md                # 适配层说明 + 支持矩阵
│   ├── skills/                  # 精选 14 技能（<name>-SKILL.md 平铺）
│   ├── skills-full/             # 全量 285 技能（258 平铺 + 27 目录包）
│   ├── agents/                  # 68 个 subagent 提示词资产
│   ├── commands/
│   │   └── command-registry.md  # 命令注册表
│   ├── rules/README.md          # 精简规则包
│   ├── hooks/README.md          # hooks → DSH 映射
│   ├── mcp/README.md            # MCP → DSH 映射
│   └── preset/                  # preset 模板（安装用）
│       ├── preset.yml           # 元数据（name: ECC）
│       ├── agent.cordis.yml     # AGENT-PLANE 组合（核心）
│       └── install-skills.ps1   # 一键复制资产脚本
├── scripts/
│   ├── ecc-to-dsh-convert-agents.js   # agent 批量转换器
│   └── ecc-to-dsh-convert-skills.js   # 技能批量转换器
└── docs/
    ├── ECC-INVENTORY.md         # ECC 组件清单
    └── MIGRATION-MAP.md         # 迁移映射 + P3 取舍 + 冲突审计
```

安装后的目标位置：`~/.dsh/.agent-presets/ecc/`（Windows: `C:\Users\<user>\.dsh\.agent-presets\ecc\`）。

---

## 3. 前置条件

1. **DSH 已安装并运行**（GUI 默认 `http://127.0.0.1:3080`）。
2. **`~/.dsh/.agent-presets/` 可写**（用户 preset 根；位于会话工作区外，AI 工具写这里通常需要一次权限升级审批）。
3. （可选）**ECC 上游仓库**：重跑转换器时需要 `skills/` 源目录；只安装不转换则不需要。

---

## 4. 安装（AI 可执行步骤）

> 沙箱提示：`~/.dsh/.agent-presets/ecc/` 在工作区之外。第一次写入会触发 `danger-full-access` 审批——这是预期行为，请用户允许。

### 4.1 复制 preset 组合

```powershell
$preset = "$env:USERPROFILE\.dsh\.agent-presets\ecc"
New-Item -ItemType Directory -Force -Path "$preset\skills","$preset\agents","$preset\commands" | Out-Null
Copy-Item <本包路径>\adapter\preset\preset.yml        $preset\preset.yml       -Force
Copy-Item <本包路径>\adapter\preset\agent.cordis.yml  $preset\agent.cordis.yml -Force
```

### 4.2 复制资产（技能 + agents + 命令注册表）

```powershell
# 一键（推荐）：
& <本包路径>\adapter\preset\install-skills.ps1 -RepoRoot <本包路径>\adapter

# 或手动：
Copy-Item <本包路径>\adapter\skills\*-SKILL.md  $preset\skills\ -Force
Copy-Item <本包路径>\adapter\agents\*.md        $preset\agents\ -Force
Copy-Item <本包路径>\adapter\commands\command-registry.md $preset\commands\ -Force

# 可选：全量 285 技能（会显著增大 skill 目录，默认不推荐）
& <本包路径>\adapter\preset\install-skills.ps1 -RepoRoot <本包路径>\adapter -IncludeAllSkills
```

### 4.3 验证挂载（必须做）

**方式 A（官方校验，推荐 AI 用）**：注册一个临时探针工具调用 `agentPresets.standingKeyFor('ecc')`。通过 = `mounted OK`；失败会给出具体行错误。探针代码（动态 Cordis 插件）：

```js
// cordis_define: host code
return {
  name: 'preset-check',
  inject: ['agentPresets', 'tools'],
  apply(ctx) {
    harness.registerTool(ctx, harness.defineTool({
      name: 'preset_check',
      description: 'Mount-validate one agent preset by id.',
      parameters: { id: { type: 'string', required: true } },
      output: { schema: { type: 'string' }, render(_a, v) { return [{ type: 'text', text: v }] } },
      async execute(args) {
        try { await ctx.agentPresets.standingKeyFor(args.id); return 'mounted OK: ' + args.id }
        catch (e) { return 'MOUNT FAILED: ' + args.id + ' :: ' + e.message }
      },
    }))
  },
}
```

**方式 B（GUI 人工）**：新建会话 → 预设选择器 → 悬停/选中 **ECC**，按钮 title 无「failed to mount」即通过。

**方式 C（最终验收）**：用 ECC preset 新建会话，发测试消息，确认：persona 生效（回复含 ECC 纪律）、`skill` 工具列出 14 技能、`subagent`/`subagent_fork` 可用。

### 4.4 设为默认（可选）

`~/.dsh/settings.yaml` → `agent-presets.default: ecc`（或在 GUI 新建会话时选择 ECC，默认值会被记住）。

---

## 5. 使用指南

### 5.1 纪律层（已注入，无需操作）
核心循环：`plan → test → implement → review → verify → remember → improve`。七条纪律（TDD 80%+ 覆盖、安全优先、不可变性、先计划后执行、置信度过滤、上下文纪律）在 persona 中，对每轮请求生效。

### 5.2 技能触发（按需加载）
- 用 `skill` 工具加载：`skill("tdd-workflow")` 等。触发依据是 frontmatter 的 `description`。
- **精选 14**：tdd-workflow、security-review、verification-loop、git-workflow、coding-standards、api-design、backend-patterns、error-handling、architecture-decision-records、strategic-compact、deep-research、code-tour、python-patterns、frontend-patterns。
- 全量 285 在 `skills-full/`，未挂载（零开销）；需要时复制进 preset 的 `skills/`。

### 5.3 子代理委派（agent-first）
- 工具：`subagent`（后台默认）/ `subagent_fork`（继承上下文）。
- 提示词资产：`~/.dsh/.agent-presets/ecc/agents/<name>.md`（68 个；工作区内也可用 `<repo>/.dsh/agents/`）。
- 推荐场景：复杂功能 → `planner`；写完代码 → `code-reviewer`；提交前/敏感代码 → `security-reviewer`；新功能/bug → `tdd-guide`；架构决策 → `architect`；构建失败 → `*-build-resolver`；语言专精 → `*-reviewer`。
- **新鲜上下文原则**：评审/安全扫描用独立 subagent 上下文做，主会话只收报告——这是本适配最重要的效率点。

### 5.4 命令注册表（语义触发，非真实斜杠命令）
`/plan` `/tdd` `/code-review` `/security` `/verify` `/build-fix` `/e2e` `/refactor-clean` `/update-docs` `/learn` `/context` `/checkpoint` —— 见 `adapter/commands/command-registry.md`。用户在对话里说对应意图时，agent 按条目激活行为。

### 5.5 Plan Mode（DSH 原生，手动开启）
- 开启：用户输 `/plan`（agent 不能自行开启，无 set 工具）。
- 退出：`exit_plan_mode`（提交计划 → 用户批准）或 `/plan off`。
- 注意区分：**原生 `/plan` = 强制状态**（调研期间禁改文件 + 审批门）；**ECC 语义 /plan = 行为建议**（planner 流程产出计划文本，无强制）。

### 5.6 Compaction（自动）
接近上下文上限时自动压缩（threshold 8192 / head 4096 / tail 1024），配合纪律第 7 条避免长会话失控。

### 5.7 工具名映射（skill/agent 正文中的 Claude 工具）
| Claude Code | DSH |
|---|---|
| Bash | pwsh（Windows）/ bash（POSIX） |
| Read / Grep / Glob | read / grep / glob |
| str_replace_editor / Edit / Write / MultiEdit | edit / write |
| Task | subagent / subagent_fork |
| WebSearch / WebFetch | web_search / browser_* |
| TodoWrite / AskUserQuestion | todo_write / ask_user_question |

---

## 6. 排查

| 症状 | 原因 | 处理 |
|---|---|---|
| 挂载失败：`invalid config: $.X missing required value` | 组合缺必填配置 | 对照 `standard` preset 补全该行 config |
| 挂载失败：`row(s) published process-global service(s)` | 有行向 root realm 发布服务 | 把发布行放进带 `isolate` realm 的 group |
| 挂载失败：`service "X" has been registered at ...` | 与宿主/其他 preset 服务重名 | 不向 preset 复制宿主服务 |
| 技能不出现 | catalog digest 缓存 | 重开会话；或检查技能 frontmatter `name` 合法（小写连字符） |
| 技能「不是我改的那份」 | 项目级技能遮蔽（rank 100 > preset 300） | 见 `docs/MIGRATION-MAP.md` §7.2 优先级表 |
| 写 `~/.dsh` 被拒 | 工作区外写入 | 一次性 `danger-full-access` 审批（正常） |
| DSH 启动崩溃：`credentials-local: the value for "version" in ...\.credentials.yaml must be a string` | `.credentials.yaml` 含非字符串的 `version` 键——该文件是严格的「凭据引用 → 非空字符串」映射，**不允许 version 字段**；与本适配包无关（仓库无凭据文件、安装步骤不触碰凭据） | 编辑 `$DSH_HOME/.credentials.yaml`，删除 `version:` 行（或写成 `version: "2"` 字符串）；重启 |

---

## 7. 边界与冲突（摘要）

- 本 preset **只消费、不发布**宿主服务 → 与现有/未来 preset 无硬冲突（`standingKeyFor` 会拒绝违规组合）。
- 项目级技能发现优先于 preset：在含 `.dsh/skills` 或 `.agents/skills` 的仓库工作区内，项目版技能会遮蔽 preset 同名技能（内容一致时无感）。
- 未来装新技能包前，先对 preset `skills/` 做重名检查。完整审计见 `docs/MIGRATION-MAP.md` §7。

---

## 8. 维护与升级

- **重装资产**：重跑 `install-skills.ps1`（幂等）。
- **转换器重跑**（需 ECC 上游 `skills/`、`agents/` 源目录）：
  ```bash
  node scripts/ecc-to-dsh-convert-agents.js                     # 68 agents → adapter/agents/
  node scripts/ecc-to-dsh-convert-skills.js                     # 285 skills → adapter/skills-full/
  node scripts/ecc-to-dsh-convert-skills.js --rewrite-tools     # 可选：正文工具名替换
  ```
- **ECC 上游升级**：重新克隆上游 → 重跑转换器 → 重跑 install-skills.ps1 → `standingKeyFor` 复验。
- **P3 未做项**（hooks 插件化 / MCP 宿主注册 / 安装器 `--target dsh`）的取舍见 `docs/MIGRATION-MAP.md` §5，按需推进。
