'use strict';
/* Внутренние сезоны — мобильное приложение (WebView + Firebase).
 * Данные: Firestore (users/{uid}, users/{uid}/private, couples/{cid}, couples/{cid}/notes, invites/{code}).
 * Без config.js (FIREBASE_CONFIG) — демо-режим на localStorage, чтобы смотреть интерфейс в браузере. */

/* ================= утилиты ================= */
const DAY = 864e5;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const localISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => new Date(s + 'T00:00:00Z');
const addDays = (iso, k) => new Date(+parse(iso) + k * DAY).toISOString().slice(0, 10);
const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / DAY);
const fmt = (iso, o = { day: 'numeric', month: 'long' }) => parse(iso).toLocaleDateString('ru-RU', { ...o, timeZone: 'UTC' });
const fmtW = iso => fmt(iso, { weekday: 'short', day: 'numeric', month: 'long' });
const today = () => localISO();
const A = window.Android || null;
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const rid = (n = 6) => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const r = crypto.getRandomValues(new Uint8Array(n)); for (const x of r) s += a[x % a.length]; return s; };

/* ================= иконки ================= */
const I = {
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  chat: '<path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H10l-5 4v-4.5A3 3 0 0 1 4 14z"/>',
  set: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/>',
  moon: '<path d="M20 12.5A8 8 0 1 1 11.5 4a6 6 0 0 0 8.5 8.5z"/>',
  gate: '<path d="M12 3l9 9-9 9-9-9z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  calm: '<circle cx="12" cy="12" r="8"/><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 10h.01M15 10h.01"/>',
  sad: '<circle cx="12" cy="12" r="8"/><path d="M8.5 16c1-1 2.1-1.5 3.5-1.5s2.5.5 3.5 1.5M9 10h.01M15 10h.01"/>',
  pain: '<path d="M12 3v4M12 17v4M5 12H3M21 12h-2M7 7L5.5 5.5M18.5 18.5L17 17M7 17l-1.5 1.5M18.5 5.5L17 7"/><circle cx="12" cy="12" r="3"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
};
const ic = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const GOOGLE = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6C6.5 42.6 14.6 48 24 48z"/></svg>';

/* ================= сезоны ================= */
const SEASONS = {
  winter: { key: 'w', name: 'Внутренняя\nзима', short: 'Зима', sub: 'Менструация · тишина и отдых',
    her: 'Время отдыха и тишины. Отмени лишнее, разреши себе ничего не делать. Здесь рождаются ответы и видение на следующий цикл.',
    him: 'Возьми на себя быт и логистику. Меньше вопросов и планов, больше тепла: плед, грелка, еда без её участия. Не жди «прежней» её — дай тишину.', calm: false },
  spring: { key: 's', name: 'Внутренняя\nвесна', short: 'Весна', sub: 'До овуляции · лёгкость и любопытство',
    her: 'Возвращается любопытство и лёгкость. Пробуй новое понемногу, не перегружайся сразу — весна ещё хрупкая.',
    him: 'Поддержи её идеи и игру: предложи новое место, прогулку, начни вместе что-то маленькое. Хорошее время для разговоров о планах.', calm: true },
  summer: { key: 'u', name: 'Внутреннее\nлето', short: 'Лето', sub: 'Овуляция · пик энергии',
    her: 'Пик энергии и отдачи. Действуй, общайся, проявляйся — но замечай, где отдаёшь слишком много.',
    him: 'Время близости, совместных дел и признания. Скажи вслух, что ценишь. Помоги не взять больше, чем она потянет в осень.', calm: true },
  autumn: { key: 'a', name: 'Внутренняя\nосень', short: 'Осень', sub: 'Перед менструацией · честность',
    her: 'Внутренний критик громче, но и правда острее. Замечай, что раздражает — это сигнал, что важно. Завершай, а не начинай.',
    him: 'Не спорь с формой — слушай суть: её раздражение часто про реальное. Сними часть нагрузки, не принимай резкость лично. Меньше сюрпризов.', calm: false }
};
const ORDER = ['winter', 'spring', 'summer', 'autumn'];
const GATES = {
  winter: { name: 'Врата в зиму', text: 'Порог перед кровотечением. Самый важный день, чтобы отпустить дела и выйти из мира.' },
  spring: { name: 'Врата в весну', text: 'Выход из зимы. Не выпрыгивай сразу в дела — сначала ясность: что увидела за эти дни?' },
  summer: { name: 'Врата в лето', text: 'Переход к овуляции: энергия растёт, легко взять на себя лишнее.' },
  autumn: { name: 'Врата в осень', text: 'Перелом после овуляции. Начни снижать темп заранее — это смягчит ПМС.' }
};
const CHAMBERS = [
  ['Отделение', 'Отойди от мира, позволь мыслям замедлиться.'], ['Сдача', 'Отпусти контроль, лежи, ничего не делай.'],
  ['Обновление', 'Принимай: тепло, отдых, заботу.'], ['Видение', 'Задай вопрос, который тебя мучает, и слушай ответы.'],
  ['Ясность', 'Запиши практические подсказки на новый цикл.']
];
// Теги по группам; цвет группы — цвет сезона, к которому состояние ближе всего
const TAG_GROUPS = [
  { k: 'w', name: 'Тихое и нежное', tags: ['нежность', 'нужна тишина', 'хочется обнимашек', 'уют', 'медленно', 'мечтательность', 'спокойствие', 'сонливость'] },
  { k: 's', name: 'Лёгкое', tags: ['энергия', 'вдохновение', 'любопытство', 'игривость', 'радость'] },
  { k: 'u', name: 'Тянет к людям', tags: ['общительность', 'близость', 'уверенность', 'хочется внимания'] },
  { k: 'a', name: 'Трудное', tags: ['устала', 'раздражение', 'тревога', 'боль', 'слёзы', 'ранимость'] }
];
const TAGS = TAG_GROUPS.flatMap(g => g.tags);
const QUICK_TAGS = ['нежность', 'нужна тишина', 'энергия', 'общительность', 'устала', 'тревога'];
const tagStyle = t => { const g = TAG_GROUPS.find(g => g.tags.includes(t)); const k = g ? g.k : 'w'; return `--g:var(--${k});--gT:var(--${k}T);--gA:var(--${k}A)`; };
const tagChip = (t, on, attr) => `<button class="chip t ${on ? 'on' : ''}" ${attr}="${t}" style="${tagStyle(t)}">${t}</button>`;
const VIS_HINT = {
  get now() { return rules().partnerChoice ? 'Она увидит запись сразу.' : 'Она выключила «Решает партнёр», поэтому запись откроется по её правилам.'; },
  get later() { return revealHint().replace(' Если отметишь «Сразу», то без ожидания.', '') + ' Эти правила она выбирает сама.'; },
  private: 'Запись увидишь только ты.'
};
const MOODS = [['bolt', 'Бодро'], ['calm', 'Спокойно'], ['heart', 'Нежно'], ['sad', 'Тяжело'], ['pain', 'Больно']];
const DEFAULT_CYCLE = { lastStart: addDays(today(), -9), cycleLen: 28, bleedLen: 5 };
const DEFAULT_RULES = { onRequest: false, phase: true, reciprocity: true, match: false, delayed: false, delayDays: 7, partnerChoice: true };

