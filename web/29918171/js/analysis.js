/* Анализ дня, месяца и сезона по трём центрам (мысли, чувства, ощущения). Всё на устройстве: правила и статистика, без сети.
 * Чистые функции: dayAnalysis, monthAnalysis, seasonAnalysis. Запись: { date, tags, text, centers?: {thoughts, feelings, body} }.
 * Значение центра может быть текстом, числом 1–5 (1 — напряжённо, 5 — спокойно) или объектом { text, level }. */
'use strict';

/* ---- тексты (шаблоны; {…} подставляются значениями) ---- */
const AN_TXT = {
  titleDay: 'Анализ дня',
  titleMonth: 'Итоги месяца',
  titleSeason: 'Итоги сезона',
  empty: 'Записей за этот период пока нет — и это тоже нормально.',
  count: 'Записей: {n}.',
  topCenter: 'Чаще всего ты отмечала центр «{center}»: {n} из {total} отметок.',
  noCenters: 'Центры наблюдения в записях не отмечены — смотрим по тегам и словам.',
  gap: 'Похоже, {a} спокойнее, чем {b}. Так бывает: можно мягко заметить, чего хочет {b}.',
  gapNone: 'Мысли, чувства и ощущения звучат примерно в одном тоне.',
  topTags: 'Чаще всего повторялось: {tags}.',
  tagsNone: 'Тегов за период не было.',
  tone: 'В целом период был {tone}.',
  match: 'Твои записи совпали с прогнозом сезона в {pct}% случаев ({n} из {total}).',
  matchHigh: 'Тело и прогноз шли в ногу.',
  matchLow: 'Ты чувствовала иначе, чем по прогнозу, — твоё ощущение важнее календаря.',
  bestDay: 'Самый наполненный день: {date}.',
  closing: 'Спасибо, что наблюдаешь за собой. Это уже забота.'
};
const AN_CENTERS = { thoughts: 'мысли', feelings: 'чувства', body: 'ощущения' };
const AN_KEYS = ['thoughts', 'feelings', 'body'];
const AN_TONES = { calm: 'скорее спокойным', tense: 'скорее напряжённым', mixed: 'разным по настроению' };
const AN_TENSE_WORDS = /тревог|напряж|боль|больно|тяжел|тяжёл|устал|раздраж|злост|злюсь|давит|тесно|зажат|слёз|слез|страх|боюсь|ноет|тянет низ|сжимает/i;
const AN_CALM_WORDS = /спокой|тепл|легк|лёгк|уют|рада|радост|нежн|расслаб|тихо|свобод|мягк|отдых|ясн|уверен/i;
const AN_TENSE_TAGS = ['устала', 'раздражение', 'тревога', 'боль', 'слёзы', 'ранимость'];
const AN_CALM_TAGS = ['нежность', 'нужна тишина', 'хочется обнимашек', 'уют', 'медленно', 'мечтательность', 'спокойствие', 'радость', 'уверенность', 'энергия', 'вдохновение', 'игривость'];
const AN_CLOSED_KEY = 'is-analysis-closed';

const anFill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const anList = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1] : a[0] || '';

/** Тон значения центра: 'calm' | 'tense' | null */
function anToneOf(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v <= 2 ? 'tense' : v >= 4 ? 'calm' : null;
  if (typeof v === 'object') { if (typeof v.level === 'number') return anToneOf(v.level); return anToneOf(v.text || v.value || ''); }
  const s = String(v), t = AN_TENSE_WORDS.test(s), c = AN_CALM_WORDS.test(s);
  return t && !c ? 'tense' : c && !t ? 'calm' : null;
}
const anHasValue = v => v != null && v !== '' && !(typeof v === 'object' && !v.text && !v.value && typeof v.level !== 'number');

/** Тон записи по тегам и тексту (запасной путь для записей без centers) */
function anNoteTone(n) {
  let t = 0, c = 0;
  for (const g of n.tags || []) { if (AN_TENSE_TAGS.includes(g)) t++; else if (AN_CALM_TAGS.includes(g)) c++; }
  const x = anToneOf(n.text); if (x === 'tense') t++; else if (x === 'calm') c++;
  return t > c ? 'tense' : c > t ? 'calm' : null;
}
/** Сезон по группе тега: соответствие TAG_GROUPS (w/s/u/a) */
const AN_GROUP_SEASON = { w: 'winter', s: 'spring', u: 'summer', a: 'autumn' };
function anNoteSeason(n, groups) {
  const cnt = {};
  for (const g of n.tags || []) { const gr = (groups || []).find(x => x.tags.includes(g)); if (gr) cnt[gr.k] = (cnt[gr.k] || 0) + 1; }
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  return top.length && (top.length === 1 || top[0][1] > top[1][1]) ? AN_GROUP_SEASON[top[0][0]] : null;
}

