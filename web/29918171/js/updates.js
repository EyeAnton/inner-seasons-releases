/* Обновление по воздуху (мост к Updater.kt) */
/* ================= обновление по воздуху =================
 * Проверяет и качает нативная часть (Updater.kt): интерфейс — тихо, со следующего запуска;
 * APK — ставится, когда приложение свёрнуто. Сюда приходит, только если нужно нажать «Установить». */
function checkUpdate() {
  if (!A || !A.checkUpdates) return toast('Обновления — только в приложении на телефоне');
  toast('Проверяю…'); A.checkUpdates();
}
window.__updateStatus = msg => toast(msg);
window.__updateReady = (name, notes) => {
  if ($('#upd-go')) return;
  sheet(`<div class="ttl"><b>Обновление готово</b><span class="small muted">версия ${esc(name)} · у тебя ${esc(A.appVersion())}</span></div>
    ${notes ? `<p style="font-size:15px;line-height:22px;white-space:pre-line">${esc(notes)}</p>` : ''}
    <p class="small muted">Уже скачано. Android попросит подтвердить установку — дальше обновления будут ставиться сами, когда сворачиваешь приложение. Записи не пропадут.</p>
    <button class="btn" id="upd-go">Установить</button><button class="btn ghost" data-close>Позже</button>`, el => {
    $('#upd-go', el).onclick = () => { closeSheet(); A.installUpdate(); };
  });
};
let readySent = false;
function webReady() { if (!readySent && A && A.webReady) { readySent = true; try { A.webReady(); } catch (e) {} } }