function info(iso, cyc) {
  const L = +cyc.cycleLen || 28, B = +cyc.bleedLen || 5, n = diffDays(iso, cyc.lastStart);
  const cd = ((n % L) + L) % L + 1, ov = L - 14;
  const season = cd <= B ? 'winter' : cd < ov - 2 ? 'spring' : cd <= ov + 2 ? 'summer' : 'autumn';
  const first = { spring: B + 1, summer: ov - 2, autumn: ov + 3 };
  const gate = cd === L ? 'winter' : cd === first[season] ? season : null;
  const chamber = season === 'winter' ? CHAMBERS[Math.min(Math.round((cd - 1) * 4 / Math.max(B - 1, 1)), 4)] : null;
  const bounds = [B, ov - 3 - B, 5, L - (ov + 2)];
  return { cd, L, season, gate, chamber, bounds, idx: ORDER.indexOf(season), future: n >= L * Math.ceil((diffDays(today(), cyc.lastStart) + 1) / L) };
}
function nextGate(cyc) {
  for (let k = 1; k <= 40; k++) { const d = addDays(today(), k), g = info(d, cyc).gate; if (g) return { d, g, k }; }
}
const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; };
const GATE_TO = { winter: 'врат в зиму', spring: 'врат в весну', summer: 'врат в лето', autumn: 'врат в осень' };
/** Когда она увидит наблюдение партнёра — по правилам, которые она включила (они складываются). */
function revealHint() {
  const r = rules(), w = [];
  if (r.onRequest) w.push('когда она нажмёт «я готова»');
  if (r.phase) w.push('в её весну или лето');
  if (r.reciprocity) w.push('после её записи за этот день');
  if (r.match) w.push('если ваши теги совпадут');
  if (r.delayed) w.push(`через ${r.delayDays} ${plural(r.delayDays, 'день', 'дня', 'дней')}`);
  const list = w.length > 1 ? w.slice(0, -1).join(', ') + ' и ' + w[w.length - 1] : w[0];
  return w.length ? `Ей откроется ${list}.` + (r.partnerChoice ? ' Если отметишь «Сразу», то без ожидания.' : '') : 'Она увидит его сразу.';
}
const inDays = k => k === 1 ? 'Завтра' : k === 2 ? 'Послезавтра' : `Через ${k} ${k < 5 ? 'дня' : 'дней'}`;

/* ================= настройки устройства (тема) ================= */
let prefs = Object.assign({ theme: 'soft', mode: 'system', notify: false }, lsGet('is-prefs', {}));
const mq = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const mode = prefs.mode === 'system' ? (mq.matches ? 'dark' : 'light') : prefs.mode;
  document.documentElement.dataset.theme = prefs.theme;
  document.documentElement.dataset.mode = mode;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (A && A.setBars) try { A.setBars(bg, mode === 'dark'); } catch (e) {}
}
mq.addEventListener && mq.addEventListener('change', () => { applyTheme(); render(); });
function setPrefs(p) { Object.assign(prefs, p); lsSet('is-prefs', prefs); applyTheme(); if (S.user) Store.saveProfile({ theme: prefs.theme, mode: prefs.mode }); render(); }

/* ================= состояние ================= */
const S = { authReady: false, user: null, profile: null, couple: null, shared: [], priv: [], loading: true };
let UI = { tab: sessionStorage.getItem('is-tab') || 'today', sel: today(), view: today().slice(0, 7), consent: false, busy: false };
const role = () => S.profile && S.profile.role;
const cycle = () => (S.couple && S.couple.cycle) || DEFAULT_CYCLE;
const rules = () => Object.assign({}, DEFAULT_RULES, S.couple && S.couple.rules);
const partnerName = () => role() === 'her' ? (S.couple && S.couple.himName) : (S.couple && S.couple.herName);
const hasPartner = () => !!(S.couple && S.couple.him);
const feelOf = iso => (S.couple && S.couple.feel && S.couple.feel[iso]) || null;
function setFeel(iso, s) { const f = Object.assign({}, S.couple.feel || {}); if (f[iso] === s && s === info(iso, cycle()).season) return; f[iso] = s; return Store.updateCouple({ feel: f }).catch(e => toast('Не сохранилось: ' + (e.code || e.message))); }
function feelPicker(iso) {
  const fc = info(iso, cycle()).season, f = feelOf(iso), isToday = iso === today();
  const q = f ? (isToday ? 'Сегодня ощущается как' : 'Ощущалось как') : (isToday ? `По прогнозу сегодня ${SEASONS[fc].short.toLowerCase()}. Так и есть?` : `По прогнозу — ${SEASONS[fc].short.toLowerCase()}. Как ощущалось?`);
  return `<div class="feel"><b class="small" style="font-size:14px">${q}</b><div class="fpills">${ORDER.map(o => `<button class="fpill ${f === o ? 'on' : ''}" data-feel="${o}" data-fdate="${iso}" style="--f:var(--${SEASONS[o].key});--fT:var(--${SEASONS[o].key}T);--fA:var(--${SEASONS[o].key}A)">${SEASONS[o].short}${o === fc ? '<small>прогноз</small>' : ''}</button>`).join('')}</div>
    ${!f && isToday ? `<button class="btn soft" data-feel="${fc}" data-fdate="${iso}">Да, ${SEASONS[fc].short.toLowerCase()}</button>` : ''}</div>`;
}
const allNotes = () => [...S.shared, ...S.priv.map(n => ({ ...n, private: true }))];

/* ================= хранилище: облако ================= */
const CFG = window.FIREBASE_CONFIG || null;
let fb = null;
const Cloud = {
  init() {
    firebase.initializeApp(CFG.firebase);
    fb = { auth: firebase.auth(), db: firebase.firestore() };
    fb.db.enablePersistence({ synchronizeTabs: false }).catch(() => {});
    let unsub = [];
    const stop = () => { unsub.forEach(f => f()); unsub = []; };
    fb.auth.onAuthStateChanged(u => {
      stop(); S.authReady = true; S.user = u ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '' } : null;
      S.profile = null; S.couple = null; S.shared = []; S.priv = []; S.loading = !!u;
      if (!u) { render(); return; }
      let coupleSub = [];
      unsub.push(fb.db.doc('users/' + u.uid).onSnapshot(snap => {
        const p = snap.exists ? snap.data() : {};
        const first = S.profile === null;
        S.profile = p;
        if (first && (p.theme || p.mode)) { prefs.theme = p.theme || prefs.theme; prefs.mode = p.mode || prefs.mode; lsSet('is-prefs', prefs); applyTheme(); }
        if (!p.consentAt && UI.consent) Cloud.saveProfile({ consentAt: Date.now(), name: S.user.name, email: S.user.email });
        coupleSub.forEach(f => f()); coupleSub = [];
        if (p.coupleId) {
          coupleSub.push(fb.db.doc('couples/' + p.coupleId).onSnapshot(s => { S.couple = s.exists ? { id: s.id, ...s.data() } : null; S.loading = false; render(); }, err => { S.couple = null; S.loading = false; render(); }));
          coupleSub.push(fb.db.collection('couples/' + p.coupleId + '/notes').onSnapshot(s => { S.shared = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, () => {}));
        } else { S.couple = null; S.shared = []; S.loading = false; }
        render();
      }, err => { toast('Нет доступа к базе: ' + err.code); S.loading = false; render(); }));
      unsub.push(fb.db.collection('users/' + u.uid + '/private').onSnapshot(s => { S.priv = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, () => {}));
      unsub.push(() => coupleSub.forEach(f => f()));
    });
  },
  signIn() {
    if (A && A.googleSignIn) { UI.busy = true; render(); A.googleSignIn(); return; }
    fb.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => toast('Вход не удался: ' + e.code));
  },
  onGoogleToken(token, err) {
    UI.busy = false;
    if (!token) { render(); if (err && err !== 'cancel') toast('Вход не удался: ' + err); return; }
    fb.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(token)).catch(e => { toast('Вход не удался: ' + e.code); render(); });
  },
  signOut() { fb.auth.signOut(); if (A && A.googleSignOut) A.googleSignOut(); },
  saveProfile(p) { return fb.db.doc('users/' + S.user.uid).set(p, { merge: true }); },
  async createCouple(cyc) {
    const ref = fb.db.collection('couples').doc();
    await ref.set({ her: S.user.uid, him: null, herName: S.user.name, createdAt: Date.now(), cycle: cyc, rules: DEFAULT_RULES });
    await Cloud.saveProfile({ role: 'her', coupleId: ref.id });
  },
  updateCouple(p) { return fb.db.doc('couples/' + S.couple.id).update(p); },
  async invite() {
    const code = rid(6);
    await fb.db.doc('invites/' + code).set({ her: S.user.uid, coupleId: S.couple.id, createdAt: Date.now() });
    await Cloud.updateCouple({ inviteCode: code });
    return code;
  },
  async join(code) {
    const inv = await fb.db.doc('invites/' + code).get();
    if (!inv.exists) throw new Error('Код не найден');
    const cid = inv.data().coupleId;
    await fb.db.doc('couples/' + cid).update({ him: S.user.uid, himName: S.user.name, joinedAt: Date.now() });
    await Cloud.saveProfile({ role: 'him', coupleId: cid });
  },
  async leave() { await Cloud.updateCouple({ him: null, himName: null }); await Cloud.saveProfile({ coupleId: null }); },
  unlink() { return Cloud.updateCouple({ him: null, himName: null }); },
  addNote(n, priv) {
    const doc = { ...n, author: S.user.uid };
    return priv ? fb.db.collection('users/' + S.user.uid + '/private').add(doc) : fb.db.collection('couples/' + S.couple.id + '/notes').add(doc);
  },
  delNote(n) { return n.private ? fb.db.doc('users/' + S.user.uid + '/private/' + n.id).delete() : fb.db.doc('couples/' + S.couple.id + '/notes/' + n.id).delete(); },
  async wipe() {
    const uid = S.user.uid, b = fb.db.batch();
    S.priv.forEach(n => b.delete(fb.db.doc('users/' + uid + '/private/' + n.id)));
    S.shared.filter(n => n.author === uid).forEach(n => b.delete(fb.db.doc('couples/' + S.couple.id + '/notes/' + n.id)));
    await b.commit();
    if (S.couple && role() === 'her') {
      const rest = await fb.db.collection('couples/' + S.couple.id + '/notes').get();
      if (!rest.empty) await Cloud.unlink();
      if (S.couple.inviteCode) await fb.db.doc('invites/' + S.couple.inviteCode).delete().catch(() => {});
      if (rest.empty) await fb.db.doc('couples/' + S.couple.id).delete();
    } else if (S.couple && role() === 'him') await Cloud.updateCouple({ him: null, himName: null }).catch(() => {});
    await fb.db.doc('users/' + uid).delete();
    Cloud.signOut();
  }
};

