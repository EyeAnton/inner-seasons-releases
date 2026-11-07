/* Шторка новой записи */
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
      if (!text && !d.tags.length && d.mood == null) return toast('Добавь пару слов, тег или настроение');
      const priv = her ? !d.share : d.vis === 'private';
      const n = { date, text, tags: d.tags, mood: d.mood, role: role(), created: Date.now(), ...(her ? {} : { vis: d.vis === 'private' ? 'later' : d.vis }) };
      if (S.profile.mediator !== false && !priv && text && harshness(text).length) return mediate(n);
      commit(n, priv);
    };
  });
}
