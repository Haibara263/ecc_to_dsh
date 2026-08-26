# ECC MCP servers → DSH 映射

ECC `mcp-configs/mcp-servers.json` 声明 35 个 MCP server。DSH 的 MCP 支持需以
宿主组合为准（`cordis_inspect_list` 确认是否有 MCP 服务/工具），本文件先给映射，
P3 再做实际注册。

## 分层建议（≤10 个核心，与 ECC 官方建议一致）

### 第一梯队：通用价值（建议注册）

| server | 类型 | DSH 备注 |
|---|---|---|
| github | npx `@modelcontextprotocol/server-github` | 需 GITHUB_PERSONAL_ACCESS_TOKEN |
| context7 | npx `@upstash/context7-mcp` | 文档查询（替代 docs-lookup agent） |
| exa-web-search | npx `exa-mcp-server` | 需 EXA_API_KEY；**DSH 已有原生 `web_search` 可替代** |
| parallel-search | http search.parallel.ai/mcp | 免 key；DSH web_search 亦可替代 |
| playwright | npx `@playwright/mcp --browser chrome` | **DSH 已有 browser_* 工具可替代** |
| filesystem | npx server-filesystem | DSH 已有原生 fs 工具，不需要 |
| memory | npx server-memory | **DSH 已有 Hindsight/viking 记忆，不需要** |
| sequential-thinking | npx server-sequential-thinking | 可选，推理辅助 |

### 第二梯队：按需（项目用到再开）

supabase、jira、confluence、firecrawl、fal-ai、vercel、railway、
cloudflare-*（4）、clickhouse、browserbase、browser-use、token-optimizer、
evalview、codescene、magic、laraplugins、devfleet。

### 第三梯队：本地/记忆类（DSH 原生替代）

ecc-memory-vault、omega-memory、longhand、squish、memxus、nexus、ito-compute。

## 结论

- **DSH 原生能力已覆盖近半**：web_search ↔ exa/parallel、browser_* ↔ playwright/
  browser-use、Hindsight/viking ↔ memory 类、fs 工具 ↔ filesystem。
- 真正值得注册的第三方 MCP：github、context7、jira/confluence（团队场景）、
  firecrawl/fal-ai（内容场景）。
- 注册位置：宿主组合（host composition）的 MCP 行，或 preset 可消费的宿主服务
  （以 `cordis_inspect_list` 实测为准，勿臆造服务名）。
