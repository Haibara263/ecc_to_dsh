# dsh-ecc — ECC × DeepSeek Harness 适配包

把 [everything-claude-code (ECC)](https://github.com/Jord5s/everything-claude-code) v2.2.0 适配到 DeepSeek Harness (DSH) 的完整交付包。

## 内容

- **adapter/** — DSH 适配层：14 精选技能 + 285 全量技能 + 68 子代理提示词 + 命令注册表 + preset 模板
- **scripts/** — 批量转换器（agents × 68、skills × 285，幂等）
- **docs/** — `ECC-INVENTORY.md`（组件清单）、`MIGRATION-MAP.md`（迁移映射 + P3 取舍 + 冲突审计）
- **AI-HANDBOOK.md** — **给 AI 看的安装与使用手册**（AI 可据此独立完成安装、验证、使用）

## 快速开始

```powershell
# 1. 安装 preset 组合与资产（写入 ~/.dsh/.agent-presets/ecc/，首次需权限审批）
& .\adapter\preset\install-skills.ps1 -RepoRoot .\adapter

# 2. DSH GUI 新建会话，预设选择 ECC
# 3. 验收：skill 工具应列出 14 个技能；subagent 可委派 68 个 ECC 专家
```

详细步骤、验证方法、使用指南与排查见 **AI-HANDBOOK.md**。

## 安装后形态

```
~/.dsh/.agent-presets/ecc/
├── agent.cordis.yml     # 组合：persona + 14 技能 + plan mode + compaction + delegation
├── preset.yml
├── skills/    (14)
├── agents/    (68)
└── commands/command-registry.md
```

## 状态

- ✅ P1 Pilot + P2 批量转换完成，挂载校验 `mounted OK`
- ✅ GUI 技能管理器（`dsh-skill-manager` web 插件）：设置页勾选启用技能，刷新/重启常驻
- ⏸️ P3（hooks 插件化 / MCP 宿主注册 / 安装器 `--target dsh`）暂缓，取舍见 `docs/MIGRATION-MAP.md` §5

## 常见问题（FAQ）

### DSH 启动崩溃：`credentials-local: the value for "version" in ...\.credentials.yaml must be a string`

- **原因**：`.credentials.yaml` 是严格的「凭据引用 → 非空字符串」映射，**不允许 `version` 字段**。文件里出现 `version:` 且值不是字符串（如 `version: 2`）即抛错 → 插件树加载失败 → DSH 无法启动。
- **与本包无关**：本仓库不含任何凭据文件，安装步骤只动 `.agent-presets/`、`cordis.patch.yml`、`profiles/web/node_modules/`，从不触碰 `.credentials.yaml`。该文件通常是被其他 DSH 版本/工具写入的。
- **修复**：编辑 `$DSH_HOME/.credentials.yaml`（即报错路径），**删除 `version:` 行**；若必须保留则写成字符串 `version: "2"`。保存后重启 DSH。

### preset 挂载失败：`invalid config: $.X missing required value`

- 组合缺必填配置（如 `tool-fs-search` 的 `sampleOverCapGlobResults`、`tool-todo` 的 `allowParallelInProgress`）。
- **修复**：对照官方 `standard` preset 的 `agent.cordis.yml` 补全该行 config。

### preset 挂载失败：`row(s) published process-global service(s) [...]`

- 有行向 root realm 发布了服务（preset 不允许）。
- **修复**：把发布行放进带 `isolate` realm 的 group（参照 `delegation`/`compaction` 组写法）。

### preset 挂载失败：`service "X" has been registered at ...`

- 与宿主或其他 preset 服务重名。
- **修复**：preset 只消费宿主服务，不复制宿主服务行。

### 技能不出现 / 技能「不是我改的那份」

- catalog 按会话缓存（digest）：改动后**新开会话**生效。
- 项目级技能发现优先于 preset：在含 `.dsh/skills` 或 `.agents/skills` 的仓库工作区内，项目版会遮蔽 preset 同名技能（优先级 rank 100 > 300，详见 `docs/MIGRATION-MAP.md` §7.2）。

### 写入 `~/.dsh` 被拒绝

- preset 根在工作区外，首次写入需要一次 `danger-full-access` 审批——这是 DSH 沙箱的正常行为。

### 技能管理器（`dsh-skill-manager`）面板不显示 / 数据为空

- 面板在**当前 GUI 页面**激活；页面刷新后若消失，说明装的是动态原型而非 web 插件——按 `ecc-skill-manager/README.md` 安装静态插件版（刷新/重启常驻）。
- 数据为空：确认 host 半身已加载（设置 → 技能管理应显示 285 项）；`/skill-manager/list` 路由可测（浏览器访问返回 JSON）。

### 网络：git clone/push 到 GitHub 失败

- 本仓库开发环境需代理（`127.0.0.1:7897` 等）；git 全局配置里的旧代理端口会覆盖环境变量——用 `git -c http.proxy=http://127.0.0.1:<port>` 显式指定。

## 许可

适配层与脚本：MIT（沿用 ECC 许可）。ECC 上游内容版权归其作者。
