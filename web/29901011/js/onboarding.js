/* Вход, согласие, роль, настройка цикла, код приглашения */
function wheel() {
  return `<svg width="220" height="220" viewBox="0 0 248 248" aria-hidden="true" style="align-self:center;position:relative">
    <path d="M124 124 L124 8 A116 116 0 0 1 240 124 Z" fill="#E7AAB7"/><path d="M124 124 L240 124 A116 116 0 0 1 124 240 Z" fill="#ACD3AB"/>
    <path d="M124 124 L124 240 A116 116 0 0 1 8 124 Z" fill="#EDCE8A"/><path d="M124 124 L8 124 A116 116 0 0 1 124 8 Z" fill="#EDB496"/>
    <circle cx="124" cy="124" r="52" fill="#17141A"/><path d="M124 8 V240 M8 124 H240" stroke="#17141A" stroke-width="6"/>
    <text x="166" y="78" font-size="14" font-weight="700" fill="#2A1A1F" font-family="Open Sans,sans-serif">Зима</text>
    <text x="160" y="182" font-size="14" font-weight="700" fill="#2A1A1F" font-family="Open Sans,sans-serif">Весна</text>
    <text x="48" y="182" font-size="14" font-weight="700" fill="#2A1A1F" font-family="Open Sans,sans-serif">Лето</text>
    <text x="42" y="78" font-size="14" font-weight="700" fill="#2A1A1F" font-family="Open Sans,sans-serif">Осень</text></svg>`;
}

function renderLogin(app, consentOnly) {
  if (A && A.setBars) try { A.setBars('#17141A', true); } catch (e) {}
  app.innerHTML = `<div class="login"><div class="glow"></div>${wheel()}
    <div style="position:relative;display:flex;flex-direction:column;gap:12px">
      <h1 style="font-size:30px;line-height:1.1;font-weight:800">Внутренние сезоны</h1>
      <p style="color:#D9D0D3">Цикл — это четыре сезона. Приложение подскажет, что тебе нужно сегодня, а партнёру — как поддержать.</p>
    </div>
    <div style="position:relative;margin-top:auto;display:flex;flex-direction:column;gap:14px">
      <button class="consent" id="cons"><span class="box ${UI.consent ? 'on' : ''}">${UI.consent ? ic('check') : ''}</span>
        <span>Согласна(ен), что записи о цикле и самочувствии хранятся в облаке Google Firebase (Европа). Доступ есть только у меня и у партнёра, которого я приглашу. Удалить всё можно в настройках.</span></button>
      <button class="btn gbtn" id="go" ${UI.consent && !UI.busy ? '' : 'disabled'}>${GOOGLE}${consentOnly ? 'Продолжить' : (UI.busy ? 'Входим…' : 'Войти через Google')}</button>
      ${!CFG ? '<p class="small" style="text-align:center;color:#A99EA1">Демо-режим: без облака, данные только в этом браузере</p>' : ''}
      ${consentOnly ? '<button class="btn link" id="out" style="color:#E8B4C1">Выйти из аккаунта</button>' : ''}
    </div></div>`;
  $('#cons').onclick = () => { UI.consent = !UI.consent; render(); };
  $('#go').onclick = () => {
    if (!UI.consent) return;
    if (consentOnly) Store.saveProfile({ consentAt: Date.now(), name: S.user.name, email: S.user.email });
    else Store.signIn();
  };
  const o = $('#out'); if (o) o.onclick = () => Store.signOut();
}

function renderRole(app) {
  app.innerHTML = `<div class="screen pad" style="gap:16px;padding-top:40px">
    <h1 style="font-size:26px;line-height:1.15;font-weight:800">Привет${S.user.name ? ', ' + esc(S.user.name.split(' ')[0]) : ''}!</h1>
    <p class="muted">Кем ты будешь в приложении?</p>
    <button class="card tap" id="r-her" style="border:0;text-align:left;color:var(--text)"><div class="row"><span class="ico" style="background:var(--w);color:var(--wA)">${ic('moon')}</span>
      <span style="display:flex;flex-direction:column"><b>Я веду свой цикл</b><span class="small muted">Календарь сезонов, записи, подсказки. Партнёра можно пригласить потом.</span></span></div></button>
    <button class="card tap" id="r-him" style="border:0;text-align:left;color:var(--text)"><div class="row"><span class="ico" style="background:var(--s);color:var(--sA)">${ic('heart')}</span>
      <span style="display:flex;flex-direction:column"><b>Я партнёр</b><span class="small muted">Нужен код приглашения от неё — он в её настройках.</span></span></div></button>
    <button class="btn link" id="out">Выйти из аккаунта</button></div>`;
  $('#r-her').onclick = () => Store.saveProfile({ role: 'her' });
  $('#r-him').onclick = () => Store.saveProfile({ role: 'him' });
  $('#out').onclick = () => Store.signOut();
}

