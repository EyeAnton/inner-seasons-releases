/* Блок B: экран блокировки (PIN / биометрия), шаги онбординга «уведомления» и «защита», bindB для настроек.
 * Нативная часть — Lock.kt (window.Android.lockStatus/setPin/checkPin/clearPin/biometricAvailable/authBiometric/setBiometric).
 * PIN хранится только в нативной части (соль + PBKDF2). В браузере без window.Android — демо-заглушка в localStorage. */
Object.assign(I, {
  finger: '<path d="M12 10a2 2 0 0 0-2 2c0 1-.1 2.5-.26 4M14 13.1c0 2.4 0 6.4-1 8.9M17.3 21c.1-.6.4-2.3.5-3M2 12a10 10 0 0 1 18-6M21.8 16c.2-2 .1-5.4 0-6M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .3-2M8.6 22c.2-.7.5-1.3.6-2M9 6.8a6 6 0 0 1 9 5.2v2"/>',
  del: '<path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  data: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>',
  drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>'
});

/* ---- доступ к защите: нативный мост, демо-заглушка или null (старая оболочка без Lock.kt) ---- */
const LockApi = (() => {
  const off = { pin: false, bio: false, bioAvail: false, wait: 0 };
  if (A && A.lockStatus) return {
    status: () => { try { return JSON.parse(A.lockStatus()); } catch (e) { return off; } },
    setPin: p => A.setPin(p),
    check: p => { try { return JSON.parse(A.checkPin(p)); } catch (e) { return { ok: false, left: 0, wait: 0 }; } },
    clear: () => A.clearPin(),
    bioAvail: () => A.biometricAvailable(),
    bio: () => A.authBiometric(),
    setBio: on => A.setBiometric(on)
  };
  if (A) return null;
  // демо в браузере: только чтобы смотреть экраны; хэш не криптостойкий, настоящий PIN — в Lock.kt
  const K = 'is-lock-demo', g = () => lsGet(K, {}) || {}, s = d => lsSet(K, d);
  const h = (p, salt) => { let x = 2166136261; for (const c of salt + p) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0; return x.toString(16); };
  const wait = d => Math.max(0, Math.ceil(((d.until || 0) - Date.now()) / 1000));
  return {
    status: () => { const d = g(); return { pin: !!d.hash, bio: !!d.hash && !!d.bio, bioAvail: d.bioAvail !== false, wait: wait(d) }; },
    setPin: p => { const salt = rid(8); s({ ...g(), salt, hash: h(p, salt), fails: 0, until: 0 }); return true; },
    check: p => {
      const d = g(), w = wait(d);
      if (w) return { ok: false, left: 0, wait: w };
      if (!d.hash || h(p, d.salt) === d.hash) { d.fails = 0; s(d); return { ok: true, left: 5, wait: 0 }; }
      d.fails = (d.fails || 0) + 1;
      if (d.fails >= 5) { d.fails = 0; d.until = Date.now() + 30000; s(d); return { ok: false, left: 0, wait: 30 }; }
      s(d); return { ok: false, left: 5 - d.fails, wait: 0 };
    },
    clear: () => s({ bioAvail: g().bioAvail }),
    bioAvail: () => g().bioAvail !== false,
    bio: () => setTimeout(() => window.__onBiometric(!g().bioDeny, g().bioDeny ? 'cancel' : null), 300),
    setBio: on => s({ ...g(), bio: on })
  };
})();

/* ---- состояние ---- */
const B = { locked: !!(LockApi && LockApi.status().pin), bioCb: null, timer: null, notifPop: false };
window.__lock = () => {
  if (B.locked || !LockApi || !LockApi.status().pin || !S.user) return;
  B.locked = true; closeSheet(); const p = $('#notif-pop'); if (p) p.remove();
  render();
};
window.__onBiometric = (ok, err) => { const cb = B.bioCb; B.bioCb = null; if (cb) cb(ok, err); };
function askBio(cb) { B.bioCb = cb; LockApi.bio(); }

/** Вызов в начале render(): экран блокировки или шаг онбординга. true — экран уже нарисован. */
function gateB(app) {
  const mark = app.dataset.b;
  const show = (k, draw) => { if (mark !== k) { app.dataset.b = k; draw(); typo(app); window.scrollTo(0, 0); } return true; };
  if (B.locked && S.authReady) {
    if (S.user) return show('lock', () => drawLock(app));
    B.locked = false;   // вышли из аккаунта — блокировать нечего
  }
  if (S.authReady && !S.user && LockApi && LockApi.status().pin) resetLock();   // вышли любым путём (в т. ч. «Удалить данные») — PIN сбрасывается
  const k = S.authReady && S.user && !S.loading && S.profile && S.profile.consentAt && S.profile.role && S.profile.coupleId && S.couple ? pendingStep() : null;
  if (k) return show('step:' + k, () => drawStep(app, k));
  delete app.dataset.b;
  if (B.notifPop && S.couple && !B.locked) { B.notifPop = false; notifPop(); }
  return false;
}