/* ================= хранилище: демо (без Firebase) ================= */
const Demo = {
  d: null,
  load() { this.d = lsGet('is-demo', null); },
  save() { lsSet('is-demo', this.d); this.sync(); render(); },
  sync() {
    const d = this.d; if (!d) { S.user = null; return; }
    const u = d.as === 'him' ? d.him : d.her;
    S.user = u; S.profile = d.profiles[u.uid] || {};
    const cid = S.profile.coupleId; S.couple = cid ? d.couples[cid] : null;
    S.shared = cid ? d.notes.filter(n => n.cid === cid) : [];
    S.priv = d.priv.filter(n => n.owner === u.uid);
  },
  init() { this.load(); S.authReady = true; S.loading = false; this.sync(); },
  signIn() {
    this.d = this.d || { as: 'her', her: { uid: 'demo-her', name: 'Лера', email: 'demo@local' }, him: { uid: 'demo-him', name: 'Антон', email: 'demo2@local' }, profiles: {}, couples: {}, notes: [], priv: [], invites: {} };
    this.d.profiles[this.d.her.uid] = this.d.profiles[this.d.her.uid] || { consentAt: Date.now() };
    this.save();
  },
  signOut() { this.d = null; lsSet('is-demo', null); S.user = null; render(); },
  saveProfile(p) { const u = S.user.uid; this.d.profiles[u] = { ...(this.d.profiles[u] || {}), ...p }; this.save(); return Promise.resolve(); },
  async createCouple(cyc) { const id = 'c' + rid(4); this.d.couples[id] = { id, her: S.user.uid, him: null, herName: S.user.name, cycle: cyc, rules: DEFAULT_RULES }; return this.saveProfile({ role: 'her', coupleId: id }); },
  updateCouple(p) { Object.assign(this.d.couples[S.couple.id], p); this.save(); return Promise.resolve(); },
  async invite() { const code = rid(6); this.d.invites[code] = S.couple.id; await this.updateCouple({ inviteCode: code }); return code; },
  async join(code) { const cid = this.d.invites[code]; if (!cid) throw new Error('Код не найден'); Object.assign(this.d.couples[cid], { him: S.user.uid, himName: S.user.name }); return this.saveProfile({ role: 'him', coupleId: cid }); },
  async leave() { await this.updateCouple({ him: null, himName: null }); return this.saveProfile({ coupleId: null }); },
  unlink() { return this.updateCouple({ him: null, himName: null }); },
  addNote(n, priv) { const doc = { ...n, id: rid(8), author: S.user.uid }; if (priv) this.d.priv.push({ ...doc, owner: S.user.uid }); else this.d.notes.push({ ...doc, cid: S.couple.id }); this.save(); return Promise.resolve(); },
  delNote(n) { if (n.private) this.d.priv = this.d.priv.filter(x => x.id !== n.id); else this.d.notes = this.d.notes.filter(x => x.id !== n.id); this.save(); return Promise.resolve(); },
  async wipe() { this.signOut(); },
  switchRole() {
    this.d.as = this.d.as === 'her' ? 'him' : 'her';
    const u = this.d[this.d.as]; this.d.profiles[u.uid] = this.d.profiles[u.uid] || { consentAt: Date.now() };
    this.save();
  }
};
const Store = CFG ? Cloud : Demo;
window.__onGoogleToken = (t, e) => Cloud.onGoogleToken(t, e);

/* ================= видимость заметок ================= */
function lockReasons(n) {
  if (role() !== 'her' || n.role !== 'him') return [];
  const r = rules(), why = [], calm = SEASONS[info(today(), cycle()).season].calm;
  const mine = allNotes().filter(x => x.role === 'her' && x.date === n.date);
  if (r.partnerChoice && n.vis === 'now') return why;
  if (r.onRequest && !((S.couple.revealedAt || 0) >= (n.created || 0))) why.push('откроется по твоей кнопке');
  if (r.phase && !calm) why.push('откроется в спокойную фазу — весну или лето');
  if (r.reciprocity && !mine.length) why.push('запиши свои ощущения за ' + fmt(n.date));
  if (r.match && !mine.some(m => (m.tags || []).some(t => (n.tags || []).includes(t)))) why.push('откроется, когда ваши теги совпадут');
  if (r.delayed && diffDays(today(), n.date) < r.delayDays) why.push('откроется через ' + r.delayDays + ' дн. после записи');
  if (r.partnerChoice && n.vis === 'later' && !calm && !why.length) why.push('он попросил показать позже');
  return why;
}
function visibleNotes() {
  const me = S.user.uid;
  return allNotes().filter(n => n.author === me || !n.private).sort((a, b) => (b.date + (b.created || 0)).localeCompare(a.date + (a.created || 0)));
}

