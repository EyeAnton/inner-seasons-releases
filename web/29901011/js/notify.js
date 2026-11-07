/* Разрешение на уведомления и напоминание о нём */
/* ================= уведомления ================= */
function askNotify() {
  if (A && A.canAskNotifications && A.canAskNotifications()) A.requestNotifications(); else if (A && A.openNotificationSettings) A.openNotificationSettings();
}
window.__onNotifyPerm = ok => {
  const p = $('#notif-pop'); if (p) p.remove();
  if (ok) { prefs.notifyOff = false; setPrefs({ notify: true }); toast('Уведомления включены'); }
};
function notifyOnStart() {
  if (!A || !A.notificationsAllowed) return;
  if (A.notificationsAllowed()) { if (!prefs.notify && !prefs.notifyOff) setPrefs({ notify: true }); return; }
  if (!lsGet('is-notif-asked', false)) { lsSet('is-notif-asked', true); setPrefs({ notify: true }); A.requestNotifications(); return; }
  if (prefs.notifyOff) return;   // сам выключил в настройках — не напоминаем
  setTimeout(() => {
    if ($('#notif-pop')) return;
    const el = document.createElement('div'); el.id = 'notif-pop'; el.className = 'toppop';
    el.innerHTML = `<div class="row" style="align-items:flex-start;gap:10px"><span class="ico sm">${ic('sun')}</span><span style="flex:1"><b>Включить уведомления?</b><br><span class="small muted">Раз в день — какой сезон и когда врата. Без лишнего.</span></span></div>
      <div class="row" style="gap:8px"><button class="btn ghost" id="np-no" style="height:40px">Не сейчас</button><button class="btn" id="np-yes" style="height:40px">Включить</button></div>`;
    document.body.appendChild(el);
    $('#np-no', el).onclick = () => el.remove();
    $('#np-yes', el).onclick = () => { el.remove(); askNotify(); };
  }, 1500);
}