/* ================= экран блокировки ================= */
function greeting() {
  const h = new Date().getHours();
  const w = h >= 5 && h < 12 ? 'Доброе утро' : h >= 12 && h < 17 ? 'Добрый день' : h >= 17 && h < 23 ? 'Добрый вечер' : 'Доброй ночи';
  const n = String((S.user && S.user.name) || '').trim().split(/\s+/)[0];
  return w + (n ? ', ' + n : '');
}
const pdots = () => `<div class="pdots">${[0, 1, 2, 3].map(() => '<i></i>').join('')}</div>`;
const keypad = bio => `<div class="kpad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'].map(k =>
  k === 'bio' ? (bio ? `<button class="key fn" data-k="bio" aria-label="Войти по отпечатку">${ic('finger')}</button>` : '<span></span>')
  : k === 'del' ? `<button class="key fn" data-k="del" aria-label="Стереть">${ic('del')}</button>`
  : `<button class="key" data-k="${k}">${k}</button>`).join('')}</div>`;
/** Цифровая клавиатура: набрали 4 цифры — onFull(pin). Возвращает fail(msg) — встряхнуть точки и очистить. */
function pinPad(root, msgEl, onFull, onBio) {
  let v = '', busy = false;
  const paint = () => $$('.pdots i', root).forEach((d, i) => d.classList.toggle('on', i < v.length));
  $$('[data-k]', root).forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (k === 'bio') return onBio && onBio();
    if (busy || $('.kpad', root).classList.contains('off')) return;
    $('.pdots', root).classList.remove('err');
    if (k === 'del') v = v.slice(0, -1); else if (v.length < 4) v += k;
    paint();
    if (v.length === 4) { busy = true; setTimeout(() => { const x = v; v = ''; busy = false; onFull(x); paint(); }, 90); }
  });
  return msg => {
    const d = $('.pdots', root); d.classList.remove('err'); void d.offsetWidth; d.classList.add('err');
    if (msgEl && msg != null) { msgEl.textContent = msg; msgEl.classList.add('err'); }
    if (A && A.vibrate) try { A.vibrate(60); } catch (e) {}
  };
}

function drawLock(app) {
  const st = LockApi.status(), bio = st.bio && st.bioAvail;
  app.innerHTML = `<div class="lockscr"><div class="lk-top"><span class="ico">${ic('lock')}</span>
    <h1>${esc(greeting())}</h1><p class="muted lk-msg" id="lk-msg">Введи PIN-код</p>${pdots()}</div>
    ${keypad(bio)}<button class="btn link" id="lk-forgot">Забыли PIN?</button></div>`;
  const msg = $('#lk-msg', app), kp = $('.kpad', app);
  const pause = w => {
    clearInterval(B.timer); kp.classList.add('off');
    const tick = () => { if (w <= 0) { clearInterval(B.timer); kp.classList.remove('off'); msg.classList.remove('err'); msg.textContent = 'Введи PIN-код'; return; } msg.classList.add('err'); msg.textContent = `Много неверных попыток. Подожди ${w} с`; w--; };
    tick(); B.timer = setInterval(tick, 1000);
  };
  const unlock = () => { clearInterval(B.timer); B.locked = false; delete app.dataset.b; render(); };
  const bioGo = () => askBio((ok, err) => { if (ok) unlock(); else if (err && err !== 'cancel' && err !== 'pin') { msg.textContent = err; } });
  const fail = pinPad(app, msg, pin => {
    const r = LockApi.check(pin);
    if (r.ok) return unlock();
    if (r.wait) { fail(null); return pause(r.wait); }
    fail(`Неверный PIN. ${r.left === 1 ? 'Осталась 1 попытка' : `Осталось попыток: ${r.left}`}`);
  }, bioGo);
  if (st.wait) pause(st.wait);
  else if (bio) setTimeout(bioGo, 250);
  $('#lk-forgot', app).onclick = () => confirmSheet('Забыли PIN?', 'Выйди из аккаунта и войди заново — PIN сбросится. Записи останутся в облаке.', 'Выйти и войти заново', signOutB);
}
/** Выход из аккаунта: PIN этого телефона тоже сбрасывается — следующий вход предложит защиту заново. */
function signOutB() { resetLock(); return Store.signOut(); }
function resetLock() {
  if (LockApi) LockApi.clear();
  const d = stepsDone(); delete d.lock; lsSet(STEPS_K, d);
  B.locked = false; clearInterval(B.timer);
}

