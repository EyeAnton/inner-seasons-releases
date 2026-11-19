/* Утилиты, иконки, сезоны, тема, состояние, хранилища (облако/демо), видимость заметок */
'use strict';
/* Внутренние сезоны — мобильное приложение (WebView + Firebase).
 * Данные: Firestore (users/{uid}, users/{uid}/private, couples/{cid}, couples/{cid}/shared + shared_tags + status/{uid}, invites/{code}; старая notes — только чтение и перенос).
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
  get now() { return revealHint() + ' Это решает она сама.'; },
  private: 'Запись увидишь только ты.'
};
const MOODS = [['bolt', 'Бодро'], ['calm', 'Спокойно'], ['heart', 'Нежно'], ['sad', 'Тяжело'], ['pain', 'Больно']];
const DEFAULT_CYCLE = { lastStart: addDays(today(), -9), cycleLen: 28, bleedLen: 5 };
const DEFAULT_RULES = { mode: 'now' };

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
  const m = visMode(rules());
  return m === 'onRequest' ? 'Ей откроется, когда она нажмёт «Открыть» на этой записи.'
    : m === 'delayed' ? `Ей откроется через ${REVEAL_DELAY_DAYS} ${plural(REVEAL_DELAY_DAYS, 'день', 'дня', 'дней')} после даты записи.` : 'Она увидит запись сразу.';
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
const S = { authReady: false, user: null, profile: null, couple: null, shared: [], priv: [], loading: true, feel: {}, partnerShare: {}, reveals: {} };
let UI = { tab: sessionStorage.getItem('is-tab') || 'today', sel: today(), view: today().slice(0, 7), consent: false, busy: false };
const role = () => S.profile && S.profile.role;
const cycle = () => (S.couple && S.couple.cycle) || DEFAULT_CYCLE;
const rules = () => Object.assign({}, DEFAULT_RULES, S.couple && S.couple.rules);
const partnerName = () => role() === 'her' ? (S.couple && S.couple.himName) : (S.couple && S.couple.herName);
const hasPartner = () => !!(S.couple && S.couple.him);
/* ощущение дня: couples/{cid}/status/{uid} = { feel: {дата: сезон}, updatedAt }. Свой — всегда, партнёра — только если она открыла «Ощущение дня» */
const feelOf = iso => (S.feel && S.feel[iso]) || null;
function setFeel(iso, s) { const f = Object.assign({}, S.feel || {}); if (f[iso] === s && s === info(iso, cycle()).season) return; f[iso] = s; return Store.saveFeel(f).catch(e => toast('Не сохранилось: ' + (e.code || e.message))); }
function feelPicker(iso) {
  const fc = info(iso, cycle()).season, f = feelOf(iso), isToday = iso === today();
  const q = f ? (isToday ? 'Сегодня ощущается как' : 'Ощущалось как') : (isToday ? `По прогнозу сегодня ${SEASONS[fc].short.toLowerCase()}. Так и есть?` : `По прогнозу — ${SEASONS[fc].short.toLowerCase()}. Как ощущалось?`);
  return `<div class="feel"><b class="small" style="font-size:14px">${q}</b><div class="fpills">${ORDER.map(o => `<button class="fpill ${f === o ? 'on' : ''}" data-feel="${o}" data-fdate="${iso}" style="--f:var(--${SEASONS[o].key});--fT:var(--${SEASONS[o].key}T);--fA:var(--${SEASONS[o].key}A)">${SEASONS[o].short}${o === fc ? '<small>прогноз</small>' : ''}</button>`).join('')}</div>
    ${!f && isToday ? `<button class="btn soft" data-feel="${fc}" data-fdate="${iso}">Да, ${SEASONS[fc].short.toLowerCase()}</button>` : ''}</div>`;
}
/* центры не лежат в записи: подмешиваем расшифрованные (Centers.map), старые открытые остаются в n.centers до миграции */
const withCenters = n => (typeof Centers !== 'undefined' && Centers.map[n.id] && !n.centers) ? { ...n, centers: Centers.map[n.id] } : n;
const allNotes = () => [...S.shared, ...S.priv.map(n => ({ ...n, private: true }))].map(withCenters);