/* ================= медиатор ================= */
const HARSH = [
  [/(бля|хуй|хуе|хер(?!сон)|пизд|ебан|ебат|ебну|ебл|уеб|сука|суки|сучк|мудак|мудил|говн|дерьм|жоп|залуп|гандон|пидор|педик|шлюх|курв)/, 'мат или грубость'],
  [/(^|[^а-я])(дура|дурак|дурочк|тупая|тупой|тупиц|идиот|истеричк|истерик|психованн|психопат|ненормальн|неадекват|овца|стерв|коза|козел|козл|дебил|даун|кретин|придур|лошар|лох(?![а-я-])|чмо|дрян|твар|урод|сволоч|мраз|гадин|гад(?![а-я])|скотин|свинь|свин(?![а-я])|корова|бестолоч|бездар|ничтожеств|убог|отврат|мерзк|мерзав|негодя|змея|ведьм|токсичн|эгоист)/, 'ярлык или оскорбление'],
  [/(заткнись|отвали|отстань|достал|задолбал|заколебал|бесишь|бесит|взбес|ненавижу|невыносим|видеть тебя не|пошла ты|пошел ты|иди ты|как последн|сама виноват|сам виноват|кому ты нужн|никому не нужн)/, 'резкость'],
  [/(^|[^а-я])(всегда|никогда|вечно|опять|снова)(?![а-я])/, 'обобщение «всегда/никогда/опять»'],
  [/(пмс|гормон|эти дни|критические)/, 'обесценивание через цикл']
];
// латинские двойники → кириллица, ё → е, «дряяянь» → «дрянь», «т.в.а.р.ь» → «тварь»
const LOOK = { a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у', '0': 'о', '3': 'з', '@': 'а' };
function norm(t) {
  let s = t.toLowerCase().replace(/ё/g, 'е');
  s = s.replace(/([а-я])[.\-_*](?=[а-я])/g, '$1');
  s = s.replace(/[a-zа-я0-9@]+/g, w => (/[а-я]/.test(w) || /^[abcehkmoptxy03@]+$/.test(w)) ? w.replace(/[abcehkmoptxy03@]/g, c => LOOK[c]) : w);
  return s.replace(/([а-я])\1{2,}/g, '$1');
}
function harshness(t) {
  const s = norm(t), hits = [...new Set(HARSH.filter(([re]) => re.test(s)).map(([, w]) => w))];
  const letters = t.replace(/[^A-Za-zА-Яа-яЁё]/g, ''), caps = letters.replace(/[^A-ZА-ЯЁ]/g, '').length;
  if (letters.length > 8 && caps / letters.length > .6) hits.push('крик капсом');
  if (/[!?]{3,}/.test(t)) hits.push('много восклицательных знаков');
  return hits.length === 1 && hits[0].startsWith('обобщение') ? [] : hits;
}

/* ================= уведомления, тосты, шторки ================= */
let toastT;
function toast(msg) {
  let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 3200);
}
function notifyToday() {
  if (!prefs.notify || !A || !A.notify || !S.couple) return;
  const k = 'is-notified-' + today(); if (lsGet(k, false)) return; lsSet(k, true);
  const i = info(today(), cycle()), s = SEASONS[i.season];
  A.notify(i.gate ? GATES[i.gate].name : s.name.replace('\n', ' '), role() === 'him' ? s.him : s.her);
}
function sheet(html, onMount) {
  const L = $('#layer');
  document.documentElement.classList.add('lock');
  L.innerHTML = `<div class="sheet-wrap"><div class="sheet" role="dialog"><div class="shead"><span class="grab"><span class="handle"></span></span><button class="icon-btn x" data-close aria-label="Закрыть">${ic('x')}</button></div><div class="sbody">${html}</div></div></div>`;
  const w = $('.sheet-wrap', L);
  w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-close]')) closeSheet(); });
  dragSheet(w, $('.sheet', L));
  onMount && onMount($('.sheet', L));
  typo($('.sheet', L));
}
const closeSheet = () => { $('#layer').innerHTML = ''; document.documentElement.classList.remove('lock'); };
/** Шторку можно тянуть вниз: за ручку или когда содержимое прокручено до верха; отпустил ниже порога — закрылась. */
function dragSheet(wrap, sh) {
  let y0 = 0, dy = 0, t0 = 0, drag = false, armed = false;
  sh.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; drag = false;
    const body = $('.sbody', sh); armed = !!e.target.closest('.shead') || (body.scrollTop <= 0 && !e.target.closest('textarea,input'));
  }, { passive: true });
  sh.addEventListener('touchmove', e => {
    if (!armed) return;
    dy = e.touches[0].clientY - y0;
    if (!drag && dy > 6) { drag = true; sh.style.transition = 'none'; }
    if (!drag) { if (dy < 0) armed = false; return; }
    e.preventDefault();
    const d = Math.max(0, dy);
    sh.style.transform = `translateY(${d}px)`; wrap.style.background = `rgba(0,0,0,${Math.max(0, .45 - d / 900)})`;
  }, { passive: false });
  sh.addEventListener('touchend', () => {
    if (!drag) return; drag = false;
    sh.style.transition = 'transform .2s ease-out';
    if (dy > Math.min(160, sh.offsetHeight * .3) || (dy > 40 && dy / (Date.now() - t0) > .6)) { sh.style.transform = 'translateY(100%)'; setTimeout(closeSheet, 180); }
    else { sh.style.transform = ''; wrap.style.background = ''; }
  });
}
window.onBack = () => {
  if ($('#layer').innerHTML) { closeSheet(); return true; }
  if (S.user && UI.tab !== 'today') { go('today'); return true; }
  return false;
};
function go(tab) { UI.from = null; UI.tab = tab; sessionStorage.setItem('is-tab', tab); if (tab === 'today') UI.sel = today(); render(); window.scrollTo(0, 0); }

/* ================= типографика =================
 * Чтобы не оставались висячие «в», «и», «не» в конце строки и тире в начале новой. */
