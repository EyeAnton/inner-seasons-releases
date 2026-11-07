/* Старт */
/* ================= старт ================= */
applyTheme();
try { Store.init(); } catch (e) { $('#app').innerHTML = '<p class="pad">Ошибка запуска: ' + esc(e.message) + '</p>'; }
render();
notifyOnStart();
