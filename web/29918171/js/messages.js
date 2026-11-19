/* Сообщения пары: «Скажи ему» (Ж) и «Как поддержать» (М) — один компонент.
   mountMessages(container, {role, cid, uid, partnerName}). Данные: couples/{cid}/messages/{id}
   {from, to, kind: compliment|hint|ready, text (≤200), createdAt, readAt}. Подписка одна на всё приложение, не в render. */
const MSG_MAX = 200;
const MSG_SLOTS = { her: ['her-ask-help', 'her-ask-quiet', 'her-after-sharp'], him: ['him-she-sad', 'him-she-tired', 'him-she-irritated', 'him-she-happy'] };
const MSG_FALLBACK = {
  her: ['Мне сейчас нужна тишина, это не про тебя.', 'Обними меня, пожалуйста, и ничего не говори.', 'Мне тяжело, помоги с одним делом по дому.'],
  him: ['Ты справляешься, я рядом.', 'Хочешь, возьму на себя ужин?', 'Мне нравится, как ты это делаешь.']
};
const MSG_COMPLIMENTS = ['Ты красивая, особенно сегодня.', 'Мне с тобой спокойно.', 'Я горжусь тобой.'];
const MSG_TITLES = {
  her: { head: 'Скажи ему', hint: 'Короткая фраза, когда трудно сказать самой', own: 'Своими словами' },
  him: { head: 'Как поддержать', hint: 'Комплимент или подсказка без лишних слов', own: 'Своими словами' }
};

/** Обрезка/проверка текста: пробелы по краям убираем, не длиннее MSG_MAX. */
function msgClean(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, MSG_MAX); }
function msgValid(t) { const s = String(t == null ? '' : t).trim(); return s.length > 0 && s.length <= MSG_MAX; }
/** Готовые фразы роли: утверждённые из texts.js, иначе встроенные. Возвращает [{kind, text}]. */
function msgPresets(role, season, pick) {
  const r = role === 'him' ? 'him' : 'her', out = [];
  const pk = pick || (typeof pickTexts === 'function' ? pickTexts : null);
  const seen = new Set(), add = (kind, text) => { const t = msgClean(text); if (t && !seen.has(kind + t)) { seen.add(kind + t); out.push({ kind, text: t }); } };
  for (const slot of MSG_SLOTS[r]) {
    let a = []; try { a = pk ? pk('ready-reply', season || 'any', slot, [], 1) : []; } catch (e) {}
    (a || []).forEach(t => add(r === 'her' ? 'ready' : 'hint', t));
  }
  if (!out.length) MSG_FALLBACK[r].forEach(t => add(r === 'her' ? 'ready' : 'hint', t));
  if (r === 'him') MSG_COMPLIMENTS.forEach(t => add('compliment', t));
  return out;
}
function msgTime(m) { const c = m && m.createdAt; return c && c.toMillis ? c.toMillis() : (typeof c === 'number' ? c : 0); }
/** Новые первыми; непрочитанные = нет readAt. */
function msgSort(list) { return (list || []).slice().sort((a, b) => msgTime(b) - msgTime(a)); }
const msgUnread = list => (list || []).filter(m => !m.readAt).length;

const MsgStore = { key: null, unsub: null, list: [], err: false, subs: new Set(), local: false };
function msgLocalOn() { return typeof fb === 'undefined' || !fb || (typeof Demo !== 'undefined' && Demo.d); }
function msgNotify() { MsgStore.subs.forEach(f => { try { f(); } catch (e) {} }); }
function msgSubscribe(cid, uid) {
  const key = cid + '|' + uid + '|' + (msgLocalOn() ? 'l' : 'c');
  if (MsgStore.key === key) return;
  try { MsgStore.unsub && MsgStore.unsub(); } catch (e) {}
  MsgStore.key = key; MsgStore.list = []; MsgStore.err = false; MsgStore.unsub = null; MsgStore.local = msgLocalOn();
  if (MsgStore.local) { try { MsgStore.list = msgSort((lsGet('is-msgs', []) || []).filter(m => m.to === uid)); } catch (e) {} return; }
  try {
    MsgStore.unsub = fb.db.collection('couples/' + cid + '/messages').where('to', '==', uid).limit(50).onSnapshot(
      s => { MsgStore.list = msgSort(s.docs.map(d => ({ id: d.id, ...d.data() }))); MsgStore.err = false; msgNotify(); },
      () => { MsgStore.err = true; msgNotify(); });
  } catch (e) { MsgStore.err = true; }
}
async function msgSend(cid, from, to, kind, text) {
  const t = msgClean(text);
  if (!msgValid(t)) return false;
  try {
    if (msgLocalOn()) {
      const all = lsGet('is-msgs', []) || []; all.push({ id: rid(8), from, to, kind, text: t, createdAt: Date.now(), readAt: null });
      lsSet('is-msgs', all.slice(-100)); return true;
    }
    const ref = await fb.db.collection('couples/' + cid + '/messages').add({ from, to, kind, text: t, createdAt: firebase.firestore.FieldValue.serverTimestamp(), readAt: null });
    if (typeof pushNotify === 'function') pushNotify('message', ref.id);
    return true;
  } catch (e) { return false; }
}
async function msgMarkRead(cid, ids) {
  try {
    if (msgLocalOn()) {
      const all = lsGet('is-msgs', []) || []; all.forEach(m => { if (ids.includes(m.id) && !m.readAt) m.readAt = Date.now(); }); lsSet('is-msgs', all);
      MsgStore.list.forEach(m => { if (ids.includes(m.id)) m.readAt = Date.now(); }); return;
    }
    await Promise.all(ids.map(id => fb.db.doc('couples/' + cid + '/messages/' + id).update({ readAt: firebase.firestore.FieldValue.serverTimestamp() })));
  } catch (e) {}
}

