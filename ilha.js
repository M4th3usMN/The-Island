/* A Grande Ilha — simulação ao vivo.
   Tudo é calculado a partir do relógio real (horário de Brasília): todo visitante
   vê a mesma cena no mesmo instante, sem precisar de servidor. */
(function () {
  'use strict';
  const SP = window.IlhaSprites, ROT = window.IlhaRotinas;
  const WW = 760, WH = 600, CX = 380, CY = 300, RX = 292, RY = 242;
  const TZ = -3 * 3600e3;                                   // Brasília (UTC-3, sem horário de verão)
  const DIA2 = Date.parse('2026-11-03T21:00:00-03:00');     // início do Dia 2 (mesmo instante de 20:00 em Manaus)
  const SPEED = 9, SLOT = 20 * 60e3, ARR = 180e3;
  const FIRE = { x: 380, y: 300 }, HUB = { x: 380, y: 320 };
  const LOOP = 45.714286;

  // ---------------------------------------------------------------- utilidades
  function hs(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  function rnd() {
    let h = 0x9e3779b9;
    for (let i = 0; i < arguments.length; i++) {
      const v = arguments[i];
      const n = typeof v === 'number' ? (Math.floor(v) % 2147483647) : hs(String(v));
      h = Math.imul(h ^ n, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    }
    return (h >>> 0) / 4294967296;
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const P = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
  function localHours(t) { return (((t + TZ) / 3600e3) % 24 + 24) % 24; }
  function idist(x, y) {
    const dx = (x - CX) / RX, dy = (y - CY) / RY, a = Math.atan2(dy, dx);
    const rad = 1 + 0.06 * Math.sin(3 * a + 1) + 0.04 * Math.sin(5 * a + 2) + 0.03 * Math.sin(9 * a);
    return Math.hypot(dx, dy) / rad;
  }

  // ---------------------------------------------------------------- lugares
  const LUG = {
    fogueira: { nome: 'Fogueira', x: 380, y: 300, sx: 380, sy: 304, r: 0, sempre: true },
    taverna: { nome: 'Taverna', x: 318, y: 268, sx: 318, sy: 286, r: 14 },
    forja: { nome: 'Forja', x: 452, y: 342, sx: 452, sy: 356, r: 9 },
    oficina: { nome: 'Oficina', x: 470, y: 256, sx: 470, sy: 270, r: 11 },
    laboratorio: { nome: 'Laboratório', x: 516, y: 308, sx: 512, sy: 321, r: 9 },
    biblioteca: { nome: 'Biblioteca', x: 322, y: 356, sx: 322, sy: 369, r: 9 },
    arena: { nome: 'Arena de treino', x: 236, y: 318, sx: 236, sy: 318, r: 13 },
    fazenda: { nome: 'Fazenda', x: 282, y: 424, sx: 282, sy: 426, r: 22 },
    pasto: { nome: 'Pasto', x: 472, y: 432, sx: 472, sy: 432, r: 18 },
    cais: { nome: 'Cais', x: 392, y: 518, sx: 392, sy: 538, r: 4, sempre: true },
    floresta: { nome: 'Floresta', x: 350, y: 150, sx: 350, sy: 150, r: 75, sempre: true },
    torre: { nome: 'Torre do mago', x: 190, y: 210, sx: 190, sy: 220, r: 7 },
    santuario: { nome: 'Santuário', x: 648, y: 322, sx: 648, sy: 330, r: 8 },
    ponte: { nome: 'Ponte do riacho', x: 600, y: 133, sx: 596, sy: 144, r: 6 }
  };
  const LAKE = { x: 540, y: 150, rx: 32, ry: 18 };
  const STREAM = [[566, 150], [600, 132], [640, 112], [672, 96]];
  const SLOTS = [[412, 278], [352, 240], [404, 238], [446, 302], [420, 378], [378, 384], [338, 400], [278, 354], [446, 208], [370, 208],
    [300, 216], [490, 380], [542, 352], [420, 422], [332, 454], [252, 264], [542, 242], [430, 172], [522, 414], [300, 172], [560, 300], [212, 380]];
  const YUKINE_CASA = [632, 298];

  // ---------------------------------------------------------------- moradores
  const MOR = (window.MORADORES || []).map((m, i) => Object.assign({}, m, { _i: i }));
  const BY = {}; MOR.forEach(m => { BY[m.id] = m; });
  let PREVIEW = false;
  const HOOKS = window.IlhaHooks = window.IlhaHooks || [];
  const TEXTO = window.IlhaTexto = window.IlhaTexto || [];

  const casas = [];
  (function setup() {
    const ord = MOR.slice().sort((a, b) => Date.parse(a.chegada) - Date.parse(b.chegada) || a._i - b._i);
    let slot = 0;
    const grupo = {};
    ord.forEach(m => {
      const base = Date.parse(m.chegada) || 0;
      grupo[base] = (grupo[base] || 0) + 1;
      m._ch = base + (grupo[base] - 1) * 25e3;
      const R = ROT[m.rotina] || ROT.lenhador;
      m._R = R; m._blocos = R.blocos;
      const animal = m.visual.tipo === 'gato' || m.visual.tipo === 'cao';
      m._jit = animal ? 0 : (rnd(m.id, 'jit') - 0.5) * 0.6;
      m._usa = new Set(m._blocos.map(b => b[2]));
      const c = m.casa || 'auto';
      if (c === 'auto' && slot < SLOTS.length) {
        const s = SLOTS[slot++]; const h = { x: s[0], y: s[1], donos: [m], v: Math.floor(rnd(m.id, 'casa') * 4) };
        casas.push(h); m._casaObj = h; m._home = { x: s[0], y: s[1] + 6, dentro: true };
      } else if (c === 'santuario') {
        const h = { x: YUKINE_CASA[0], y: YUKINE_CASA[1], donos: [m], v: 4 }; casas.push(h); m._casaObj = h;
        m._home = { x: h.x, y: h.y + 6, dentro: true }; m._usa.add('santuario');
      } else if (c === 'torre' || c === 'taverna') {
        const L = LUG[c]; m._home = { x: L.sx, y: L.sy - 4, dentro: true, lugar: c }; m._usa.add(c);
        if (animal) m._home = { x: L.x + 10, y: L.y - 22, dentro: false, telhado: true };
      } else if (c.indexOf('com:') === 0 && BY[c.slice(4)] && BY[c.slice(4)]._home) {
        const o = BY[c.slice(4)];
        m._home = animal ? { x: o._home.x + 9, y: o._home.y + 1, dentro: false } : o._home;
        if (o._casaObj && !animal) { o._casaObj.donos.push(m); m._casaObj = o._casaObj; }
      } else {
        m._home = { x: HUB.x, y: HUB.y, dentro: false };
      }
    });
  })();

  function arrived(m, t) { return PREVIEW || t >= m._ch; }
  const placeCache = { t: -1, set: null };
  function placesAt(t) {
    if (placeCache.t === t) return placeCache.set;
    const s = new Set(Object.keys(LUG).filter(k => LUG[k].sempre));
    MOR.forEach(m => { if (arrived(m, t)) m._usa.forEach(p => { if (LUG[p]) s.add(p); }); });
    placeCache.t = t; placeCache.set = s; return s;
  }

  // ---------------------------------------------------------------- simulação
  function blockAt(m, t) {
    const bl = m._blocos, H = (localHours(t) - m._jit + 24) % 24;
    for (let i = 0; i < bl.length; i++) {
      const s = bl[i][0], e = bl[i][1];
      const inb = s < e ? (H >= s && H < e) : (H >= s || H < e);
      if (inb) return { i, b: bl[i], start: t - ((H - s + 24) % 24) * 3600e3 };
    }
    return { i: 0, b: bl[0], start: t };
  }
  function spotFor(m, pl, op, k) {
    if (pl === 'fogueira') {
      const a = rnd(m.id, 'f') * Math.PI * 2, r = 19 + rnd(m.id, 'fr') * 13;
      return { x: FIRE.x + Math.cos(a) * r, y: FIRE.y + 3 + Math.sin(a) * r * 0.72 };
    }
    if (pl === 'casa') return m._home;
    if (op && op.soneca && pl === 'taverna') return { x: LUG.taverna.x + 10, y: LUG.taverna.y - 23 };
    const L = LUG[pl] || LUG.fogueira;
    const a = rnd(m.id, pl, k || 0) * 6.2832, r = Math.sqrt(rnd(m.id, pl, 'r', k || 0)) * L.r;
    return { x: L.sx + Math.cos(a) * r, y: L.sy + Math.sin(a) * r * 0.6 };
  }
  function roamPlace(m, S, k) {
    const opts = Array.from(placesAt(S)).filter(p => p !== 'ponte' || m.id !== 'gustavo');
    return opts[Math.floor(rnd(m.id, Math.floor(S / 60000), k, 'rp') * opts.length)];
  }
  function roamSpot(m, S, k) { return spotFor(m, roamPlace(m, S, k), null, k); }
  function blockLen(b) { return ((b[1] - b[0] + 24) % 24 || 24) * 3600e3; }
  function endOfPrev(m, r, depth) {
    const n = m._blocos.length, pb = m._blocos[(r.i - 1 + n) % n];
    const ps = r.start - blockLen(pb);
    if (pb[2] === 'passeio') return roamSpot(m, ps, Math.floor(blockLen(pb) / SLOT - 1e-9));
    if (pb[2] === 'gato') { const c = BY.gustavo; const p = c && depth < 2 ? posAt(c, r.start, depth + 1) : null; return p ? { x: p.x, y: p.y } : spotFor(m, 'pasto'); }
    return spotFor(m, pb[2], pb[4]);
  }
  function leg(m, t, depth) {
    const r = blockAt(m, t), b = r.b;
    if (b[2] === 'passeio') {
      const k = Math.floor((t - r.start) / SLOT);
      return { from: k > 0 ? roamSpot(m, r.start, k - 1) : endOfPrev(m, r, depth), to: roamSpot(m, r.start, k), start: r.start + k * SLOT, pl: roamPlace(m, r.start, k), act: b[3], op: b[4] };
    }
    return { from: endOfPrev(m, r, depth), to: spotFor(m, b[2], b[4]), start: r.start, pl: b[2], act: b[3], op: b[4] };
  }
  function route(a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d < 70) return { pts: [a, b], len: d };
    const l1 = Math.hypot(HUB.x - a.x, HUB.y - a.y), l2 = Math.hypot(b.x - HUB.x, b.y - HUB.y);
    return { pts: [a, HUB, b], len: l1 + l2, l1 };
  }
  function along(rt, d) {
    const p = rt.pts;
    if (p.length === 2) { const f = rt.len ? d / rt.len : 1; return { x: p[0].x + (p[1].x - p[0].x) * f, y: p[0].y + (p[1].y - p[0].y) * f }; }
    if (d < rt.l1) { const f = d / rt.l1; return { x: p[0].x + (p[1].x - p[0].x) * f, y: p[0].y + (p[1].y - p[0].y) * f }; }
    const l2 = rt.len - rt.l1, f = l2 ? (d - rt.l1) / l2 : 1;
    return { x: p[1].x + (p[2].x - p[1].x) * f, y: p[1].y + (p[2].y - p[1].y) * f };
  }
  function posAt(m, t, depth) {
    depth = depth || 0;
    if (!arrived(m, t)) return null;
    const g = leg(m, t, depth);
    if (g.pl === 'gato' && depth < 2) {
      const c = BY.gustavo;
      const p = c && arrived(c, t) ? posAt(c, t - 2500, depth + 1) : null;
      if (p && !p.sleeping) return { x: p.x - 10, y: p.y + 2, walking: p.walking, perseguindo: true, leg: Object.assign({}, g, { pl: p.leg.pl }) };
    }
    let from = g.from, start = g.start, arriving = false;
    if (!PREVIEW && t - m._ch < ARR) { from = { x: 392 + (rnd(m.id, 'cx') - 0.5) * 6, y: 556 }; start = m._ch; arriving = true; }
    const rt = route(from, g.to), e = (t - start) / 1000, d = e * SPEED;
    if (d < rt.len) { const q = along(rt, d); return { x: q.x, y: q.y, walking: true, viagem: true, leg: g, arriving }; }
    if (g.op && (g.op.sono || g.op.soneca)) {
      return { x: g.to.x, y: g.to.y, walking: false, sleeping: true, hidden: !!g.op.sono && !!m._home.dentro, leg: g, arriving };
    }
    const e2 = e - rt.len / SPEED, WP = 16, k = Math.floor(e2 / WP);
    const R = g.pl === 'fogueira' ? 2 : g.pl === 'casa' ? 5 : g.pl === 'floresta' ? 12 : clamp((LUG[g.pl] || { r: 6 }).r * 0.5 + 2, 3, 10);
    const sk = Math.floor(start / 1000);
    const wp = kk => kk < 0 ? g.to : { x: g.to.x + (rnd(m.id, kk, sk) - 0.5) * 2 * R, y: g.to.y + (rnd(m.id, kk, 'y', sk) - 0.5) * R };
    const a = wp(k - 1), b = wp(k), dd = Math.hypot(b.x - a.x, b.y - a.y), u = (e2 - k * WP) * 4;
    if (u < dd) { const f = u / dd; return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, walking: true, leg: g, arriving }; }
    return { x: b.x, y: b.y, walking: false, leg: g, arriving };
  }
  function placeName(p, m) {
    if (p === 'casa') return m._home.lugar ? LUG[m._home.lugar].nome : 'Em casa';
    return (LUG[p] || {}).nome || '';
  }
  function frase(m, p, t) {
    if (!p || p.walking || p.sleeping || p.hidden) return null;
    const W = Math.floor(t / 6000);
    const social = p.leg.pl === 'fogueira' || p.leg.pl === 'taverna';
    if (rnd(m.id, W, 'b') > (social ? 0.24 : 0.09) || (t % 6000) > 3800) return null;
    const list = social ? m._R.social : m._R.trabalho;
    return list && list.length ? list[Math.floor(rnd(m.id, W, 'f') * list.length)] : null;
  }
  function darkness(h) {
    if (h >= 7.5 && h < 16.5) return 0;
    if (h >= 16.5 && h < 19) return (h - 16.5) / 2.5 * 0.66;
    if (h >= 19 || h < 5) return 0.66;
    return (1 - (h - 5) / 2.5) * 0.66;
  }
  function clima(t) {
    const w = Math.floor((t + TZ) / (3 * 3600e3)), r = rnd('clima', w), h = localHours(t);
    if (r < 0.6) return 'limpo';
    if (r < 0.8) return 'nublado';
    if (r < 0.92) return 'chuva';
    return h >= 3 && h < 10 ? 'neblina' : 'nublado';
  }
  function diaDe(t) { return t < DIA2 ? 1 : 2 + Math.floor((t - DIA2) / 864e5); }

  // ---------------------------------------------------------------- terreno (desenhado uma vez)
  const terr = document.createElement('canvas'); terr.width = WW; terr.height = WH;
  const shorePts = [], waterPts = [], landPts = [];
  (function buildTerrain() {
    const c = terr.getContext('2d');
    const img = c.createImageData(WW, WH), D = img.data, R = mulberry(7);
    const pathMask = new Uint8Array(WW * WH);
    const stamp = (x, y, r, val) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const X = Math.round(x + i), Y = Math.round(y + j); if (X >= 0 && Y >= 0 && X < WW && Y < WH) pathMask[Y * WW + X] = Math.max(pathMask[Y * WW + X], val); } };
    const line = (a, b, r, val) => { const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)); for (let s = 0; s <= n; s++) { const f = n ? s / n : 0; stamp(a.x + (b.x - a.x) * f + (R() - 0.5) * 0.8, a.y + (b.y - a.y) * f, r, val); } };
    Object.keys(LUG).forEach(k => { if (k !== 'fogueira' && k !== 'floresta') line(HUB, { x: LUG[k].sx, y: LUG[k].sy }, 1, 1); });
    line(HUB, { x: 350, y: 200 }, 1, 1);
    SLOTS.forEach(s => line({ x: s[0], y: s[1] + 3 }, { x: s[0] + (HUB.x - s[0]) * 0.25, y: s[1] + 3 + (HUB.y - s[1]) * 0.25 }, 0, 1));
    line({ x: 600, y: 144 }, { x: YUKINE_CASA[0], y: YUKINE_CASA[1] + 4 }, 1, 1);
    for (let i = 0; i < STREAM.length - 1; i++) line({ x: STREAM[i][0], y: STREAM[i][1] }, { x: STREAM[i + 1][0], y: STREAM[i + 1][1] }, 2, 2);
    for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
      const d = idist(x, y), o = (y * WW + x) * 4, n = R();
      let col;
      const lake = ((x - LAKE.x) / LAKE.rx) ** 2 + ((y - LAKE.y) / LAKE.ry) ** 2;
      const fr = ((x - 350) / 175) ** 2 + ((y - 138) / 78) ** 2;
      const plaza = Math.hypot((x - FIRE.x) / 1, (y - FIRE.y - 3) / 0.75);
      if (d >= 1) { col = d < 1.07 ? [24, 58, 92] : [14, 36, 62]; if (d < 1.07) shorePts.push(x, y); else if (n < 0.012) waterPts.push(x, y); }
      else if (lake < 1 || pathMask[y * WW + x] === 2) { col = lake < 0.55 ? [24, 66, 120] : [30, 80, 132]; if (n < 0.04) waterPts.push(x, y); }
      else if (d > 0.93) col = n < 0.35 ? [168, 146, 96] : [184, 162, 108];
      else if (pathMask[y * WW + x] === 1 || plaza < 34) col = n < 0.5 ? [124, 100, 70] : [112, 90, 62];
      else if (fr < 1 || Math.hypot(x - 190, y - 205) < 40) col = n < 0.5 ? [36, 74, 52] : [40, 82, 56];
      else { col = n < 0.5 ? [58, 110, 66] : [64, 120, 70]; if (n > 0.985) col = [80, 140, 82]; if (n < 0.006) landPts.push(x, y); }
      D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    // arvores e detalhes
    const blocked = (x, y) => {
      if (idist(x, y) > 0.9) return true;
      if (pathMask[Math.round(y) * WW + Math.round(x)] || pathMask[Math.round(y + 3) * WW + Math.round(x)]) return true;
      if (Math.hypot(x - FIRE.x, (y - FIRE.y) / 0.75) < 52) return true;
      for (const k in LUG) { if (k === 'floresta') continue; const L = LUG[k]; if (Math.hypot(x - L.x, y - L.y + 6) < 26 + L.r || Math.hypot(x - L.sx, y - L.sy) < 14 + L.r) return true; }
      for (const s of SLOTS) if (Math.hypot(x - s[0], y - s[1] + 6) < 20) return true;
      if (Math.hypot(x - YUKINE_CASA[0], y - YUKINE_CASA[1] + 6) < 20) return true;
      if (((x - LAKE.x) / (LAKE.rx + 8)) ** 2 + ((y - LAKE.y) / (LAKE.ry + 8)) ** 2 < 1) return true;
      return false;
    };
    const trees = [];
    for (let i = 0; i < 9000 && trees.length < 420; i++) {
      const x = 90 + R() * 580, y = 60 + R() * 470;
      if (blocked(x, y)) continue;
      const fr = ((x - 350) / 175) ** 2 + ((y - 138) / 78) ** 2;
      const dens = fr < 1 ? 0.9 : Math.hypot(x - 190, y - 205) < 40 ? 0.7 : idist(x, y) > 0.7 ? 0.32 : 0.06;
      if (R() > dens) continue;
      if (trees.some(q => Math.abs(q[0] - x) < 7 && Math.abs(q[1] - y) < 6)) continue;
      trees.push([Math.round(x), Math.round(y), R()]);
    }
    trees.sort((a, b) => a[1] - b[1]);
    trees.forEach(([x, y, k]) => {
      if (k < 0.12) { // arvore redonda de outono
        P(c, x - 4, y - 1, 8, 2, 'rgba(0,0,0,.25)'); P(c, x, y - 2, 1, 3, '#5a3e26');
        P(c, x - 4, y - 8, 8, 6, '#b07a2e'); P(c, x - 3, y - 9, 6, 1, '#b07a2e'); P(c, x - 2, y - 8, 3, 2, '#d39a44'); P(c, x + 1, y - 4, 3, 2, '#8a5a22');
        return;
      }
      if (k < 0.3) { // arvore redonda
        P(c, x - 5, y - 1, 10, 2, 'rgba(0,0,0,.25)'); P(c, x, y - 2, 2, 3, '#5a3e26');
        P(c, x - 5, y - 10, 10, 8, '#2e6a3e'); P(c, x - 4, y - 11, 8, 1, '#2e6a3e'); P(c, x - 3, y - 10, 4, 3, '#3f8a4e'); P(c, x + 1, y - 5, 4, 3, '#245a34');
        return;
      }
      P(c, x - 4, y, 8, 2, 'rgba(0,0,0,.25)');
      P(c, x - 1, y - 1, 2, 2, '#5a3e26');
      const dk = '#1f5038', md = '#2a6444', lt = '#3a7e52';
      for (let r = 0; r < 4; r++) P(c, x - 1 - r, y - 10 + r, 2 + r * 2, 1, r < 2 ? md : dk);
      for (let r = 0; r < 5; r++) P(c, x - 2 - r, y - 6 + r, 4 + r * 2, 1, r < 2 ? md : dk);
      P(c, x - 1, y - 9, 1, 2, lt); P(c, x - 2, y - 5, 1, 2, lt);
    });
    // pedras, flores
    for (let i = 0; i < 160; i++) {
      const x = Math.round(90 + R() * 580), y = Math.round(60 + R() * 480);
      if (blocked(x, y)) continue;
      const k = R();
      if (k < 0.3) { P(c, x - 2, y - 1, 4, 3, '#7a7e8a'); P(c, x - 1, y - 1, 2, 1, '#a0a4ae'); }
      else if (k < 0.75) { P(c, x, y, 1, 1, ['#f2d34a', '#f28aa4', '#f4f4f4', '#9ad0ff'][Math.floor(R() * 4)]); P(c, x + 2, y + 1, 1, 1, '#f4f4f4'); }
      else { P(c, x, y - 2, 1, 2, '#4f9a58'); P(c, x + 1, y - 3, 1, 3, '#4f9a58'); P(c, x + 2, y - 2, 1, 2, '#4f9a58'); }
    }
    // pedras ao redor do lago
    for (let a = 0; a < 6.28; a += 0.5) P(c, LAKE.x + Math.cos(a) * (LAKE.rx + 1) - 1, LAKE.y + Math.sin(a) * (LAKE.ry + 1) - 1, 3, 2, '#6e7280');
  })();

  // ---------------------------------------------------------------- construcoes
  const ROOFS = [['#b0864a', '#c99a54', '#8a6638'], ['#7a4a2e', '#8f5a38', '#5e3822'], ['#9a3a2e', '#b04a3a', '#7a2a20'], ['#5a6478', '#6e7890', '#444c5e'], ['#a8323e', '#c04450', '#7e2430']];
  const WALLS = ['#6e4a30', '#7a5636', '#8a8a92', '#6a5a4a', '#7e6a58'];
  function roof(c, x, y, top, rows, w0, w1, pal) {
    for (let r = 0; r < rows; r++) { const w = Math.round(w0 + (w1 - w0) * r / (rows - 1)); P(c, x - w / 2, top + r, w, 1, r === rows - 1 ? pal[2] : r % 3 === 0 ? pal[1] : pal[0]); }
  }
  function drawHouse(c, h, lit, t) {
    const x = h.x, y = h.y, pal = ROOFS[h.v % ROOFS.length], wall = WALLS[(h.v + h.x) % WALLS.length];
    P(c, x - 12, y - 1, 24, 3, 'rgba(0,0,0,.3)');
    P(c, x - 9, y - 11, 18, 11, wall);
    P(c, x - 9, y - 11, 1, 11, 'rgba(0,0,0,.25)'); P(c, x + 8, y - 11, 1, 11, 'rgba(0,0,0,.25)'); P(c, x, y - 11, 1, 11, 'rgba(0,0,0,.18)');
    P(c, x - 2, y - 7, 4, 7, '#3a261a'); P(c, x + 1, y - 4, 1, 1, '#c9a14a');
    const wc = lit ? '#ffd36a' : '#2a2c3c';
    P(c, x - 7, y - 8, 3, 3, wc); P(c, x + 4, y - 8, 3, 3, wc);
    roof(c, x, y - 20, y - 20, 9, 14, 24, pal);
    P(c, x + 4, y - 23, 3, 5, '#6a6a74'); P(c, x + 4, y - 23, 3, 1, '#4a4a54');
    if (h.v === 4) { P(c, x - 11, y - 12, 22, 1, '#7a2430'); }
  }
  function smoke(c, x, y, t, col, n) {
    for (let k = 0; k < (n || 3); k++) {
      const life = (t * 0.25 + k / (n || 3) + x * 0.013) % 1;
      const px = x + Math.round(Math.sin(life * 6 + x) * 2), py = y - life * 16;
      const a = (1 - life) * 0.7;
      c.fillStyle = col ? col.replace('A', a.toFixed(2)) : `rgba(170,170,184,${a.toFixed(2)})`;
      c.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
  }
  const DRAW = {
    taverna(c, L, t, night) {
      const x = L.x, y = L.y;
      P(c, x - 22, y - 1, 44, 3, 'rgba(0,0,0,.3)');
      P(c, x - 18, y - 15, 36, 15, '#7a5030'); for (let i = -18; i < 18; i += 6) P(c, x + i, y - 15, 1, 15, '#5e3c24');
      P(c, x - 18, y - 6, 36, 1, '#5e3c24');
      const wc = night ? '#ffcc5c' : '#2a2c3c';
      P(c, x - 14, y - 12, 4, 4, wc); P(c, x - 6, y - 12, 4, 4, wc); P(c, x + 8, y - 12, 4, 4, wc);
      P(c, x + 1, y - 9, 5, 9, '#3a261a');
      roof(c, x, y - 26, y - 26, 11, 30, 44, ['#8a3a28', '#a04a32', '#6a2a1c']);
      P(c, x - 12, y - 30, 4, 6, '#6a6a74');
      P(c, x + 20, y - 18, 1, 14, '#5e3c24'); P(c, x + 18, y - 18, 6, 1, '#5e3c24'); P(c, x + 19, y - 17, 5, 4, '#c89a3a'); P(c, x + 20, y - 16, 2, 2, '#fff2c8');
      P(c, x - 15, y + 7, 12, 2, '#6a4428'); P(c, x - 14, y + 9, 1, 2, '#4a2e1a'); P(c, x - 5, y + 9, 1, 2, '#4a2e1a');
      P(c, x - 13, y + 4, 8, 2, '#8a5a34');
      P(c, x + 10, y + 3, 10, 2, '#6a4428');
      P(c, x + 13, y - 4, 4, 5, '#8a5a30'); P(c, x + 13, y - 2, 4, 1, '#5e3c24');
      smoke(c, x - 11, y - 31, t);
    },
    forja(c, L, t) {
      const x = L.x, y = L.y;
      P(c, x - 15, y - 1, 30, 3, 'rgba(0,0,0,.3)');
      P(c, x - 12, y - 13, 24, 13, '#6e6e78'); for (let j = 0; j < 13; j += 3) P(c, x - 12, y - 13 + j, 24, 1, '#5a5a64');
      roof(c, x, y - 20, y - 20, 7, 20, 28, ['#3e4250', '#4e5262', '#2e313c']);
      P(c, x + 5, y - 26, 4, 8, '#5a5a64');
      const fl = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.3);
      P(c, x - 5, y - 8, 9, 8, '#2a1a14'); P(c, x - 4, y - 4, 7, 4, `rgba(255,${Math.round(110 + 60 * fl)},40,1)`); P(c, x - 2, y - 3, 3, 2, '#ffe08a');
      P(c, x + 7, y + 4, 6, 2, '#4a4a52'); P(c, x + 8, y + 6, 4, 2, '#3a3a42'); P(c, x + 9, y + 8, 2, 2, '#4a4a52');
      P(c, x - 13, y + 3, 4, 4, '#5a4030'); P(c, x - 12, y + 3, 2, 1, '#3a6aa0');
      smoke(c, x + 6, y - 27, t, 'rgba(120,120,130,A)', 4);
    },
    oficina(c, L, t) {
      const x = L.x, y = L.y;
      P(c, x - 15, y - 1, 30, 3, 'rgba(0,0,0,.3)');
      P(c, x - 13, y - 12, 26, 12, '#8a6440'); for (let i = -13; i < 13; i += 5) P(c, x + i, y - 12, 1, 12, '#6a4a2e');
      roof(c, x, y - 20, y - 20, 8, 22, 30, ['#4e6a86', '#5e7c9a', '#3a5068']);
      P(c, x - 3, y - 8, 6, 8, '#3a261a');
      const g = Math.floor(t * 2) % 2;
      P(c, x - 10, y - 10, 5, 5, '#c9a14a'); P(c, x - 9, y - 9, 3, 3, '#8a6a2a'); P(c, x - 8, y - 8, 1, 1, '#c9a14a');
      if (g) { P(c, x - 11, y - 8, 1, 1, '#c9a14a'); P(c, x - 5, y - 8, 1, 1, '#c9a14a'); } else { P(c, x - 8, y - 11, 1, 1, '#c9a14a'); P(c, x - 8, y - 5, 1, 1, '#c9a14a'); }
      P(c, x + 12, y - 4, 5, 5, '#a0773f'); P(c, x + 12, y - 2, 5, 1, '#7a5a2e'); P(c, x + 15, y - 8, 4, 4, '#a0773f');
      P(c, x + 6, y + 4, 8, 2, '#6a4428'); P(c, x + 7, y + 3, 2, 1, '#9aa0aa'); P(c, x + 11, y + 2, 2, 2, '#c9a14a');
    },
    laboratorio(c, L, t) {
      const x = L.x, y = L.y;
      P(c, x - 13, y - 1, 26, 3, 'rgba(0,0,0,.3)');
      P(c, x - 10, y - 12, 20, 12, '#7c7a84'); for (let j = 0; j < 12; j += 3) P(c, x - 10, y - 12 + j, 20, 1, '#66646e');
      roof(c, x, y - 19, y - 19, 7, 16, 24, ['#3f6a4a', '#4f805a', '#2e5038']);
      P(c, x - 2, y - 7, 4, 7, '#2e2a22'); P(c, x + 4, y - 9, 3, 3, '#7dff9a');
      P(c, x + 3, y - 24, 3, 6, '#5a5a64');
      smoke(c, x + 4, y - 25, t, 'rgba(110,230,140,A)', 4);
      P(c, x - 18, y + 4, 9, 2, '#6a4428'); P(c, x - 17, y + 6, 1, 2, '#4a2e1a'); P(c, x - 10, y + 6, 1, 2, '#4a2e1a');
      P(c, x - 17, y + 2, 1, 2, '#ff6ad5'); P(c, x - 15, y + 1, 2, 3, '#7dff9a'); P(c, x - 12, y + 2, 1, 2, '#6ac8ff');
    },
    biblioteca(c, L, t) {
      const x = L.x, y = L.y;
      P(c, x - 15, y - 1, 30, 3, 'rgba(0,0,0,.3)');
      P(c, x - 12, y - 13, 24, 13, '#9a948a'); for (let j = 0; j < 13; j += 3) P(c, x - 12, y - 13 + j, 24, 1, '#86807a');
      roof(c, x, y - 21, y - 21, 8, 20, 28, ['#6e2a2a', '#843636', '#561e1e']);
      P(c, x - 3, y - 9, 6, 9, '#3a261a'); P(c, x - 2, y - 10, 4, 1, '#3a261a');
      P(c, x - 10, y - 10, 3, 4, '#2a2c3c'); P(c, x + 7, y - 10, 3, 4, '#2a2c3c');
      P(c, x + 8, y + 3, 9, 2, '#6a4428'); P(c, x + 9, y + 2, 4, 1, '#efe2bf'); P(c, x + 14, y + 1, 2, 2, '#7a2e2e'); P(c, x + 14, y, 2, 1, '#2e4f7a');
    },
    arena(c, L, t) {
      const x = L.x, y = L.y;
      for (let j = -9; j <= 9; j++) { const w = Math.round(Math.sqrt(1 - (j / 10) ** 2) * 22); P(c, x - w, y + j, w * 2, 1, j % 3 ? '#c8a874' : '#bea06c'); }
      for (let a = 0; a < 6.28; a += 0.52) { const px = x + Math.cos(a) * 23, py = y + Math.sin(a) * 10.5; P(c, px, py - 4, 2, 5, '#6a4428'); }
      P(c, x + 10, y - 10, 1, 9, '#6a4428'); P(c, x + 7, y - 8, 7, 1, '#6a4428'); P(c, x + 8, y - 14, 5, 5, '#d8b45a'); P(c, x + 9, y - 7, 3, 4, '#b09048');
      P(c, x - 16, y - 7, 1, 6, '#9aa0aa'); P(c, x - 14, y - 7, 1, 6, '#9aa0aa'); P(c, x - 17, y - 1, 5, 1, '#6a4428');
    },
    fazenda(c, L, t, night, dia) {
      const x = L.x, y = L.y, g = clamp(dia - 1, 1, 4);
      for (let r = 0; r < 6; r++) {
        const yy = y - 16 + r * 6;
        P(c, x - 30, yy, 60, 4, '#6a4a2e'); P(c, x - 30, yy, 60, 1, '#7e5a38');
        for (let i = -28; i < 28; i += 4) { const sway = Math.round(Math.sin(t * 1.5 + i * 0.3 + r)); P(c, x + i + (g > 2 ? sway : 0), yy - g + 1, 1, g, g > 3 ? '#d8b44a' : '#5aaa4a'); }
      }
      P(c, x + 34, y - 10, 1, 12, '#6a4428'); P(c, x + 31, y - 7, 7, 1, '#6a4428'); P(c, x + 32, y - 13, 5, 4, '#d8b45a'); P(c, x + 31, y - 14, 7, 1, '#a0773f'); P(c, x + 32, y - 6, 5, 4, '#8a3a2e');
    },
    pasto(c, L, t) {
      const x = L.x, y = L.y, w = 58, h = 36;
      for (let i = 0; i <= w; i += 6) { P(c, x - w / 2 + i, y - h / 2 - 3, 2, 4, '#7a5230'); P(c, x - w / 2 + i, y + h / 2 - 3, 2, 4, '#7a5230'); }
      for (let j = 0; j <= h; j += 6) { P(c, x - w / 2, y - h / 2 + j - 3, 2, 4, '#7a5230'); P(c, x + w / 2, y - h / 2 + j - 3, 2, 4, '#7a5230'); }
      P(c, x - w / 2, y - h / 2 - 2, w + 2, 1, '#a8844e'); P(c, x - w / 2, y + h / 2 - 2, w + 2, 1, '#a8844e');
      P(c, x - w / 2, y - h / 2 - 2, 1, h + 1, '#a8844e'); P(c, x + w / 2 + 1, y - h / 2 - 2, 1, h + 1, '#a8844e');
    },
    cais(c, L, t) {
      const x = L.x, y = L.y;
      P(c, x - 5, y + 2, 12, 44, 'rgba(0,0,0,.25)');
      P(c, x - 6, y, 12, 44, '#8a6234'); for (let j = 0; j < 44; j += 3) P(c, x - 6, y + j, 12, 1, '#6e4c28');
      P(c, x - 7, y + 6, 2, 3, '#5a3e22'); P(c, x + 5, y + 6, 2, 3, '#5a3e22'); P(c, x - 7, y + 26, 2, 3, '#5a3e22'); P(c, x + 5, y + 26, 2, 3, '#5a3e22');
      const bob = Math.round(Math.sin(t * 1.4));
      P(c, x + 9, y + 34 + bob, 18, 6, '#7a4e2e'); P(c, x + 10, y + 35 + bob, 16, 2, '#a8844e'); P(c, x + 17, y + 18 + bob, 1, 17, '#5e3c24');
      P(c, x + 18, y + 20 + bob, 7, 12, '#e8dcc0'); P(c, x + 18, y + 25 + bob, 7, 1, '#c03a3a');
      P(c, x - 4, y + 4, 4, 4, '#8a5a30'); P(c, x - 4, y + 5, 4, 1, '#5e3c24');
      P(c, x + 4, y + 40, 1, 7, '#4a2e1a'); P(c, x + 3, y + 38, 3, 3, '#ffcc5c');
    },
    torre(c, L, t, night) {
      const x = L.x, y = L.y;
      P(c, x - 10, y - 1, 20, 3, 'rgba(0,0,0,.35)');
      P(c, x - 7, y - 40, 14, 40, '#4a4458'); P(c, x - 7, y - 40, 3, 40, '#5a5468');
      for (let j = 0; j < 40; j += 4) P(c, x - 7, y - 40 + j, 14, 1, '#3a3446');
      for (let i = -8; i < 8; i += 4) P(c, x + i, y - 44, 2, 4, '#4a4458');
      P(c, x - 8, y - 41, 16, 2, '#3a3446');
      const glow = 0.6 + 0.4 * Math.sin(t * 2.3);
      P(c, x - 2, y - 33, 4, 5, night ? `rgba(170,110,255,${glow.toFixed(2)})` : '#2a2440'); P(c, x - 2, y - 20, 4, 4, night ? '#7a50c8' : '#2a2440');
      P(c, x - 2, y - 7, 4, 7, '#1e1a28');
      P(c, x, y - 52, 1, 9, '#3a2a1e'); P(c, x + 1, y - 52, 6, 3, '#5a2a8a'); P(c, x + 1, y - 49, 4, 1, '#5a2a8a');
    },
    santuario(c, L, t, night) {
      const x = L.x, y = L.y;
      for (let a = 0; a < 6.28; a += 1.05) { const px = x + Math.cos(a) * 13, py = y + Math.sin(a) * 7; P(c, px - 1, py - 7, 3, 8, '#8a8e9a'); P(c, px - 1, py - 7, 1, 8, '#a6aab4'); }
      P(c, x - 4, y - 3, 8, 4, '#6e7280'); P(c, x - 4, y - 3, 8, 1, '#9a9eaa');
      const f = Math.round(Math.sin(t * 8));
      P(c, x - 3, y - 6, 1, 3, '#f2ead8'); P(c, x - 3, y - 7 + (f > 0 ? 0 : 1), 1, 1, '#ffcc5c');
      P(c, x + 2, y - 6, 1, 3, '#f2ead8'); P(c, x + 2, y - 7 + (f > 0 ? 1 : 0), 1, 1, '#ffcc5c');
      for (let k = 0; k < 4; k++) {
        const a = t * 0.6 + k * 1.57, px = x + Math.cos(a) * 10, py = y - 12 + Math.sin(a * 1.3) * 4;
        P(c, px, py, 1, 1, night ? '#cfefff' : 'rgba(207,239,255,0.55)');
      }
    },
    ponte(c, L, t) {
      const x = L.x, y = L.y;
      P(c, x - 9, y - 4, 18, 8, 'rgba(0,0,0,.25)');
      P(c, x - 9, y - 5, 18, 8, '#8a6234'); for (let i = -9; i < 9; i += 3) P(c, x + i, y - 5, 1, 8, '#6e4c28');
      P(c, x - 9, y - 7, 18, 1, '#5e3c24'); P(c, x - 9, y + 3, 18, 1, '#5e3c24');
      P(c, x - 9, y - 8, 2, 3, '#5e3c24'); P(c, x + 7, y - 8, 2, 3, '#5e3c24'); P(c, x - 9, y + 2, 2, 3, '#5e3c24'); P(c, x + 7, y + 2, 2, 3, '#5e3c24');
    }
  };
  function drawFire(c, t) {
    const x = FIRE.x, y = FIRE.y;
    for (let a = 0; a < 6.28; a += 0.785) P(c, x + Math.round(9 * Math.cos(a)) - 1, y + 3 + Math.round(4.5 * Math.sin(a)) - 1, 3, 2, '#7a7a86');
    P(c, x - 6, y + 2, 12, 2, '#6a4428'); P(c, x - 4, y + 4, 8, 1, '#4a2e1a');
    const h = 9 + (Math.floor(t * 12) % 3);
    c.fillStyle = '#f06e1e'; c.beginPath(); c.moveTo(x - 5, y + 3); c.lineTo(x + 5, y + 3); c.lineTo(x + 2, y - h / 2); c.lineTo(x, y - h); c.lineTo(x - 2, y - h / 2); c.closePath(); c.fill();
    c.fillStyle = '#ffbe3c'; c.beginPath(); c.moveTo(x - 3, y + 3); c.lineTo(x + 3, y + 3); c.lineTo(x + 1, y - h / 2 + 2); c.lineTo(x, y - h + 4); c.lineTo(x - 1, y - h / 2 + 2); c.closePath(); c.fill();
    P(c, x - 1, y, 2, 3, '#fff096');
    for (let i = 0; i < 14; i++) { const life = (t * 0.9 + i * 0.37) % 1; if (life > 0.9) continue; P(c, x + Math.round(7 * Math.sin(i * 2.1 + t * 2)), y - 8 - life * 34, 1, 1, `rgb(255,${Math.round(200 - 110 * life)},60)`); }
  }
  const LANTERNAS = [[344, 318], [416, 320], [380, 342], [352, 274]];
  function drawLantern(c, x, y, night) {
    P(c, x, y - 9, 1, 9, '#3a2a1e'); P(c, x - 1, y - 12, 3, 3, night ? '#ffd36a' : '#6a5a3a'); P(c, x - 1, y - 13, 3, 1, '#3a2a1e');
  }
  function drawSheep(c, x, y, t, k) {
    x = Math.round(x); y = Math.round(y);
    P(c, x - 3, y, 7, 2, 'rgba(0,0,0,.25)');
    P(c, x - 3, y - 4, 7, 4, '#f2efe6'); P(c, x - 2, y - 5, 5, 1, '#f2efe6'); P(c, x - 3, y - 1, 7, 1, '#d6d2c6');
    const s = k % 2 ? 1 : -1; P(c, s > 0 ? x + 3 : x - 5, y - 5, 3, 3, '#3a3236');
    P(c, x - 2, y, 1, 1, '#3a3236'); P(c, x + 2, y, 1, 1, '#3a3236');
  }

  // ---------------------------------------------------------------- DOM / estado
  const stage = document.getElementById('ilha');
  const ctx = stage.getContext('2d');
  const buf = document.createElement('canvas'), bctx = buf.getContext('2d');
  const lightC = document.createElement('canvas'), lctx = lightC.getContext('2d');
  const cam = { x: 390, y: 320, s: 2, follow: null };
  let vw = 0, vh = 0, dpr = 1, frameChars = [], hoverId = null, pinnedId = null, lastOx = 0, lastOy = 0;
  const offPx = () => vw >= 760 ? 153 : 0;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = stage.clientWidth; vh = stage.clientHeight;
    stage.width = Math.round(vw * dpr); stage.height = Math.round(vh * dpr);
  }
  function defaultScale() { return clamp(Math.round(Math.min(vw, vh) / 430), 2, 6); }

  // ---------------------------------------------------------------- render
  function render(t) {
    const S = cam.s * dpr;
    const bw = Math.ceil(stage.width / S) + 2, bh = Math.ceil(stage.height / S) + 2;
    if (buf.width !== bw || buf.height !== bh) { buf.width = bw; buf.height = bh; lightC.width = bw; lightC.height = bh; }
    const hrs = localHours(t), night = darkness(hrs) > 0.3, dia = diaDe(t), sec = t / 1000;

    // personagens
    frameChars = [];
    MOR.forEach(m => {
      const p = posAt(m, t);
      if (!p) return;
      const p2 = posAt(m, t - 300);
      const vx = p2 ? p.x - p2.x : 0, vy = p2 ? p.y - p2.y : 0;
      let side = vx < -0.05 ? -1 : vx > 0.05 ? 1 : (rnd(m.id, 's') < 0.5 ? -1 : 1);
      if (!p.walking && p.leg.pl === 'fogueira') side = p.x > FIRE.x ? -1 : 1;
      const dir = p.walking && vy < -Math.abs(vx) ? 'up' : 'down';
      frameChars.push({ m, p, side, dir });
    });
    if (cam.follow) {
      const f = frameChars.find(q => q.m.id === cam.follow);
      if (f) { cam.x += (f.p.x - cam.x) * 0.18; cam.y += (f.p.y - 6 - cam.y) * 0.18; }
    }
    cam.x = clamp(cam.x, 0, WW); cam.y = clamp(cam.y, 0, WH);
    const ox = Math.round(cam.x - bw / 2 + offPx() / cam.s), oy = Math.round(cam.y - bh / 2);
    lastOx = ox; lastOy = oy;

    const c = bctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#0e243e'; c.fillRect(0, 0, bw, bh);
    c.drawImage(terr, -ox, -oy);
    c.setTransform(1, 0, 0, 1, -ox, -oy);

    // agua animada
    const fi = Math.floor(sec * 2.5);
    for (let i = 0; i < waterPts.length; i += 2) if ((fi + i) % 7 === 0) P(c, waterPts[i], waterPts[i + 1], 1, 1, '#4a7aa8');
    for (let i = 0; i < shorePts.length; i += 2) {
      const x = shorePts[i], y = shorePts[i + 1];
      if (Math.sin(sec * 1.6 + idist(x, y) * 80 + x * 0.05) > 0.85) P(c, x, y, 1, 1, '#5a8cb0');
    }

    // objetos ordenados por y
    const places = placesAt(t), objs = [];
    places.forEach(k => { if (DRAW[k]) objs.push({ y: k === 'arena' || k === 'fazenda' || k === 'pasto' ? LUG[k].y - 30 : k === 'cais' ? LUG[k].y - 2 : LUG[k].y, f: () => DRAW[k](c, LUG[k], sec, night, dia) }); });
    const sleepers = new Set();
    frameChars.forEach(q => { if (q.p.hidden && q.m._casaObj) sleepers.add(q.m._casaObj); });
    casas.forEach(h => {
      if (!h.donos.some(m => arrived(m, t))) return;
      const anyHome = h.donos.some(m => { const q = frameChars.find(z => z.m === m); return q && q.p.leg.pl === 'casa' && !q.p.hidden; });
      const lit = night && (anyHome || (hrs >= 18 && hrs < 22.5));
      objs.push({ y: h.y, f: () => { drawHouse(c, h, lit, sec); if (!sleepers.has(h)) smoke(c, h.x + 5, h.y - 24, sec); } });
    });
    objs.push({ y: FIRE.y + 3, f: () => drawFire(c, sec) });
    LANTERNAS.forEach(l => objs.push({ y: l[1], f: () => drawLantern(c, l[0], l[1], night) }));
    if (places.has('pasto')) {
      for (let k = 0; k < 6; k++) {
        const L = LUG.pasto, W = Math.floor(sec / 11 + k * 0.37);
        const ax = L.x + (rnd('ov', k, W - 1) - 0.5) * 46, ay = L.y + (rnd('ov', k, 'y', W - 1) - 0.5) * 24;
        const bx = L.x + (rnd('ov', k, W) - 0.5) * 46, by = L.y + (rnd('ov', k, 'y', W) - 0.5) * 24;
        const f = clamp((sec / 11 + k * 0.37 - W) * 3, 0, 1);
        const sx = ax + (bx - ax) * f, sy = ay + (by - ay) * f;
        objs.push({ y: sy, f: () => drawSheep(c, sx, sy, sec, k + (bx < ax ? 1 : 0)) });
      }
    }
    frameChars.forEach(q => { if (!q.p.hidden) objs.push({ y: q.p.y, f: () => SP.drawCharacter(c, q.p.x, q.p.y, q.m.visual, { t: sec + q.m._i, walking: q.p.walking, side: q.side, dir: q.dir, dormindo: q.p.sleeping }) }); });
    // extras (ex.: mascotes dos apoiadores, em extras.js) entram na mesma ordenação por y
    HOOKS.forEach(h => { try { h(objs, c, { t, sec, night, hrs }); } catch (e) { } });
    objs.sort((a, b) => a.y - b.y).forEach(o => o.f());

    // brilho de chegada
    frameChars.forEach(q => {
      if (!q.p.arriving) return;
      for (let i = 0; i < 6; i++) { const a = sec * 3 + i * 1.05; P(c, q.p.x + Math.cos(a) * 7, q.p.y - 8 + Math.sin(a) * 5, 1, 1, i % 2 ? '#ffe27a' : '#fffbe0'); }
    });

    // vagalumes a noite
    if (night) {
      for (let i = 0; i < landPts.length; i += 2) {
        if ((i / 2) % 3) continue;
        const x = landPts[i] + Math.sin(sec * 0.7 + i) * 4, y = landPts[i + 1] + Math.cos(sec * 0.5 + i) * 3;
        if (Math.sin(sec * 2 + i) > 0.2) P(c, x, y, 1, 1, ['#ffe27a', '#9ad0ff', '#b8f0a0'][i % 3]);
      }
    }

    // clima
    const cl = clima(t);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (cl === 'nublado') { c.fillStyle = 'rgba(30,40,60,0.14)'; c.fillRect(0, 0, bw, bh); }
    if (cl === 'chuva') {
      c.fillStyle = 'rgba(20,30,50,0.22)'; c.fillRect(0, 0, bw, bh);
      c.fillStyle = 'rgba(180,200,230,0.55)';
      for (let i = 0; i < 160; i++) { const x = (rnd('r', i) * bw + sec * 40) % bw, y = (rnd('ry', i) * bh + sec * 150 + i * 7) % bh; c.fillRect(Math.round(x), Math.round(y), 1, 3); }
    }

    // noite e luzes
    const dk = darkness(hrs);
    if (dk > 0.01) {
      lctx.globalCompositeOperation = 'source-over';
      lctx.clearRect(0, 0, bw, bh);
      lctx.fillStyle = `rgba(8,12,40,${dk.toFixed(3)})`; lctx.fillRect(0, 0, bw, bh);
      lctx.globalCompositeOperation = 'destination-out';
      const flick = 0.92 + 0.08 * Math.sin(sec * 13) + 0.04 * Math.sin(sec * 31);
      const light = (x, y, r, a) => {
        const X = x - ox, Y = y - oy; if (X < -r || Y < -r || X > bw + r || Y > bh + r) return;
        const g = lctx.createRadialGradient(X, Y, 0, X, Y, r);
        g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.55})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        lctx.fillStyle = g; lctx.fillRect(X - r, Y - r, r * 2, r * 2);
      };
      light(FIRE.x, FIRE.y, 62 * flick, 1);
      LANTERNAS.forEach(l => light(l[0], l[1] - 11, 16, 0.8));
      if (places.has('forja')) light(LUG.forja.x, LUG.forja.y - 4, 26 * flick, 0.9);
      if (places.has('taverna') && (hrs >= 15 || hrs < 2)) light(LUG.taverna.x, LUG.taverna.y, 34, 0.85);
      if (places.has('torre')) light(LUG.torre.x, LUG.torre.y - 30, 18, 0.8);
      if (places.has('santuario')) light(LUG.santuario.x, LUG.santuario.y - 5, 16, 0.85);
      if (places.has('laboratorio')) light(LUG.laboratorio.x + 5, LUG.laboratorio.y - 8, 12, 0.7);
      light(LUG.cais.x + 4, LUG.cais.y + 38, 16, 0.85);
      casas.forEach(h => { if (h.donos.some(m => arrived(m, t)) && hrs >= 18 && hrs < 22.5) light(h.x, h.y - 6, 13, 0.7); });
      c.drawImage(lightC, 0, 0);
      // tom quente perto do fogo
      c.globalCompositeOperation = 'lighter';
      const X = FIRE.x - ox, Y = FIRE.y - oy, g = c.createRadialGradient(X, Y, 0, X, Y, 46);
      g.addColorStop(0, `rgba(120,60,10,${(0.35 * dk * flick).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(X - 46, Y - 46, 92, 92);
      c.globalCompositeOperation = 'source-over';
    }
    const dusk = hrs >= 16.5 && hrs < 19.5 ? Math.sin((hrs - 16.5) / 3 * Math.PI) : hrs >= 5 && hrs < 7.5 ? Math.sin((hrs - 5) / 2.5 * Math.PI) * 0.7 : 0;
    if (dusk > 0.01) { c.fillStyle = `rgba(255,130,60,${(0.13 * dusk).toFixed(3)})`; c.fillRect(0, 0, bw, bh); }
    if (cl === 'neblina') { c.fillStyle = 'rgba(210,220,230,0.2)'; c.fillRect(0, 0, bw, bh); }

    // para a tela
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 0, 0, bw * S, bh * S);

    // textos em tela (nomes, falas, z)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scr = (x, y) => [(x - ox) * cam.s, (y - oy) * cam.s];
    const fs = cam.s >= 4 ? 16 : 8;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    sleepers.forEach(h => {
      const [sx, sy] = scr(h.x - 4, h.y - 24); const ph = (sec * 0.6) % 1;
      ctx.font = `${8 * Math.max(1, Math.floor(cam.s / 2))}px Silkscreen, monospace`; ctx.fillStyle = `rgba(220,230,255,${(1 - ph).toFixed(2)})`;
      ctx.fillText('z', sx - ph * 6, sy - ph * 14);
    });
    frameChars.forEach(q => {
      const m = q.m, p = q.p;
      if (p.hidden) return;
      const hb = SP.hitBox(m.visual);
      const [sx, sy] = scr(p.x, p.y + hb.t - 2);
      const focus = m.id === hoverId || m.id === pinnedId || m.id === cam.follow;
      if (p.sleeping) {
        const ph = (sec * 0.6 + m._i * 0.3) % 1;
        ctx.font = `${fs}px Silkscreen, monospace`; ctx.fillStyle = `rgba(220,230,255,${(1 - ph).toFixed(2)})`; ctx.fillText('z', sx + 6 + ph * 6, sy - ph * 12);
      }
      if (cam.s >= 3 || focus || p.arriving) {
        ctx.font = `${fs}px Silkscreen, monospace`;
        const label = p.arriving ? m.nome.toUpperCase() + ' CHEGOU!' : m.nome.toUpperCase();
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,16,0.9)'; ctx.lineJoin = 'round';
        ctx.strokeText(label, sx, sy);
        ctx.fillStyle = p.arriving ? '#ffd046' : focus ? '#ffd046' : '#f4f1e8'; ctx.fillText(label, sx, sy);
      }
      const fr = frase(m, p, t);
      if (fr && cam.s >= 2) {
        ctx.font = `${fs === 16 ? 14 : 12}px "Pixelify Sans", monospace`;
        const w = Math.ceil(ctx.measureText(fr).width) + 12, h = fs === 16 ? 22 : 18;
        const bx = Math.round(sx - w / 2), by = Math.round(sy - (cam.s >= 3 ? fs + 4 : 4) - h);
        ctx.fillStyle = '#f7f2e4'; ctx.fillRect(bx, by, w, h); ctx.fillRect(bx + 2, by - 2, w - 4, h + 4);
        ctx.fillStyle = '#1b1a1f'; ctx.fillRect(Math.round(sx) - 2, by + h + 2, 4, 3);
        ctx.fillStyle = '#f7f2e4'; ctx.fillRect(Math.round(sx) - 2, by + h + 1, 4, 3);
        ctx.fillStyle = '#2a2420'; ctx.fillText(fr, sx, by + h - (fs === 16 ? 6 : 5));
      }
    });
    // textos de extras (ex.: @ dos viajantes, falas, em jogo.js)
    TEXTO.forEach(h => { try { h(ctx, scr, fs, { t, sec }); } catch (e) { } });
  }

  // ---------------------------------------------------------------- HUD e lista
  const $ = id => document.getElementById(id);
  const fmtHora = t => { const d = new Date(t + TZ); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
  const CLIMA_TXT = { limpo: ['Céu limpo', 'Noite estrelada'], nublado: ['Nublado', 'Noite nublada'], chuva: ['Chuva leve', 'Chuva na noite'], neblina: ['Neblina', 'Neblina'] };
  const items = {};
  function buildList() {
    const ul = $('lista'); ul.innerHTML = '';
    MOR.forEach(m => {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mor'; b.id = 'mor-' + m.id;
      const ic = SP.icon(m.visual, 2); ic.className = 'mor-ic'; ic.setAttribute('aria-hidden', 'true');
      const tx = document.createElement('span'); tx.className = 'mor-tx';
      tx.innerHTML = `<span class="mor-nome"></span><span class="mor-prof"></span><span class="mor-ativ"><i class="dot"></i><span class="ativ"></span></span>`;
      tx.querySelector('.mor-nome').textContent = m.nome;
      tx.querySelector('.mor-prof').textContent = m.profissao;
      b.append(ic, tx);
      b.addEventListener('click', () => seguir(m.id));
      li.appendChild(b); ul.appendChild(li);
      items[m.id] = { li, b, ativ: tx.querySelector('.ativ'), dot: tx.querySelector('.dot') };
    });
  }
  function estado(m, t) {
    const p = posAt(m, t);
    if (!p) return { txt: 'Chega ' + quando(m._ch), cls: 'pend', p: null };
    if (p.arriving) return { txt: 'Chegando de barco agora', cls: 'and', p };
    if (p.viagem) return { txt: 'A caminho: ' + placeName(p.leg.pl, m), cls: 'and', p };
    return { txt: p.leg.act, cls: p.sleeping ? 'dorm' : 'ativo', p };
  }
  function quando(ms) {
    const d = diaDe(ms), now = Date.now();
    const same = Math.floor((ms + TZ) / 864e5) === Math.floor((now + TZ) / 864e5);
    return (same ? 'hoje às ' : 'no Dia ' + d + ' às ') + fmtHora(ms);
  }
  function updateHUD(t) {
    const dia = diaDe(t), h = localHours(t), night = darkness(h) > 0.3, cl = clima(t);
    $('h-dia').textContent = 'DIA ' + dia;
    $('h-hora').textContent = fmtHora(t);
    $('h-clima').textContent = CLIMA_TXT[cl][night ? 1 : 0];
    const pres = MOR.filter(m => arrived(m, t));
    const places = placesAt(t);
    const nCasas = casas.filter(c => c.donos.some(m => arrived(m, t))).length;
    const nCons = Array.from(places).filter(k => DRAW[k]).length + 1;
    $('h-mor').textContent = pres.length;
    $('h-casas').textContent = nCasas;
    $('h-cons').textContent = nCons;
    $('lista-n').textContent = pres.length;
    const q = ($('busca').value || '').trim().toLowerCase();
    MOR.forEach(m => {
      const it = items[m.id]; const e = estado(m, t);
      it.ativ.textContent = e.txt; it.dot.className = 'dot ' + e.cls;
      it.li.hidden = !!q && !(m.nome + ' ' + m.profissao).toLowerCase().includes(q);
      it.b.classList.toggle('on', cam.follow === m.id);
    });
    // chegada
    const pend = MOR.filter(m => !PREVIEW && t < m._ch);
    const ch = $('chegada');
    if (pend.length || PREVIEW) {
      ch.hidden = false;
      if (PREVIEW) { $('ch-txt').textContent = 'Prévia: todos os moradores já estão na ilha.'; $('ch-btn').textContent = 'Voltar ao vivo'; }
      else {
        const next = Math.min.apply(null, pend.map(m => m._ch)), nn = pend.filter(m => m._ch - next < 15 * 60e3).length;
        const left = next - t, hh = Math.floor(left / 3600e3), mm = Math.floor(left % 3600e3 / 60e3), ss = Math.floor(left % 60e3 / 1000);
        const desembarque = MOR.some(m => t >= m._ch && t - m._ch < 15 * 60e3 && m._ch > DIA2 - 864e5) && left < 15 * 60e3;
        $('ch-txt').textContent = desembarque
          ? `Desembarque ao vivo: ${pend.length} ${pend.length === 1 ? 'morador ainda no barco' : 'moradores ainda no barco'}`
          : `${nn} ${nn === 1 ? 'novo morador chega' : 'novos moradores chegam'} ${quando(next)} · faltam ${hh ? hh + 'h ' : ''}${String(mm).padStart(2, '0')}min ${String(ss).padStart(2, '0')}s`;
        $('ch-btn').textContent = 'Ver prévia';
      }
    } else ch.hidden = true;
    // seguindo
    const sg = $('seguindo');
    if (cam.follow) {
      const m = BY[cam.follow], e = estado(m, t);
      sg.hidden = false; $('sg-nome').textContent = m.nome; $('sg-ativ').textContent = e.txt;
    } else sg.hidden = true;
    if (pinnedId || hoverId) fillCard(BY[pinnedId || hoverId], t);
  }

  // ---------------------------------------------------------------- card
  const card = $('card');
  function fillCard(m, t) {
    if (!m) { card.hidden = true; return; }
    const e = estado(m, t);
    $('c-nome').textContent = m.nome; $('c-prof').textContent = m.profissao; $('c-hist').textContent = m.historia;
    $('c-ativ').textContent = e.txt;
    $('c-lugar').textContent = e.p ? (e.p.viagem ? 'Andando pela ilha' : placeName(e.p.leg.pl, m)) : 'Ainda no mar';
    $('c-desde').textContent = m._ch <= DIA2 - 864e5 ? 'Fundador da ilha' : 'Chegou no Dia ' + diaDe(m._ch);
    const ic = $('c-ic'); ic.innerHTML = ''; ic.appendChild(SP.icon(m.visual, 3));
    card.hidden = false;
  }
  function placeCard(px, py) {
    const r = card.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    let x = px + 18, y = py + 18;
    if (x + r.width > W - 12) x = px - r.width - 18;
    if (y + r.height > H - 12) y = H - r.height - 12;
    card.style.left = Math.max(12, x) + 'px'; card.style.top = Math.max(12, y) + 'px';
  }

  // ---------------------------------------------------------------- camera e interacao
  function seguir(id) {
    cam.follow = id; pinnedId = id; hoverId = null;
    if (cam.s < 4) cam.s = Math.min(6, Math.max(4, cam.s));
    fillCard(BY[id], Date.now());
    card.classList.add('fixo');
    if (window.innerWidth < 760) { $('painel').classList.remove('aberto'); $('btn-lista').setAttribute('aria-expanded', 'false'); }
    updateHUD(Date.now());
  }
  function pararSeguir() { cam.follow = null; pinnedId = null; card.classList.remove('fixo'); card.hidden = true; updateHUD(Date.now()); }
  function hitAt(cx, cy) {
    const r = stage.getBoundingClientRect();
    const wx = (cx - r.left) / cam.s + lastOx, wy = (cy - r.top) / cam.s + lastOy;
    let best = null;
    frameChars.forEach(q => {
      if (q.p.hidden) return;
      const hb = SP.hitBox(q.m.visual), pad = cam.s <= 2 ? 3 : 1;
      if (wx >= q.p.x + hb.l - pad && wx <= q.p.x + hb.r + pad && wy >= q.p.y + hb.t - pad && wy <= q.p.y + hb.b + pad) { if (!best || q.p.y > best.p.y) best = q; }
    });
    return best;
  }
  let drag = null;
  stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false, id: e.pointerId }; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => {
    if (drag && drag.id === e.pointerId) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
      if (drag.moved) { cam.follow = null; cam.x = drag.cx - dx / cam.s; cam.y = drag.cy - dy / cam.s; stage.style.cursor = 'grabbing'; }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const q = hitAt(e.clientX, e.clientY);
    stage.style.cursor = q ? 'pointer' : 'grab';
    if (q) { hoverId = q.m.id; if (!pinnedId) { fillCard(q.m, Date.now()); placeCard(e.clientX, e.clientY); } }
    else { hoverId = null; if (!pinnedId) card.hidden = true; }
  });
  stage.addEventListener('pointerleave', () => { hoverId = null; if (!pinnedId) card.hidden = true; });
  stage.addEventListener('pointerup', e => {
    if (!drag) return;
    const moved = drag.moved; drag = null; stage.style.cursor = 'grab';
    if (moved) return;
    const q = hitAt(e.clientX, e.clientY);
    if (window.IlhaClique && window.IlhaClique(e.clientX, e.clientY, q)) return; // modo jogador (jogo.js)
    if (q) seguir(q.m.id); else if (pinnedId) pararSeguir();
  });
  stage.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  function zoom(d) { cam.s = clamp(cam.s + d, 1, 6); }
  $('z-mais').addEventListener('click', () => zoom(1));
  $('z-menos').addEventListener('click', () => zoom(-1));
  $('z-ilha').addEventListener('click', () => { cam.follow = null; cam.x = 390; cam.y = 310; cam.s = Math.max(1, Math.floor(Math.min(vw / 740, vh / 560))) || 1; });
  $('sg-fechar').addEventListener('click', pararSeguir);
  $('c-fechar').addEventListener('click', pararSeguir);
  $('busca').addEventListener('input', () => updateHUD(Date.now()));
  $('btn-lista').addEventListener('click', () => { const p = $('painel'); const o = !p.classList.contains('aberto'); p.classList.toggle('aberto', o); $('btn-lista').setAttribute('aria-expanded', String(o)); });
  $('ch-btn').addEventListener('click', () => { PREVIEW = !PREVIEW; placeCache.t = -1; updateHUD(Date.now()); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') pararSeguir(); if (e.target.tagName === 'INPUT') return; if (e.key === '+' || e.key === '=') zoom(1); if (e.key === '-') zoom(-1); });
  window.addEventListener('resize', resize);

  // ---------------------------------------------------------------- musica 24/7
  const audio = { ctx: null, gain: null, el: null, playing: false, muted: false, vol: 0.55, started: false, escolhaManual: false };
  try { const s = JSON.parse(localStorage.getItem('grande-ilha-audio') || '{}'); if (typeof s.vol === 'number') audio.vol = s.vol; if (s.muted) audio.muted = true; } catch (e) { }
  function salvarAudio() { try { localStorage.setItem('grande-ilha-audio', JSON.stringify({ vol: audio.vol, muted: audio.muted })); } catch (e) { } }
  function aplicarVolume() {
    const v = audio.muted ? 0 : audio.vol;
    if (audio.gain) audio.gain.gain.setTargetAtTime(v, audio.ctx.currentTime, 0.05);
    if (audio.el) audio.el.volume = v;
    $('vol').value = Math.round(audio.vol * 100);
    $('btn-mudo').setAttribute('aria-pressed', String(audio.muted));
    $('btn-mudo').querySelector('.ico-som').hidden = audio.muted;
    $('btn-mudo').querySelector('.ico-mudo').hidden = !audio.muted;
    $('btn-mudo').setAttribute('aria-label', audio.muted ? 'Ativar som' : 'Silenciar');
  }
  function mostrarPlay() {
    $('btn-play').querySelector('.ico-play').hidden = audio.playing;
    $('btn-play').querySelector('.ico-pause').hidden = !audio.playing;
    $('btn-play').setAttribute('aria-label', audio.playing ? 'Pausar música' : 'Tocar música');
    $('dica-som').hidden = audio.started;
  }
  async function tocar() {
    audio.started = true;
    try {
      if (!audio.ctx && !audio.el) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audio.ctx = new AC(); audio.gain = audio.ctx.createGain(); audio.gain.gain.value = 0; audio.gain.connect(audio.ctx.destination);
        const res = await fetch('musica.mp3'); const ab = await res.arrayBuffer();
        const b = await audio.ctx.decodeAudioData(ab);
        const src = audio.ctx.createBufferSource(); src.buffer = b; src.loop = true; src.loopStart = 0.08; src.loopEnd = 0.08 + LOOP;
        src.connect(audio.gain); src.start(0, 0.08 + (Date.now() / 1000) % LOOP);
      }
      if (audio.ctx) await audio.ctx.resume(); else await audio.el.play();
    } catch (err) {
      try {
        if (audio.ctx) { audio.ctx.close(); audio.ctx = null; audio.gain = null; }
        audio.el = audio.el || new Audio('musica.mp3'); audio.el.loop = true; await audio.el.play();
      } catch (e2) { audio.playing = false; mostrarPlay(); return; }
    }
    audio.playing = true; aplicarVolume(); mostrarPlay();
  }
  function pausar() { if (audio.ctx) audio.ctx.suspend(); if (audio.el) audio.el.pause(); audio.playing = false; mostrarPlay(); }
  $('btn-play').addEventListener('click', e => { e.stopPropagation(); audio.escolhaManual = true; audio.playing ? pausar() : tocar(); });
  $('btn-mudo').addEventListener('click', e => { e.stopPropagation(); audio.escolhaManual = true; audio.muted = !audio.muted; aplicarVolume(); salvarAudio(); if (!audio.playing && !audio.muted) tocar(); });
  $('vol').addEventListener('input', e => { audio.vol = e.target.value / 100; if (audio.vol > 0) audio.muted = false; aplicarVolume(); salvarAudio(); });
  $('vol').addEventListener('pointerdown', e => e.stopPropagation());
  $('dica-som').addEventListener('click', e => { e.stopPropagation(); audio.escolhaManual = true; audio.muted = false; tocar(); });
  const primeiro = () => { if (!audio.escolhaManual && !audio.started) tocar(); window.removeEventListener('pointerdown', primeiro, true); window.removeEventListener('keydown', primeiro, true); };
  window.addEventListener('pointerdown', primeiro, true);
  window.addEventListener('keydown', primeiro, true);

  // ---------------------------------------------------------------- quem esta assistindo agora
  const MIN_PLATEIA = 3; // abaixo disso o painel mostra so "AO VIVO"
  function mostrarPlateia(n) {
    const el = $('h-ao');
    if (typeof n === 'number' && n >= MIN_PLATEIA) { el.textContent = n + ' ASSISTINDO'; el.hidden = false; }
    else el.hidden = true;
  }
  let tentativas = 0;
  function conectarPlateia() {
    if (window.ILHA_MANUAL || !/^https?:$/.test(location.protocol)) return;
    let ws, ping;
    try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ao-vivo'); }
    catch (e) { return; }
    ws.onopen = () => { tentativas = 0; ping = setInterval(() => { try { ws.send('ping'); } catch (e) { } }, 50000); };
    ws.onmessage = e => { try { const d = JSON.parse(e.data); if (typeof d.assistindo === 'number') mostrarPlateia(d.assistindo); } catch (err) { } };
    ws.onclose = () => {
      clearInterval(ping); mostrarPlateia(null);
      tentativas++;
      if (tentativas <= 8) setTimeout(conectarPlateia, Math.min(60000, 3000 * 2 ** tentativas) + Math.random() * 3000);
    };
  }
  conectarPlateia();

  // ---------------------------------------------------------------- loop
  resize();
  cam.s = defaultScale();
  if (vw < 760) { cam.x = 380; cam.y = 312; }
  buildList(); aplicarVolume(); mostrarPlay();
  let last = 0, lastHud = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    if (ts - last < 32) return;
    last = ts;
    const t = Date.now();
    render(t);
    if (ts - lastHud > 500) { lastHud = ts; updateHUD(t); }
  }
  updateHUD(Date.now());
  if (!window.ILHA_MANUAL) requestAnimationFrame(loop);
  window.GrandeIlha = {
    posAt, MOR, BY, casas, LUG, estado, cam, seguir, pararSeguir,
    rnd, diaDe, DIA2, FIRE, P, hooks: HOOKS, arrived: (m, t) => t >= m._ch, localHours,
    andavel: (x, y) => {
      if (Math.hypot(x - LUG.ponte.sx, y - LUG.ponte.sy) < 12 || Math.hypot(x - LUG.cais.sx, y - LUG.cais.sy) < 9) return true; // ponte e cais
      if (idist(x, y) >= 0.985 || (((x - LAKE.x) / LAKE.rx) ** 2 + ((y - LAKE.y) / LAKE.ry) ** 2) < 1.1) return false;
      if (Math.hypot(x - FIRE.x, (y - FIRE.y - 2) / 0.7) < 8) return false; // fogueira
      const agora = Date.now();
      for (const h of casas) if (x > h.x - 10 && x < h.x + 10 && y > h.y - 11 && y < h.y - 1 && h.donos.some(m => agora >= m._ch)) return false; // paredes das casas
      for (const k of ['taverna', 'forja', 'oficina', 'laboratorio', 'biblioteca', 'torre']) { const L = LUG[k]; if (Math.abs(x - L.x) < 11 && y > L.y - 14 && y < L.y - 2) return false; }
      for (let i = 0; i < STREAM.length - 1; i++) { // riacho: só se atravessa pela ponte
        const [ax, ay] = STREAM[i], [bx, by] = STREAM[i + 1], L2 = (bx - ax) ** 2 + (by - ay) ** 2;
        const k = clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L2, 0, 1);
        if (Math.hypot(x - ax - (bx - ax) * k, y - ay - (by - ay) * k) < 3.5) return false;
      }
      return true;
    },
    toWorld: (cx, cy) => { const r = stage.getBoundingClientRect(); return { x: (cx - r.left) / cam.s + lastOx, y: (cy - r.top) / cam.s + lastOy }; },
    renderAt: t => { placeCache.t = -1; render(t); updateHUD(t); },
    setPreview: v => { PREVIEW = v; placeCache.t = -1; }
  };
})();
