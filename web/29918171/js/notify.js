/* Разрешение на уведомления и напоминание о нём */
/* ================= уведомления ================= */
function askNotify() {
  if (A && A.canAskNotifications && A.canAskNotifications()) A.requestNotifications(); else if (A && A.openNotificationSettings) A.openNotificationSettings();
}
window.__onNotifyPerm = ok => {
  const p = $('#notif-pop'); if (p) p.remove();
  if (ok) { prefs.notifyOff = false; setPrefs({ notify: true }); toast('Уведомления включены'); }
};
/** При запуске: разрешение уже есть — включаем; ещё не спрашивали — спросит шаг онбординга (lock.js, шаг notify);
 * отказался и не выключал сам — плашка-напоминание, когда откроется главный экран (gateB → notifPop). */
function notifyOnStart() {
  if (!A || !A.notificationsAllowed) return;
  if (A.notificationsAllowed()) { if (!prefs.notify && !prefs.notifyOff) setPrefs({ notify: true }); return; }
  if (!stepsDone().notify) return;
  if (prefs.notifyOff) return;   // сам выключил в настройках — не напоминаем
  B.notifPop = true;
}
function notifPop() {
  setTimeout(() => {
    if ($('#notif-pop') || B.locked || $('#app').dataset.b) return;
    const el = document.createElement('div'); el.id = 'notif-pop'; el.className = 'toppop';
    el.innerHTML = `<div class="row" style="align-items:flex-start;gap:10px"><span class="ico sm">${ic('sun')}</span><span style="flex:1"><b>Включить уведомления?</b><br><span class="small muted">Раз в день — какой сезон и когда врата. Без лишнего.</span></span></div>
      <div class="row" style="gap:8px"><button class="btn ghost" id="np-no" style="height:40px">Не сейчас</button><button class="btn" id="np-yes" style="height:40px">Включить</button></div>`;
    document.body.appendChild(el);
    $('#np-no', el).onclick = () => el.remove();
    $('#np-yes', el).onclick = () => { el.remove(); askNotify(); };
  }, 1500);
}

/* ================= уведомление ей: он написал запись, которая ей видна ================= */
/* Приватность: в тексте только имя партнёра и шаблон — ни текста записи, ни тегов, ни настроения.
   В localStorage хранятся лишь id уже показанных записей и номер последнего шаблона. */
const PARTNER_PUSH = [
  '{name}: загляни, что он заметил сегодня про тебя 💛',
  '{name} оставил запись для тебя ✨',
  '{name} думал о тебе — посмотри, что он написал 🌿',
  'Новая запись от {name}. Откроешь, когда будет минутка ☕',
  '{name} кое-что заметил в тебе. Загляни 🔎',
  'Тёплое наблюдение от {name} ждёт тебя 🫶',
  '{name}: у меня для тебя пара слов 🌸',
  'Что {name} увидел в тебе сегодня? Узнай 🌙'
];
function pickPartnerPush(name, prev) {
  let i = Math.floor(Math.random() * PARTNER_PUSH.length);
  if (i === prev) i = (i + 1 + Math.floor(Math.random() * (PARTNER_PUSH.length - 1))) % PARTNER_PUSH.length;
  return { i, text: PARTNER_PUSH[i].replace('{name}', name) };
}
function notifyPartnerNotes() {
  if (role() !== 'her' || !S.couple || !hasPartner()) return;
  const ids = allNotes().filter(n => n.role === 'him' && !n.private && !lockReasons(n).length).map(n => n.id);
  const seen = lsGet('is-pushed-notes', null);
  lsSet('is-pushed-notes', ids);
  if (seen === null) return;   // первый запуск: уже существующие записи не объявляем
  if (!ids.some(id => !seen.includes(id))) return;
  if (!prefs.notify || !A || !A.notify) return;
  const p = pickPartnerPush((partnerName() || 'Он').split(' ')[0], lsGet('is-pushed-tpl', -1));
  lsSet('is-pushed-tpl', p.i);
  A.notify('Внутренние сезоны', p.text);
}
