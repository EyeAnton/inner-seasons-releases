/* Тосты, шторки (sheet/dragSheet), типографика, confirmSheet, commit */
/* ================= уведомления, тосты, шторки ================= */
let toastT;
function toast(msg) {
  let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 3200);
}
function notifyToday() {
  if (!prefs.notify || !A || !A.notify || !S.couple) return;
  const k = 'is-notified-' + today(); if (lsGet(k, false)) return; lsSet(k, true);
  const i = info(today(), cycle()), s = SEASONS[i.season];
  A.notify(i.gate ? GATES[i.gate].name : s.name.replace('\n', ' '), role() === 'him' ? s.him : s.her);
}
function sheet(html, onMount) {
  const L = $('#layer');
  document.documentElement.classList.add('lock');
  L.innerHTML = `<div class="sheet-wrap"><div class="sheet" role="dialog"><div class="shead"><span class="grab"><span class="handle"></span></span><button class="icon-btn x" data-close aria-label="Закрыть">${ic('x')}</button></div><div class="sbody">${html}</div></div></div>`;
  const w = $('.sheet-wrap', L);
  w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-close]')) closeSheet(); });
  dragSheet(w, $('.sheet', L));
  onMount && onMount($('.sheet', L));
  typo($('.sheet', L));
}
const closeSheet = () => { $('#layer').innerHTML = ''; document.documentElement.classList.remove('lock'); };
/** Шторку можно тянуть вниз: за ручку или когда содержимое прокручено до верха; отпустил ниже порога — закрылась. */
function dragSheet(wrap, sh) {
  let y0 = 0, dy = 0, t0 = 0, drag = false, armed = false;
  sh.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; drag = false;
    const body = $('.sbody', sh); armed = !!e.target.closest('.shead') || (body.scrollTop <= 0 && !e.target.closest('textarea,input'));
  }, { passive: true });
  sh.addEventListener('touchmove', e => {
    if (!armed) return;
    dy = e.touches[0].clientY - y0;
    if (!drag && dy > 6) { drag = true; sh.style.transition = 'none'; }
    if (!drag) { if (dy < 0) armed = false; return; }
    e.preventDefault();
    const d = Math.max(0, dy);
    sh.style.transform = `translateY(${d}px)`; wrap.style.background = `rgba(0,0,0,${Math.max(0, .45 - d / 900)})`;
  }, { passive: false });
  sh.addEventListener('touchend', () => {
    if (!drag) return; drag = false;
    sh.style.transition = 'transform .2s ease-out';
    if (dy > Math.min(160, sh.offsetHeight * .3) || (dy > 40 && dy / (Date.now() - t0) > .6)) { sh.style.transform = 'translateY(100%)'; setTimeout(closeSheet, 180); }
    else { sh.style.transform = ''; wrap.style.background = ''; }
  });
}
window.onBack = () => {
  if ($('#layer').innerHTML) { closeSheet(); return true; }
  if (S.user && UI.tab !== 'today') { go('today'); return true; }
  return false;
};
function go(tab) { UI.from = null; UI.tab = tab; sessionStorage.setItem('is-tab', tab); if (tab === 'today') UI.sel = today(); render(); window.scrollTo(0, 0); }

/* ================= типографика =================
 * Чтобы не оставались висячие «в», «и», «не» в конце строки и тире в начале новой. */
const NB = /(^|[\s(«„"])([А-Яа-яЁёA-Za-z]{1,2}|не|ни|без|для|под|над|при|про|это|как)\s+/g;
function typoText(s) { return s.replace(NB, (m, a, w) => a + w + '\u00A0').replace(NB, (m, a, w) => a + w + '\u00A0').replace(/\s+—/g, '\u00A0—').replace(/(\d)\s+(?=[а-яё])/g, '$1\u00A0'); }
function typo(root) {
  if (!root) return;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentNode.closest('textarea,input,script,style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const list = []; while (tw.nextNode()) list.push(tw.currentNode);
  for (const n of list) { const v = typoText(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
}
function confirmSheet(title, text, yes, onYes) {
  sheet(`<div class="ttl"><b>${title}</b></div><p class="muted" style="font-size:15px">${text}</p><button class="btn" id="yes">${yes}</button><button class="btn ghost" data-close>Отмена</button>`,
    el => $('#yes', el).onclick = async () => { closeSheet(); try { await onYes(); } catch (e) { toast('Не получилось: ' + (e.code || e.message)); } });
}
async function commit(n, priv) {
  closeSheet();
  try { await Store.addNote(n, priv); toast(priv ? 'Сохранено только для тебя' : 'Сохранено'); }
  catch (e) { toast('Не сохранилось: ' + (e.code || e.message)); }
}
