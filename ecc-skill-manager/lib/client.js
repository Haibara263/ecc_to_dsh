/**
 * dsh-skill-manager — client half (static web plugin, browser).
 *
 * Renders the 技能管理 settings page: checkbox list over the catalog that the
 * host published into the `ecc-skill-manager` settings namespace, with
 * search / select-all / clear / save. Saves by updating the namespace's
 * `active` array; the host half reacts via scope.watch and syncs
 * skills-active/ — no custom RPC in either direction.
 *
 * Bundle format: DSH client modules are served as
 * `window.__ModuleLoader__.load({ id, factory(require) })`. The factory
 * returns the cordis plugin object; the client runtime provides ctx with
 * slots (ctx.get('slots')) and the settings binding API.
 */
window.__ModuleLoader__.load({
  id: 'dsh-skill-manager',
  factory: (require) => {
    const { default: React } = require('react');

    return {
      name: 'skill-manager-client',
      inject: ['slots', 'settingsScope'],
      apply(ctx) {
        const h = React.createElement;

        // Browser-side settings binding (secondary path where the transport is
        // available); host.call is the primary data channel.
        let bound = null;
        try {
          const ss = ctx.settingsScope || ctx.get('settingsScope');
          if (ss && typeof ss.bind === 'function') bound = ss.bind({ namespace: 'ecc-skill-manager' });
        } catch (_) {}

        // Data channel: host.call (static client runner pairs it with the host
        // half's harness.handle — the mechanism proven in the dynamic
        // prototype). settingsScope is a secondary path where the transport is
        // available (loopback host mode).
        const readValue = () => null; // host.call is the read path
        const callHost = async (method, args) => {
          if (typeof host !== 'undefined' && host.call) return await host.call(method, args || {});
          throw new Error('host.call unavailable');
        };

        function SkillManager() {
          const [state, setState] = React.useState({ loading: true, skills: [], search: '', saved: null });

          React.useEffect(() => {
            let alive = true;
            const load = async () => {
              try {
                const r = await callHost('skillmgr.list', {});
                const catalog = r && Array.isArray(r.skills) ? r.skills : [];
                const activeSet = new Set(catalog.filter((s) => s.active).map((s) => s.name));
                if (!alive) return;
                const skills = catalog.map((s) => ({ ...s, active: activeSet.has(s.name) }));
                setState((s) => ({ ...s, loading: false, skills }));
              } catch (e) {
                if (alive) setState((s) => ({ ...s, loading: false, saved: 'list error: ' + String(e) }));
              }
            };
            load();
            return () => { alive = false; };
          }, []);

          const q = (state.search || '').trim().toLowerCase();
          const shown = state.skills.filter((sk) => !q || sk.name.includes(q) || (sk.description || '').toLowerCase().includes(q));
          const activeCount = state.skills.filter((sk) => sk.active).length;
          const toggle = (name) => setState((s) => ({ ...s, skills: s.skills.map((sk) => sk.name === name ? { ...sk, active: !sk.active } : sk) }));
          const setAll = (v) => setState((s) => ({ ...s, skills: s.skills.map((sk) => ({ ...sk, active: v })) }));
          const save = async () => {
            const active = state.skills.filter((sk) => sk.active).map((sk) => sk.name);
            setState((s) => ({ ...s, saved: 'saving...' }));
            try {
              const r = await callHost('skillmgr.apply', { active });
              setState((s) => ({ ...s, saved: (r && r.ok) ? '已保存：启用 ' + r.activeCount + ' 个技能（新会话生效）' : '保存失败: ' + String(r && r.why || r) }));
            } catch (e) {
              setState((s) => ({ ...s, saved: 'save error: ' + String(e) }));
            }
          };

          const row = (sk) => h('label', { key: sk.name, style: { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid rgba(128,128,128,.18)', cursor: 'pointer' } },
            h('input', { type: 'checkbox', checked: !!sk.active, onChange: () => toggle(sk.name), style: { marginTop: 2 } }),
            h('span', { style: { flex: 1 } },
              h('span', { style: { fontWeight: 600, marginRight: 6 } }, sk.name),
              h('span', { style: { opacity: .75, fontSize: 12 } }, (sk.description || '').slice(0, 140)),
            ),
          );
          const btn = (label, onClick, primary) => h('button', { onClick, style: { padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(128,128,128,.4)', background: primary ? '#2563eb' : 'transparent', color: primary ? '#fff' : 'inherit', cursor: 'pointer' } }, label);

          return h('div', { style: { padding: '12px 0', maxWidth: 720 } },
            h('h2', { style: { fontSize: 16, margin: '0 0 4px' } }, '技能管理（ECC preset）'),
            h('div', { style: { opacity: .8, fontSize: 13, marginBottom: 10 } }, '勾选要在会话中启用的技能，保存后写入 skills-active/（新会话生效）。当前启用：' + activeCount + ' / ' + state.skills.length),
            state.saved ? h('div', { style: { marginBottom: 8, fontSize: 13, color: String(state.saved).startsWith('已保存') ? '#22c55e' : '#ef4444' } }, state.saved) : null,
            h('div', { style: { display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' } },
              h('input', { placeholder: '搜索技能名/描述…', value: state.search, onChange: (e) => setState((s) => ({ ...s, search: e.target.value })), style: { flex: 1, minWidth: 200, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(128,128,128,.4)', background: 'transparent', color: 'inherit' } }),
              btn('全选', () => setAll(true)),
              btn('清空', () => setAll(false)),
              btn('保存', save, true),
            ),
            h('div', { style: { maxHeight: '55vh', overflowY: 'auto', border: '1px solid rgba(128,128,128,.2)', borderRadius: 8, padding: '0 10px' } },
              state.loading ? h('div', { style: { padding: 16, opacity: .7 } }, '加载中…') : (shown.length === 0 ? h('div', { style: { padding: 16, opacity: .7 } }, '无匹配技能') : shown.map(row)),
            ),
          );
        }

        ctx.slots.inject('settings.section', () => ctx.slots.register(
          { name: 'settings.section', id: 'ecc-skill-manager', order: 30, label: '技能管理' },
          () => h(SkillManager),
        ));
      },
    };
  },
});
