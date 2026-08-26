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
- ⏸️ P3（hooks 插件化 / MCP 宿主注册 / 安装器 `--target dsh`）暂缓，取舍见 `docs/MIGRATION-MAP.md` §5

## 许可

适配层与脚本：MIT（沿用 ECC 许可）。ECC 上游内容版权归其作者。
