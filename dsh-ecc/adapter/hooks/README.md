# ECC Hooks → DSH 映射

ECC `hooks/hooks.json` 是 Claude Code 事件钩子（JSON）。DSH 没有 Claude-Code-格式的
hook 运行时，映射分两档：**提示级纪律**（立即生效）与 **Cordis 插件**（P3，真实自动化）。

## 事件映射

| Claude Code 事件 | ECC hook 示例 | DSH 落点（提示级） | DSH 落点（插件级，需实测事件名） |
|---|---|---|---|
| PreToolUse | pre:bash:dispatcher（质量/推送/GateGuard）、pre:write:doc-file-warning、pre:config-protection、pre:edit-write:gateguard-fact-force | 规则：写码前检查相关 skill 是否应激活；改文件前先调查 | 动态 Cordis 插件 `ctx.on(<工具前事件>)`，拦截 Edit/Write 做事实强制 |
| PostToolUse | post:mcp-health-check、post:skill:track | 规则：工具后自查 | 同左，监听工具后事件 |
| PostToolUseFailure | post:mcp-health-check（重连） | 规则：失败后诊断再重试 | 同左 |
| PreCompact | pre:compact（保存状态） | 规则：压缩前输出进度摘要 | DSH 已有原生 compaction |
| SessionStart | session:start（载入上文/探测包管理器） | 规则：会话开始先读项目上下文 | preset `agent-instructions` 注入即等效 |
| Stop | stop:format-typecheck、stop:check-console-log、stop:cost-tracker、stop:desktop-notify、stop:session-end | 规则：结束前批量格式化+类型检查、查 console.log、验证 | DSH 回合结束钩子（若有） |
| SessionEnd | session:end:marker | 规则：会话结束写记忆 | DSH Hindsight 记忆已原生承接 |

## 值得插件化的高价值 hooks（P3）

1. **gateguard-fact-force**：首次 Edit/Write 前强制调查（数据 schema、调用方、用户指令）——防幻觉编辑，价值最高。
2. **config-protection**：禁止改 linter/formatter 配置文件，引导改代码。
3. **security pre-check**：写文件前扫密钥（GitHub secret scanning 同款语义）。
4. **stop:check-console-log**：回合结束查 console.log。

## 实现路径（P3）

1. `cordis_inspect_list` / `cordis_inspect_query`（Event.listEvents）确认 DSH 暴露的
   工具前/后事件名与载荷。
2. 用 `cordis-plugin-development` 技能写动态插件：`apply(ctx)` 内 `ctx.on(event)`，
   复用 ECC `scripts/hooks/*.js` 的检查逻辑（Node 可直接调用）。
3. 插件经 preset 的 host 侧挂载或作为宿主组合行注册。

## 提示级纪律（pilot 立即启用，写进 preset agent-instructions）

```text
写码前：
1. 检查是否应激活某个 skill（tdd-workflow / security-review …）。
2. 检查改动是否涉及安全敏感面。
3. 优先测试先行。

完成前：
1. 重读用户请求。
2. 列出实际改动的主路径。
3. 说明验证了什么、没验证什么（verification-loop）。
```