const NB = /(^|[\s(«„"])([А-Яа-яЁёA-Za-z]{1,2}|не|ни|без|для|под|над|при|про|это|как)\s+/g;
function typoText(s) { return s.replace(NB, (m, a, w) => a + w + '\u00A0').replace(NB, (m, a, w) => a + w + '\u00A0').replace(/\s+—/g, '\u00A0—').replace(/(\d)\s+(?=[а-яё])/g, '$1\u00A0'); }
function typo(root) {
  if (!root) return;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentNode.closest('textarea,input,script,style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const list = []; while (tw.nextNode()) list.push(tw.currentNode);
  for (const n of list) { const v = typoText(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
}

/* ================= экраны ================= */
function render() {
  applyTheme();
  setTimeout(webReady, 0);
  const app = $('#app');
  if (!S.authReady) { app.innerHTML = '<div class="spin"></div>'; return; }
  if (!S.user) return renderLogin(app);
  if (S.loading || S.profile === null) { app.innerHTML = '<div class="spin"></div>'; return; }
  if (!S.profile.consentAt) return renderLogin(app, true);
  if (!S.profile.role) return renderRole(app);
  if (!S.profile.coupleId) return role() === 'her' ? renderSetup(app) : renderJoin(app);
  if (!S.couple) { app.innerHTML = '<div class="spin"></div>'; return; }
  const scrollY = window.scrollY;
  app.innerHTML = `<div class="screen">${({ today: viewToday, cal: viewCal, notes: viewNotes, settings: viewSettings })[UI.tab]()}</div>${tabs()}`;
  bind(app);
  typo(app);
  window.scrollTo(0, scrollY);
  notifyToday();
}

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

function tabs() {
  const her = role() === 'her';
  const locked = her ? allNotes().filter(n => n.role === 'him' && !n.private && lockReasons(n).length).length : 0;
  const t = [['today', 'sun', 'Сегодня'], ['cal', 'cal', 'Календарь'], ['notes', 'chat', 'Записи'], ['settings', 'set', 'Настройки']];
  return `<nav class="tabs" aria-label="Разделы">${t.map(([k, i, l]) => `<button data-tab="${k}" class="${UI.tab === k ? 'on' : ''}">${ic(i)}${l}${k === 'notes' && locked ? `<span class="dot">${locked}</span>` : ''}</button>`).join('')}</nav>`;
}
function roleSeg() { return ''; }

function heroVars(season) { const k = SEASONS[season].key; return `--hero:var(--${k});--heroT:var(--${k}T);--acc:var(--${k}A)`; }

function viewToday() {
  const her = role() === 'her', i = info(today(), cycle()), ng = nextGate(cycle());
  const felt = feelOf(today()), shown = felt || i.season, s = SEASONS[shown];
  const pos = { winter: i.cd / i.bounds[0], spring: (i.cd - i.bounds[0]) / i.bounds[1], summer: (i.cd - i.bounds[0] - i.bounds[1]) / 5, autumn: (i.cd - i.bounds[0] - i.bounds[1] - 5) / i.bounds[3] }[i.season];
  // полоски сезонов одинаковой ширины: это четыре части цикла, а не дни; точка — где она внутри своего сезона
  const bar = ORDER.map((o, k) => `<span class="${k === i.idx ? 'on' : ''}">${k === i.idx ? `<i style="left:${Math.min(94, Math.max(6, pos * 100)).toFixed(0)}%"></i>` : ''}</span>`).join('');
  const lab = ORDER.map((o, k) => `<span>${SEASONS[o].short}</span>`).join('');
  const mineToday = allNotes().filter(n => n.author === S.user.uid && n.date === today());
  const pn = partnerName(), first = pn ? pn.split(' ')[0] : '';
  const gateLine = i.gate ? `<button class="hlink" data-goday="${today()}">${ic('gate')}<span class="hl2"><b>Сегодня ${GATES[i.gate].name.toLowerCase()}</b><small>${GATES[i.gate].text}</small></span>${ic('chev')}</button>`
    : ng ? `<button class="hlink" data-goday="${ng.d}">${ic('gate')}<span class="hl2"><b>${ng.k} ${plural(ng.k, 'день', 'дня', 'дней')} до ${GATE_TO[ng.g]}</b><small>смотреть в календаре</small></span>${ic('chev')}</button>` : '';
  let h = `<div class="hero" style="${heroVars(shown)}">
    <div class="orb" style="right:-90px;top:20px;width:260px;height:260px"></div><div class="orb" style="right:10px;top:150px;width:120px;height:120px"></div>
    <span class="day" style="position:relative;padding-top:14px">${fmtW(today())}</span>
    <div class="hbar"><h1>${her ? 'Сегодня' : 'Сегодня у'}</h1>${!her && first ? `<span class="badge" style="box-shadow:inset 0 0 0 1px var(--track)">${ic('heart', 'i" style="width:14px;height:14px')}${esc(first)}</span>` : ''}</div>
    <div style="position:relative;display:flex;flex-direction:column;gap:6px">
      <span class="name">${s.name.replace('\n', ' ')}</span>
      <span class="sub">День ${i.cd} из ${i.L}${felt && felt !== i.season ? ` · прогноз: ${SEASONS[i.season].short.toLowerCase()}` : ''}</span></div>
    <div style="position:relative;display:flex;flex-direction:column;gap:6px"><div class="cbar">${bar}</div><div class="clab">${lab}</div></div>
    ${gateLine}</div>
  <div class="content">`;
  if (i.chamber && her) h += `<div class="card" style="gap:8px"><div class="row" style="gap:10px"><span class="ico sm" style="background:var(--w);color:var(--wA)">${ic('moon')}</span><b>Зал «${i.chamber[0]}»</b></div><p class="small muted" style="font-size:14px">${i.chamber[1]}</p></div>`;
  if (her) h += `<div class="card">${feelPicker(today())}</div>`;
  h += `<div class="card" style="gap:8px"><div class="row" style="gap:10px"><span class="ico sm" style="background:var(--hero);color:var(--acc);${heroVars(shown)}">${ic(her ? 'moon' : 'heart')}</span><b>${her ? 'Тебе сегодня' : 'Как позаботиться'}</b></div>
    <p style="color:var(--text2);font-size:15px;line-height:22px">${her ? s.her : s.him}</p></div>`;
  if (!her) {
    const hers = S.shared.filter(n => n.role === 'her' && n.date === today());
    if (hers.length) h += `<div class="card"><b>Она отметила сегодня</b><div class="chips">${[...new Set(hers.flatMap(n => n.tags || []))].map(t => `<span class="chip t on" style="${tagStyle(t)}">${esc(t)}</span>`).join('')}</div>${hers.filter(n => n.text).map(n => `<p class="small" style="font-size:14px">«${esc(n.text)}»</p>`).join('')}</div>`;
  }
  h += `<div class="card"><div class="row" style="justify-content:space-between"><b>${her ? 'Как ты сегодня?' : 'Что ты заметил?'}</b><span class="small muted">${mineToday.length ? 'записей: ' + mineToday.length : 'ещё нет записи'}</span></div>
    ${her ? `<div class="chips scroll">${QUICK_TAGS.map(t => tagChip(t, false, 'data-quick')).join('')}</div>` : `<p class="small muted" style="font-size:14px">Без оценок — просто наблюдение. ${revealHint()}</p>`}
    <button class="btn" data-entry="${today()}">${ic('plus')}${her ? 'Записать' : 'Записать наблюдение'}</button></div>`;
  if (her) {
    if (hasPartner()) {
      const his = allNotes().filter(n => n.role === 'him' && !n.private), open = his.filter(n => !lockReasons(n).length).length;
      h += `<button class="card tap" style="border:0;text-align:left;color:var(--text)" data-tab="notes"><div class="row"><span class="ico">${ic('chat')}</span><span style="flex:1;display:flex;flex-direction:column"><b>${esc((pn || 'Партнёр').split(' ')[0])} замечает</b><span class="small muted">открыто ${open} · ждут правил ${his.length - open}</span></span>${ic('chev')}</div></button>`;
    } else h += `<button class="card tap" style="border:0;text-align:left;color:var(--text)" data-tab="settings"><div class="row"><span class="ico">${ic('link')}</span><span style="flex:1;display:flex;flex-direction:column"><b>Пригласить партнёра</b><span class="small muted">Он увидит подсказки «как помочь» и сможет оставлять наблюдения</span></span>${ic('chev')}</div></button>`;
  }
  return h + '</div>';
}

function viewCal() {
  const cyc = cycle(), [y, m] = UI.view.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)), days = new Date(Date.UTC(y, m, 0)).getUTCDate(), lead = (first.getUTCDay() + 6) % 7;
  const t = today(), notesBy = {};
  visibleNotes().forEach(n => notesBy[n.date] = 1);
  let g = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(d => `<span class="dow">${d}</span>`).join('') + '<span></span>'.repeat(lead);
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${pad(m)}-${pad(d)}`, i = info(iso, cyc), f = feelOf(iso), k = SEASONS[f || i.season].key;
    const fut = diffDays(iso, t) > 0, guess = !fut && !f;
    g += `<button class="dcell ${fut ? 'future' : ''} ${guess ? 'guess' : ''} ${iso === t ? 'now' : ''} ${iso === UI.sel ? 'sel' : ''}" data-day="${iso}" style="--f:var(--${k});--fT:var(--${k}T)" aria-label="${fmt(iso)}">
      ${i.gate ? '<span class="gate"></span>' : ''}<b>${d}</b><small>${iso === t ? 'сегодня' : 'д' + i.cd}</small>${notesBy[iso] ? '<span class="nd"></span>' : ''}</button>`;
  }
  const sel = UI.sel, si = info(sel, cyc), sf = feelOf(sel), ss = SEASONS[sf || si.season], dn = visibleNotes().filter(n => n.date === sel);
  return `<div class="bar"><span class="row" style="gap:6px">${UI.from === 'today' ? `<button class="icon-btn" style="background:none;margin-left:-10px" data-tab="today" aria-label="Назад на главную">${ic('back')}</button>` : ''}<h1>Календарь</h1></span>${UI.from ? '' : `<button class="btn link" style="width:auto" data-goday="${t}">Сегодня</button>`}</div>
  <div class="content" style="padding-top:4px">
    <div class="card" style="padding:12px">
      <div class="cal-head"><button class="icon-btn" data-mon="-1" aria-label="Предыдущий месяц">${ic('back')}</button>
        <span style="display:flex;flex-direction:column;align-items:center"><b style="font-size:17px;text-transform:capitalize">${first.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</b><span class="small muted">цикл ${cyc.cycleLen} дней</span></span>
        <button class="icon-btn" data-mon="1" aria-label="Следующий месяц">${ic('chev')}</button></div>
      <div class="grid7">${g}</div>
      <div class="legend">${ORDER.map(o => `<span><b style="background:var(--${SEASONS[o].key})"></b>${SEASONS[o].short}</span>`).join('')}<span><b style="width:7px;height:7px;transform:rotate(45deg);background:var(--text)"></b>врата</span></div>
      <p class="small muted" style="text-align:center">Залито — как ${role() === 'her' ? 'ты отметила' : 'она отметила'} · бледно — прогноз без отметки · контур — прогноз вперёд</p>
    </div>
    <div class="card" id="dayCard" style="${heroVars(sf || si.season)}">
      <div class="row"><span class="ico" style="width:48px;height:48px;border-radius:14px;background:var(--hero);color:var(--heroT);flex-direction:column;font-weight:800;line-height:1">${+sel.slice(8)}<small style="font-size:10px;font-weight:400">д${si.cd}</small></span>
        <span style="display:flex;flex-direction:column"><b>${fmtW(sel)}</b><span class="small muted">${ss.name.replace('\n', ' ')}${sf && sf !== si.season ? ' · по ощущению' : ''}${si.gate ? ' · ' + GATES[si.gate].name.toLowerCase() : ''}</span></span></div>
      ${role() === 'her' && diffDays(sel, t) <= 0 ? feelPicker(sel) : ''}
      ${si.gate ? `<div class="banner">${ic('gate')}<span>${GATES[si.gate].text}</span></div>` : ''}
      ${si.chamber ? `<p class="small" style="font-size:14px"><b>Зал «${si.chamber[0]}»</b> — ${si.chamber[1]}</p>` : ''}
      <p class="small" style="font-size:14px;color:var(--text2)"><b style="color:var(--text)">Ей:</b> ${ss.her}</p>
      ${hasPartner() || role() === 'him' ? `<p class="small" style="font-size:14px;color:var(--text2)"><b style="color:var(--text)">Партнёру:</b> ${ss.him}</p>` : ''}
      ${dn.length ? `<div class="feed">${dn.map(noteBubble).join('')}</div>` : ''}
      <button class="btn" data-entry="${sel}">${ic('plus')}Запись за ${fmt(sel)}</button>
    </div>
  </div>`;
}

function noteBubble(n) {
  const me = n.author === S.user.uid, who = n.role === 'her' ? 'Она' : 'Партнёр';
  const tags = (n.tags || []).join(', '), mood = n.mood != null ? MOODS[n.mood][1].toLowerCase() : '';
  const meta = [me ? 'Я' : who, mood, tags].filter(Boolean).join(' · ');
  if (me) {
    const vis = n.private ? 'только мне' : n.role === 'him' ? (n.vis === 'now' ? 'показать сразу' : 'откроется, когда она решит') : (hasPartner() ? 'видит партнёр' : 'видишь только ты');
    return `<div class="bub out" data-note="${n.id}" data-priv="${n.private ? 1 : ''}">${esc(n.text || '—')}<small>${esc(meta)} · ${vis}</small></div>`;
  }
  const why = lockReasons(n);
  if (why.length) return `<div class="bub lock">${ic('lock', 'i" style="width:16px;height:16px')}<span>Заметка партнёра: ${why.join(' · ')}</span></div>`;
  return `<div class="bub in">${esc(n.text || '—')}<small>${esc(meta)}</small></div>`;
}

function viewNotes() {
  const her = role() === 'her', list = visibleNotes(), r = rules();
  const lockedCount = her ? list.filter(n => n.role === 'him' && lockReasons(n).length).length : 0;
  let h = `<div class="bar"><h1>Записи</h1></div><div class="content" style="padding-top:4px">`;
  if (her && r.onRequest && lockedCount) h += `<button class="btn" id="reveal">${ic('heart')}Я готова — показать, что он заметил</button>`;
  if (her && lockedCount && !r.onRequest) h += `<div class="warnbox">${ic('lock')}<span>${lockedCount} ${lockedCount === 1 ? 'заметка партнёра ждёт' : 'заметки партнёра ждут'} твоих правил раскрытия</span></div>`;
  if (!list.length) h += `<div class="card" style="align-items:center;text-align:center;padding:32px 16px"><span class="ico">${ic('chat')}</span><b>Пока пусто</b><p class="small muted">${her ? 'Записывай, как ты себя чувствуешь — по записям виден твой цикл.' : 'Здесь будут её записи, которыми она делится, и твои наблюдения.'}</p><button class="btn" data-entry="${today()}" style="margin-top:8px">${ic('plus')}Первая запись</button></div>`;
  const days = [];
  for (const n of list.slice(0, 200)) { if (!days.length || days[days.length - 1].date !== n.date) days.push({ date: n.date, notes: [] }); days[days.length - 1].notes.push(n); }
  for (const g of days) {
    const sk = feelOf(g.date) || info(g.date, cycle()).season, k = SEASONS[sk].key;
    h += `<div class="dgroup" style="--f:var(--${k});--fT:var(--${k}T);--fA:var(--${k}A)"><div class="dhead"><b>${fmtW(g.date)}</b><span class="spill">${SEASONS[sk].short}</span></div><div class="feed">${g.notes.map(noteBubble).join('')}</div></div>`;
  }
  return h + '</div>';
}

function viewSettings() {
  const her = role() === 'her', c = cycle(), r = rules(), u = S.user, pn = partnerName();
  const sw = (id, on) => `<button class="sw ${on ? 'on' : ''}" data-sw="${id}" role="switch" aria-checked="${on}"></button>`;
  const rule = (k, t, d) => `<div class="srow"><div class="t"><b>${t}</b><span>${d}</span></div>${sw('r:' + k, r[k])}</div>`;
  const tq = th => th === 'soft' ? ['#EBCFD5', '#D3E6D2', '#F5E3B5', '#F3D3C2'] : ['#7B2D3B', '#3F7A4C', '#E0A33A', '#B0532F'];
  let h = `<div class="bar"><h1>Настройки</h1></div><div class="content" style="padding-top:4px">
  <div class="card"><div class="row">${u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer" style="width:48px;height:48px;border-radius:24px">` : `<span class="av">${esc((u.name || u.email || '?')[0].toUpperCase())}</span>`}
    <span style="flex:1;display:flex;flex-direction:column;min-width:0"><b>${esc(u.name || 'Без имени')}</b><span class="small muted" style="overflow:hidden;text-overflow:ellipsis">${esc(u.email)}</span><span class="small muted">${her ? 'веду свой цикл' : 'партнёр'}${CFG ? ' · данные в облаке' : ' · демо, без облака'}</span></span></div>
    <button class="btn ghost" id="out">Выйти</button>${!CFG ? '<button class="btn ghost" id="demo-role">Демо: войти за ' + (her ? 'партнёра' : 'неё') + '</button>' : ''}</div>
  <div class="card"><b>Оформление</b><div class="themes">${['soft', 'bright'].map(th => `<button class="tcard ${prefs.theme === th ? 'on' : ''}" data-theme="${th}"><span class="q">${tq(th).map(x => `<i style="background:${x}"></i>`).join('')}</span>${th === 'soft' ? 'Нежная' : 'Яркая'}</button>`).join('')}</div>
    <div class="seg" style="background:var(--field)">${[['light', 'Светлая'], ['dark', 'Тёмная'], ['system', 'Системная']].map(([k, l]) => `<button style="flex:1" class="${prefs.mode === k ? 'on' : ''}" data-mode="${k}">${l}</button>`).join('')}</div></div>`;
  if (her) h += `<div class="card"><b>Цикл</b>
    <label class="cap" for="ls">Первый день последней менструации</label><input class="f" type="date" id="ls" value="${c.lastStart}" max="${today()}">
    <div class="srow"><div class="t"><b>Длина цикла</b><span>дней</span></div>${stepper('cl', c.cycleLen)}</div>
    <div class="srow"><div class="t"><b>Дней менструации</b></div>${stepper('bl', c.bleedLen)}</div></div>`;
  h += `<div class="card"><b>Партнёр</b>`;
  if (her) {
    if (hasPartner()) h += `<div class="row"><span class="ico">${ic('heart')}</span><span style="flex:1"><b>${esc(pn || 'Партнёр')}</b><br><span class="small muted">видит подсказки и твои открытые записи</span></span></div><button class="btn ghost" id="unlink">Отвязать партнёра</button>`;
    else h += `<p class="small muted" style="font-size:14px">Он установит приложение, войдёт своим Google-аккаунтом, выберет «Я партнёр» и введёт код.</p>
      ${S.couple.inviteCode ? `<div style="text-align:center;font-size:30px;font-weight:800;letter-spacing:.2em;padding:6px 0">${esc(S.couple.inviteCode)}</div><button class="btn" id="share">${ic('share')}Отправить код</button><button class="btn link" id="invite">Новый код</button>` : `<button class="btn" id="invite">${ic('link')}Пригласить партнёра</button>`}`;
  } else h += `<div class="row"><span class="ico">${ic('heart')}</span><span style="flex:1"><b>Вы с ${esc(pn || 'ней')}</b><br><span class="small muted">ты видишь её сезоны и записи, которыми она делится</span></span></div><button class="btn ghost" id="leave">Выйти из пары</button>`;
  h += `</div>`;
  if (her) h += `<div class="card"><b>Когда я вижу заметки партнёра</b><p class="small muted">Включённые правила складываются</p>
    ${rule('onRequest', 'По моей кнопке', 'Сама решаю, когда готова прочитать')}
    ${rule('phase', 'В спокойную фазу', 'Открываются весной и летом, не в осень и зиму')}
    ${rule('reciprocity', 'Взаимность', 'Вижу его запись за день, если записала свою')}
    ${rule('match', 'Совпадение', 'Открывается, если наши теги совпали')}
    ${rule('delayed', 'Отложенно', 'Видны через ' + r.delayDays + ' дней — как ретроспектива')}
    ${rule('partnerChoice', 'Решает партнёр', 'Он может отметить «показать сразу»')}</div>`;
  h += `<div class="card"><b>Помощь и уведомления</b>
    <div class="srow"><div class="t"><b>Медиатор</b><span>Мягко подскажет, если запись звучит резко. Работает только на этом телефоне</span></div>${sw('mediator', S.profile.mediator !== false)}</div>
    <div class="srow"><div class="t"><b>Уведомления</b><span>Сезон и врата — раз в день при открытии</span></div>${sw('notify', prefs.notify)}</div></div>
  <div class="card"><b>Данные</b><p class="small muted">Хранятся в Firebase (Европа), доступ — только у тебя и партнёра в паре. Согласие дано ${S.profile.consentAt ? fmt(localISO(new Date(S.profile.consentAt))) : '—'}.</p>
    <button class="btn ghost" id="wipe" style="color:var(--accent)">Удалить все мои данные</button></div>
  <button class="btn ghost" id="upd">Проверить обновления</button>
  <p class="small muted" style="text-align:center">Внутренние сезоны · ${A && A.appVersion ? 'v' + esc(A.appVersion()) + (A.webVersion ? ' · интерфейс ' + A.webVersion() : '') : 'web'}</p></div>`;
  return h;
}

/* ================= шторка записи ================= */
function openEntry(date, preset) {
  const her = role() === 'her', d = { mood: null, tags: preset ? [preset] : [], share: hasPartner(), vis: 'later' };
  const i = info(date, cycle());
  sheet(`<div class="ttl"><b>${her ? 'Как ты сегодня?' : 'Что ты заметил?'}</b><span class="small muted">${fmtW(date)} · день ${i.cd} · ${SEASONS[i.season].short.toLowerCase()}</span></div>
    ${her ? `<div class="moods">${MOODS.map(([icn, l], k) => `<button class="mood" data-mood="${k}"><span>${ic(icn)}</span>${l}</button>`).join('')}</div>` : ''}
    <label class="cap" for="txt">${her ? 'Пара слов для себя' : 'Наблюдение без оценок'}</label>
    <div class="compose"><textarea id="txt" rows="3" placeholder="${her ? 'Как ты себя чувствуешь?' : 'Например: вечером много смеялась'}"></textarea>
      <div class="cbot"><div class="chips scroll ctags">${TAGS.map(t => tagChip(t, d.tags.includes(t), 'data-tag')).join('')}</div><button class="send" id="send" aria-label="Сохранить">${ic('up')}</button></div></div>
    <span class="cap">Теги</span>${TAG_GROUPS.map(g => `<div class="tgroup"><span class="small muted">${g.name}</span><div class="chips">${g.tags.map(t => tagChip(t, d.tags.includes(t), 'data-tag')).join('')}</div></div>`).join('')}
    ${her ? (hasPartner() ? `<div class="srow" style="border-top:1px solid var(--line)"><div class="t"><b>Поделиться с партнёром</b><span>Он увидит текст и теги</span></div><button class="sw on" id="share" role="switch"></button></div>` : '')
          : `<span class="cap">Когда ей показать</span><div class="seg" style="background:var(--field)">${[['now', 'Сразу'], ['later', 'Когда решит'], ['private', 'Только мне']].map(([k, l]) => `<button style="flex:1" class="${d.vis === k ? 'on' : ''}" data-vis="${k}">${l}</button>`).join('')}</div><p class="small muted" id="vis-hint">${VIS_HINT[d.vis]}</p>`}
    <button class="btn" id="save">Сохранить запись</button>`, el => {
    $$('[data-mood]', el).forEach(b => b.onclick = () => { d.mood = d.mood === +b.dataset.mood ? null : +b.dataset.mood; $$('[data-mood]', el).forEach(x => x.classList.toggle('on', +x.dataset.mood === d.mood)); });
    $$('[data-tag]', el).forEach(b => {
      b.onmousedown = e => e.preventDefault();   // не забирать фокус у поля — клавиатура остаётся
      b.onclick = () => { const t = b.dataset.tag; d.tags = d.tags.includes(t) ? d.tags.filter(x => x !== t) : [...d.tags, t]; $$(`[data-tag="${t}"]`, el).forEach(x => x.classList.toggle('on', d.tags.includes(t))); };
    });
    $('#send', el).onmousedown = e => e.preventDefault();
    // пока открыта клавиатура, ниже поля ничего не показываем: теги есть в самом поле, отправка — стрелкой
    const txt = $('#txt', el), sh = el.closest('.sheet');
    let fullH = window.innerHeight;
    const typing = () => { const kb = window.innerHeight < fullH * .8; sh.classList.toggle('typing', document.activeElement === txt && kb); };
    txt.addEventListener('focus', () => setTimeout(typing, 300));
    txt.addEventListener('blur', () => setTimeout(typing, 50));
    window.addEventListener('resize', () => { if (!sh.isConnected) return; fullH = Math.max(fullH, window.innerHeight); typing(); });
    $('#send', el).onclick = () => $('#save', el).click();
    $$('[data-vis]', el).forEach(b => b.onclick = () => { d.vis = b.dataset.vis; $$('[data-vis]', el).forEach(x => x.classList.toggle('on', x === b)); $('#vis-hint', el).textContent = VIS_HINT[d.vis]; });
    const sh = $('#share', el); if (sh) sh.onclick = () => { d.share = !d.share; sh.classList.toggle('on', d.share); };
    $('#save', el).onclick = () => {
      const text = $('#txt', el).value.trim();
      if (!text && !d.tags.length && d.mood == null) return toast('Добавь пару слов, тег или настроение');
      const priv = her ? !d.share : d.vis === 'private';
      const n = { date, text, tags: d.tags, mood: d.mood, role: role(), created: Date.now(), ...(her ? {} : { vis: d.vis === 'private' ? 'later' : d.vis }) };
      if (S.profile.mediator !== false && !priv && text && harshness(text).length) return mediate(n);
      commit(n, priv);
    };
  });
}
async function commit(n, priv) {
  closeSheet();
  try { await Store.addNote(n, priv); toast(priv ? 'Сохранено только для тебя' : 'Сохранено'); }
  catch (e) { toast('Не сохранилось: ' + (e.code || e.message)); }
}
function mediate(n, again) {
  const him = n.role === 'him', i = info(n.date, cycle()), other = him ? 'ей' : 'ему';
  const ctx = him ? { winter: 'У неё сейчас зима — силы на нуле, и это не про тебя.', spring: 'У неё весна — разговор о том, что болит, сейчас будет услышан легче.', summer: 'У неё лето — хорошее время сказать о своих потребностях прямо и спокойно.', autumn: 'У неё осень — резкость с её стороны часто про реальную перегрузку, а не про тебя.' }[i.season]
    : 'Твоё раздражение — сигнал, что что-то важно. Его стоит услышать, а не проглотить.';
  sheet(`<div class="ttl"><b>${again ? 'Ещё звучит резко' : 'Пауза на минуту'}</b></div>
    <p style="font-size:15px;line-height:22px">Похоже, тебе сейчас тяжело. Это нормально — у тебя тоже есть пределы, и твои чувства важны.</p>
    <p class="small muted">Что могло бы ранить ${other}: ${harshness(n.text).join(', ')}. Это видишь только ты — проверка идёт на телефоне.</p>
    <div class="banner" style="font-weight:400">${ctx}</div>
    <div class="card" style="background:var(--field);gap:4px"><b class="small">Попробуй так</b><span class="small" style="font-size:14px">Я заметил(а)… · Я почувствовал(а)… · Мне бы хотелось…</span></div>
    <textarea class="f" id="mtxt" rows="4"></textarea>
    <button class="btn" id="m-send">${ic('check')}Проверить и отправить</button>
    <button class="btn ghost" id="m-private">Оставить только себе</button>
    <button class="btn ghost" id="m-anyway">Отправить как есть</button>
    <button class="btn link" id="m-drop">Удалить</button>`, el => {
    $('#mtxt', el).value = n.text;
    const cur = () => $('#mtxt', el).value.trim();
    // правка проверяется заново — пока текст не станет мягче или не нажата «Отправить как есть»
    $('#m-send', el).onclick = () => { const t = cur(); if (!t) return toast('Текст пустой'); n.text = t; if (harshness(t).length) return mediate(n, true); commit(n, false); };
    $('#m-private', el).onclick = () => { n.text = cur() || n.text; commit(n, true); };
    $('#m-anyway', el).onclick = () => { n.text = cur() || n.text; if (him) n.vis = 'later'; commit(n, false); };
    $('#m-drop', el).onclick = () => closeSheet();
  });
}
function confirmSheet(title, text, yes, onYes) {
  sheet(`<div class="ttl"><b>${title}</b></div><p class="muted" style="font-size:15px">${text}</p><button class="btn" id="yes">${yes}</button><button class="btn ghost" data-close>Отмена</button>`,
    el => $('#yes', el).onclick = async () => { closeSheet(); try { await onYes(); } catch (e) { toast('Не получилось: ' + (e.code || e.message)); } });
}

/* ================= обработчики ================= */
function bind(app) {
  $$('[data-tab]', app).forEach(b => b.onclick = () => go(b.dataset.tab));
  $$('[data-entry]', app).forEach(b => b.onclick = () => openEntry(b.dataset.entry));
  $$('[data-feel]', app).forEach(b => b.onclick = () => setFeel(b.dataset.fdate, b.dataset.feel));
  $$('[data-quick]', app).forEach(b => b.onclick = () => openEntry(today(), b.dataset.quick));
  $$('[data-goday]', app).forEach(b => b.onclick = () => { if (UI.tab === 'today') UI.from = 'today'; UI.sel = b.dataset.goday; UI.view = UI.sel.slice(0, 7); UI.tab = 'cal'; sessionStorage.setItem('is-tab', 'cal'); render(); });
  $$('[data-day]', app).forEach(b => b.onclick = () => { UI.sel = b.dataset.day; render(); const c = $('#dayCard'); c && c.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $$('[data-mon]', app).forEach(b => b.onclick = () => { const [y, m] = UI.view.split('-').map(Number), d = new Date(Date.UTC(y, m - 1 + +b.dataset.mon, 1)); UI.view = d.toISOString().slice(0, 7); render(); });
  $$('.bub.out', app).forEach(b => b.onclick = () => {
    const n = allNotes().find(x => x.id === b.dataset.note); if (!n) return;
    confirmSheet('Удалить запись?', esc(n.text || 'Запись без текста') + ' — ' + fmt(n.date), 'Удалить', () => Store.delNote(n));
  });
  const on = (id, f) => { const e = $('#' + id, app); if (e) e.onclick = f; };
  on('reveal', () => Store.updateCouple({ revealedAt: Date.now() }));
  on('out', () => confirmSheet('Выйти из аккаунта?', 'Данные останутся в облаке — войдёшь снова и всё увидишь.', 'Выйти', () => Store.signOut()));
  on('demo-role', () => Demo.switchRole());
  on('upd', () => checkUpdate());
  on('invite', async () => { try { await Store.invite(); } catch (e) { toast('Не получилось: ' + (e.code || e.message)); } });
  on('share', () => { const t = `Код для «Внутренних сезонов»: ${S.couple.inviteCode}\n\nВставь это сообщение целиком — код найдётся сам. Приложение: https://github.com/EyeAnton/inner-seasons-releases/releases/latest/download/inner-seasons.apk`; if (A && A.share) A.share(t); else if (navigator.share) navigator.share({ text: t }).catch(() => {}); else { navigator.clipboard && navigator.clipboard.writeText(t); toast('Код скопирован'); } });
  on('unlink', () => confirmSheet('Отвязать партнёра?', 'Он перестанет видеть твои сезоны и записи. Его прошлые заметки останутся у тебя.', 'Отвязать', () => Store.unlink()));
  on('leave', () => confirmSheet('Выйти из пары?', 'Ты перестанешь видеть её сезоны и записи.', 'Выйти из пары', () => Store.leave()));
  on('wipe', () => confirmSheet('Удалить все мои данные?', 'Удалятся твои записи, профиль и согласие' + (role() === 'her' ? ', а пара будет распущена' : '') + '. Это нельзя отменить.', 'Удалить навсегда', () => Store.wipe()));
  $$('[data-theme]', app).forEach(b => b.onclick = () => setPrefs({ theme: b.dataset.theme }));
  $$('[data-mode]', app).forEach(b => b.onclick = () => setPrefs({ mode: b.dataset.mode }));
  $$('[data-sw]', app).forEach(b => b.onclick = () => {
    const k = b.dataset.sw;
    if (k.startsWith('r:')) { const r = rules(); r[k.slice(2)] = !r[k.slice(2)]; Store.updateCouple({ rules: r }); }
    else if (k === 'mediator') Store.saveProfile({ mediator: S.profile.mediator === false });
    else if (k === 'notify') { const on = !prefs.notify; prefs.notifyOff = !on; setPrefs({ notify: on }); if (on && A && A.notificationsAllowed && !A.notificationsAllowed()) askNotify(); }
  });
  const ls = $('#ls', app); if (ls) ls.onchange = e => e.target.value && Store.updateCouple({ cycle: { ...cycle(), lastStart: e.target.value } });
  if ($('#cl', app)) {
    bindStepper('cl', v => Store.updateCouple({ cycle: { ...cycle(), cycleLen: Math.max(21, Math.min(40, v)) } }));
    bindStepper('bl', v => Store.updateCouple({ cycle: { ...cycle(), bleedLen: Math.max(2, Math.min(8, v)) } }));
  }
}

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

/* ================= старт ================= */
applyTheme();
try { Store.init(); } catch (e) { $('#app').innerHTML = '<p class="pad">Ошибка запуска: ' + esc(e.message) + '</p>'; }
render();
notifyOnStart();
