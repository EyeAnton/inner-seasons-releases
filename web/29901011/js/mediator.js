/* Медиатор: словарь резкости, нормализация, harshness(); шторка паузы mediate() */
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