/* ================= хранилище: облако ================= */
/* Локальная проверка: открыть с ?emulator=1 на localhost — Auth 9099 и Firestore 8080 эмулятора, без боевого конфига */
const LOCAL_EMU = location.search.includes('emulator=1') && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const CFG = window.FIREBASE_CONFIG || (LOCAL_EMU ? { firebase: { apiKey: 'demo', authDomain: 'localhost', projectId: 'demo-inner-seasons', appId: 'demo' } } : null);
let fb = null;
/* Подписки на записи, статус дня и флаги «что видит партнёр». Записи разложены по пяти источникам:
 * legacy — старая коллекция notes (пока не перенесена), mine — shared где автор я, theirs — shared партнёра
 * (запросы только с where author == uid, иначе правила не могут их доказать), tags — shared_tags партнёрки (теги без текста). */
const NOTEBUF = { legacy: [], mine: [], theirs: [], tags: [] };
const tagsProj = d => ({ author: d.author, date: d.date || '', role: d.role || 'her', tags: d.tags || [], created: d.created || Date.now() });
const Sync = {
  key: null, base: [], noteKey: null, notes: [], stKey: null, st: null, mbusy: {}, fm: false, mineOk: false, mrun: 0,
  stop() {
    [...this.base, ...this.notes, ...(this.st ? [this.st] : [])].forEach(f => f());
    this.base = []; this.notes = []; this.st = null; this.key = this.noteKey = this.stKey = null; this.fm = false; this.mineOk = false; this.mbusy = {};
    Object.assign(NOTEBUF, { legacy: [], mine: [], theirs: [], tags: [] }); S.shared = []; S.feel = {}; S.partnerShare = {}; S.reveals = {};
  },
  merge() {
    const me = S.user && S.user.uid, c = S.couple; if (!me || !c) return;
    const her = c.her === me, pf = S.partnerShare || {}, seen = new Set(), out = [];
    const add = n => { if (!seen.has(n.id)) { seen.add(n.id); out.push(n); } };
    NOTEBUF.mine.forEach(add); NOTEBUF.theirs.forEach(add);
    NOTEBUF.legacy.forEach(n => {
      const l = { ...n, _legacy: true };
      // старые записи владелицы лежат открыто: партнёру показываем только то, что она открыла
      if (!her && n.author === c.her) { if (pf.notes) add(l); else if (pf.tags) { const { text, centers, mood, ...t } = l; add(t); } return; }
      add(l);
    });
    NOTEBUF.tags.forEach(add);
    S.shared = out;
  },
  couple() {
    const c = S.couple, me = S.user && S.user.uid; if (!c || !me) return;
    const her = c.her === me, partner = her ? c.him : c.her, key = c.id + '|' + partner;
    if (key !== this.key) {
      this.stop(); this.key = key;
      const col = n => fb.db.collection('couples/' + c.id + '/' + n);
      this.base.push(col('notes').onSnapshot(s => { NOTEBUF.legacy = s.docs.map(d => ({ id: d.id, ...d.data() })); this.merge(); render(); Centers.migrate(); this.migrateNotes(); }, () => {}));
      this.base.push(this.q('shared', me, 'mine'));
      if (her) this.base.push(col('reveals').onSnapshot(s => { S.reveals = {}; s.docs.forEach(d => { S.reveals[d.id] = true; }); render(); }, () => { S.reveals = {}; }));
      if (!her) this.base.push(fb.db.doc('couples/' + c.id + '/share/' + c.her).onSnapshot(s => { S.partnerShare = s.exists ? (s.data().items || {}) : {}; this.sub(); render(); }, () => { S.partnerShare = {}; this.sub(); }));
    }
    this.sub();
    if (her) this.migrateFeel();
  },
  q(coll, uid, k) {
    return fb.db.collection('couples/' + S.couple.id + '/' + coll).where('author', '==', uid)
      .onSnapshot(s => { NOTEBUF[k] = s.docs.map(d => ({ id: d.id, ...d.data() })); if (k === 'mine') { this.mineOk = true; this.migrateNotes(); } this.merge(); render(); }, () => { NOTEBUF[k] = []; this.merge(); render(); });
  },
  /** партнёрские записи и статус зависят от флагов в share/{её uid}: при смене флага переподписываемся */
  sub() {
    const c = S.couple, me = S.user.uid, her = c.her === me, partner = her ? c.him : c.her, pf = S.partnerShare || {};
    const nk = (her ? 'h' : (pf.notes ? 'n' : '') + (pf.tags ? 't' : '')) + '|' + partner;
    if (nk !== this.noteKey) {
      this.notes.forEach(f => f()); this.notes = []; this.noteKey = nk; NOTEBUF.theirs = []; NOTEBUF.tags = [];
      if (partner && (her || pf.notes)) this.notes.push(this.q('shared', partner, 'theirs'));
      if (partner && !her && pf.tags && !pf.notes) this.notes.push(this.q('shared_tags', partner, 'tags'));
      this.merge();
    }
    const sk = her ? 'me' : pf.status ? 'p' : '-';
    if (sk !== this.stKey) {
      if (this.st) this.st(); this.st = null; this.stKey = sk; S.feel = {};
      if (sk !== '-') this.st = fb.db.doc('couples/' + c.id + '/status/' + (her ? me : c.her))
        .onSnapshot(s => { S.feel = s.exists ? (s.data().feel || {}) : {}; render(); }, () => { S.feel = {}; render(); });
    }
  },
  /** Старое поле couples.feel открыто обоим: переносим в status/{uid} и удаляем */
  async migrateFeel() {
    const c = S.couple; if (this.fm || !c || c.feel === undefined) return; this.fm = true;
    try {
      const ref = fb.db.doc('couples/' + c.id + '/status/' + S.user.uid), cur = await ref.get();
      await ref.set({ feel: { ...(c.feel || {}), ...(cur.exists ? cur.data().feel || {} : {}) }, updatedAt: Date.now() });
      await fb.db.doc('couples/' + c.id).update({ feel: firebase.firestore.FieldValue.delete() });
    } catch (e) { this.fm = false; }
  },
  /** Мои записи из старой коллекции notes → shared (+ shared_tags для записей владелицы). Только КОПИРУЕТ: старые записи не удаляются и не меняются.
   *  Запись с центрами ждёт, пока её центры зашифрованы в private/{uid}/centers (Centers.migrate). Что не получилось — остаётся в старом месте и видно как раньше.
   *  Когда переносить больше нечего, ставим couples/{cid}/private/{uid}.migratedAt; повтор не дублирует записи (проверка по id). */
  async migrateNotes() {
    const c = S.couple; if (!c || !this.mineOk || !Centers.wrapLoaded || Centers.migratedAt || this.mrun) return;
    this.mrun = 1;
    try {
      const have = new Set(NOTEBUF.mine.map(x => x.id)); let pending = 0;
      for (const n of NOTEBUF.legacy.filter(x => x.author === S.user.uid)) {
        if (have.has(n.id) || this.mbusy[n.id]) continue;
        if (n.centers && !Centers.docs[n.id]) { pending++; continue; }
        try {
          const { id, centers, ...rest } = n, b = fb.db.batch(), base = 'couples/' + c.id + '/';
          b.set(fb.db.doc(base + 'shared/' + id), rest);
          if (rest.role === 'her') b.set(fb.db.doc(base + 'shared_tags/' + id), tagsProj(rest));
          await b.commit(); this.mbusy[id] = 1;
        } catch (e) { pending++; }
      }
      if (!pending) await Centers.markMigrated().catch(() => {});
    } finally { this.mrun = 0; }
  }
};
const Cloud = {
  init() {
    firebase.initializeApp(CFG.firebase);
    fb = { auth: firebase.auth(), db: firebase.firestore() };
    if (LOCAL_EMU) { fb.auth.useEmulator('http://127.0.0.1:9099'); fb.db.useEmulator('127.0.0.1', 8080); }
    fb.db.enablePersistence({ synchronizeTabs: false }).catch(() => {});
    let unsub = [];
    const stop = () => { unsub.forEach(f => f()); unsub = []; };
    fb.auth.onAuthStateChanged(u => {
      stop(); Sync.stop(); S.authReady = true; S.user = u ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '' } : null;
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
          coupleSub.push(fb.db.doc('couples/' + p.coupleId).onSnapshot(s => { S.couple = s.exists ? { id: s.id, ...s.data() } : null; S.loading = false; if (S.couple) Sync.couple(); else Sync.stop(); render(); }, err => { S.couple = null; S.loading = false; Sync.stop(); render(); }));
          coupleSub.push(startPrivacy(p.coupleId, u.uid));   // centers.js: шифрованные центры и настройки «что видит партнёр»
        } else { S.couple = null; Sync.stop(); S.loading = false; }
        render();
      }, err => { toast('Нет доступа к базе: ' + err.code); S.loading = false; render(); }));
      unsub.push(fb.db.collection('users/' + u.uid + '/private').onSnapshot(s => { S.priv = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); Centers.migrate(); }, () => {}));
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
  signOut() { if (typeof reminderSet === 'function') reminderSet(false); fb.auth.signOut(); if (A && A.googleSignOut) A.googleSignOut(); },
  saveProfile(p) { return fb.db.doc('users/' + S.user.uid).set(p, { merge: true }); },
  async createCouple(cyc) {
    const ref = fb.db.collection('couples').doc();
    await ref.set({ her: S.user.uid, him: null, herName: S.user.name, createdAt: Date.now(), cycle: cyc, rules: DEFAULT_RULES });
    await Cloud.saveProfile({ role: 'her', coupleId: ref.id });
  },
  updateCouple(p) { return fb.db.doc('couples/' + S.couple.id).update(p); },
  /** «Открыть» на записи партнёра: couples/{cid}/reveals/{noteId} = { at }, пишет только владелица */
  revealNote(id) { return fb.db.doc('couples/' + S.couple.id + '/reveals/' + id).set({ at: Date.now() }); },
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
  async addNote(n, priv) {
    const { centers, ...rest } = n, doc = { ...rest, author: S.user.uid };
    // общие записи — в couples/{cid}/shared; у владелицы ещё проекция тегов без текста (shared_tags), её читает партнёр при флаге «Теги записей»
    const col = priv ? fb.db.collection('users/' + S.user.uid + '/private') : fb.db.collection('couples/' + S.couple.id + '/shared');
    const ref = col.doc();
    const put = () => {
      if (priv || doc.role !== 'her') return ref.set(doc);
      const b = fb.db.batch(); b.set(ref, doc); b.set(fb.db.doc('couples/' + S.couple.id + '/shared_tags/' + ref.id), tagsProj(doc));
      return b.commit().then(() => { if (typeof pushNotify === 'function') pushNotify('shared', ref.id); });
    };
    if (centers && Centers.active()) {
      // центры уходят только зашифрованными; без фразы запись сохраняется без центров
      if (await Centers.prompt()) { await Centers.save(ref.id, centers); await put(); return ref; }
      toast('Центры не сохранены: без фразы их нельзя зашифровать');
    } else if (centers) doc.centers = centers;   // нет пары: запись только моя, лежит в users/{uid}/private
    await put(); return ref;
  },
  delNote(n) {
    Centers.remove(n.id);
    if (n.private) return fb.db.doc('users/' + S.user.uid + '/private/' + n.id).delete();
    const base = 'couples/' + S.couple.id + '/', b = fb.db.batch();
    b.delete(fb.db.doc(base + (n._legacy ? 'notes/' : 'shared/') + n.id));
    if (!n._legacy && n.role === 'her' && n.author === S.user.uid) b.delete(fb.db.doc(base + 'shared_tags/' + n.id));
    return b.commit();
  },
  saveFeel(f) {
    return fb.db.doc('couples/' + S.couple.id + '/status/' + S.user.uid).set({ feel: f, updatedAt: Date.now() })
      .then(() => { if (typeof pushNotify === 'function') pushNotify('status'); });
  },
  async wipe() {
    await Centers.wipe();
    const uid = S.user.uid, b = fb.db.batch(), base = 'couples/' + (S.couple && S.couple.id) + '/';
    S.priv.forEach(n => b.delete(fb.db.doc('users/' + uid + '/private/' + n.id)));
    S.shared.filter(n => n.author === uid).forEach(n => {
      b.delete(fb.db.doc(base + (n._legacy ? 'notes/' : 'shared/') + n.id));
      if (!n._legacy && n.role === 'her') b.delete(fb.db.doc(base + 'shared_tags/' + n.id));
    });
    if (S.couple) b.delete(fb.db.doc(base + 'status/' + uid));
    await b.commit();
    if (S.couple && role() === 'her') {
      const rest = await fb.db.collection('couples/' + S.couple.id + '/notes').get();
      if (!rest.empty || S.shared.some(n => n.author !== uid)) await Cloud.unlink();
      if (S.couple.inviteCode) await fb.db.doc('invites/' + S.couple.inviteCode).delete().catch(() => {});
      if (rest.empty && !S.shared.some(n => n.author !== uid)) await fb.db.doc('couples/' + S.couple.id).delete();
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
    S.feel = (S.couple && S.couple.feel) || {};
    S.reveals = Object.assign({}, (S.couple && S.couple.reveals) || {});
  },
  saveFeel(f) { return this.updateCouple({ feel: f }); },
  init() { this.load(); S.authReady = true; S.loading = false; this.sync(); },
  signIn() {
    this.d = this.d || { as: 'her', her: { uid: 'demo-her', name: 'Лера', email: 'demo@local' }, him: { uid: 'demo-him', name: 'Антон', email: 'demo2@local' }, profiles: {}, couples: {}, notes: [], priv: [], invites: {} };
    this.d.profiles[this.d.her.uid] = this.d.profiles[this.d.her.uid] || { consentAt: Date.now() };
    this.save();
  },
  signOut() { if (typeof reminderSet === 'function') reminderSet(false); this.d = null; lsSet('is-demo', null); S.user = null; render(); },
  saveProfile(p) { const u = S.user.uid; this.d.profiles[u] = { ...(this.d.profiles[u] || {}), ...p }; this.save(); return Promise.resolve(); },
  async createCouple(cyc) { const id = 'c' + rid(4); this.d.couples[id] = { id, her: S.user.uid, him: null, herName: S.user.name, cycle: cyc, rules: DEFAULT_RULES }; return this.saveProfile({ role: 'her', coupleId: id }); },
  updateCouple(p) { Object.assign(this.d.couples[S.couple.id], p); this.save(); return Promise.resolve(); },
  revealNote(id) { const c = this.d.couples[S.couple.id]; c.reveals = { ...(c.reveals || {}), [id]: { at: Date.now() } }; this.save(); return Promise.resolve(); },
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
  const l = visLock(visMode(rules()), n, today(), S.reveals);
  if (!l) return [];
  return [l.mode === 'delayed' ? `откроется через ${l.left} ${plural(l.left, 'день', 'дня', 'дней')}` : 'откроется по твоей кнопке'];
}
function visibleNotes() {
  const me = S.user.uid;
  return allNotes().filter(n => n.author === me || !n.private).sort((a, b) => (b.date + (b.created || 0)).localeCompare(a.date + (a.created || 0)));
}
