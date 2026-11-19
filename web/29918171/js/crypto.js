/* Шифрование «трёх центров»: AES-256-GCM, ключ обёрнут фразой (PBKDF2-SHA256, >= 600000 итераций).
   Ключ в открытом виде никуда не пишется: в облако уходит только обёртка keyWrap, на устройстве
   ключ лежит в IndexedDB как неизвлекаемый CryptoKey. Чистые функции, работают и в браузере, и в Node (globalThis.crypto). */
const IScrypto = (() => {
  const ITER = 600000, enc = new TextEncoder(), dec = new TextDecoder();
  const subtle = () => (globalThis.crypto || window.crypto).subtle;
  const rnd = n => (globalThis.crypto || window.crypto).getRandomValues(new Uint8Array(n));
  const b64 = u8 => { let s = ''; u8 = new Uint8Array(u8); for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function kek(phrase, salt, iterations) {
    const base = await subtle().importKey('raw', enc.encode(String(phrase).normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return subtle().deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
  }
  /** Новый ключ + обёртка фразой. Возвращает { key (неизвлекаемый), wrap: {salt, iv, wrapped, iterations} } */
  async function create(phrase) {
    if (!phrase || String(phrase).length < 6) throw new Error('Фраза короче 6 символов');
    const raw = await subtle().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const salt = rnd(16), iv = rnd(12);
    const wrapped = await subtle().wrapKey('raw', raw, await kek(phrase, salt, ITER), { name: 'AES-GCM', iv });
    const wrap = { salt: b64(salt), iv: b64(iv), wrapped: b64(wrapped), iterations: ITER };
    return { key: await unlock(phrase, wrap), wrap };
  }
  /** Развернуть ключ фразой (неверная фраза — исключение). Ключ неизвлекаемый. */
  async function unlock(phrase, wrap) {
    if (!wrap || !(wrap.iterations >= ITER)) throw new Error('Обёртка ключа повреждена');
    return subtle().unwrapKey('raw', unb64(wrap.wrapped), await kek(phrase, unb64(wrap.salt), wrap.iterations), { name: 'AES-GCM', iv: unb64(wrap.iv) }, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encrypt(key, obj) {
    const iv = rnd(12);
    return { iv: b64(iv), ct: b64(await subtle().encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)))) };
  }
  async function decrypt(key, doc) {
    return JSON.parse(dec.decode(await subtle().decrypt({ name: 'AES-GCM', iv: unb64(doc.iv) }, key, unb64(doc.ct))));
  }
  /* ключ на этом устройстве: IndexedDB, CryptoKey хранится как неизвлекаемый объект */
  const idb = () => new Promise((ok, no) => { const r = indexedDB.open('is-keys', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  async function saveLocal(id, key) { try { const db = await idb(); await new Promise((ok, no) => { const t = db.transaction('k', 'readwrite'); t.objectStore('k').put(key, id); t.oncomplete = ok; t.onerror = () => no(t.error); }); return true; } catch (e) { return false; } }
  async function loadLocal(id) { try { const db = await idb(); return await new Promise((ok, no) => { const r = db.transaction('k').objectStore('k').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => no(r.error); }); } catch (e) { return null; } }
  async function dropLocal(id) { try { const db = await idb(); await new Promise(ok => { const t = db.transaction('k', 'readwrite'); t.objectStore('k').delete(id); t.oncomplete = ok; t.onerror = ok; }); } catch (e) {} }
  return { ITER, create, unlock, encrypt, decrypt, saveLocal, loadLocal, dropLocal };
})();
if (typeof module !== 'undefined') module.exports = IScrypto;
