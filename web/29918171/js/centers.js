/* Центры наблюдения (мысли, чувства, ощущения): шифрование на устройстве.
   Хранение: couples/{cid}/private/{uid}.keyWrap (обёртка ключа фразой), couples/{cid}/private/{uid}/centers/{noteId} = {iv, ct}.
   Старые записи с открытыми centers внутри документа переносятся сюда при первом открытии с разблокированным ключом (migrate). */
const Centers = {
  migratedAt: 0, cid: null, uid: null, key: null, wrap: null, wrapLoaded: false, docs: {}, map: {}, busy: {}, subs: [],
  base() { return 'couples/' + this.cid + '/private/' + this.uid; },
  /** none — фразы ещё нет; locked — фраза есть, ключа на устройстве нет; ready — можно читать и писать */
  status() { return this.key ? 'ready' : (this.wrap ? 'locked' : 'none'); },
  active() { return !!(CFG && this.cid); },
  start(cid, uid) {
    this.stop(); this.cid = cid; this.uid = uid;
    const id = cid + ':' + uid;
    IScrypto.loadLocal(id).then(k => { if (k && this.cid === cid && !this.key) { this.key = k; this.decryptAll(); } });
    this.subs.push(fb.db.doc(this.base()).onSnapshot(s => { this.wrap = (s.exists && s.data().keyWrap) || null; this.migratedAt = (s.exists && s.data().migratedAt) || 0; this.wrapLoaded = true; if (!this.wrap) this.key = null; render(); }, () => {}));
    this.subs.push(fb.db.collection(this.base() + '/centers').onSnapshot(s => { this.docs = {}; s.docs.forEach(d => this.docs[d.id] = d.data()); this.decryptAll(); }, () => {}));
    return () => this.stop();
  },
  stop() { this.subs.forEach(f => f()); this.subs = []; this.cid = this.uid = this.key = this.wrap = null; this.wrapLoaded = false; this.migratedAt = 0; this.docs = {}; this.map = {}; this.busy = {}; },
  async decryptAll() {
    const out = {};
    if (this.key) for (const [id, d] of Object.entries(this.docs)) { try { out[id] = await IScrypto.decrypt(this.key, d); } catch (e) { /* чужой/старый ключ — не показываем */ } }
    this.map = out; render(); this.migrate();
  },
  async setup(phrase) {
    if (this.wrap) throw new Error('Фраза уже задана, введи её');
    const { key, wrap } = await IScrypto.create(phrase);
    await fb.db.doc(this.base()).set({ keyWrap: wrap }, { merge: true });
    this.key = key; this.wrap = wrap; await IScrypto.saveLocal(this.cid + ':' + this.uid, key); this.decryptAll();
  },
  async unlock(phrase) {
    const key = await IScrypto.unlock(phrase, this.wrap);
    this.key = key; await IScrypto.saveLocal(this.cid + ':' + this.uid, key); this.decryptAll();
  },
  async forgetDevice() { await IScrypto.dropLocal(this.cid + ':' + this.uid); this.key = null; this.map = {}; render(); },
  async save(noteId, centers) {
    await fb.db.doc(this.base() + '/centers/' + noteId).set(await IScrypto.encrypt(this.key, centers));
    this.map[noteId] = centers;
  },
  remove(noteId) { return this.active() ? fb.db.doc(this.base() + '/centers/' + noteId).delete().catch(() => {}) : Promise.resolve(); },
  async wipe() {
    if (!this.active()) return;
    const b = fb.db.batch(); Object.keys(this.docs).forEach(id => b.delete(fb.db.doc(this.base() + '/centers/' + id)));
    b.delete(fb.db.doc(this.base())); await b.commit().catch(() => {});
  },
  /** Старые записи моего авторства с открытыми centers: только КОПИЯ в зашифрованном виде, старая запись не меняется и не удаляется.
   *  Если ключа нет или шифрование не удалось — запись остаётся как есть и показывается как раньше. */
  legacy() {
    const me = this.uid, out = [];
    S.shared.filter(n => n.author === me && n.centers).forEach(n => out.push({ n }));
    S.priv.filter(n => n.centers).forEach(n => out.push({ n }));
    return out;
  },
  async migrate() {
    if (this.status() !== 'ready') return;
    for (const { n } of this.legacy()) {
      if (this.busy[n.id] || this.docs[n.id]) continue; this.busy[n.id] = 1;
      try { await this.save(n.id, n.centers); } catch (e) { delete this.busy[n.id]; }
    }
    if (typeof Sync !== 'undefined') Sync.migrateNotes();
  },
  /** Флаг «перенос из старых мест выполнен» */
  async markMigrated() {
    if (!this.active() || this.migratedAt) return;
    await fb.db.doc(this.base()).set({ migratedAt: Date.now() }, { merge: true });
  },
  /** Дождаться готового ключа: при необходимости показать шторку (задать или ввести фразу). false — отказалась. */
  prompt() {
    if (this.status() === 'ready') return Promise.resolve(true);
    return new Promise(res => {
      const mode = this.status(); let done = false;
      const fin = v => { if (!done) { done = true; res(v); } };
      sheet(this.sheetHtml(mode), el => {
        $('.sheet-wrap').addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === $('.sheet-wrap')) fin(false); });
        this.bindSheet(el, mode, () => { fin(true); closeSheet(); });
      });
    });
  },
  warn: 'Фраза нужна, чтобы открыть центры на новом телефоне. Мы её не храним и не можем восстановить: если забудешь, прежние центры не прочитать (записи останутся).',
  sheetHtml(mode) {
    return mode === 'none'
      ? `<div class="ttl"><b>Фраза для центров</b></div><p class="muted" style="font-size:15px">Мысли, чувства и ощущения шифруются на этом телефоне. Партнёр и сервер прочитать их не могут.</p>
         <p class="small" style="font-size:14px"><b>${this.warn}</b></p>
         <input class="f" id="cph" type="password" autocomplete="new-password" placeholder="Фраза, от 6 символов"><input class="f" id="cph2" type="password" autocomplete="new-password" placeholder="Повтори фразу">
         <p class="small muted" id="cerr" style="color:var(--accent)"></p><button class="btn" id="cgo">Задать фразу</button>`
      : `<div class="ttl"><b>Введи фразу</b></div><p class="muted" style="font-size:15px">Центры зашифрованы. Чтобы открыть их на этом телефоне, введи свою фразу. Забытую фразу восстановить нельзя.</p>
         <input class="f" id="cph" type="password" autocomplete="current-password" placeholder="Фраза"><p class="small muted" id="cerr" style="color:var(--accent)"></p><button class="btn" id="cgo">Открыть центры</button>`;
  },
  bindSheet(el, mode, done) {
    const go = $('#cgo', el), err = m => $('#cerr', el).textContent = m;
    go.onclick = async () => {
      const p = $('#cph', el).value;
      try {
        go.disabled = true;
        if (mode === 'none') { if (p.length < 6) throw new Error('Фраза короче 6 символов'); if (p !== $('#cph2', el).value) throw new Error('Фразы не совпадают'); await this.setup(p); }
        else await this.unlock(p).catch(() => { throw new Error('Фраза не подошла'); });
        done();
      } catch (e) { go.disabled = false; err(e.message); }
    };
  }
};

/* Обвязка для core.js: подписки на центры и на настройки «что видит партнёр»; возвращает функцию отписки */
function startPrivacy(cid, uid) {
  const a = Centers.start(cid, uid), b = typeof Share !== 'undefined' ? Share.start(cid) : () => {};
  return () => { a(); b(); };
}
