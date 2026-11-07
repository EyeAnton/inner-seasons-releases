/* Экран «Календарь» */
const prevSeason = s => ORDER[(ORDER.indexOf(s) + 3) % 4];
/** Сезон дня с учётом её отметок. Своя отметка — главное. Если позже в том же прогнозном отрезке (не дальше сегодня)
 * она отметила предыдущий по кругу сезон (сезон затянулся), то и этот день без отметки считаем тем, затянувшимся.
 * Ранний приход сезона назад не тянем. Считается на лету, в базу не пишется. */
function effectiveSeason(iso) {
  const f = feelOf(iso); if (f) return f;
  const cyc = cycle(), s = info(iso, cyc).season, t = today();
  for (let d = addDays(iso, 1); diffDays(d, t) <= 0 && info(d, cyc).season === s; d = addDays(d, 1)) {
    const g = feelOf(d); if (g) return g === prevSeason(s) ? g : s;
  }
  return s;
}
/** Врата: [уходящий, приходящий] сезон. Врата в зиму стоят на последнем дне осени, остальные — на первом дне нового сезона. */
const gatePair = i => i.gate === i.season ? [prevSeason(i.season), i.season] : [i.season, i.gate];

function viewCal() {
  const cyc = cycle(), [y, m] = UI.view.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)), days = new Date(Date.UTC(y, m, 0)).getUTCDate(), lead = (first.getUTCDay() + 6) % 7;
  const t = today(), notesBy = {}, her = role() === 'her';
  visibleNotes().forEach(n => notesBy[n.date] = 1);
  let g = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(d => `<span class="dow">${d}</span>`).join('') + '<span></span>'.repeat(lead);
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${pad(m)}-${pad(d)}`, i = info(iso, cyc), fut = diffDays(iso, t) > 0;
    const es = fut ? i.season : effectiveSeason(iso), k = SEASONS[es].key, guess = !fut && !feelOf(iso);
    // врата — градиент уходящего и приходящего сезона, если её отметка не перекрасила день
    const gp = i.gate && es === i.season ? gatePair(i).map(o => SEASONS[o].key) : null;
    const gs = gp ? `;--g1:var(--${gp[0]});--g2:var(--${gp[1]})` : '';
    g += `<button class="dcell ${fut ? 'future' : ''} ${guess ? 'guess' : ''} ${gp ? 'gated' : ''} ${iso === t ? 'now' : ''} ${iso === UI.sel ? 'sel' : ''}" data-day="${iso}" style="--f:var(--${k});--fT:var(--${k}T)${gs}" aria-label="${fmt(iso)}${i.gate ? ', ' + GATES[i.gate].name.toLowerCase() : ''}">
      <b>${d}</b><small>д${i.cd}</small>${notesBy[iso] ? '<span class="nd"></span>' : ''}</button>`;
  }
  const sel = UI.sel, si = info(sel, cyc), sf = diffDays(sel, t) > 0 ? null : effectiveSeason(sel), ses = sf || si.season, ss = SEASONS[ses], dn = visibleNotes().filter(n => n.date === sel);
  // сначала совет тому, чей кабинет; ниже — про другого
  const other = her ? (hasPartner() ? ['Чем он может помочь', ss.him] : null) : ['Что с ней сейчас', ss.her];
  return `<div class="bar"><span class="row" style="gap:6px">${UI.from === 'today' ? `<button class="icon-btn" style="background:none;margin-left:-10px" data-tab="today" aria-label="Назад на главную">${ic('back')}</button>` : ''}<h1>Календарь</h1></span></div>
  <div class="content" style="padding-top:4px">
    <div class="card calcard">
      <div class="cal-head"><button class="icon-btn" data-mon="-1" aria-label="Предыдущий месяц">${ic('back')}</button>
        <span style="display:flex;flex-direction:column;align-items:center"><b style="font-size:17px;text-transform:capitalize">${first.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</b><button class="tolink" data-goday="${t}">Сегодня</button></span>
        <button class="icon-btn" data-mon="1" aria-label="Следующий месяц">${ic('chev')}</button></div>
      <div class="grid7">${g}</div>
    </div>
    <div class="card" id="dayCard" style="${heroVars(ses)}">
      <div class="row"><span class="ico" style="width:48px;height:48px;border-radius:14px;background:var(--hero);color:var(--heroT);flex-direction:column;font-weight:800;line-height:1">${+sel.slice(8)}<small style="font-size:10px;font-weight:400">д${si.cd}</small></span>
        <span style="display:flex;flex-direction:column"><b>${fmtW(sel)}</b><span class="small muted">${ss.name.replace('\n', ' ')}${sf && sf !== si.season ? (feelOf(sel) ? ' · по ощущению' : ' · сезон затянулся') : ''}${si.gate ? ' · ' + GATES[si.gate].name.toLowerCase() : ''}</span></span></div>
      ${her && diffDays(sel, t) <= 0 ? feelPicker(sel) : ''}
      ${si.gate ? `<div class="banner">${ic('gate')}<span>${GATES[si.gate].text}</span></div>` : ''}
      ${si.chamber ? `<p class="small" style="font-size:14px"><b>Зал «${si.chamber[0]}»</b> — ${si.chamber[1]}</p>` : ''}
      <p class="dtip">${her ? ss.her : ss.him}</p>
      ${other ? `<div class="dother"><b>${other[0]}</b><p>${other[1]}</p></div>` : ''}
      ${dn.length ? `<div class="feed">${dn.map(noteBubble).join('')}</div>` : ''}
      <button class="btn" data-entry="${sel}">${ic('plus')}Запись за ${fmt(sel)}</button>
    </div>
  </div>`;
}