const MSG_KIND = { compliment: 'Комплимент', hint: 'Подсказка', ready: 'Готовая фраза' };
const MsgUI = { draft: '', open: false };

function mountMessages(container, o) {
  try {
    if (!container || !o || !o.cid || !o.uid) { if (container) container.innerHTML = ''; return; }
    const role = o.role === 'him' ? 'him' : 'her', T = MSG_TITLES[role];
    const to = (typeof S !== 'undefined' && S.couple) ? (role === 'her' ? S.couple.him : S.couple.her) : null;
    msgSubscribe(o.cid, o.uid);
    const pn = o.partnerName ? String(o.partnerName).split(' ')[0] : '';
    const view = () => {
      if (!container.isConnected) { MsgStore.subs.delete(view); return; }
      const list = MsgStore.list, un = msgUnread(list);
      const presets = msgPresets(role, typeof info === 'function' ? info(today(), cycle()).season : 'any');
      const btns = presets.map((p, i) => `<div class="msg-p"><span>${esc(p.text)}</span><button class="btn sm" data-msg-p="${i}"${to ? '' : ' disabled'}>Отправить</button></div>`).join('');
      const inbox = MsgUI.open ? (list.length ? list.map(m => `<div class="msg-in${m.readAt ? '' : ' new'}"><small>${MSG_KIND[m.kind] || ''}${m.readAt ? '' : ' · новое'}</small><div>${esc(m.text)}</div></div>`).join('')
        : `<span class="small muted">${MsgStore.err ? 'Нет связи, сообщения не загрузились' : 'Пока ничего нет'}</span>`) : '';
      container.innerHTML = `<div class="msg-box"><div class="row" style="justify-content:space-between"><b>${T.head}</b>
        <button class="msg-open" data-msg-open>${MsgUI.open ? 'Скрыть' : 'Входящие'}${un ? ` <span class="dot">${un}</span>` : ''}</button></div>
        <span class="small muted">${T.hint}${to ? '' : ' (пара ещё не собрана)'}</span>${MsgUI.open ? `<div class="msg-list">${inbox}</div>` : ''}
        <div class="msg-presets">${btns}</div>
        <textarea class="f msg-own" rows="2" maxlength="${MSG_MAX}" placeholder="${T.own}${pn ? ' для ' + esc(pn) : ''}">${esc(MsgUI.draft)}</textarea>
        <div class="row" style="justify-content:space-between"><small class="muted msg-cnt">${MsgUI.draft.length}/${MSG_MAX}</small>
        <span class="row" style="gap:6px">${role === 'him' ? '<button class="btn sm ghost" data-msg-own="compliment"' + (to ? '' : ' disabled') + '>Комплимент</button>' : ''}<button class="btn sm" data-msg-own="${role === 'him' ? 'hint' : 'ready'}"${to ? '' : ' disabled'}>${role === 'him' ? 'Подсказка' : 'Отправить'}</button></span></div></div>`;
      const ta = container.querySelector('.msg-own');
      ta.oninput = () => { MsgUI.draft = ta.value.slice(0, MSG_MAX); container.querySelector('.msg-cnt').textContent = MsgUI.draft.length + '/' + MSG_MAX; };
      const send = async (kind, text, own) => {
        if (!to) return;
        if (!msgValid(text)) { try { toast('Напиши хотя бы несколько слов'); } catch (e) {} return; }
        const ok = await msgSend(o.cid, o.uid, to, kind, text);
        try { toast(ok ? 'Отправлено' : 'Не отправилось, попробуй ещё раз'); } catch (e) {}
        if (ok && own) MsgUI.draft = '';
        view();
      };
      container.querySelectorAll('[data-msg-p]').forEach(b => b.onclick = () => { const p = presets[+b.dataset.msgP]; send(p.kind, p.text, false); });
      container.querySelectorAll('[data-msg-own]').forEach(b => b.onclick = () => send(b.dataset.msgOwn, MsgUI.draft, true));
      container.querySelector('[data-msg-open]').onclick = () => {
        MsgUI.open = !MsgUI.open;
        if (MsgUI.open) { const ids = list.filter(m => !m.readAt).map(m => m.id); if (ids.length) msgMarkRead(o.cid, ids); }
        view();
      };
    };
    MsgStore.subs.forEach(f => { if (f.__c && !f.__c.isConnected) MsgStore.subs.delete(f); });
    view.__c = container; MsgStore.subs.add(view);
    view();
  } catch (e) { try { container.innerHTML = '<span class="small muted">Сообщения пока недоступны</span>'; } catch (e2) {} }
}
if (typeof module !== 'undefined') module.exports = { msgClean, msgValid, msgPresets, msgSort, msgUnread, MSG_MAX };
