#!/usr/bin/env node
/**
 * ecc-to-dsh agent converter (Pilot + 批量转换器骨架)
 *
 * 把 ECC `agents/<name>.md`（Claude Code 子代理，YAML frontmatter:
 * name/description/tools/model）转成 DSH 可用的 subagent 提示词资产：
 *   - 解析并剥离 frontmatter
 *   - description 转成 DSH 调用说明
 *   - tools 字段映射到 DSH 工具名（Bash→pwsh/bash, Read→read, Grep→grep,
 *     Glob→glob, str_replace_editor→edit, Task→subagent, …）
 *   - model 字段转为「建议模型」注释
 *   - 正文原样保留为 prompt 主体
 *
 * 用法:
 *   node scripts/ecc-to-dsh-convert-agents.js [--agents planner,code-reviewer] [--out .dsh/agents]
 * 缺省: 转换 agents/ 下全部 68 个。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(ROOT, 'agents');
const OUT_DIR = path.resolve(ROOT, '.dsh', 'agents');

// ECC (Claude Code) 工具名 -> DSH 工具名映射表（批量替换的核心配置）
const TOOL_MAP = {
  Bash: 'pwsh (Windows) / bash (POSIX)',
  Read: 'read',
  Grep: 'grep',
  Glob: 'glob',
  str_replace_editor: 'edit / write',
  Edit: 'edit',
  Write: 'write',
  MultiEdit: 'edit (replace_all)',
  Task: 'subagent / subagent_fork',
  WebSearch: 'web_search',
  WebFetch: 'browser_open / browser_content',
  TodoWrite: 'todo_write',
  AskUserQuestion: 'ask_user_question',
  Skill: 'skill',
  Agent: 'subagent',
};

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z-]+):\s*(.*)$/.exec(line.trim());
    if (kv) meta[kv[1]] = kv[2];
  }
  return { meta, body: text.slice(m[0].length) };
}

function mapTools(toolsStr) {
  if (!toolsStr) return '(继承 DSH 默认工具集)';
  return toolsStr
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => TOOL_MAP[t] || t)
    .join(', ');
}

function convert(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const name = meta.name || path.basename(file, '.md');
  const desc = meta.description || '';
  const tools = mapTools(meta.tools);
  const model = meta.model ? `\n> 建议模型档位：\`${meta.model}\`（DSH 使用会话模型路由，此处仅供参考）` : '';

  const out = [
    `# Agent: ${name}`,
    '',
    `> ECC 子代理适配为 DSH subagent 提示词。原文件：\`agents/${name}.md\``,
    '',
    `## 调用说明`,
    '',
    `- **用途**：${desc}`,
    `- **工具映射**：${tools}`,
    model,
    '',
    '## 提示词主体（原样保留）',
    '',
    '---',
    '',
    body.trim(),
    '',
  ].join('\n');

  return { name, out };
}

function main() {
  const args = process.argv.slice(2);
  let names = null;
  let outDir = OUT_DIR;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agents') names = args[++i].split(',');
    if (args[i] === '--out') outDir = args[++i];
  }
  fs.mkdirSync(outDir, { recursive: true });

  const files = names
    ? names.map((n) => path.join(AGENTS_DIR, `${n}.md`))
    : fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).map((f) => path.join(AGENTS_DIR, f));

  let ok = 0, fail = 0;
  for (const f of files) {
    if (!fs.existsSync(f)) { console.error(`MISSING: ${f}`); fail++; continue; }
    try {
      const { name, out } = convert(f);
      fs.writeFileSync(path.join(outDir, `${name}.md`), out, 'utf8');
      console.log(`converted: ${name}`);
      ok++;
    } catch (e) { console.error(`FAIL ${f}: ${e.message}`); fail++; }
  }
  console.log(`\nDone: ${ok} converted, ${fail} failed -> ${outDir}`);
}

main();
