# ECC → DSH 迁移映射表（Migration Map）

> 依据：ECC v2.2.0（见 [`ECC-INVENTORY.md`](./ECC-INVENTORY.md)）+ 本机 DSH 部署实测
> （preset 组合格式、skill 注册机制均来自 `%APPDATA%…\@deepseek-ai\dsh\config\agent-presets\` 官方预设）。

## 0. 结论先行

**完全可行，且比预想便宜**。三个决定性事实：

1. **Skill 格式逐字节兼容**：ECC `SKILL.md` 的 frontmatter（`name` + `description`）与 DSH 官方 `cordis` preset 的 SKILL.md 完全同构，285 个技能几乎零转换。
2. **ECC 自带跨 harness 适配范式**：仓库内已有 `.codex/`、`.opencode/`、`.cursor/` 等 13 个适配层，DSH 适配照抄其模式即可，还有官方 `docs/MANUAL-ADAPTATION-GUIDE.md` 兜底。
3. **DSH 有原生 skill 注册机制**：preset 里放 `skills/` 目录 + `@deepseek-ai/dsh-skill-filesystem` + `@deepseek-ai/dsh-tool-skill` 两行即可挂载，经 `skill` 工具按 description 触发——与 Claude Code 的 skill 机制同源。

## 1. 总映射表

| ECC 组件 | 数量 | Claude Code 形态 | **DSH 落点** | 转换成本 | 说明 |
|---|---|---|---|---|---|
| Skills | 285 | `.claude/skills/<n>/SKILL.md` | preset 内 `skills/<n>/SKILL.md` + `dsh-skill-filesystem` 行 | ★（复制即可） | frontmatter 兼容；正文中 Claude 专属工具名（Bash/Read/Grep/Glob/str_replace_editor）建议做一次批量替换 |
| Agents | 68 | `agents/*.md`（子代理） | `.dsh/agents/*.md` 提示词资产，供 `subagent`/`subagent_fork` 工具作为 delegation prompt 使用 | ★★ | 主 agent 通过「agent 注册表」提示段知道何时用哪个；模型名（sonnet→DSH 模型路由）与工具名需改写 |
| Commands | 94 | `/slash` 命令 | 按 MANUAL-ADAPTATION-GUIDE 转成「命令注册表」提示段（无原生斜杠系统时）；部分高频命令（plan/tdd/review/verify/security）可做成 skill | ★★ | DSH 无斜杠系统，语义等价物是 skill + 提示段 |
| Rules | 122 | `.claude/rules/*.md` | `@deepseek-ai/dsh-agent-instructions`（maxBytes 64K）或 persona 提示段 | ★★ | 总护栏（guardrails）必选；语言规则按需裁剪 |
| Hooks | 5 文件 | hooks.json 事件钩子 | **两档**：(a) 提示级纪律（写入 agent-instructions，立即生效）；(b) Cordis 插件事件（`Event.listEvents` 确认 DSH 事件名后写动态插件，实现 pre-edit 安全闸等） | ★★★（插件档） | 与 `.codex/AGENTS.md`「Security Without Hooks」同思路：无原生 hooks 时用指令级强制 |
| MCP | 35 | `.mcp.json` / mcp-configs | DSH 宿主组合的 MCP 注册（需先用 `cordis_inspect_list` 确认本部署是否启用 MCP 服务） | ★★★ | 先注册 github/context7/exa/playwright 等 ≤10 个核心；DSH 已有 web_search 可替代部分搜索类 MCP |
| `.claude-plugin/` | 3 | 插件打包 | 参照 `plugins/ecc/.codex-plugin/plugin.json` → 可做 DSH 动态插件 | ★★★ | 后期 |
| Scripts/CLI | 48 | Node 脚本 | 大部分可在 DSH 内经 `pwsh`/`bash` 直接调用（`node scripts/ecc.js …`）；安装器不适用 | ★★ | DSH 沙箱内可直接跑 |
| 记忆/连续学习 | — | hooks + memory | DSH 已有 Hindsight / viking 记忆系统；ECC Memory Vault 可作补充或桥接 | ★★ | 建议映射文档，不重复造 |
| 安全/AgentShield | — | hook + 扫描 | DSH 沙箱（workspace-write）+ 审批栈天然承接 | ★ | 概念对齐即可 |

## 2. 关键格式对照（实测）

### 2.1 Skill：零转换

```yaml
# ECC  skills/git-workflow/SKILL.md 的 frontmatter
---
name: git-workflow
description: Git workflow patterns including branching strategies, …
metadata:
  origin: ECC
---
```

```yaml
# DSH  cordis preset 的 SKILL.md frontmatter（同构）
---
name: cordis-plugin-development
description: Create, modify, debug, or extend dynamic Cordis Plugins, …
---
```

### 2.2 Agent：frontmatter 映射

| ECC agent frontmatter | DSH 落点 |
|---|---|
| `name` | 提示词资产文件名 / 注册表条目名 |
| `description` | subagent 调用时的用途说明 |
| `tools: Read, Grep, Glob, Bash` | → `read`/`grep`/`glob`/`pwsh`（DSH 工具名），写入调用说明 |
| `model: sonnet` | 忽略（DSH 用会话模型路由），或标注「建议高性能模型」 |
| 正文 | 原样作为 subagent prompt 主体 |

### 2.3 Hook：事件映射

| Claude Code 事件 | DSH 候选（需 `Event.listEvents` 实测确认） | 等效实现 |
|---|---|---|
| PreToolUse | 工具调用前事件 | 动态 Cordis 插件 `ctx.on(...)` 或提示级纪律 |
| PostToolUse | 工具调用后事件 | 同上 |
| Stop / SessionEnd | 回合结束 / 会话结束 | goal/记忆持久化已有宿主实现（Hindsight） |
| SessionStart | 会话创建 | preset agent-instructions 注入 |

## 3. 推荐落地形态（两条腿）

### 3.1 一等适配层：`ecc-src/.dsh/`（贡献回 ECC 的模式）

仿照 `.codex/`、`.opencode/`，在 ECC 仓库内新增 `.dsh/` 目录：

```
ecc-src/.dsh/
├── README.md          # DSH 适配说明（仿 .opencode/README.md）
├── AGENTS.md          # DSH 补充说明（仿 .codex/AGENTS.md，含差异表）
├── skills/            # 精选技能（SKILL.md 原样 + 工具名替换）
├── agents/            # 精选 agent 提示词（.md）
├── commands/          # 命令注册表（.md）
├── rules/             # 精简规则包
├── mcp/               # MCP 映射说明
└── hooks/             # hook 映射说明（DSH 事件名）
```

配套：向 `scripts/lib/install-manifests.js` 的 `SUPPORTED_INSTALL_TARGETS` 增加 `'dsh'`，并提供 `--target dsh` 安装器（可后置，pilot 不阻塞）。

### 3.2 可运行交付：DSH 用户 preset `ecc`

在 `~/.dsh/.agent-presets/ecc/` 创建：

```
~/.dsh/.agent-presets/ecc/
├── preset.yml         # name: ECC / description
├── agent.cordis.yml   # persona + agent-instructions(rules) + skill-filesystem + 工具行
└── skills/            # 精选 ECC 技能（物理复制）
```

`agent.cordis.yml` 结构（参照官方 `cordis`/`standard` preset）：

```yaml
- id: persona
  name: '@deepseek-ai/dsh-persona'
  config:
    text: >-   # ECC 总则（plan → test → implement → review → verify → remember）

- id: agent-instructions   # ECC rules（guardrails + 常用规则）
  name: '@deepseek-ai/dsh-agent-instructions'
  config: { maxBytes: 65536 }

- id: skill-filesystem     # 挂载 skills/ 目录
  name: '@deepseek-ai/dsh-skill-filesystem'
  config:
    customSkillDirs:
      - !!js "process.getBuiltinModule('node:url').fileURLToPath(new URL('skills/', baseUrl))"

- id: tool-skill
  name: '@deepseek-ai/dsh-tool-skill'

# + 标准工具行（tool-pwsh / tool-fs / tool-jobs / tool-subagent 组等，从 standard 复制）
# + Plan Mode 隔离组（dsh-plan-mode）与 Compaction 隔离组（dsh-compaction-basic +
#   dsh-command-compact + dsh-compaction-tool-result-pruner）——照抄 standard，已挂载验证
```

> 注意：该文件是 AGENT-PLANE 组合；任何 publish 服务的行必须置于带 `isolate` realm 的 group 内（参照 standard 的 delegation/compaction 组）。工具行只消费宿主服务，无需 realm。

## 4. 优先级路线（Pilot → 批量 → 完整）

| 阶段 | 内容 | 产出 | 验证 |
|---|---|---|---|
| P1 Pilot ✅ | 精选 12~15 技能 + 4~5 agent 提示词 + 命令注册表 + rules 精简包 | `.dsh/` 适配层 + 可运行 `ecc` preset | ✅ preset 挂载校验 `mounted OK`；用户真实会话验收（14 技能 + persona + 委托工具） |
| P2 批量 ✅ | 285 技能批量转换 + 68 agent 批量生成提示词 | `.dsh/skills/`（258 平铺 + 27 目录包）、`.dsh/agents/`（68）、转换脚本 ×2 | ✅ 转换器 285/285、68/68 零失败；抽样检查通过；preset 同步 68 agents 后复验 `mounted OK` |
| P3 完整（暂缓，见 §6） | hooks→Cordis 插件、MCP→宿主注册、安装器 `--target dsh`、记忆桥接 | 一等适配层 + 安装器 | `node scripts/install-apply.js --target dsh --dry-run` |

## 5. P3 取舍（2025 决策记录）

> 结论：**P3 三项均不影响当前可用性**（P1+P2 已交付可运行 preset）。按真实痛感决定是否推进。

| P3 项 | 不做的影响 | 兜底/替代 | 等级 | 优先级建议 |
|---|---|---|---|---|
| hooks → Cordis 插件 | ECC 的机械拦截（Edit/Write 前强制调查、禁改 lint 配置、查 console.log）退化为**提示级纪律**，靠模型自觉 | DSH 沙箱 `workspace-write` + 审批栈已机械兜底「越权写文件」；最坏是违反软规则而非数据灾难 | 低-中 | 1（价值最高：gateguard 事实强制；动态插件不动宿主，风险低） |
| MCP → 宿主注册 | 35 个 server 的工具不可用；**实测 DSH 有 `dsh-mcp-client` 包但宿主组合未注册任何 MCP**，做此项 = 改部署级组合 | 近半已被 DSH 原生替代：`web_search`↔exa/parallel、`browser_*`↔playwright/browser-use、Hindsight/viking↔memory 类、fs↔filesystem；github 用 gh CLI、context7 用 web_search | 低 | 3（影响面最大、收益最小，建议搁置） |
| 安装器 `--target dsh` | ECC 上游升级不自动跟进，需手动重跑转换/安装；无法向社区提交 DSH 支持 | 现有 `install-skills.ps1` 半自动 + 文档 | 低 | 2（一劳永逸解决升级跟进；改上游） |

**隐性收益（不做 P3）**：不动宿主组合、不碰部署级配置，DSH 升级零冲突。

## 6. 主要风险与对策

| 风险 | 对策 |
|---|---|
| Skill 正文引用 Claude 专属工具名导致「指空」 | 批量替换表：Bash→pwsh/bash、Read→read、Grep→grep、Glob→glob、str_replace_editor→edit、Task→subagent |
| 285 技能全量导入会稀释 skill 触发质量 | 默认只挂精选集；全量集放 `.dsh/skills-full/` 按需启用 |
| MCP 注册依赖宿主支持 | pilot 阶段以文档映射 + DSH 原生 web_search/浏览器工具替代，MCP 留 P3 |
| Hooks 无原生事件 | 先提示级纪律（零成本），插件化按 `Event.listEvents` 实测后做 |
| preset 组合写错（service 未隔离） | 每步用官方 `standingKeyFor`/新建会话实测（见 `editing-cordis-compositions` 技能） |

## 7. 插件冲突审计（2025 记录）

> 结论：**当前零冲突**；1 个可感知行为（项目级技能遮蔽，内容相同无碍）；5 类未来风险均有缓解。

### 7.1 当前安装对比（证据链）

| 检查项 | 结果 |
|---|---|
| 宿主组合（编译态）50+ 服务 | preset 只消费、不发布 → 无冲突（`standingKeyFor` 挂载校验硬性验证） |
| 组合行审计 | 全部消费行（persona/tools/skill-filesystem/goal/subagent…），无 `provide/publish` 语义；`isolate: workflowEngine` 为空 entry-local realm（standard 同款预留，无害） |
| 用户 preset（standard/code/minimal/cordis/liangshen/ecc） | preset 间按 **scope 分层**，工具/技能注册互不干扰 |
| GUI/客户端插件（皮肤、remote-web-ui、workbench、ssh、task-board、aionui-panel、liangshen） | client/UI 平面，与 agent 平面无交集 |
| 动态插件 | 探针 prst-1/2/3 已全部 `cordis_undefine` 清理 |
| 技能根 | `~/.dsh/skills` 不存在；`~/.agents/skills` 仅 `vision-support`，与 14 精选零重名；`DSH_BUNDLED_SKILL_DIR` 未设置 |
| `cordis.patch.yml` | 仅皮肤补丁 |

### 7.2 技能发现优先级（实测 rank）

```
项目 .dsh/skills  = 100   ← 最高
项目 .agents/skills = 200
preset customDir  = 300   ← 我们的 preset skills/
用户 .dsh/skills  = 400
用户 .agents/skills = 500
bundled           = 600   ← 最低
```

- 在 `ecc-src` 工作区内，项目级 `.dsh/skills`（14）自动发现并**遮蔽** preset 同名技能——当前内容一致，行为无差异；若将来两处漂移，项目版优先（特性而非缺陷）。
- `ecc-src/.agents/skills`（89 个 Codex 侧技能）会在任何以 ecc-src 为工作区的会话（含 standard preset）的 skill 目录出现——ECC 仓库布局与 DSH 默认发现的自然交汇。

### 7.3 未来冲突风险清单（按现实度）

| # | 风险 | 触发 | 后果 | 缓解 |
|---|---|---|---|---|
| 1 | 技能重名 | 未来安装的技能包含 `api-design`/`deep-research`/`git-workflow` 等通用名 | 同层按 rank、跨层就近胜出；不崩，可能互相遮蔽 | preset 只挂 14 精选、全量按需启用；装包前跑一次重名检查 |
| 2 | preset id `ecc` | 未来插件也发布 `ecc` preset | roster 拒绝其一 | 社区化前改名 `ecc-dsh`（需同步 settings 默认值） |
| 3 | 工具名 | 未来宿主级插件注册同名工具（subagent/skill 等） | 就近层遮蔽，不报错 | 工具名均为官方标准名；避免自定义同名词 |
| 4 | 未来 hooks 动态插件 | 做 P3-1 时 | 若向 root realm 发布服务/注入未声明服务则挂载失败 | 按 `cordis-plugin-development` 规范：工具名唯一、不 inject 未声明服务 |
| 5 | MCP server 名 | 做 P3-2 注册时与宿主/其他插件重名（如 github） | 重复注册报错或遮蔽 | 注册前查 `cordis_inspect_list`；当前零注册零冲突 |

### 7.4 可选加固（暂缓，按需执行）

1. preset id `ecc` → `ecc-dsh`（防未来碰撞；需同步 `settings.yaml` 默认值）
2. 清理 delegation 组预留的 `isolate: workflowEngine`（无害，删不删都行）
