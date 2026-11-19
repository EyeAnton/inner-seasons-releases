/* Видимость записей партнёра для неё: ровно один из трёх режимов (чистая логика, без DOM; тест — web/test/visibility-test.js) */
const REVEAL_DELAY_DAYS = 7;
const VIS_MODES = ['now', 'delayed', 'onRequest'];
/** Режим из сохранённых правил пары. Старые наборы правил (onRequest/phase/reciprocity/match/delayed/partnerChoice) сводятся к одному режиму:
 * была кнопка — «по кнопке»; было любое другое ограничение — «через 7 дней»; ничего не было — «сразу». */
function visMode(r) {
  r = r || {};
  if (VIS_MODES.includes(r.mode)) return r.mode;
  if (r.onRequest) return 'onRequest';
  if (r.delayed || r.phase || r.reciprocity || r.match) return 'delayed';
  return 'now';
}
const visDays = (a, b) => Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 864e5);
/** Сколько дней до открытия записи в режиме «через 7 дней» (0 и меньше — уже открыта) */
const visDaysLeft = (noteDate, todayISO) => REVEAL_DELAY_DAYS - visDays(todayISO, noteDate);
/** Закрыта ли запись партнёра: null — открыта, иначе { mode, left? } (режимы взаимоисключающие, решает только она) */
function visLock(mode, note, todayISO, reveals) {
  if (mode === 'delayed') { const left = visDaysLeft(note.date, todayISO); return left > 0 ? { mode, left } : null; }
  if (mode === 'onRequest') return reveals && reveals[note.id] ? null : { mode };
  return null;
}