/** Общая статистика по набору записей */
function anStats(notes, opts = {}) {
  const centerCount = { thoughts: 0, feelings: 0, body: 0 }, centerTone = { thoughts: [], feelings: [], body: [] };
  const tagCount = {}, tones = { calm: 0, tense: 0 }, perDay = {};
  for (const n of notes) {
    perDay[n.date] = (perDay[n.date] || 0) + 1;
    for (const g of n.tags || []) tagCount[g] = (tagCount[g] || 0) + 1;
    const nt = anNoteTone(n); if (nt) tones[nt]++;
    const c = n.centers;
    if (c && typeof c === 'object') for (const k of AN_KEYS) if (anHasValue(c[k])) {
      centerCount[k]++;
      const t = anToneOf(c[k]); if (t) centerTone[k].push(t);
    }
  }
  const total = AN_KEYS.reduce((s, k) => s + centerCount[k], 0);
  const top = AN_KEYS.slice().sort((a, b) => centerCount[b] - centerCount[a])[0];
  // расхождение: средний «напряжённый» вклад центра против остальных
  const score = k => { const a = centerTone[k]; return a.length ? a.filter(x => x === 'calm').length / a.length - a.filter(x => x === 'tense').length / a.length : null; };
  let gap = null;
  const sc = AN_KEYS.map(k => [k, score(k)]).filter(x => x[1] != null);
  if (sc.length >= 2) {
    sc.sort((a, b) => b[1] - a[1]);
    const hi = sc[0], lo = sc[sc.length - 1];
    if (hi[1] - lo[1] >= 1) gap = { calm: hi[0], tense: lo[0] };
  }
  const topTags = Object.entries(tagCount).filter(e => e[1] >= (notes.length > 3 ? 2 : 1)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(e => e[0]);
  let match = null;
  if (opts.seasonOf) {
    let n = 0, ok = 0;
    for (const x of notes) { const s = anNoteSeason(x, opts.groups); if (s) { n++; if (s === opts.seasonOf(x.date)) ok++; } }
    if (n) match = { n: ok, total: n, pct: Math.round(100 * ok / n) };
  }
  const tone = tones.calm + tones.tense === 0 ? null : tones.calm > tones.tense * 1.5 ? 'calm' : tones.tense > tones.calm * 1.5 ? 'tense' : 'mixed';
  const bestDay = Object.entries(perDay).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return { count: notes.length, centerCount, centerTotal: total, top: total ? top : null, gap, topTags, match, tone, bestDay: bestDay && bestDay[1] > 1 ? bestDay[0] : null };
}

/** Превращает статистику в список тёплых фраз */
function anLines(st, opts = {}) {
  const L = [];
  if (!st.count) return [AN_TXT.empty];
  L.push(anFill(AN_TXT.count, { n: st.count }));
  if (st.top) L.push(anFill(AN_TXT.topCenter, { center: AN_CENTERS[st.top], n: st.centerCount[st.top], total: st.centerTotal }));
  else L.push(AN_TXT.noCenters);
  if (st.gap) L.push(anFill(AN_TXT.gap, { a: AN_CENTERS[st.gap.calm], b: AN_CENTERS[st.gap.tense] }));
  else if (st.centerTotal >= 3) L.push(AN_TXT.gapNone);
  if (st.topTags.length) L.push(anFill(AN_TXT.topTags, { tags: anList(st.topTags) }));
  else if (!opts.day) L.push(AN_TXT.tagsNone);
  if (st.tone && !opts.day) L.push(anFill(AN_TXT.tone, { tone: AN_TONES[st.tone] }));
  if (st.match) L.push(anFill(AN_TXT.match, st.match) + ' ' + (st.match.pct >= 60 ? AN_TXT.matchHigh : st.match.pct <= 30 ? AN_TXT.matchLow : ''));
  if (st.bestDay && !opts.day) L.push(anFill(AN_TXT.bestDay, { date: typeof fmt === 'function' ? fmt(st.bestDay) : st.bestDay }));
  L.push(AN_TXT.closing);
  return L.map(s => s.trim());
}

/** notes — записи автора; opts: { seasonOf(iso), groups } */
function dayAnalysis(notes, date, opts = {}) {
  const day = notes.filter(n => n.date === date), st = anStats(day, opts);
  return { kind: 'day', title: AN_TXT.titleDay, date, stats: st, lines: anLines(st, { ...opts, day: true }) };
}
/** period: { from, to } включительно (ISO-даты) */
function seasonAnalysis(notes, period, opts = {}) {
  const sel = notes.filter(n => n.date >= period.from && n.date <= period.to), st = anStats(sel, opts);
  return { kind: 'season', title: AN_TXT.titleSeason, period, stats: st, lines: anLines(st, opts) };
}
function monthAnalysis(notes, year, month, opts = {}) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`, end = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(end).padStart(2, '0')}`;
  const sel = notes.filter(n => n.date >= from && n.date <= to), st = anStats(sel, opts);
  return { kind: 'month', title: AN_TXT.titleMonth, period: { from, to }, stats: st, lines: anLines(st, opts) };
}

