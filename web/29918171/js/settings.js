/* Экран «Настройки»: сворачиваемые группы (открытая — в sessionStorage is-set-open), внизу «Выйти из аккаунта» */
function viewSettings() {
  const her = role() === 'her', c = cycle(), r = rules(), u = S.user, pn = partnerName();
  const sw = (id, on) => `<button class="sw ${on ? 'on' : ''}" data-sw="${id}" role="switch" aria-checked="${on}"></button>`;
  const lsw = (id, on) => `<button class="sw ${on ? 'on' : ''}" data-lk="${id}" role="switch" aria-checked="${on}"></button>`;
  const vm = visMode(r), VIS_LABEL = { now: 'сразу', delayed: 'через ' + REVEAL_DELAY_DAYS + ' дней', onRequest: 'по моей кнопке' };
  const vmode = (k, t, d) => `<div class="srow"><div class="t"><b>${t}</b><span>${d}</span></div><button class="sw ${vm === k ? 'on' : ''}" data-vmode="${k}" role="radio" aria-checked="${vm === k}" aria-label="${t}"></button></div>`;
  const tq = th => th === 'soft' ? ['#EBCFD5', '#D3E6D2', '#F5E3B5', '#F3D3C2'] : ['#7B2D3B', '#3F7A4C', '#E0A33A', '#B0532F'];
  const open = sessionStorage.getItem('is-set-open');
  const grp = (k, icn, title, sub, body) => `<div class="card grp ${open === k ? 'open' : ''}">
    <button class="ghead" data-grp="${k}" aria-expanded="${open === k}"><span class="ico sm">${ic(icn)}</span>
      <span class="gt"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</span>${ic('chev', 'i gch')}</button>
    ${open === k ? `<div class="gbody">${body}</div>` : ''}</div>`;
  const modeName = { light: 'светлая', dark: 'тёмная', system: 'системная' }[prefs.mode];
  const ver = A && A.appVersion ? 'v' + esc(A.appVersion()) + (A.webVersion ? ' · интерфейс ' + A.webVersion() : '') : 'web';

  let h = `<div class="bar"><h1>Настройки</h1></div><div class="content glist" style="padding-top:4px">`;
  h += grp('acc', 'user', 'Аккаунт', esc(u.name || u.email || ''), `<div class="row">${u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer" style="width:48px;height:48px;border-radius:24px">` : `<span class="av">${esc((u.name || u.email || '?')[0].toUpperCase())}</span>`}
    <span style="flex:1;display:flex;flex-direction:column;min-width:0"><b>${esc(u.name || 'Без имени')}</b><span class="small muted" style="overflow:hidden;text-overflow:ellipsis">${esc(u.email)}</span><span class="small muted">${her ? 'веду свой цикл' : 'партнёр'}${CFG ? ' · данные в облаке' : ' · демо, без облака'}</span></span></div>
    ${!CFG ? '<button class="btn ghost" id="demo-role">Демо: войти за ' + (her ? 'партнёра' : 'неё') + '</button>' : ''}`);
  h += grp('look', 'drop', 'Оформление', (prefs.theme === 'soft' ? 'Нежная' : 'Яркая') + ' · ' + modeName, `<div class="themes">${['soft', 'bright'].map(th => `<button class="tcard ${prefs.theme === th ? 'on' : ''}" data-theme="${th}"><span class="q">${tq(th).map(x => `<i style="background:${x}"></i>`).join('')}</span>${th === 'soft' ? 'Нежная' : 'Яркая'}</button>`).join('')}</div>
    <div class="seg" style="background:var(--field)">${[['light', 'Светлая'], ['dark', 'Тёмная'], ['system', 'Системная']].map(([k, l]) => `<button style="flex:1" class="${prefs.mode === k ? 'on' : ''}" data-mode="${k}">${l}</button>`).join('')}</div>`);
  if (her) h += grp('cyc', 'cal', 'Цикл', `${c.cycleLen} дней · менструация ${c.bleedLen}`, `<label class="cap" for="ls">Первый день последней менструации</label><input class="f" type="date" id="ls" value="${c.lastStart}" max="${today()}">
    <div class="srow"><div class="t"><b>Длина цикла</b><span>дней</span></div>${stepper('cl', c.cycleLen)}</div>
    <div class="srow"><div class="t"><b>Дней менструации</b></div>${stepper('bl', c.bleedLen)}</div>`);
  let pb;
  if (her) {
    if (hasPartner()) pb = `<div class="row"><span class="ico">${ic('heart')}</span><span style="flex:1"><b>${esc(pn || 'Партнёр')}</b><br><span class="small muted">видит подсказки и твои открытые записи</span></span></div><button class="btn ghost" id="unlink">Отвязать партнёра</button>`;
    else pb = `<p class="small muted" style="font-size:14px">Он установит приложение, войдёт своим Google-аккаунтом, выберет «Я партнёр» и введёт код.</p>
      ${S.couple.inviteCode ? `<div style="text-align:center;font-size:30px;font-weight:800;letter-spacing:.2em;padding:6px 0">${esc(S.couple.inviteCode)}</div><button class="btn" id="share">${ic('share')}Отправить код</button><button class="btn link" id="invite">Новый код</button>` : `<button class="btn" id="invite">${ic('link')}Пригласить партнёра</button>`}`;
  } else pb = `<div class="row"><span class="ico">${ic('heart')}</span><span style="flex:1"><b>Вы с ${esc(pn || 'ней')}</b><br><span class="small muted">ты видишь её сезоны и записи, которыми она делится</span></span></div><button class="btn ghost" id="leave">Выйти из пары</button>`;
  h += grp('part', 'heart', 'Партнёр', her ? (hasPartner() ? esc(pn || 'в паре') : 'ещё не приглашён') : (pn ? 'пара · ' + esc(pn) : 'в паре'), pb);
  if (her) h += grp('rules', 'chat', 'Видимость записей партнёра', VIS_LABEL[vm], `<p class="small muted">Выбран один вариант. Решаешь только ты.</p>
    ${vmode('now', 'Видеть сразу', 'Его записи видны тебе, как только он их написал')}
    ${vmode('delayed', 'Видеть через ' + REVEAL_DELAY_DAYS + ' дней', 'Запись открывается через ' + REVEAL_DELAY_DAYS + ' дней после даты записи')}
    ${vmode('onRequest', 'Видеть по моей кнопке', 'Каждая запись закрыта, пока ты не нажмёшь «Открыть» именно на ней')}`);
  if (her) h += grp('share', 'shield', 'Что видит партнёр', 'центры всегда приватно', shareGroupBody());
  h += grp('lock', 'shield', 'Защита', lockSummary(), lockSettings(lsw));
  h += grp('help', 'bell', 'Помощь и уведомления', `медиатор ${S.profile.mediator !== false ? 'вкл' : 'выкл'} · уведомления ${prefs.notify ? 'вкл' : 'выкл'}`, `<div class="srow"><div class="t"><b>Медиатор</b><span>Мягко подскажет, если запись звучит резко. Работает только на этом телефоне</span></div>${sw('mediator', S.profile.mediator !== false)}</div>
    <div class="srow"><div class="t"><b>Уведомления</b><span>Сезон и врата — раз в день при открытии</span></div>${sw('notify', prefs.notify)}</div>${role() === 'him' && typeof reminderSettingsHTML === 'function' ? reminderSettingsHTML() : ''}`);
  h += grp('data', 'data', 'Данные', 'Firebase, Европа', `<p class="small muted">Хранятся в Firebase (Европа), доступ — только у тебя и партнёра в паре. Согласие дано ${S.profile.consentAt ? fmt(localISO(new Date(S.profile.consentAt))) : '—'}.</p>
    <button class="btn ghost" id="backup">Скачать копию данных</button>
    <p class="small muted">Один файл со всеми твоими записями. Центры в нём остаются зашифрованными: без твоей фразы их не прочитать, но они не потеряются.</p>
    <button class="btn ghost" id="wipe" style="color:var(--accent)">Удалить все мои данные</button>`);
  h += grp('upd', 'up', 'Обновления', ver, `<p class="small muted">Интерфейс обновляется сам, тихо. Новая версия приложения ставится, когда сворачиваешь его, или сразу — по кнопке.</p><button class="btn ghost" id="upd">Обновить приложение</button>`);
  h += `<button class="outlink" id="out">Выйти из аккаунта</button>
  <p class="small muted" style="text-align:center">Внутренние сезоны · ${ver}</p></div>`;
  return h;
}

/* ================= «Что видит партнёр»: couples/{cid}/share/{uid} = { items: {notes, tags, status, periodContent, hints} } ================= */
const SHARE_ITEMS = [
  ['notes', 'Записи', 'Текст твоих записей'],
  ['tags', 'Теги записей', 'Какие теги ты ставишь'],
  ['status', 'Ощущение дня', 'Какой сезон ты отметила сегодня'],
  ['periodContent', 'Итоги периода', 'Содержимое итогов сезона и месяца; без этого он увидит только «итоги готовы»'],
  ['hints', 'Подсказки', 'Подсказки для него: что сказать или как помочь']
];
const Share = {
  docs: {},
  start(cid) {
    this.docs = {};
    if (!CFG) return () => {};
    return fb.db.collection('couples/' + cid + '/share').onSnapshot(s => { this.docs = {}; s.docs.forEach(d => this.docs[d.id] = d.data().items || {}); render(); }, () => {});
  },
  mine() { return CFG ? (this.docs[S.user.uid] || {}) : lsGet('is-share', {}); },
  async set(key, on) {
    const items = { notes: false, tags: false, status: false, periodContent: false, hints: false, ...this.mine(), [key]: on };
    if (!CFG) { lsSet('is-share', items); render(); return; }
    this.docs[S.user.uid] = items; render();
    await fb.db.doc('couples/' + S.couple.id + '/share/' + S.user.uid).set({ items, updatedAt: Date.now() });
  }
};
function shareGroupBody() {
  const m = Share.mine(), sw = (k, on) => `<button class="sw ${on ? 'on' : ''}" data-shr="${k}" role="switch" aria-checked="${!!on}"></button>`;
  const cs = Centers.status();
  return `<p class="small muted">По умолчанию партнёр не видит ничего из этого. Включай только то, чем хочешь делиться.</p>
    ${SHARE_ITEMS.map(([k, t, d]) => `<div class="srow"><div class="t"><b>${t}</b><span>${d}</span></div>${sw(k, m[k])}</div>`).join('')}
    <div class="srow"><div class="t"><b>Мысли, чувства, ощущения</b><span>Всегда приватно: шифруются на твоём телефоне, партнёр их не получит ни при каких настройках</span></div><button class="sw" disabled aria-disabled="true" aria-checked="false" role="switch" style="opacity:.4"></button></div>
    <div class="srow"><div class="t"><b>Ключ центров</b><span>${CFG ? (cs === 'ready' ? 'Открыт на этом телефоне.' : cs === 'locked' ? 'Центры закрыты фразой: введи её, чтобы увидеть.' : 'Фраза ещё не задана: центры пока не зашифрованы.') + ' <b>Без фразы центры не восстановить.</b>' : 'В демо центры лежат только на этом устройстве.'}</span></div></div>
    ${CFG && cs === 'locked' ? '<button class="btn" id="cen-unlock">Ввести фразу</button>' : ''}${CFG && cs === 'none' && Centers.wrapLoaded ? '<button class="btn" id="cen-setup">Задать фразу</button>' : ''}
    ${CFG && cs === 'ready' ? '<button class="btn ghost" id="cen-forget">Закрыть центры на этом телефоне</button>' : ''}`;
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-shr]');
  if (b) { Share.set(b.dataset.shr, !Share.mine()[b.dataset.shr]).catch(err => toast('Не сохранилось: ' + (err.code || err.message))); return; }
  const id = e.target.closest && e.target.closest('#cen-unlock, #cen-setup, #cen-forget');
  if (!id) return;
  if (id.id === 'cen-forget') Centers.forgetDevice(); else Centers.prompt();
});

/* ================= Копия данных: один JSON-файл, центры только в зашифрованном виде (iv, ct), фразы и открытого ключа нет ================= */
const Backup = {
  /** собирает всё, что лежит в облаке у этого пользователя; чужие записи берём только те, что правила разрешают читать */
  async collect() {
    const out = { version: 1, exportedAt: new Date().toISOString(), couple: null, notes: [], shared: [], shared_tags: [], status: {}, share: {}, reveals: [], periods: [], centers: [] };
    if (!CFG || !S.user) { out.shared = S.shared.map(n => ({ ...n })); return out; }
    const me = S.user.uid, got = async q => { try { return (await q.get()).docs.map(d => ({ id: d.id, ...d.data() })); } catch (e) { return []; } };
    const one = async r => { try { const d = await r.get(); return d.exists ? d.data() : null; } catch (e) { return null; } };
    const c = S.couple;
    if (c) {
      const base = 'couples/' + c.id, col = n => fb.db.collection(base + '/' + n);
      const { inviteCode, ...cp } = c; out.couple = cp;
      out.notes = await got(col('notes'));
      out.shared = await got(col('shared').where('author', '==', me));
      out.shared_tags = await got(col('shared_tags').where('author', '==', me));
      out.status = (await one(fb.db.doc(base + '/status/' + me))) || {};
      out.share = (await one(fb.db.doc(base + '/share/' + me))) || {};
      out.reveals = await got(col('reveals'));
      out.periods = await got(fb.db.collection(base + '/private/' + me + '/periods'));
      out.centers = (await got(fb.db.collection(base + '/private/' + me + '/centers'))).map(d => ({ id: d.id, iv: d.iv, ct: d.ct }));
      const pv = (await one(fb.db.doc(base + '/private/' + me))) || {};
      out.private = { keyWrap: pv.keyWrap || null, migratedAt: pv.migratedAt || null };
    }
    out.private_notes = await got(fb.db.collection('users/' + me + '/private'));
    return out;
  },
  save(name, text) {
    if (A && A.saveFile) { A.saveFile(name, text); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  },
  async run() {
    try {
      toast('Собираю копию…');
      const data = await this.collect(), name = 'inner-seasons-' + localISO(new Date()) + '.json';
      this.save(name, JSON.stringify(data, null, 2));
      toast('Копия сохранена: ' + name);
    } catch (e) { toast('Не получилось: ' + (e.code || e.message)); }
  }
};
