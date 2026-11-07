/* Напоминание партнёру «Как прошёл день?»: шаг онбординга, строка настроек, открытие записи из уведомления.
   Время хранит нативная часть (Reminder.kt, A.setReminder / A.getReminder); в браузере — localStorage для вида. */
/* ================= напоминание ================= */
const REMINDER_DEFAULT = { on: false, hour: 21, minute: 0, set: false };
const reminderNative = () => !!(A && A.setReminder && A.getReminder);
function reminderGet() {
  if (reminderNative()) try { return Object.assign({}, REMINDER_DEFAULT, JSON.parse(A.getReminder())); } catch (e) {}
  return Object.assign({}, REMINDER_DEFAULT, lsGet('is-reminder', {}));
}
function reminderSet(on, hour, minute) {
  const r = reminderGet(); hour = hour ?? r.hour; minute = minute ?? r.minute;
  if (reminderNative()) try { A.setReminder(hour, minute, !!on); } catch (e) {}
  lsSet('is-reminder', { on: !!on, hour, minute, set: true });
  // без разрешения на уведомления напоминание не покажется — спросим
  if (on && A && A.notificationsAllowed && !A.notificationsAllowed() && typeof askNotify === 'function') askNotify();
}
const reminderTime = r => `${pad(r.hour)}:${pad(r.minute)}`;
const parseTime = v => { const m = /^(\d{1,2}):(\d{2})/.exec(v || ''); return m ? [Math.min(23, +m[1]), Math.min(59, +m[2])] : null; };

/** Шаг онбординга для него: выбрать время или «Не сейчас». Рисует экран в app, по завершении — done(). */
function reminderStep(app, done) {
  const r = reminderGet();
  app.innerHTML = `<div class="screen pad" style="gap:16px;padding-top:40px">
    <h1 style="font-size:26px;line-height:1.15;font-weight:800">Когда напомнить написать?</h1>
    <p class="muted">Раз в день в это время придёт уведомление: пара слов о том, как прошёл день и какой ты её сегодня увидел. Нажмёшь — сразу откроется запись.</p>
    <div class="card"><label class="cap" for="rem-step-time">Время напоминания</label>
      <input class="f rem-big" type="time" id="rem-step-time" value="${reminderTime(r)}"></div>
    <button class="btn" id="rem-step-on">${ic('check')}Напоминать в <span id="rem-step-lbl">${reminderTime(r)}</span></button>
    <button class="btn link" id="rem-step-skip">Не сейчас</button>
    <p class="small muted" style="text-align:center">Время можно поменять или выключить в настройках</p></div>`;
  const inp = $('#rem-step-time', app);
  inp.oninput = inp.onchange = () => { const t = parseTime(inp.value); if (t) $('#rem-step-lbl', app).textContent = `${pad(t[0])}:${pad(t[1])}`; };
  $('#rem-step-on', app).onclick = () => { const t = parseTime(inp.value) || [21, 0]; reminderSet(true, t[0], t[1]); toast('Напомню в ' + `${pad(t[0])}:${pad(t[1])}`); done(); };
  $('#rem-step-skip', app).onclick = () => done();
}

/** Строка для настроек (группа «Уведомления»): переключатель + время. После вставки в DOM — bindReminder(root). */
function reminderSettingsHTML() {
  const r = reminderGet();
  return `<div class="srow" id="rem-row"><div class="t"><b>Когда напомнить написать?</b><span>Каждый день — «Как прошёл день?»</span></div>
    <span class="rem-ctl"><input class="f rem-time" type="time" id="rem-time" value="${reminderTime(r)}" ${r.on ? '' : 'disabled'} aria-label="Время напоминания">
    <button class="sw ${r.on ? 'on' : ''}" id="rem-sw" role="switch" aria-checked="${r.on}" aria-label="Напоминание"></button></span></div>`;
}
function bindReminder(root = document) {
  const sw = $('#rem-sw', root), inp = $('#rem-time', root); if (!sw || !inp) return;
  sw.onclick = () => {
    const on = !reminderGet().on, t = parseTime(inp.value) || [21, 0];
    reminderSet(on, t[0], t[1]);
    sw.classList.toggle('on', on); sw.setAttribute('aria-checked', on); inp.disabled = !on;
    toast(on ? 'Напомню в ' + `${pad(t[0])}:${pad(t[1])}` : 'Напоминание выключено');
  };
  inp.onchange = () => { const t = parseTime(inp.value); if (t && reminderGet().on) { reminderSet(true, t[0], t[1]); toast('Напомню в ' + `${pad(t[0])}:${pad(t[1])}`); } };
}

/* Открытие шторки записи за сегодня из уведомления: ждём, пока приложение дойдёт до главного экрана
   (данные загружены, есть нижние вкладки — значит, вход/PIN пройдены), и только тогда открываем. */
let openTodayT = null;
window.__openEntryToday = () => {
  clearTimeout(openTodayT);
  const t0 = Date.now();
  const tryOpen = () => {
    const ready = S.couple && role() && $('#app .tabs');
    if (ready) return openEntry(today());
    if (Date.now() - t0 < 60000) openTodayT = setTimeout(tryOpen, 300);
  };
  tryOpen();
};
// холодный старт из уведомления: нативная часть хранит флаг, забираем один раз
if (A && A.takeOpenEntry) try { if (A.takeOpenEntry()) setTimeout(() => window.__openEntryToday(), 0); } catch (e) {}