/* ================= ввод нового / текущего PIN ================= */
/** mode: 'set' — придумать и повторить; 'change' — текущий, новый, повтор; 'verify' — только текущий. */
function pinFlow(root, mode, onDone, onCancel, cancelText) {
  const stages = mode === 'set' ? ['new', 'rep'] : mode === 'change' ? ['old', 'new', 'rep'] : ['old'];
  const T = { old: 'Введи текущий PIN', new: 'Придумай PIN из 4 цифр', rep: 'Повтори PIN' };
  let i = 0, first = '';
  const draw = (note, err) => {
    root.innerHTML = `<div class="pinbox"><b class="pt">${T[stages[i]]}</b><p class="small muted pm ${err ? 'err' : ''}">${esc(note || (stages[i] === 'new' ? 'Его будешь вводить при каждом открытии' : ' '))}</p>
      ${pdots()}${keypad(false)}${onCancel ? `<button class="btn link" data-pc>${cancelText || 'Отмена'}</button>` : ''}</div>`;
    const c = $('[data-pc]', root); if (c) c.onclick = onCancel;
    const fail = pinPad(root, $('.pm', root), pin => {
      const s = stages[i];
      if (s === 'old') { const r = LockApi.check(pin); if (!r.ok) return fail(r.wait ? `Много неверных попыток. Подожди ${r.wait} с` : `Неверный PIN. Осталось попыток: ${r.left}`); }
      if (s === 'new') first = pin;
      if (s === 'rep' && pin !== first) { i = stages.indexOf('new'); draw('PIN не совпал — придумай ещё раз', true); $('.pdots', root).classList.add('err'); return; }
      if (++i < stages.length) return draw();
      if (stages.includes('new')) LockApi.setPin(first);
      onDone();
    });
  };
  draw();
}
function pinSheet(mode, onDone) {
  sheet('<div class="pinsheet"></div>', el => pinFlow($('.pinsheet', el), mode, () => { closeSheet(); onDone(); }, closeSheet));
}

/* ================= шаги онбординга после основной настройки =================
 * Пройденные/пропущенные шаги — в localStorage (is-steps): у существующих пользователей после обновления
 * один раз покажутся только новые шаги. Уведомления и защита — свойства этого телефона, поэтому не в профиле.
 * Шаг «время напоминания» (для партнёра) делает web/js/reminder.js: reminderStep(app, done) рисует экран в app
 * и вызывает done(), когда время выбрано или нажато «Не сейчас». Пока функции нет — шаг пропускается. */
