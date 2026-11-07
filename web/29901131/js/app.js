/* render() — маршрутизация экранов, нижние вкладки, общий bind() */
/* ================= экраны ================= */
function render() {
  applyTheme();
  setTimeout(webReady, 0);
  const app = $('#app');
  if (gateB(app)) return;   // блок B: экран блокировки и шаги онбординга (lock.js)
  if (!S.authReady) { app.innerHTML = '<div class="spin"></div>'; return; }
  if (!S.user) return renderLogin(app);
  if (S.loading || S.profile === null) { app.innerHTML = '<div class="spin"></div>'; return; }
  if (!S.profile.consentAt) return renderLogin(app, true);
  if (!S.profile.role) return renderRole(app);
  if (!S.profile.coupleId) return role() === 'her' ? renderSetup(app) : renderJoin(app);
  if (!S.couple) { app.innerHTML = '<div class="spin"></div>'; return; }
  const scrollY = window.scrollY;
  app.innerHTML = `<div class="screen">${({ today: viewToday, cal: viewCal, notes: viewNotes, settings: viewSettings })[UI.tab]()}</div>${tabs()}`;
  bind(app);
  typo(app);
  window.scrollTo(0, scrollY);
  notifyToday();
}
function tabs() {
  const her = role() === 'her';
  const locked = her ? allNotes().filter(n => n.role === 'him' && !n.private && lockReasons(n).length).length : 0;
  const t = [['today', 'sun', 'Сегодня'], ['cal', 'cal', 'Календарь'], ['notes', 'chat', 'Записи'], ['settings', 'set', 'Настройки']];
  return `<nav class="tabs" aria-label="Разделы">${t.map(([k, i, l]) => `<button data-tab="${k}" class="${UI.tab === k ? 'on' : ''}">${ic(i)}${l}${k === 'notes' && locked ? `<span class="dot">${locked}</span>` : ''}</button>`).join('')}</nav>`;
}
function roleSeg() { return ''; }

function heroVars(season) { const k = SEASONS[season].key; return `--hero:var(--${k});--heroT:var(--${k}T);--acc:var(--${k}A)`; }
/* ================= обработчики ================= */
function bind(app) {
  $$('[data-tab]', app).forEach(b => b.onclick = () => go(b.dataset.tab));
  $$('[data-entry]', app).forEach(b => b.onclick = () => openEntry(b.dataset.entry));
  $$('[data-feel]', app).forEach(b => b.onclick = () => setFeel(b.dataset.fdate, b.dataset.feel));
  $$('[data-quick]', app).forEach(b => b.onclick = () => openEntry(today(), b.dataset.quick));
  $$('[data-goday]', app).forEach(b => b.onclick = () => { if (UI.tab === 'today') UI.from = 'today'; UI.sel = b.dataset.goday; UI.view = UI.sel.slice(0, 7); UI.tab = 'cal'; sessionStorage.setItem('is-tab', 'cal'); render(); });
  $$('[data-day]', app).forEach(b => b.onclick = () => { UI.sel = b.dataset.day; render(); const c = $('#dayCard'); c && c.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $$('[data-mon]', app).forEach(b => b.onclick = () => { const [y, m] = UI.view.split('-').map(Number), d = new Date(Date.UTC(y, m - 1 + +b.dataset.mon, 1)); UI.view = d.toISOString().slice(0, 7); render(); });
  $$('.bub.out', app).forEach(b => b.onclick = () => {
    const n = allNotes().find(x => x.id === b.dataset.note); if (!n) return;
    confirmSheet('Удалить запись?', esc(n.text || 'Запись без текста') + ' — ' + fmt(n.date), 'Удалить', () => Store.delNote(n));
  });
  const on = (id, f) => { const e = $('#' + id, app); if (e) e.onclick = f; };
  on('reveal', () => Store.updateCouple({ revealedAt: Date.now() }));
  on('out', () => confirmSheet('Выйти из аккаунта?', 'Данные останутся в облаке — войдёшь снова и всё увидишь.', 'Выйти', () => Store.signOut()));
  on('demo-role', () => Demo.switchRole());
  on('upd', () => checkUpdate());
  on('invite', async () => { try { await Store.invite(); } catch (e) { toast('Не получилось: ' + (e.code || e.message)); } });
  on('share', () => { const t = `Код для «Внутренних сезонов»: ${S.couple.inviteCode}\n\nВставь это сообщение целиком — код найдётся сам. Приложение: https://github.com/EyeAnton/inner-seasons-releases/releases/latest/download/inner-seasons.apk`; if (A && A.share) A.share(t); else if (navigator.share) navigator.share({ text: t }).catch(() => {}); else { navigator.clipboard && navigator.clipboard.writeText(t); toast('Код скопирован'); } });
  on('unlink', () => confirmSheet('Отвязать партнёра?', 'Он перестанет видеть твои сезоны и записи. Его прошлые заметки останутся у тебя.', 'Отвязать', () => Store.unlink()));
  on('leave', () => confirmSheet('Выйти из пары?', 'Ты перестанешь видеть её сезоны и записи.', 'Выйти из пары', () => Store.leave()));
  on('wipe', () => confirmSheet('Удалить все мои данные?', 'Удалятся твои записи, профиль и согласие' + (role() === 'her' ? ', а пара будет распущена' : '') + '. Это нельзя отменить.', 'Удалить навсегда', () => Store.wipe()));
  $$('[data-theme]', app).forEach(b => b.onclick = () => setPrefs({ theme: b.dataset.theme }));
  $$('[data-mode]', app).forEach(b => b.onclick = () => setPrefs({ mode: b.dataset.mode }));
  $$('[data-sw]', app).forEach(b => b.onclick = () => {
    const k = b.dataset.sw;
    if (k.startsWith('r:')) { const r = rules(); r[k.slice(2)] = !r[k.slice(2)]; Store.updateCouple({ rules: r }); }
    else if (k === 'mediator') Store.saveProfile({ mediator: S.profile.mediator === false });
    else if (k === 'notify') { const on = !prefs.notify; prefs.notifyOff = !on; setPrefs({ notify: on }); if (on && A && A.notificationsAllowed && !A.notificationsAllowed()) askNotify(); }
  });
  const ls = $('#ls', app); if (ls) ls.onchange = e => e.target.value && Store.updateCouple({ cycle: { ...cycle(), lastStart: e.target.value } });
  if ($('#cl', app)) {
    bindStepper('cl', v => Store.updateCouple({ cycle: { ...cycle(), cycleLen: Math.max(21, Math.min(40, v)) } }));
    bindStepper('bl', v => Store.updateCouple({ cycle: { ...cycle(), bleedLen: Math.max(2, Math.min(8, v)) } }));
  }
  bindB(app);
}
