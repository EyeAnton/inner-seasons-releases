/* Экран «Сегодня» */
function viewToday() {
  const her = role() === 'her', i = info(today(), cycle()), ng = nextGate(cycle());
  const felt = feelOf(today()), shown = effectiveSeason(today()), s = SEASONS[shown];
  const pos = { winter: i.cd / i.bounds[0], spring: (i.cd - i.bounds[0]) / i.bounds[1], summer: (i.cd - i.bounds[0] - i.bounds[1]) / 5, autumn: (i.cd - i.bounds[0] - i.bounds[1] - 5) / i.bounds[3] }[i.season];
  // полоски сезонов одинаковой ширины: это четыре части цикла, а не дни; точка — где она внутри своего сезона
  const bar = ORDER.map((o, k) => `<span class="${k === i.idx ? 'on' : ''}">${k === i.idx ? `<i style="left:${Math.min(94, Math.max(6, pos * 100)).toFixed(0)}%"></i>` : ''}</span>`).join('');
  const lab = ORDER.map((o, k) => `<span>${SEASONS[o].short}</span>`).join('');
  const mineToday = allNotes().filter(n => n.author === S.user.uid && n.date === today());
  const pn = partnerName(), first = pn ? pn.split(' ')[0] : '';
  const gateLine = i.gate ? `<button class="hlink" data-goday="${today()}"><span class="hl2"><b>Сегодня ${GATES[i.gate].name.toLowerCase()}</b><small>${GATES[i.gate].text}</small></span>${ic('chev')}</button>`
    : ng ? `<button class="hlink" data-goday="${ng.d}"><span class="hl2"><b>${ng.k} ${plural(ng.k, 'день', 'дня', 'дней')} до ${GATE_TO[ng.g]}</b><small>смотреть в календаре</small></span>${ic('chev')}</button>` : '';
  let h = `<div class="hero htoday" style="${heroVars(shown)}">
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
