/* Фазы Луны офлайн: Jean Meeus, «Astronomical Algorithms», гл. 49 (главные фазы с поправками) + ΔT (Espenak–Meeus).
 * Чистые функции от даты, без сети. Время — UTC. */
const Lunar = (() => {
  const rad = d => d * Math.PI / 180, sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));
  const A_COEF = [0.000325, 0.000165, 0.000164, 0.000126, 0.00011, 0.000062, 0.00006, 0.000056, 0.000047, 0.000042, 0.00004, 0.000037, 0.000035, 0.000023];
  /** ΔT = TT − UT, секунды (полиномы Espenak–Meeus для 1961–2150, вне — грубая парабола). */
  function deltaT(y) {
    if (y >= 2005 && y < 2050) { const t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
    if (y >= 1986 && y < 2005) { const t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5; }
    if (y >= 1961 && y < 1986) { const t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718; }
    if (y >= 2050 && y < 2150) return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
    const u = (y - 1820) / 100; return -20 + 32 * u * u;
  }
  /** Юлианская дата (UT) главной фазы. q: 0 новолуние, 1 первая четверть, 2 полнолуние, 3 последняя четверть; k0 — номер лунации (целое). */
  function phaseJD(k0, q) {
    const k = k0 + q / 4, T = k / 1236.85;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T ** 2 - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
    const E = 1 - 0.002516 * T - 0.0000074 * T ** 2;
    const M = 2.5534 + 29.1053567 * k - 0.0000014 * T ** 2 - 0.00000011 * T ** 3;
    const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T ** 2 + 0.00001238 * T ** 3 - 0.000000058 * T ** 4;
    const F = 160.7108 + 390.67050284 * k - 0.0016118 * T ** 2 - 0.00000227 * T ** 3 + 0.000000011 * T ** 4;
    const O = 124.7746 - 1.56375588 * k + 0.0020672 * T ** 2 + 0.00000215 * T ** 3;
    const E2 = E * E;
    let c;
    if (q === 0 || q === 2) {
      const n = q === 0;
      c = (n ? -0.4072 : -0.40614) * sin(Mp) + (n ? 0.17241 : 0.17302) * E * sin(M) + (n ? 0.01608 : 0.01614) * sin(2 * Mp) + (n ? 0.01039 : 0.01043) * sin(2 * F)
        + (n ? 0.00739 : 0.00734) * E * sin(Mp - M) - (n ? 0.00514 : 0.00515) * E * sin(Mp + M) + (n ? 0.00208 : 0.00209) * E2 * sin(2 * M)
        - 0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F) + 0.00056 * E * sin(2 * Mp + M) - 0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F)
        + 0.00038 * E * sin(M - 2 * F) - 0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(O) - 0.00007 * sin(Mp + 2 * M) + 0.00004 * sin(2 * Mp - 2 * F)
        + 0.00004 * sin(3 * M) + 0.00003 * sin(Mp + M - 2 * F) + 0.00003 * sin(2 * Mp + 2 * F) - 0.00003 * sin(Mp + M + 2 * F) + 0.00003 * sin(Mp - M + 2 * F)
        - 0.00002 * sin(Mp - M - 2 * F) - 0.00002 * sin(3 * Mp + M) + 0.00002 * sin(4 * Mp);
    } else {
      c = -0.62801 * sin(Mp) + 0.17172 * E * sin(M) - 0.01183 * E * sin(Mp + M) + 0.00862 * sin(2 * Mp) + 0.00804 * sin(2 * F) + 0.00454 * E * sin(Mp - M)
        + 0.00204 * E2 * sin(2 * M) - 0.0018 * sin(Mp - 2 * F) - 0.0007 * sin(Mp + 2 * F) - 0.0004 * sin(3 * Mp) - 0.00034 * E * sin(2 * Mp - M)
        + 0.00032 * E * sin(M + 2 * F) + 0.00032 * E * sin(M - 2 * F) - 0.00028 * E2 * sin(Mp + 2 * M) + 0.00027 * E * sin(2 * Mp + M) - 0.00017 * sin(O)
        - 0.00005 * sin(Mp - M - 2 * F) + 0.00004 * sin(2 * Mp + 2 * F) - 0.00004 * sin(Mp + M + 2 * F) + 0.00004 * sin(Mp - 2 * M)
        + 0.00003 * sin(Mp + M - 2 * F) + 0.00003 * sin(3 * M) + 0.00002 * sin(2 * Mp - 2 * F) + 0.00002 * sin(Mp - M + 2 * F) - 0.00002 * sin(3 * Mp + M);
      const W = 0.00306 - 0.00038 * E * cos(M) + 0.00026 * cos(Mp) - 0.00002 * cos(Mp - M) + 0.00002 * cos(Mp + M) + 0.00002 * cos(2 * F);
      c += q === 1 ? W : -W;
    }
    const AA = [299.77 + 0.107408 * k - 0.009173 * T ** 2, 251.88 + 0.016321 * k, 251.83 + 26.651886 * k, 349.42 + 36.412478 * k, 84.66 + 18.206239 * k,
      141.74 + 53.303771 * k, 207.14 + 2.453732 * k, 154.84 + 7.30686 * k, 34.52 + 27.261239 * k, 207.19 + 0.121824 * k, 291.34 + 1.844379 * k,
      161.72 + 24.198154 * k, 239.56 + 25.513099 * k, 331.55 + 3.592518 * k];
    AA.forEach((a, i) => { c += A_COEF[i] * sin(a); });
    jde += c;
    return jde - deltaT(2000 + (jde - 2451545) / 365.25) / 86400;
  }
  const jdOf = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000 + 2440587.5;
  const dateOf = jd => new Date((jd - 2440587.5) * 86400000);
  const KINDS = ['new', 'fq', 'full', 'lq'];
  const NAMES = { new: 'Новолуние', fq: 'Первая четверть', full: 'Полнолуние', lq: 'Последняя четверть' };
  const ICONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  /** Номер лунации k, чьё новолуние — последнее не позже момента jd. */
  function lunationAt(jd) {
    let k = Math.floor((jd - 2451550.09766) / 29.530588861);
    while (phaseJD(k, 0) > jd) k--;
    while (phaseJD(k + 1, 0) <= jd) k++;
    return k;
  }
  /** Фаза на момент jd (UT): доля цикла 0..1 (0 — новолуние, 0.5 — полнолуние), освещённость 0..1, возраст в днях. */
  function phaseAt(jd) {
    const k = lunationAt(jd), a = phaseJD(k, 0), b = phaseJD(k + 1, 0), frac = (jd - a) / (b - a);
    return { frac, illum: (1 - Math.cos(2 * Math.PI * frac)) / 2, age: jd - a };
  }
  /** Главные фазы, момент которых попал в сутки UTC дня iso: [{kind, name, date}]. */
  function eventsOn(iso) {
    const j0 = jdOf(iso), j1 = j0 + 1, k = lunationAt(j0), out = [];
    for (let kk = k - 1; kk <= k + 1; kk++) for (let q = 0; q < 4; q++) {
      const j = phaseJD(kk, q); if (j >= j0 && j < j1) out.push({ kind: KINDS[q], name: NAMES[KINDS[q]], date: dateOf(j) });
    }
    return out;
  }
  /** Луна на день iso (YYYY-MM-DD): фаза на полдень UTC и главная фаза дня, если она попала в эти сутки. */
  function day(iso) {
    const p = phaseAt(jdOf(iso) + 0.5), ev = eventsOn(iso)[0] || null;
    const name = ev ? ev.name : p.frac < 0.25 ? 'Растущий серп' : p.frac < 0.5 ? 'Растущая Луна' : p.frac < 0.75 ? 'Убывающая Луна' : 'Убывающий серп';
    const icon = ev ? ICONS[{ new: 0, fq: 2, full: 4, lq: 6 }[ev.kind]] : ICONS[Math.round(p.frac * 8) % 8];
    return { ...p, event: ev && ev.kind, name, icon };
  }
  return { phaseJD, phaseAt, eventsOn, day, deltaT, jdOf, dateOf };
})();