/* ---- периоды: что закончилось ---- */
/** Последний полностью закончившийся сезон: { season, from, to } по циклу (нужны info и ORDER из core.js, либо infoFn) */
function lastEndedSeason(cyc, todayIso, infoFn) {
  const inf = infoFn || info, add = (iso, k) => new Date(Date.parse(iso + 'T00:00:00Z') + k * 864e5).toISOString().slice(0, 10);
  const cur = inf(todayIso, cyc).season;
  let d = todayIso;
  for (let i = 0; i < 80 && inf(d, cyc).season === cur; i++) d = add(d, -1);
  const season = inf(d, cyc).season, to = d;
  for (let i = 0; i < 80 && inf(d, cyc).season === season; i++) d = add(d, -1);
  return { season, from: add(d, 1), to };
}
/** Предыдущий календарный месяц относительно todayIso */
function lastEndedMonth(todayIso) {
  const y = +todayIso.slice(0, 4), m = +todayIso.slice(5, 7), d = new Date(Date.UTC(y, m - 2, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/* ---- показ: карточка на «Сегодня» ---- */
const anClosed = () => { const v = typeof lsGet === 'function' ? lsGet(AN_CLOSED_KEY, []) : []; return Array.isArray(v) ? v : []; };
function anClose(id) { const a = anClosed(); if (!a.includes(id)) { a.push(id); typeof lsSet === 'function' && lsSet(AN_CLOSED_KEY, a.slice(-40)); } }

function anCardHtml(an, id, label) {
  return `<div class="an-card" data-an="${esc(id)}"><button class="an-x" data-an-close="${esc(id)}" aria-label="Закрыть">${ic('x')}</button>
    <b class="an-t">${esc(an.title)}</b><span class="small an-s">${esc(label)}</span>
    ${an.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
}
/** HTML карточек итогов, которые ещё не закрыты; видны только Ж (записи приватны) */
function analysisCards() {
  try {
    if (role() !== 'her' || !S.user) return '';
    const mine = allNotes().filter(n => n.author === S.user.uid), now = today(), cyc = cycle(), closed = anClosed();
    const seasonOf = iso => info(iso, cyc).season, opts = { seasonOf, groups: TAG_GROUPS }, out = [];
    const sp = lastEndedSeason(cyc, now), sid = `s:${sp.from}:${sp.to}`;
    if (!closed.includes(sid) && mine.some(n => n.date >= sp.from && n.date <= sp.to))
      out.push(anCardHtml(seasonAnalysis(mine, sp, opts), sid, `${SEASONS[sp.season].name.replace('\n', ' ')} · ${fmt(sp.from)} – ${fmt(sp.to)}`));
    const mp = lastEndedMonth(now), mid = `m:${mp.year}-${pad(mp.month)}`;
    if (!closed.includes(mid)) {
      const an = monthAnalysis(mine, mp.year, mp.month, opts);
      if (an.stats.count) out.push(anCardHtml(an, mid, new Date(Date.UTC(mp.year, mp.month - 1, 1)).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' })));
    }
    return out.join('');
  } catch (e) { return ''; }
}
if (typeof document !== 'undefined') document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-an-close]');
  if (b) { anClose(b.dataset.anClose); const c = b.closest('.an-card'); c && c.remove(); }
});

if (typeof module !== 'undefined') module.exports = { dayAnalysis, monthAnalysis, seasonAnalysis, lastEndedSeason, lastEndedMonth };
