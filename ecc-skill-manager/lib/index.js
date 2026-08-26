/**
 * dsh-skill-manager — host half (static web plugin).
 *
 * RPC-free, settings-driven design:
 *  - Registers settings namespace `ecc-skill-manager` = { active: string[] }.
 *    The DSH settings surface renders an editable section for it (schema
 *    form), so the user picks active skills from the GUI without any custom
 *    client code.
 *  - Publishes the skill catalog into the namespace (`catalog`) so richer
 *    browser UIs (the custom checkbox panel) can render from the same data.
 *  - `scope.watch()` fires on every commit; the host then syncs the preset's
 *    `skills-active/` directory (selected -> copy SKILL.md from skills/ or
 *    skills-full/; unselected -> blank the file, which the skill-filesystem
 *    provider treats as absent).
 *  - Uses ctx.get('fs') for all file access (verified to write the preset dir).
 */
import z from 'schemastery';

const NAMESPACE = 'ecc-skill-manager';
const PRESET_ID = 'ecc';
const ACTIVE_DIR = 'skills-active';

const Config = z.object({
  active: z.array(z.string()).default([]),
});

const inject = ['settings', 'agentPresets'];

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line.trim());
    if (kv) meta[kv[1]] = kv[2];
  }
  return { name: meta.name, description: meta.description || '' };
}

export default {
  name: 'skill-manager-host',
  inject,
  apply(ctx) {
    const settings = ctx.get('settings');
    const presets = ctx.get('agentPresets');
    if (settings === undefined || presets === undefined) return;

    const scope = settings.register(NAMESPACE, Config);

    const fsMaybe = () => ctx.get('fs');

    async function presetDir() {
      const p = await presets.resolve(PRESET_ID);
      return String(p.path).replace(/[\\/][^\\/]+$/, '');
    }

    async function readMaybe(fs, target) {
      try { return await fs.readText(target); } catch (_) { return null; }
    }

    async function scanDir(fs, dir) {
      const out = [];
      let entries = [];
      try { entries = await fs.listDir(dir); } catch (_) { return out; }
      for (const e of entries) {
        let text = null;
        if (e.type === 'file' && e.name.endsWith('.md')) text = await readMaybe(fs, e.target);
        else if (e.type === 'directory') {
          try {
            const sub = await fs.listDir(e.target);
            const skill = sub.find((s) => s.name === 'SKILL.md');
            if (skill) text = await readMaybe(fs, skill.target);
          } catch (_) {}
        }
        if (text === null || !text.trim()) continue;
        const meta = parseFrontmatter(text);
        if (!meta || !meta.name) continue;
        out.push(meta);
      }
      return out;
    }

    async function buildCatalog() {
      const fs = fsMaybe();
      if (fs === undefined) return [];
      const dir = await presetDir();
      const join = (d) => fs.resolve(dir + '/' + d);
      const curated = await scanDir(fs, await join('skills'));
      const full = await scanDir(fs, await join('skills-full'));
      const active = await scanDir(fs, await join(ACTIVE_DIR));
      const activeNames = new Set(active.map((a) => a.name));
      const byName = new Map();
      for (const c of curated) if (!byName.has(c.name)) byName.set(c.name, { ...c, source: 'curated' });
      for (const f of full) if (!byName.has(f.name)) byName.set(f.name, { ...f, source: 'full' });
      return [...byName.values()]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({ name: s.name, description: s.description, source: s.source, active: activeNames.has(s.name) }));
    }

    async function syncActive(active) {
      const fs = fsMaybe();
      if (fs === undefined) return { ok: false, why: 'no fs service' };
      const want = new Set(Array.isArray(active) ? active : []);
      const dir = await presetDir();
      const join = (d) => fs.resolve(dir + '/' + d);
      const curated = await scanDir(fs, await join('skills'));
      const full = await scanDir(fs, await join('skills-full'));
      const source = new Map();
      const addSource = (list, tag) => { for (const s of list) if (!source.has(s.name)) source.set(s.name, { ...s, tag }); };
      addSource(curated, 'curated');
      addSource(full, 'full');
      let activeCount = 0;
      for (const [name, s] of source) {
        const target = await join(ACTIVE_DIR + '/' + name + '-SKILL.md');
        if (want.has(name)) {
          let text = null;
          if (s.tag === 'curated') text = await readMaybe(fs, await fs.resolve(dir + '/skills/' + name + '-SKILL.md'));
          if (text === null || !text.trim()) text = await readMaybe(fs, await fs.resolve(dir + '/skills-full/' + name + '-SKILL.md'));
          if (text === null || !text.trim()) text = await readMaybe(fs, await fs.resolve(dir + '/skills-full/' + name + '/SKILL.md'));
          if (text !== null && text.trim()) { await fs.writeText(target, text); activeCount++; }
        } else {
          await fs.writeText(target, '');
        }
      }
      return { ok: true, activeCount, total: source.size };
    }

    // Publish the catalog into the namespace for richer UIs.
    buildCatalog().then((catalog) => {
      try { scope.update({ catalog }); } catch (_) {}
    });

    // React to every commit of the namespace (GUI edits included).
    scope.watch(() => {
      const value = scope.get();
      const active = value && Array.isArray(value.active) ? value.active : [];
      syncActive(active).then((r) => {
        if (!r.ok) console.error('[skill-manager] sync failed', r.why);
      }).catch((e) => console.error('[skill-manager] sync error', e));
    });

    // Client data channel: harness.handle pairs with the browser half's
    // host.call (the mechanism proven in the dynamic prototype).
    if (typeof harness !== 'undefined' && harness.handle) {
      harness.handle('skillmgr.list', async () => {
        try {
          const skills = await buildCatalog();
          return { ok: true, skills };
        } catch (e) {
          return { ok: false, why: String(e && e.message || e) };
        }
      });
      harness.handle('skillmgr.apply', async (args) => {
        try {
          const active = Array.isArray(args && args.active) ? args.active : [];
          return await syncActive(active);
        } catch (e) {
          return { ok: false, why: String(e && e.message || e) };
        }
      });
    }

    return;
  },
};