function renderSetup(app) {
  const c = UI.setup = UI.setup || { ...DEFAULT_CYCLE };
  app.innerHTML = `<div class="screen pad" style="gap:16px;padding-top:40px">
    <h1 style="font-size:26px;line-height:1.15;font-weight:800">Твой цикл</h1>
    <p class="muted">По этим данным считаются сезоны и врата. Поменять можно в любой момент.</p>
    <div class="card">
      <label class="cap" for="ls">Первый день последней менструации</label><input class="f" type="date" id="ls" value="${c.lastStart}" max="${today()}">
      <div class="srow"><div class="t"><b>Длина цикла</b><span>обычно 21–35 дней</span></div>${stepper('cl', c.cycleLen)}</div>
      <div class="srow"><div class="t"><b>Дней менструации</b><span>обычно 3–7</span></div>${stepper('bl', c.bleedLen)}</div>
    </div>
    <button class="btn" id="save">Готово</button>
    <button class="btn link" id="back">Назад</button></div>`;
  $('#ls').onchange = e => c.lastStart = e.target.value || c.lastStart;
  bindStepper('cl', v => { c.cycleLen = Math.max(21, Math.min(40, v)); render(); });
  bindStepper('bl', v => { c.bleedLen = Math.max(2, Math.min(8, v)); render(); });
  $('#save').onclick = async () => { $('#save').disabled = true; try { await Store.createCouple({ lastStart: c.lastStart, cycleLen: c.cycleLen, bleedLen: c.bleedLen }); } catch (e) { toast('Не сохранилось: ' + e.message); $('#save').disabled = false; } };
  $('#back').onclick = () => Store.saveProfile({ role: null });
}
const stepper = (id, v) => `<div class="stepper"><button class="icon-btn" data-st="${id}" data-d="-1" aria-label="Меньше">−</button><b id="${id}">${v}</b><button class="icon-btn" data-st="${id}" data-d="1" aria-label="Больше">+</button></div>`;
function bindStepper(id, cb) { $$(`[data-st="${id}"]`).forEach(b => b.onclick = () => cb(+$('#' + id).textContent + +b.dataset.d)); }

/** Достаёт код приглашения из любого текста: «Код для …: K7M2QX» → K7M2QX (без I, O, 0, 1). */
function pickCode(s) { const m = String(s).toUpperCase().match(/(?:^|[^A-Z0-9])([A-HJ-NP-Z2-9]{6})(?![A-Z0-9])/); return m ? m[1] : null; }
function renderJoin(app) {
  app.innerHTML = `<div class="screen pad" style="gap:16px;padding-top:40px">
    <h1 style="font-size:26px;line-height:1.15;font-weight:800">Код приглашения</h1>
    <p class="muted">Попроси её открыть «Настройки → Партнёр → Пригласить» и прислать код из 6 символов.</p>
    <input class="f" id="code" placeholder="Например, K7M2QX" autocapitalize="characters" style="font-size:22px;letter-spacing:.2em;text-transform:uppercase;text-align:center;height:60px">
    <button class="btn" id="join">Присоединиться</button>
    <button class="btn link" id="back">Назад</button></div>`;
  const inp = $('#code');
  inp.oninput = () => { const c = pickCode(inp.value); if (c && c !== inp.value) inp.value = c; };
  $('#join').onclick = async () => {
    const code = pickCode($('#code').value) || ''; if (code.length < 6) return toast('Нужно 6 символов кода');
    $('#join').disabled = true;
    try { await Store.join(code); } catch (e) { toast(e.message === 'Код не найден' ? 'Код не найден — проверь его' : 'Не получилось: ' + (e.code || e.message)); $('#join').disabled = false; }
  };
  $('#back').onclick = () => Store.saveProfile({ role: null });
}
