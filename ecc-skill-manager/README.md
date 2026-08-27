# dsh-skill-manager

DSH 静态 web 插件：在设置页提供「技能管理」面板，勾选哪些 ECC 技能在会话中启用。

## 原理

- **host 半身**（`lib/index.js`）：注册 `ecc-skill-manager` 设置命名空间（持久化 `active` 列表）；
  启动时把 285 技能目录（`skills/` 精选 14 + `skills-full/` 全量）发布为 catalog；
  `scope.watch` 响应设置变更 → 同步 preset 的 `skills-active/` 目录（选中复制 SKILL.md、未选中清空文件，
  `dsh-skill-filesystem` 把空文件视为不存在 → 技能从会话目录消失）。
- **client 半身**（`lib/client.js`）：`settings.section` 的「技能管理」页（搜索/全选/清空/保存）。
- **数据通道**：同源 HTTP 路由 `/skill-manager/list` + `/skill-manager/apply`（host `webServer` 注册）——
  静态 client 的 `host.call`/`settingsScope` 通道在本部署不可用（实测），HTTP 路由是与
  `describe-image` 同款的可用模式。

## 安装

```bash
# 1. link 方式加入 profile 依赖（源码即生效，pnpm 不清除）
dsh plugin --profile web add link:<本目录>

# 2. 在 ~/.dsh/cordis.patch.yml 加挂载行（已加则跳过）
# - insert:
#     - id: skill-manager
#       name: 'dsh-skill-manager'

# 3. 依赖装进源码目录（link 插件依赖约束）
cd <本目录> && npm install

# 4. 重启 DSH（host 路由与 client 模块启动时加载）
```

## 使用

设置 → 技能管理：勾选要在会话中启用的技能 → 保存 → 写入 `skills-active/` →
新会话的 skill 目录只含勾选项。**刷新页面/重启 DSH 均常驻**。

## 关键设计（勿改）

- `syncActive` 空选择 = 跳过（防启动时误清空；`scope.watch` 会在 host 发布 catalog 时触发）。
- `dsh.client.inject` 必须声明 client 依赖（runtime/connection/ui-settings）。
- `skills-active/` 由本插件独占管理；`skills/`（精选源）与 `skills-full/`（全量源）只读。

## 状态

已验证：面板常驻（刷新/重启）、285 技能列全、勾选/保存/磁盘同步闭环、空选择防护。
