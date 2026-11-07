/* Экран «Настройки»: сворачиваемые группы (открытая — в sessionStorage is-set-open), внизу «Выйти из аккаунта» */
function viewSettings() {
  const her = role() === 'her', c = cycle(), r = rules(), u = S.user, pn = partnerName();
  const sw = (id, on) => `<button class="sw ${on ? 'on' : ''}" data-sw="${id}" role="switch" aria-checked="${on}"></button>`;
  const lsw = (id, on) => `<button class="sw ${on ? 'on' : ''}" data-lk="${id}" role="switch" aria-checked="${on}"></button>`;
  const rule = (k, t, d) => `<div class="srow"><div class="t"><b>${t}</b><span>${d}</span></div>${sw('r:' + k, r[k])}</div>`;
  const tq = th => th === 'soft' ? ['#EBCFD5', '#D3E6D2', '#F5E3B5', '#F3D3C2'] : ['#7B2D3B', '#3F7A4C', '#E0A33A', '#B0532F'];
  const open = sessionStorage.getItem('is-set-open');
  const grp = (k, icn, title, sub, body) => `<div class="card grp ${open === k ? 'open' : ''}">
    <button class="ghead" data-grp="${k}" aria-expanded="${open === k}"><span class="ico sm">${ic(icn)}</span>
      <span class="gt"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</span>${ic('chev', 'i gch')}</button>
    ${open === k ? `<div class="gbody">${body}</div>` : ''}</div>`;
  const modeName = { light: 'светлая', dark: 'тёмная', system: 'системная' }[prefs.mode];
  const ver = A && A.appVersion ? 'v' + esc(A.appVersion()) + (A.webVersion ? ' · интерфейс ' + A.webVersion() : '') : 'web';
  const nRules = ['onRequest', 'phase', 'reciprocity', 'match', 'delayed', 'partnerChoice'].filter(k => r[k]).length;

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
  if (her) h += grp('rules', 'chat', 'Когда я вижу заметки', nRules ? `правил включено: ${nRules}` : 'сразу', `<p class="small muted">Включённые правила складываются</p>
    ${rule('onRequest', 'По моей кнопке', 'Сама решаю, когда готова прочитать')}
    ${rule('phase', 'В спокойную фазу', 'Открываются весной и летом, не в осень и зиму')}
    ${rule('reciprocity', 'Взаимность', 'Вижу его запись за день, если записала свою')}
    ${rule('match', 'Совпадение', 'Открывается, если наши теги совпали')}
    ${rule('delayed', 'Отложенно', 'Видны через ' + r.delayDays + ' дней — как ретроспектива')}
    ${rule('partnerChoice', 'Решает партнёр', 'Он может отметить «показать сразу»')}`);
  h += grp('lock', 'shield', 'Защита', lockSummary(), lockSettings(lsw));
  h += grp('help', 'bell', 'Помощь и уведомления', `медиатор ${S.profile.mediator !== false ? 'вкл' : 'выкл'} · уведомления ${prefs.notify ? 'вкл' : 'выкл'}`, `<div class="srow"><div class="t"><b>Медиатор</b><span>Мягко подскажет, если запись звучит резко. Работает только на этом телефоне</span></div>${sw('mediator', S.profile.mediator !== false)}</div>
    <div class="srow"><div class="t"><b>Уведомления</b><span>Сезон и врата — раз в день при открытии</span></div>${sw('notify', prefs.notify)}</div>${role() === 'him' && typeof reminderSettingsHTML === 'function' ? reminderSettingsHTML() : ''}`);
  h += grp('data', 'data', 'Данные', 'Firebase, Европа', `<p class="small muted">Хранятся в Firebase (Европа), доступ — только у тебя и партнёра в паре. Согласие дано ${S.profile.consentAt ? fmt(localISO(new Date(S.profile.consentAt))) : '—'}.</p>
    <button class="btn ghost" id="wipe" style="color:var(--accent)">Удалить все мои данные</button>`);
  h += grp('upd', 'up', 'Обновления', ver, `<p class="small muted">Интерфейс обновляется сам, тихо. Новая версия приложения ставится, когда сворачиваешь его.</p><button class="btn ghost" id="upd">Проверить обновления</button>`);
  h += `<button class="outlink" id="out">Выйти из аккаунта</button>
  <p class="small muted" style="text-align:center">Внутренние сезоны · ${ver}</p></div>`;
  return h;
}