const STEPS_K = 'is-steps';
const stepsDone = () => lsGet(STEPS_K, {}) || {};
function stepDone(k) { lsSet(STEPS_K, { ...stepsDone(), [k]: Date.now() }); }
function stepList() {
  const l = [];
  if (!A || A.notificationsAllowed) l.push('notify');
  if (LockApi) l.push('lock');
  if (role() === 'him' && typeof reminderStep === 'function') l.push('remind');
  return l;
}
function pendingStep() {
  const d = stepsDone();
  if (!d.notify && A && A.notificationsAllowed && A.notificationsAllowed()) { stepDone('notify'); d.notify = 1; }
  if (!d.lock && LockApi && LockApi.status().pin) { stepDone('lock'); d.lock = 1; }
  return stepList().find(k => !d[k]) || null;
}
function drawStep(app, k) {
  const next = () => { stepDone(k); delete app.dataset.b; render(); };
  if (k === 'remind') return reminderStep(app, next);
  const her = role() === 'her', list = stepList(), d = stepsDone();
  const dots = list.length > 1 ? `<div class="sdots">${list.map(x => `<i class="${x === k ? 'cur' : d[x] ? 'on' : ''}"></i>`).join('')}</div>` : '';
  const wrap = (icn, title, text, yes) => `<div class="screen pad bstep">${dots}<span class="bico">${ic(icn)}</span>
    <h1>${title}</h1><p class="muted">${text}</p><div class="bact"><button class="btn" id="st-yes">${yes}</button>
    <button class="btn link" id="st-no">Не сейчас</button><p class="small muted">Поменять можно в Настройках</p></div></div>`;
  if (k === 'notify') {
    app.innerHTML = wrap('bell', 'Уведомления', her ? 'Раз в день — какой у тебя сезон и когда врата. Без лишнего.' : 'Раз в день — какой у неё сезон и как поддержать. Без лишнего.', 'Включить');
    $('#st-yes', app).onclick = () => {
      lsSet('is-notif-asked', true); prefs.notifyOff = false; stepDone('notify');
      if (A) askNotify(); else return setPrefs({ notify: true });   // ответ системы придёт в __onNotifyPerm
      delete app.dataset.b; render();
    };
    $('#st-no', app).onclick = next;
  } else if (k === 'lock') {
    app.innerHTML = wrap('shield', 'Защита входа', 'PIN-код из 4 цифр при каждом открытии приложения — записи увидишь только ты.' + (LockApi.bioAvail() ? ' Можно входить и по отпечатку.' : ''), 'Придумать PIN');
    $('#st-no', app).onclick = next;
    $('#st-yes', app).onclick = () => {
      app.innerHTML = `<div class="screen pad bstep pinstep">${dots}<div class="pinhost"></div></div>`;
      pinFlow($('.pinhost', app), 'set', () => {
        if (!LockApi.bioAvail()) { toast('PIN включён'); return next(); }
        app.innerHTML = wrap('finger', 'Входить по отпечатку?', 'Отпечаток или лицо вместо PIN — если не получится, PIN всегда под рукой.', 'Включить');
        $('#st-no', app).textContent = 'Только PIN';
        $('#st-no', app).onclick = () => { toast('PIN включён'); next(); };
        $('#st-yes', app).onclick = () => askBio(ok => { if (ok) { LockApi.setBio(true); toast('Защита включена'); next(); } });
        typo(app);
      }, next, 'Не сейчас');
    };
  }
}

/* ================= настройки: группы и защита ================= */
function bindB(app) {
  if (typeof bindReminder === 'function' && $('#rem-row', app)) bindReminder(app);   // строка напоминания в настройках (reminder.js)
  $$('[data-grp]', app).forEach(b => b.onclick = () => {
    const k = b.dataset.grp, cur = sessionStorage.getItem('is-set-open');
    if (cur === k) sessionStorage.removeItem('is-set-open'); else sessionStorage.setItem('is-set-open', k);
    render();
  });
  const out = $('#out', app);
  if (out) out.onclick = () => confirmSheet('Выйти из аккаунта?', 'Данные останутся в облаке — войдёшь снова и всё увидишь.' + (LockApi && LockApi.status().pin ? ' PIN на этом телефоне сбросится.' : ''), 'Выйти', signOutB);
  $$('[data-lk]', app).forEach(b => b.onclick = () => {
    const st = LockApi.status(), k = b.dataset.lk;
    if (k === 'pin' && st.pin) pinSheet('verify', () => { LockApi.clear(); toast('PIN выключен'); render(); });
    else if (k === 'pin') pinSheet('set', () => { toast('PIN включён'); render(); });
    else if (k === 'change') pinSheet('change', () => toast('PIN изменён'));
    else if (k === 'bio' && st.bio) { LockApi.setBio(false); render(); }
    else if (k === 'bio') askBio(ok => { if (ok) { LockApi.setBio(true); toast('Вход по отпечатку включён'); } render(); });
  });
}
/** Тело группы «Защита» для настроек. */
function lockSettings(sw) {
  if (!LockApi) return '<p class="small muted">Нужна новая версия приложения — загляни в «Обновления».</p>';
  const st = LockApi.status();
  let h = `<div class="srow"><div class="t"><b>PIN-код</b><span>При открытии и после минуты в фоне</span></div>${sw('pin', st.pin)}</div>`;
  if (st.pin) h += st.bioAvail ? `<div class="srow"><div class="t"><b>Отпечаток или лицо</b><span>Вместо PIN, если телефон умеет</span></div>${sw('bio', st.bio)}</div>`
    : '<p class="small muted">Отпечаток или лицо — нет на этом телефоне (или не настроены в Android).</p>';
  if (st.pin) h += '<button class="btn ghost" data-lk="change">Сменить PIN</button>';
  return h;
}
const lockSummary = () => { if (!LockApi) return 'нужна новая версия'; const s = LockApi.status(); return s.pin ? (s.bio && s.bioAvail ? 'PIN и отпечаток' : 'PIN-код') : 'выключена'; };
