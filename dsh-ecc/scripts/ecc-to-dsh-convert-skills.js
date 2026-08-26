#!/usr/bin/env node
/**
 * ecc-to-dsh skill converter (P2 批量)
 *
 * 把 ECC `skills/<name>/SKILL.md`（285 个）复制进 `.dsh/skills-full/`：
 *   - 纯 SKILL.md 的技能 -> 平铺复制为 `<name>-SKILL.md`（frontmatter name 即技能 id）
 *   - 带附加文件（references/、agents/ 等）的技能 -> 整体目录复制 `<name>/`
 *     （保留资源文件，DSH 两种发现形态都支持）
 *
 * `.dsh/skills/` 保留精选 14 个（preset 默认挂载）；全量集在此目录，
 * 需要时用 `preset/install-skills.ps1 -IncludeAllSkills` 复制进 preset。
 *
 * 可选 --rewrite-tools：对正文做 Claude 专属工具名的保守替换（默认关闭，
 * 避免误伤正文）。frontmatter 不动（description 是触发关键，保持原样）。
 *
 * 用法:
 *   node scripts/ecc-to-dsh-convert-skills.js [--out .dsh/skills-full] [--rewrite-tools]
 * 缺省: 转换 skills/ 下全部 285 个。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const OUT_DIR = path.resolve(ROOT, '.dsh', 'skills-full');

// 正文工具名保守替换表（仅当 --rewrite-tools 时应用；只替换独立词元）
const TOOL_REWRITES = [
  [/\bstr_replace_editor\b/g, 'edit / write'],
  [/\bMultiEdit\b/g, 'edit (replace_all)'],
  [/\bBash\b/g, 'pwsh / bash'],
  [/\bWebSearch\b/g, 'web_search'],
  [/\bWebFetch\b/g, 'browser_open / browser_content'],
  [/\bTodoWrite\b/g, 'todo_write'],
  [/\bAskUserQuestion\b/g, 'ask_user_question'],
];

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  const args = process.argv.slice(2);
  let outDir = OUT_DIR;
  let rewrite = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') outDir = args[++i];
    if (args[i] === '--rewrite-tools') rewrite = true;
  }
  fs.mkdirSync(outDir, { recursive: true });

  const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  let flat = 0, bundle = 0, fail = 0;
  for (const name of dirs.sort()) {
    const skillDir = path.join(SKILLS_DIR, name);
    const files = fs.readdirSync(skillDir);
    const hasExtras = files.some((f) => f !== 'SKILL.md');
    try {
      if (hasExtras) {
        copyDir(skillDir, path.join(outDir, name));
        bundle++;
      } else {
        let body = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
        if (rewrite) for (const [re, to] of TOOL_REWRITES) body = body.replace(re, to);
        fs.writeFileSync(path.join(outDir, `${name}-SKILL.md`), body, 'utf8');
        flat++;
      }
    } catch (e) { console.error(`FAIL ${name}: ${e.message}`); fail++; }
  }
  console.log(`Done: ${flat} flat + ${bundle} bundle = ${flat + bundle}, ${fail} failed -> ${outDir}`);
}

main();
