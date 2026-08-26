# ECC Command Registry for DSH

DSH 没有原生斜杠命令系统，按 ECC 官方
[MANUAL-ADAPTATION-GUIDE](docs/MANUAL-ADAPTATION-GUIDE.md) 的做法，把 ECC 的 94
个斜杠命令浓缩为**语义注册表**：主 agent 遇到对应场景时按条目激活对应行为。
实现方式是提示段（preset 的 `agent-instructions` 注入），不是真实命令。

## 注册表（核心 12 条）

| 命令 | 触发场景 | 激活行为 |
|---|---|---|
| `/plan` | 复杂功能 / 重构 / 架构变更 | 用 `.dsh/agents/planner.md` 的规划流程：需求分析→架构审查→分步计划→风险与验收标准→产出计划 |
| `/tdd` | 新功能 / bug 修复 | 加载 `tdd-workflow` 技能：先写失败测试（RED）→最小实现（GREEN）→重构（IMPROVE），覆盖率 ≥80% |
| `/code-review` | 写完/改完代码后 | 用 `.dsh/agents/code-reviewer.md`：git diff → 置信度过滤 → 按严重级输出（CRITICAL/HIGH/MEDIUM/LOW）→ 总结表 + 判定 |
| `/security` | 提交前 / 敏感代码 | 加载 `security-review` 技能：硬编码密钥、注入、XSS、路径穿越、认证绕过、依赖漏洞 |
| `/verify` | 声称完成前 | 加载 `verification-loop` 技能：构建→测试→lint→类型检查→安全检查，逐项报告结果 |
| `/build-fix` | 构建/类型错误 | 用对应语言 build-resolver agent 提示词：分析错误→增量修复→每步验证 |
| `/e2e` | 关键用户流程 | 加载 `e2e-testing` 技能（Playwright 流程） |
| `/refactor-clean` | 死代码清理 | 用 refactor-cleaner 提示词 |
| `/update-docs` | 文档/代码地图更新 | 用 doc-updater 提示词 |
| `/learn` | 会话模式提炼 | 记录可复用模式（DSH 可用 Hindsight/记忆工具承接） |
| `/context` | 上下文紧张 | 加载 `strategic-compact` 技能：保留任务框架，压缩冗余 |
| `/checkpoint` | 阶段性保存 | 输出结构化进度摘要（DSH 可用 goal/todo 承接） |

## 实现要点

1. 注册表随 preset 注入 `agent-instructions`（或作为 `strategic-compact` 类似
   的常驻提示段），让主 agent 在每轮都知道这些触发条件。
2. 子代理场景必须用 `subagent`/`subagent_fork` 工具 + `.dsh/agents/<name>.md`
   提示词（保持新鲜上下文，符合 ECC「fresh context review」理念）。
3. 命令参数（如 `/code-review 42` 的 PR 模式）映射为 subagent 提示词里的输入说明。

## 完整命令目录

ECC `commands/`（94 个）与 `legacy-command-shims/commands/` 保留为参考；
高频命令按上述 12 条注册即可覆盖日常 90% 场景。
