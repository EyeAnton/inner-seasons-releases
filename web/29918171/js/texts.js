/* Тексты: источник — Firestore texts (только status === "approved"); кэш в localStorage — лишь удобство.
   Без сети и без данных работают встроенные тексты (fallback в pickText). */
/* ================= тексты ================= */
const TEXTS = { items: [] };
try { const c = lsGet('is-texts', []); if (Array.isArray(c)) TEXTS.items = c.filter(t => t && typeof t.text === 'string'); } catch (e) {}

/** Утверждённые тексты группы: group = day-hint | ready-reply | push; season — сезон или 'any'; slot — her | him | gate | chamber-N | ситуация. */
function approvedTexts(group, season, slot) {
  try {
    return TEXTS.items.filter(t => t.group === group && (!season || t.season === season) && (!slot || t.slot === slot) && String(t.text).trim()).map(t => t.text);
  } catch (e) { return []; }
}
const textSeed = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
/** Один текст на день (seed — дата): утверждённые по кругу; если их нет — fallback (старый встроенный). */
function pickText(group, season, slot, fallback, seed = today()) {
  const a = approvedTexts(group, season, slot);
  return a.length ? a[textSeed(seed + '|' + group + '|' + season + '|' + slot) % a.length] : fallback;
}
/** До n разных текстов; если утверждённых нет — fallback (массив). */
function pickTexts(group, season, slot, fallback, n, seed = today()) {
  const a = approvedTexts(group, season, slot);
  if (!a.length) return fallback;
  const o = textSeed(seed + '|' + group + '|' + slot), out = [];
  for (let k = 0; k < Math.min(n, a.length); k++) out.push(a[(o + k) % a.length]);
  return out;
}
const seasonText = (season, who, seed) => pickText('day-hint', season, who, SEASONS[season][who], seed);
const gateText = (season, seed) => pickText('day-hint', season, 'gate', GATES[season].text, seed);
const chamberText = (ch, seed) => { const n = CHAMBERS.indexOf(ch); return n < 0 ? ch[1] : pickText('day-hint', 'winter', 'chamber-' + n, ch[1], seed); };

/** Применить список утверждённых: кэш + перерисовка (только если ничего не открыто). Пустой список — остаёмся как есть. */
function textsApply(list) {
  const ap = list.filter(t => t && t.status === 'approved' && typeof t.text === 'string' && t.text.trim())
    .map(t => ({ id: t.id, group: t.group, season: t.season, slot: t.slot, text: t.text }));
  if (!ap.length) return;
  const changed = JSON.stringify(ap) !== JSON.stringify(TEXTS.items);
  TEXTS.items = ap; try { lsSet('is-texts', ap); } catch (e) {}
  // перерисовываем только если ничего не открыто (шторка/ввод) — чтобы не стереть набираемое
  if (changed && typeof render === 'function' && !document.querySelector('#layer .sheet') && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) try { render(); } catch (e) {}
}
/** Из Firestore только status == approved (правила тоже не отдают остальные). Любая ошибка — тихо остаёмся на кэше/встроенных. */
async function textsFromFirestore() {
  try {
    if (typeof fb === 'undefined' || !fb || !fb.db) return false;
    const snap = await fb.db.collection('texts').where('status', '==', 'approved').get();
    textsApply(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    return true;
  } catch (e) { return false; }
}
function textsLoad() {
  try {
    if (typeof fb !== 'undefined' && fb && fb.auth) {
      // тексты читают только вошедшие: ждём входа, тянем один раз
      let done = false;
      fb.auth.onAuthStateChanged(u => { if (u && !done) { done = true; textsFromFirestore(); } });
      return;
    }
    // демо без облака: статичный файл
    fetch('data/texts.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => {
      if (d && Array.isArray(d.items)) textsApply(d.items);
    }).catch(() => {});
  } catch (e) {}
}
