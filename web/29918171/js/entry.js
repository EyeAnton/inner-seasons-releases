/* Шторка новой записи */
/* ================= шторка записи ================= */
const TG_SHORT = ['Тихое', 'Лёгкое', 'К людям', 'Трудное'];
const CENTERS = [['thoughts', 'Мысли', 'О чём думалось?'], ['feelings', 'Чувства', 'Что чувствовалось?'], ['body', 'Ощущения', 'Что в теле?']];
function openEntry(date, preset) {
  const her = role() === 'her', d = { mood: null, tags: preset ? [preset] : [], share: hasPartner(), vis: 'now' };
  const i = info(date, cycle());
  sheet(`<div class="ttl"><b>${her ? 'Как ты сегодня?' : 'Что ты заметил?'}</b><span class="small muted">${fmtW(date)} · день ${i.cd} · ${SEASONS[i.season].short.toLowerCase()}</span></div>
    ${her ? `<div class="moods">${MOODS.map(([icn, l], k) => `<button class="mood" data-mood="${k}"><span>${ic(icn)}</span>${l}</button>`).join('')}</div>` : ''}
    <label class="cap" for="txt">${her ? 'Пара слов для себя' : 'Наблюдение без оценок'}</label>
    <div class="compose"><textarea id="txt" rows="3" placeholder="${her ? 'Как ты себя чувствуешь?' : 'Например: вечером много смеялась'}"></textarea>
      <div class="tgwrap"><div class="tgbar"><button class="tgback" id="tgback" aria-label="Свернуть теги" tabindex="-1">${ic('back')}</button>${TAG_GROUPS.map((g, gi) => `<button class="tgbtn" data-tg="${gi}" style="--g:var(--${g.k});--gA:var(--${g.k}A)"><i></i><span>${TG_SHORT[gi] || g.name}</span><em></em></button>`).join('')}</div>
        <button class="send" id="send" aria-label="Сохранить">${ic('up')}</button></div>
      ${TAG_GROUPS.map((g, gi) => `<div class="tgpanel" data-tp="${gi}"><div><div class="chips">${g.tags.map(t => tagChip(t, d.tags.includes(t), 'data-tag')).join('')}</div></div></div>`).join('')}</div>
    <details class="centers"><summary class="cap">Три центра <span class="small muted">· только для тебя, по желанию</span></summary>
      ${CENTERS.map(([k, l, ph]) => `<label class="small muted" for="c-${k}">${l}</label><input id="c-${k}" data-center="${k}" maxlength="200" placeholder="${ph}" autocomplete="off">`).join('')}</details>
    ${her ? (hasPartner() ? `<div class="srow" style="border-top:1px solid var(--line)"><div class="t"><b>Поделиться с партнёром</b><span>Он увидит текст и теги</span></div><button class="sw on" id="share" role="switch"></button></div>` : '')
          : `<span class="cap">Когда ей показать</span><div class="seg" style="background:var(--field)">${[['now', 'Поделиться'], ['private', 'Только мне']].map(([k, l]) => `<button style="flex:1" class="${d.vis === k ? 'on' : ''}" data-vis="${k}">${l}</button>`).join('')}</div><p class="small muted" id="vis-hint">${VIS_HINT[d.vis]}</p>`}
    <button class="btn" id="save">Сохранить запись</button>`, el => {
    $$('[data-mood]', el).forEach(b => b.onclick = () => { d.mood = d.mood === +b.dataset.mood ? null : +b.dataset.mood; $$('[data-mood]', el).forEach(x => x.classList.toggle('on', +x.dataset.mood === d.mood)); });
    const tgSync = () => TAG_GROUPS.forEach((g, gi) => { const c = g.tags.filter(t => d.tags.includes(t)).length, b = $(`[data-tg="${gi}"]`, el); $('em', b).textContent = c || ''; b.classList.toggle('has', !!c); });
    let tgOpen = -1;
    const tgSet = gi => { tgOpen = gi; $$('[data-tg]', el).forEach(x => x.classList.toggle('open', +x.dataset.tg === gi)); $$('[data-tp]', el).forEach(x => x.classList.toggle('open', +x.dataset.tp === gi)); $('.tgwrap', el).classList.toggle('opened', gi >= 0); };
    $$('[data-tg]', el).forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => tgSet(tgOpen === +b.dataset.tg ? -1 : +b.dataset.tg); });
    $('#tgback', el).onmousedown = e => e.preventDefault();
    $('#tgback', el).onclick = () => tgSet(-1);
    tgSync();
    $$('[data-tag]', el).forEach(b => {
      b.onmousedown = e => e.preventDefault();   // не забирать фокус у поля — клавиатура остаётся
      b.onclick = () => { const t = b.dataset.tag; d.tags = d.tags.includes(t) ? d.tags.filter(x => x !== t) : [...d.tags, t]; $$(`[data-tag="${t}"]`, el).forEach(x => x.classList.toggle('on', d.tags.includes(t))); tgSync(); };
    });
    $('#send', el).onmousedown = e => e.preventDefault();
    // пока открыта клавиатура, ниже поля ничего не показываем: теги есть в самом поле, отправка — стрелкой
    const txt = $('#txt', el), sheetEl = el.closest('.sheet');
    let fullH = window.innerHeight;
    const typing = () => { const kb = window.innerHeight < fullH * .8; sheetEl.classList.toggle('typing', document.activeElement === txt && kb); };
    txt.addEventListener('focus', () => setTimeout(typing, 300));
    txt.addEventListener('blur', () => setTimeout(typing, 50));
    window.addEventListener('resize', () => { if (!sheetEl.isConnected) return; fullH = Math.max(fullH, window.innerHeight); typing(); });
    $('#send', el).onclick = () => $('#save', el).click();
    $$('[data-vis]', el).forEach(b => b.onclick = () => { d.vis = b.dataset.vis; $$('[data-vis]', el).forEach(x => x.classList.toggle('on', x === b)); $('#vis-hint', el).textContent = VIS_HINT[d.vis]; });
    const sh = $('#share', el); if (sh) sh.onclick = () => { d.share = !d.share; sh.classList.toggle('on', d.share); };
    $('#save', el).onclick = () => {
      const text = $('#txt', el).value.trim();
      const centers = {}; $$('[data-center]', el).forEach(i => { const v = i.value.trim(); if (v) centers[i.dataset.center] = v; });
      if (!text && !d.tags.length && d.mood == null && !Object.keys(centers).length) return toast('Добавь пару слов, тег или настроение');
      const priv = her ? !d.share : d.vis === 'private';
      const n = { date, text, tags: d.tags, mood: d.mood, role: role(), created: Date.now(), ...(Object.keys(centers).length ? { centers: { thoughts: centers.thoughts || '', feelings: centers.feelings || '', body: centers.body || '' } } : {}), ...(her ? {} : { vis: d.vis === 'private' ? 'later' : d.vis }) };
      if (S.profile.mediator !== false && !priv && text && harshness(text).length) return mediate(n);
      commit(n, priv);
    };
  });
}
