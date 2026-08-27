# ecc_to_dsh — ECC × DeepSeek Harness 适配

把 [everything-claude-code (ECC)](https://github.com/Jord5s/everything-claude-code) v2.2.0
（285 技能 / 68 子代理 / 94 命令 / 规则与纪律）适配到 DeepSeek Harness (DSH) 的完整工程。

## 仓库结构

| 路径 | 说明 |
|---|---|
| [`dsh-ecc/`](dsh-ecc/) | **交付包**：适配层（14 精选 + 285 全量技能、68 agent 提示词、preset 模板）、转换脚本、文档、AI 手册 |
| [`dsh-ecc/AI-HANDBOOK.md`](dsh-ecc/AI-HANDBOOK.md) | 给 AI 看的安装与使用手册 |
| [`dsh-ecc/README.md`](dsh-ecc/README.md) | 包说明 + **FAQ（常见问题）** |
| [`dsh-ecc/docs/MIGRATION-MAP.md`](dsh-ecc/docs/MIGRATION-MAP.md) | 迁移映射、P3 取舍、冲突审计 |
| [`ecc-skill-manager/`](ecc-skill-manager/) | GUI 技能管理器 web 插件（设置页勾选启用技能，刷新/重启常驻） |

## 快速开始

```powershell
# 1. 安装 ECC preset（写入 ~/.dsh/.agent-presets/ecc/）
& .\dsh-ecc\adapter\preset\install-skills.ps1 -RepoRoot .\dsh-ecc\adapter

# 2. DSH GUI 新建会话 → 预设选择 ECC
# 3. 验收：skill 工具列出 14 个技能；subagent 可委派 68 个 ECC 专家

# 可选：GUI 技能管理器（设置 → 技能管理 勾选启用技能）
#   按 ecc-skill-manager/README.md 安装 web 插件
```

## ⚠️ 常见问题速查

**「下载后 DSH 启动崩溃：`credentials-local: the value for "version" in ...\.credentials.yaml must be a string`」**
→ 与本包**无关**：`.credentials.yaml` 是严格的「凭据引用 → 非空字符串」映射，不允许 `version` 字段。
修复：删除该文件里的 `version:` 行（或写成 `version: "2"` 字符串）后重启 DSH。

其他问题（preset 挂载失败、技能不出现、权限、技能管理器、代理）见 [dsh-ecc/README.md](dsh-ecc/README.md) 的 FAQ 与 [AI-HANDBOOK.md](dsh-ecc/AI-HANDBOOK.md) §6 排查表。

## 状态

- ✅ P1 Pilot + P2 批量转换 + GUI 技能管理器（web 插件，刷新/重启常驻）
- ⏸️ P3（hooks 插件化 / MCP 宿主注册 / 安装器 `--target dsh`）暂缓

## 许可

适配层与脚本 MIT（沿用 ECC 许可）。ECC 上游内容版权归其作者。
