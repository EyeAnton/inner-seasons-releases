// Push: токен FCM берёт нативная оболочка (Android.fcmToken / window.__onFcmToken), страница кладёт его
// в users/{uid}.fcmTokens. В обычном вебе и WebView без Firebase-ресурсов ничего не делает.
// Пуш партнёру шлёт бесплатный Cloudflare Worker (worker/ в репо; Cloud Functions на Spark не работают):
// после записи страница зовёт pushNotify(kind, id), Worker сам читает документ и шлёт только шаблонную фразу,
// текста записей и сообщений в пуше нет. Нет сети или Worker не настроен — тихо ничего.
const PUSH_URL = 'https://inner-seasons-push.leritosha.workers.dev/notify';
/** kind: message | shared | status; id — ид документа (для status не нужен). Никогда не бросает. */
function pushNotify(kind, id) {
  try {
    if (typeof fb === 'undefined' || !fb || !fb.auth || !fb.auth.currentUser || typeof S === 'undefined' || !S.couple) return;
    if (typeof LOCAL_EMU !== 'undefined' && LOCAL_EMU) return;
    const cid = S.couple.id;
    fb.auth.currentUser.getIdToken()
      .then(t => fetch(PUSH_URL, { method: 'POST', headers: { authorization: 'Bearer ' + t, 'content-type': 'application/json' },
        body: JSON.stringify({ cid, kind, id: id || '' }) }))
      .catch(() => {});
  } catch (e) {}
}
(function () {
  let pushed = '';
  function save(tok) {
    if (!tok || tok === pushed || typeof S === 'undefined' || !S.user || typeof fb === 'undefined' || !fb) return;
    pushed = tok;
    fb.db.doc('users/' + S.user.uid).set({ fcmTokens: firebase.firestore.FieldValue.arrayUnion(tok) }, { merge: true })
      .catch(() => { pushed = ''; });
  }
  window.__onFcmToken = save;
  // вход и токен приходят в любом порядке: проверяем, пока оба не сойдутся
  if (typeof A !== 'undefined' && A && A.fcmToken) {
    setInterval(() => { try { save(A.fcmToken()); } catch (e) {} }, 4000);
  }
})();
