/* Лента записей: noteBubble, экран «Записи» */
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
  let h = `<div class="bar"><h1>Записи</h1></div><div class="content notes" style="padding-top:4px">`;
  if (her && r.onRequest && lockedCount) h += `<button class="btn" id="reveal">${ic('heart')}Я готова — показать, что он заметил</button>`;
  if (her && lockedCount && !r.onRequest) h += `<div class="warnbox">${ic('lock')}<span>${lockedCount} ${lockedCount === 1 ? 'заметка партнёра ждёт' : 'заметки партнёра ждут'} твоих правил раскрытия</span></div>`;
  if (!list.length) h += `<div class="card" style="align-items:center;text-align:center;padding:32px 16px"><span class="ico">${ic('chat')}</span><b>Пока пусто</b><p class="small muted">${her ? 'Записывай, как ты себя чувствуешь — по записям виден твой цикл.' : 'Здесь будут её записи, которыми она делится, и твои наблюдения.'}</p></div>`;
  h += feed(list);
  return h + `</div><button class="fab" data-entry="${today()}">${ic('plus')}Добавить запись</button>`;
}

/** Лента записей — одна для неё и для него: сезон — полупрозрачный фон во всю ширину с подписью в начале отрезка,
 * дата — общий разделитель для её и его сообщений, чужие закрытые заметки — замком (правила в noteBubble). */
function feed(list) {
  let h = '', band = null, last = '';
  for (const n of list.slice(0, 200)) {
    const sk = effectiveSeason(n.date);
    if (sk !== band) {
      if (band) h += '</div></div>';
      band = sk; last = '';
      const k = SEASONS[sk].key;
      h += `<div class="sband" style="--f:var(--${k});--fA:var(--${k}A)"><span class="sname">${SEASONS[sk].name.replace('\n', ' ')}</span><div class="feed">`;
    }
    if (n.date !== last) { last = n.date; h += `<div class="dsep"><span>${fmtW(n.date)}</span></div>`; }
    h += noteBubble(n);
  }
  return band ? h + '</div></div>' : h;
}
