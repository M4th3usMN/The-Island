/* A Grande Ilha — simulação ao vivo.
   Tudo é calculado a partir do relógio real (horário de Brasília): todo visitante
   vê a mesma cena no mesmo instante, sem precisar de servidor. */
(function () {
  'use strict';
  const SP = window.IlhaSprites, ROT = window.IlhaRotinas;
  // Ilha ampliada (23/11/2026): cresce para norte, leste e oeste; a costa sul (cais) fica no mesmo lugar.
  // O terreno cobre x de X0 a X0+WW e y de Y0 a Y0+WH (coordenadas antigas continuam valendo).
  const X0 = -100, Y0 = -170, WW = 960, WH = 770, CX = 380, CY = 220, RX = 380, RY = 323;
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
  function idistC(x, y, cx, cy, rx, ry) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry, a = Math.atan2(dy, dx);
    const rad = 1 + 0.06 * Math.sin(3 * a + 1) + 0.04 * Math.sin(5 * a + 2) + 0.03 * Math.sin(9 * a);
    return Math.hypot(dx, dy) / rad;
  }
  const idist = (x, y) => idistC(x, y, CX, CY, RX, RY);
  const idistAntiga = (x, y) => idistC(x, y, 380, 300, 292, 242); // contorno da ilha até 23/11

  // ---------------------------------------------------------------- orla: volta completa pela areia, começando e terminando no cais
  const ORLA = (function () {
    const pts = [], N = 240, a0 = Math.atan2((538 - CY) / RY, (392 - CX) / RX);
    for (let i = 0; i <= N; i++) {
      const a = a0 + i / N * Math.PI * 2; let lo = 0, hi = 2;
      for (let k = 0; k < 30; k++) { const md = (lo + hi) / 2; if (idist(CX + Math.cos(a) * RX * md, CY + Math.sin(a) * RY * md) < 0.955) lo = md; else hi = md; }
      pts.push({ x: CX + Math.cos(a) * RX * lo, y: CY + Math.sin(a) * RY * lo });
    }
    let len = 0; const acc = [0];
    for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); acc.push(len); }
    return { pts, acc, len, VEL: 3 };
  })();
  function naOrla(d) {
    const A = ORLA.acc; let i = 1; while (i < A.length - 1 && A[i] < d) i++;
    const f = (d - A[i - 1]) / ((A[i] - A[i - 1]) || 1), p = ORLA.pts;
    return { x: p[i - 1].x + (p[i].x - p[i - 1].x) * f, y: p[i - 1].y + (p[i].y - p[i - 1].y) * f };
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
    ponte: { nome: 'Ponte do riacho', x: 600, y: 133, sx: 596, sy: 144, r: 6 },
    mercearia: { nome: 'Mercearia', x: 292, y: 314, sx: 292, sy: 324, r: 9 }
  };
  // construções e terrenos da expansão (Dia 3 em diante): ficam fora do sorteio do terreno original,
  // então nenhuma árvore, pedra ou caminho que já existia muda de lugar.
  const NOVOS = new Set(['mercearia']);
  const LAKE = { x: 540, y: 150, rx: 32, ry: 18 };
  const STREAM = [[566, 150], [600, 132], [640, 112], [672, 96]];
  const SLOTS = [[412, 278], [352, 240], [404, 238], [446, 302], [420, 378], [378, 384], [338, 400], [278, 354], [446, 208], [370, 208],
    [300, 216], [490, 380], [542, 352], [420, 422], [332, 454], [252, 264], [542, 242], [430, 172], [522, 414], [300, 172], [560, 300], [212, 380]];
  const YUKINE_CASA = [632, 298];
  const SLOTS_EXTRA = [[364, 432], [264, 228], [484, 204], [404, 456], [520, 188], [200, 344], [192, 292], [216, 424], [588, 360],
    [487, 355], [511, 250], [247, 355], [364, 457], [520, 376], [223, 271], [232, 229], [547, 277], // Dia 7
    [578, 278], [474, 302], [442, 466], // Dia 8
    [164, 228], [472, 474], [242, 390], [455, 384], // Dia 9
    [170, 392], [596, 420], [312, 446], [560, 446], [276, 186], // Dia 10
    [182, 322], [588, 316], // 14/11
    [166, 280], [606, 344], [598, 388], [172, 440], [224, 462], // 15/11
    [568, 342], // 16/11
    [204, 248], [564, 256], // 18/11
    [150, 254], [522, 478]]; // 21/11
  // terrenos da ilha ampliada (23/11/2026): só na terra nova, sempre no FIM da lista (quem já mora não muda de casa)
  (function () {
    const usados = SLOTS.concat(SLOTS_EXTRA).concat([[566, 220]]), novos = [];
    for (let y = Y0 + 40; y < 560; y += 22) for (let x = X0 + 40; x < X0 + WW - 40; x += 26) {
      const xx = x + ((y / 22) % 2) * 13;
      if (idist(xx, y) > 0.8 || idistAntiga(xx, y) < 0.95) continue;
      if (usados.concat(novos).some(s => Math.hypot(s[0] - xx, s[1] - y) < 44)) continue;
      novos.push([xx, y]);
    }
    novos.sort((a, b) => Math.hypot(a[0] - 380, a[1] - 300) - Math.hypot(b[0] - 380, b[1] - 300));
    SLOTS_EXTRA.push(...novos);
  })();
  // RESERVADO (não usar como terreno): pedreira dos Ofícios em (566, 220), ver oficios.js
  const LOTES = [];
  const TRAP = { x0: 586, y0: 170, x1: 597, y1: 137 }; // trapiche da praia até a ponte  // casas com lugar marcado (casa: 'lote:x,y' em moradores.js)

  // ---------------------------------------------------------------- moradores
  const MOR = (window.MORADORES || []).map((m, i) => Object.assign({}, m, { _i: i }));
  const BY = {}; MOR.forEach(m => { BY[m.id] = m; });
  let PREVIEW = false;
  const HOOKS = window.IlhaHooks = window.IlhaHooks || [];
  const TEXTO = window.IlhaTexto = window.IlhaTexto || [];
  const JOGADOS = new Map(); // moradores sendo controlados pelo próprio dono agora (id -> @), ver jogo.js

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
      m._jit = animal || R.pontual ? 0 : (rnd(m.id, 'jit') - 0.5) * 0.6;
      m._usa = new Set(m._blocos.map(b => b[2]));
      const c = m.casa || 'auto';
      const TODOS = SLOTS.concat(SLOTS_EXTRA);
      if (c.indexOf('lote:') === 0) {
        const [lx, ly] = c.slice(5).split(',').map(Number); LOTES.push([lx, ly]);
        const h = { x: lx, y: ly, donos: [m], v: Math.floor(rnd(m.id, 'casa') * 4) };
        casas.push(h); m._casaObj = h; m._home = { x: lx, y: ly + 6, dentro: true };
      } else if (c === 'auto' && slot < TODOS.length) {
        const s = TODOS[slot++]; const h = { x: s[0], y: s[1], donos: [m], v: Math.floor(rnd(m.id, 'casa') * 4) };
        casas.push(h); m._casaObj = h; m._home = { x: s[0], y: s[1] + 6, dentro: true };
      } else if (c === 'santuario') {
        const h = { x: YUKINE_CASA[0], y: YUKINE_CASA[1], donos: [m], v: 4 }; casas.push(h); m._casaObj = h;
        m._home = { x: h.x, y: h.y + 6, dentro: true }; m._usa.add('santuario');
      } else if (c === 'torre' || c === 'taverna' || c === 'mercearia') {
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
    // casas do Flow têm ~28 de largura: casas no mesmo lugar viram uma só (os donos dividem) e
    // casas lado a lado que se encostam são afastadas na horizontal (24/11/2026)
    for (let i = 0; i < casas.length; i++) for (let j = i + 1; j < casas.length; j++) {
      const a = casas[i], b = casas[j]; if (a.dup || b.dup) continue;
      const dx = b.x - a.x, dy = Math.abs(b.y - a.y);
      if (dy >= 12 || Math.abs(dx) >= 29) continue;
      if (Math.abs(dx) < 8 && dy < 8) { b.dup = a; b.donos.forEach(m => { if (!a.donos.includes(m)) a.donos.push(m); m._casaObj = a; }); continue; }
      const em = (29 - Math.abs(dx)) / 2 * (dx < 0 ? -1 : 1);
      [[a, -em], [b, em]].forEach(([h, d]) => { h.x += d; h.donos.forEach(m => { if (m._casaObj === h && m._home) m._home.x += d; }); });
    }
    for (let i = casas.length - 1; i >= 0; i--) if (casas[i].dup) casas.splice(i, 1);
    // casas que invadem um lugar (arena, fazenda, pasto, prédios) saem pelo lado mais curto
    const AREA = { arena: [-26, -13, 26, 14], fazenda: [-33, -22, 42, 20], pasto: [-32, -21, 32, 21], taverna: [-23, -40, 23, 5], forja: [-17, -36, 17, 5],
      oficina: [-17, -36, 17, 5], mercearia: [-17, -40, 17, 5], laboratorio: [-14, -38, 14, 5], biblioteca: [-18, -34, 18, 5], torre: [-9, -46, 9, 4], santuario: [-16, -12, 16, 9] };
    const CASA = [-14, -32, 14, 3];
    for (let volta = 0; volta < 3; volta++) casas.forEach(h => Object.keys(AREA).forEach(k => {
      const L = LUG[k], A = AREA[k]; if (!L) return;
      const ax0 = L.x + A[0], ay0 = L.y + A[1], ax1 = L.x + A[2], ay1 = L.y + A[3];
      const hx0 = h.x + CASA[0], hy0 = h.y + CASA[1], hx1 = h.x + CASA[2], hy1 = h.y + CASA[3];
      if (hx1 <= ax0 || hx0 >= ax1 || hy1 <= ay0 || hy0 >= ay1) return;
      const opts = [[ax0 - hx1, 0], [ax1 - hx0, 0], [0, ay0 - hy1], [0, ay1 - hy0]].sort((p, q) => Math.abs(p[0] + p[1]) - Math.abs(q[0] + q[1]));
      const [dx, dy] = opts[0];
      h.x += dx; h.y += dy; h.donos.forEach(m => { if (m._casaObj === h && m._home) { m._home.x += dx; m._home.y += dy; } });
    }));
    // depois de empurrar, separa de novo as casas que ficaram encostadas lado a lado
    for (let volta = 0; volta < 4; volta++) for (let i = 0; i < casas.length; i++) for (let j = i + 1; j < casas.length; j++) {
      const a = casas[i], b = casas[j], dx = b.x - a.x;
      if (Math.abs(b.y - a.y) >= 12 || Math.abs(dx) >= 29) continue;
      const em = (29 - Math.abs(dx)) / 2 * (dx < 0 ? -1 : 1);
      [[a, -em], [b, em]].forEach(([h, d]) => { h.x += d; h.donos.forEach(m => { if (m._casaObj === h && m._home) m._home.x += d; }); });
    }
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
    if (pl === 'orla') return ORLA.pts[0];
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
    if (g.pl === 'orla') {
      const od = (e - rt.len / SPEED) * ORLA.VEL;
      if (od < ORLA.len) { const q = naOrla(od); return { x: q.x, y: q.y, walking: true, orla: true, leg: g, arriving }; }
      const fim = ORLA.pts[0]; return { x: fim.x, y: fim.y, walking: false, leg: Object.assign({}, g, { act: 'Terminou a volta pela orla' }), arriving };
    }
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
    if (p === 'orla') return 'Orla da ilha';
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
  let ARV = []; // árvores sorteadas: desenhadas depois, em 2x, no estilo estudo 6
  const terr = document.createElement('canvas'); terr.width = WW; terr.height = WH;
  const shorePts = [], waterPts = [], landPts = [];
  (function buildTerrain() {
    const c = terr.getContext('2d');
    const img = c.createImageData(WW, WH), D = img.data, R = mulberry(7);
    const pathMask = new Uint8Array(WW * WH);
    const PM = (X, Y) => (X >= X0 && Y >= Y0 && X < X0 + WW && Y < Y0 + WH) ? (Y - Y0) * WW + (X - X0) : -1; // índice no terreno
    const stamp = (x, y, r, val) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const k = PM(Math.round(x + i), Math.round(y + j)); if (k >= 0) pathMask[k] = Math.max(pathMask[k], val); } };
    const line = (a, b, r, val) => { const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)); for (let s = 0; s <= n; s++) { const f = n ? s / n : 0; stamp(a.x + (b.x - a.x) * f + (R() - 0.5) * 0.8, a.y + (b.y - a.y) * f, r, val); } };
    Object.keys(LUG).forEach(k => { if (k !== 'fogueira' && k !== 'floresta' && !NOVOS.has(k)) line(HUB, { x: LUG[k].sx, y: LUG[k].sy }, 1, 1); });
    line(HUB, { x: 350, y: 200 }, 1, 1);
    SLOTS.forEach(s => line({ x: s[0], y: s[1] + 3 }, { x: s[0] + (HUB.x - s[0]) * 0.25, y: s[1] + 3 + (HUB.y - s[1]) * 0.25 }, 0, 1));
    line({ x: 600, y: 144 }, { x: YUKINE_CASA[0], y: YUKINE_CASA[1] + 4 }, 1, 1);
    for (let i = 0; i < STREAM.length - 1; i++) line({ x: STREAM[i][0], y: STREAM[i][1] }, { x: STREAM[i + 1][0], y: STREAM[i + 1][1] }, 2, 2);
    for (let py = 0; py < WH; py++) for (let px = 0; px < WW; px++) {
      const x = px + X0, y = py + Y0, d = idist(x, y), o = (py * WW + px) * 4, n = R();
      let col;
      const lake = ((x - LAKE.x) / LAKE.rx) ** 2 + ((y - LAKE.y) / LAKE.ry) ** 2;
      const fr = ((x - 350) / 175) ** 2 + ((y - 138) / 78) ** 2;
      const plaza = Math.hypot((x - FIRE.x) / 1, (y - FIRE.y - 3) / 0.75);
      if (d >= 1) { col = d < 1.07 ? [24, 58, 92] : [14, 36, 62]; if (d < 1.07) shorePts.push(x, y); else if (n < 0.012) waterPts.push(x, y); }
      else if (lake < 1 || pathMask[py * WW + px] === 2) { col = lake < 0.55 ? [24, 66, 120] : [30, 80, 132]; if (n < 0.04) waterPts.push(x, y); }
      else if (d > 0.93) col = n < 0.35 ? [168, 146, 96] : [184, 162, 108];
      else if (pathMask[py * WW + px] === 1 || plaza < 34) col = n < 0.5 ? [124, 100, 70] : [112, 90, 62];
      else if (fr < 1 || Math.hypot(x - 190, y - 205) < 40) col = n < 0.5 ? [36, 74, 52] : [40, 82, 56];
      else { col = n < 0.5 ? [58, 110, 66] : [64, 120, 70]; if (n > 0.985) col = [80, 140, 82]; if (n < 0.006) landPts.push(x, y); }
      D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    c.setTransform(1, 0, 0, 1, -X0, -Y0); // daqui em diante desenha em coordenadas do mundo
    // arvores e detalhes
    const blocked = (x, y) => {
      if (idist(x, y) > 0.9) return true;
      const k1 = PM(Math.round(x), Math.round(y)), k2 = PM(Math.round(x), Math.round(y + 3));
      if ((k1 >= 0 && pathMask[k1]) || (k2 >= 0 && pathMask[k2])) return true;
      if (Math.hypot(x - FIRE.x, (y - FIRE.y) / 0.75) < 52) return true;
      for (const k in LUG) { if (k === 'floresta' || NOVOS.has(k)) continue; const L = LUG[k]; if (Math.hypot(x - L.x, y - L.y + 6) < 26 + L.r || Math.hypot(x - L.sx, y - L.sy) < 14 + L.r) return true; }
      for (const s of SLOTS.concat(SLOTS_EXTRA)) if (Math.hypot(x - s[0], y - s[1] + 6) < 20) return true;
      if (Math.hypot(x - YUKINE_CASA[0], y - YUKINE_CASA[1] + 6) < 20) return true;
      if (((x - LAKE.x) / (LAKE.rx + 8)) ** 2 + ((y - LAKE.y) / (LAKE.ry + 8)) ** 2 < 1) return true;
      return false;
    };
    // caminhos da expansão (sorteio próprio: não altera o resto do mapa)
    (function () {
      const R2 = mulberry(303), cam = (a, b, r) => {
        const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
        for (let s = 0; s <= n; s++) {
          const f = n ? s / n : 0, cx = a.x + (b.x - a.x) * f + (R2() - 0.5) * 0.8, cy = a.y + (b.y - a.y) * f;
          for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
            const X = Math.round(cx + i), Y = Math.round(cy + j);
            if (PM(X, Y) < 0 || idist(X, Y) > 0.93) continue;
            P(c, X, Y, 1, 1, R2() < 0.5 ? '#7c6446' : '#705a3e');
          }
        }
      };
      NOVOS.forEach(k => { const L = LUG[k], d = Math.hypot(HUB.x - L.sx, HUB.y - L.sy), f = Math.min(1, 46 / d); cam({ x: L.sx, y: L.sy }, { x: L.sx + (HUB.x - L.sx) * f, y: L.sy + (HUB.y - L.sy) * f }, 1); });
      SLOTS_EXTRA.concat(LOTES).forEach(s => cam({ x: s[0], y: s[1] + 3 }, { x: s[0] + (HUB.x - s[0]) * 0.2, y: s[1] + 3 + (HUB.y - s[1]) * 0.2 }, 0));
    })();
    const trees = [];
    for (let i = 0; i < 16000 && trees.length < 720; i++) {
      const x = X0 + 40 + R() * (WW - 80), y = Y0 + 40 + R() * (WH - 80);
      if (blocked(x, y)) continue;
      const fr = ((x - 350) / 175) ** 2 + ((y - 138) / 78) ** 2;
      const dens = fr < 1 ? 0.9 : Math.hypot(x - 190, y - 205) < 40 ? 0.7 : idist(x, y) > 0.7 ? 0.32 : 0.06;
      if (R() > dens) continue;
      if (trees.some(q => Math.abs(q[0] - x) < 7 && Math.abs(q[1] - y) < 6)) continue;
      trees.push([Math.round(x), Math.round(y), R()]);
    }
    trees.sort((a, b) => a[1] - b[1]);
    // clareira da votação (temporada.js): canteiro da Fortaleza do Dragão no alto da floresta. Filtra depois do sorteio para não mudar o resto do mapa.
    for (let i = trees.length - 1; i >= 0; i--) if (Math.hypot(trees[i][0] - 300, (trees[i][1] - 96) * 1.3) < 34) trees.splice(i, 1);
    ARV = trees;
    if (false) trees.forEach(([x, y, k]) => { // (desenho antigo de 1x, desligado)
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
    for (let i = 0; i < 280; i++) {
      const x = Math.round(X0 + 40 + R() * (WW - 80)), y = Math.round(Y0 + 40 + R() * (WH - 80));
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
  // ---------------------------------------------------------------- estilo estudo 6 (cenário): árvores, casas e chão em 2x
  const rndE = s => { let r = s; return () => (r = (r * 16807) % 2147483647) / 2147483647; };
  const mkE = (w, h) => { const k = document.createElement('canvas'); k.width = w; k.height = h; return k; };
  function contornoE(cv, cor) {
    cor = '#140e1a'; // estilo Flow: mesmo contorno escuro em tudo
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, d = c.getImageData(0, 0, W, H), o = new Uint8ClampedArray(d.data);
    const a = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d.data[(y * W + x) * 4 + 3] > 200;
    const [r, g, b] = [1, 3, 5].map(i => parseInt(cor.slice(i, i + 2), 16));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) { const k = (y * W + x) * 4; o[k] = r; o[k + 1] = g; o[k + 2] = b; o[k + 3] = 255; }
    c.putImageData(new ImageData(o, W, H), 0, 0); return cv;
  }
  function bolhaE(c, cx, cy, rx, ry, ramp, folhas, seed) {
    const rnd = rndE(seed || 3);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2; if (d > 1) continue;
      const v = 0.62 - 0.32 * (x / rx) - 0.42 * (y / ry) - d * 0.3;
      c.fillStyle = ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)))]; c.fillRect(cx + x, cy + y, 1, 1);
    }
    if (folhas) for (let k = 0; k < rx * ry * 0.22; k++) {
      const a = rnd() * 6.283, rr = Math.sqrt(rnd()) * 0.92, x = Math.round(Math.cos(a) * rx * rr), y = Math.round(Math.sin(a) * ry * rr);
      const v = 0.62 - 0.32 * (x / rx) - 0.42 * (y / ry) - ((x / rx) ** 2 + (y / ry) ** 2) * 0.3;
      const i = Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length) + 1));
      c.fillStyle = ramp[i]; c.fillRect(cx + x, cy + y, 2, 1); c.fillRect(cx + x + (rnd() < .5 ? 0 : 1), cy + y - 1, 1, 1);
      if (i >= 2) { c.fillStyle = ramp[i - 2]; c.fillRect(cx + x + 1, cy + y + 1, 1, 1); }
    }
  }
  const FOLHA_E = ['#1d4f2a', '#2a6e32', '#3d8f3a', '#5cb045', '#86cf5a', '#c2ec86'];
  const OUTONO_E = ['#5a2a12', '#8a4a1a', '#c0742a', '#e09a3a', '#f6c45a', '#fde29a'];
  const PINHO_E = ['#123a2a', '#1c5034', '#2a6a3e', '#3e8a48', '#62ac58', '#9ad07a'];
  const ARV_CACHE = {};
  function arvoreE(tipo, va) { // ~32x44 px = 16x22 do mundo
    const key = tipo + va; if (ARV_CACHE[key]) return ARV_CACHE[key];
    const W = 34, H = 46, cv = mkE(W, H), c = cv.getContext('2d');
    const T = ['#3a2416', '#5e3a22', '#84542e', '#a8743e'];
    for (let y = H - 11; y < H - 2; y++) for (let x = 14; x <= 19; x++) { c.fillStyle = T[x < 15 ? 3 : x < 17 ? 2 : x < 19 ? 1 : 0]; c.fillRect(x, y, 1, 1); }
    c.fillStyle = T[1]; c.fillRect(12, H - 3, 3, 2); c.fillStyle = T[0]; c.fillRect(19, H - 3, 3, 2);
    const ramp = tipo === 'outono' ? OUTONO_E : tipo === 'pinheiro' ? PINHO_E : FOLHA_E, b = H - 11;
    const blobs = tipo === 'pinheiro'
      ? [[17, b - 4, 12, 6], [17, b - 11, 10, 6], [17, b - 18, 8, 6], [17, b - 25, 6, 5], [17, b - 30, 4, 4]]
      : [[17, b - 3, 13, 6], [9, b - 9, 7, 5], [25, b - 9, 7, 5], [17, b - 13, 11, 7], [17, b - 22, 8, 6], [17, b - 28, 5, 4]];
    blobs.forEach(([x, y, rx, ry], i) => bolhaE(c, x, y, rx, ry, ramp, true, va * 13 + i + (tipo === 'outono' ? 50 : 0)));
    if (tipo === 'redonda' && va % 2) [[11, b - 12], [22, b - 16], [16, b - 6]].forEach(([x, y]) => { c.fillStyle = '#e84a4a'; c.fillRect(x, y, 2, 2); c.fillStyle = '#ffa08a'; c.fillRect(x, y, 1, 1); });
    contornoE(cv, '#10301a'); SP.vivo && SP.vivo(cv);
    return (ARV_CACHE[key] = cv);
  }
  const PALHA_E = ['#6a4a1e', '#8e6a2c', '#b08c40', '#cfae5a', '#e8cc7a'];
  const TETOS_E = [PALHA_E, ['#4a1a18', '#7a2a22', '#a8402e', '#d0603e', '#f08a5a'], ['#2a2e40', '#3e4660', '#566080', '#7280a0', '#9aa8c4'], ['#3a2414', '#5e3a20', '#84542e', '#a8743e', '#c8945a']];
  const PAREDES_E = [['#8a7a3a', '#b0a050', '#d0c26a', '#e6da8a'], ['#8a7a5e', '#b8a882', '#ddd0a8', '#f4ecca'], ['#6a5a4e', '#8e7e70', '#b4a496', '#d4c8bc']];
  const CASA_CACHE = {};
  function casaE(v, lit) { // 58x50 px = 29x25 do mundo
    const key = v + ':' + (lit ? 1 : 0); if (CASA_CACHE[key]) return CASA_CACHE[key];
    const KC = 0.6, W = 96, H = 84, cv = mkE(Math.round(W * KC), Math.round(H * KC)), c = cv.getContext('2d');
    const R = (x, y, w, h, col) => { const x0 = Math.round(x * KC), y0 = Math.round(y * KC); c.fillStyle = col; c.fillRect(x0, y0, Math.max(1, Math.round((x + w) * KC) - x0), Math.max(1, Math.round((y + h) * KC) - y0)); };
    const PAR = PAREDES_E[v % PAREDES_E.length], MAD = ['#4a3020', '#6a4428', '#8a5e36'], PA = TETOS_E[v % TETOS_E.length], telha = PA !== PALHA_E;
    for (let y = 42; y < 80; y++) for (let x = 10; x < 86; x++) R(x, y, 1, 1, PAR[x < 14 ? 3 : x < 70 ? 2 : 1]);
    for (let x = 10; x < 86; x++) { R(x, 79, 1, 1, PAR[0]); R(x, 43, 1, 1, PAR[0]); }
    [10, 47, 84].forEach(x => { for (let y = 42; y < 80; y++) { R(x, y, 2, 1, MAD[1]); R(x, y, 1, 1, MAD[2]); } });
    const vid = lit ? ['#ffd36a', '#ffe9a0', '#fff6d0'] : ['#3f8a86', '#6ab8b0', '#8fd8cc'];
    const jan = (x, y) => { R(x - 1, y - 1, 12, 16, MAD[0]); R(x, y, 10, 14, vid[0]); R(x + 1, y + 1, 3, 5, vid[2]); R(x + 1, y + 1, 1, 9, vid[1]); R(x + 4, y, 1, 14, MAD[1]); R(x, y + 6, 10, 1, MAD[1]); R(x - 2, y + 14, 14, 2, MAD[2]); };
    jan(18, 52); jan(68, 52);
    R(52, 54, 16, 26, MAD[0]); for (let y = 55; y < 80; y++) for (let x = 53; x < 67; x++) R(x, y, 1, 1, x < 56 ? MAD[2] : (x % 4 === 0 ? MAD[0] : MAD[1]));
    R(63, 67, 2, 2, '#f2c14e');
    for (let y = 4; y < 46; y++) {
      const m = Math.round((y - 4) * 1.15), x0 = 48 - 12 - m, x1 = 48 + 12 + m;
      for (let x = x0; x <= x1; x++) {
        const f = (x - x0) / (x1 - x0); let i = f < 0.12 ? 4 : f < 0.5 ? 3 : f < 0.85 ? 2 : 1;
        if (telha) { const fila = Math.floor((y - 4) / 5); if ((y - 4) % 5 === 4) i = Math.max(0, i - 2); else if ((x + (fila % 2) * 3) % 6 === 0) i = Math.max(0, i - 1); }
        else { if ((y % 6 === 0) || (y % 6 === 1 && (x + y) % 5 === 0)) i = Math.max(0, i - 1); if ((x * 7 + y * 3) % 11 === 0) i = Math.max(0, i - 1); }
        if (y > 42) i = Math.max(0, i - 2);
        R(x, y, 1, 1, PA[i]);
      }
    }
    for (let x = 34; x <= 62; x++) R(x, 4, 1, 2, PA[4]);
    for (let y = 6; y < 20; y++) for (let x = 64; x < 72; x++) R(x, y, 1, 1, x < 66 ? '#b8b0a8' : x < 70 ? '#8e8680' : '#6a625e');
    R(63, 5, 10, 2, '#5a524e');
    contornoE(cv, '#1a1008'); SP.vivo && SP.vivo(cv);
    return (CASA_CACHE[key] = cv);
  }
  // chão em 2x: grama viva com tufos em blocos, mata mais escura, caminhos de lajotas
  function repintaChaoE(dest) {
    const src = terr.getContext('2d').getImageData(0, 0, WW, WH).data;
    const g = dest.getContext('2d'), W = dest.width, H = dest.height, img = g.getImageData(0, 0, W, H), D = img.data;
    const hx = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const rgb = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    // estilo Flow: verdes menos saturados e lajotas de terra batida mais quentes
    const GR = ['#2e4a26', '#3d6230', '#507c3a', '#6a9446', '#8fb260'].map(rgb), FL = ['#f2ead8', '#f2c94a', '#e88aa0'].map(rgb);
    const LA = [['#c9a46a', '#dbb985', '#9e7a48'], ['#bb9660', '#cfac78', '#8e6c40']].map(a => a.map(rgb));
    const cls = (r, gg, b) => {
      if ((r === 58 && gg === 110 && b === 66) || (r === 64 && gg === 120 && b === 70) || (r === 80 && gg === 140 && b === 82)) return 1;
      if ((r === 36 && gg === 74 && b === 52) || (r === 40 && gg === 82 && b === 56)) return 2;
      if ((r === 124 && gg === 100 && b === 70) || (r === 112 && gg === 90 && b === 62) || (r === 124 && gg === 100 && b === 70) || (r === 0x7c && gg === 0x64 && b === 0x46) || (r === 0x70 && gg === 0x5a && b === 0x3e)) return 3;
      return 0;
    };
    const TUFO = [[0, 0], [0, 1], [1, 1], [2, 0], [2, 1]], BRILHO = [[0, 0], [1, 0], [1, -1]];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const so = (Math.floor(y * WW / W) * WW + Math.floor(x * WW / W)) * 4, k = cls(src[so], src[so + 1], src[so + 2]); if (!k) continue;
      const o = (y * W + x) * 4; let col;
      if (k === 3) { // lajotas de 8x8
        const tx = Math.floor(x / 8), ty = Math.floor(y / 8), lx = x - tx * 8, ly = y - ty * 8, A = LA[(tx + ty) & 1];
        col = (ly === 0 || lx === 0) ? A[1] : (ly === 7 || lx === 7) ? A[2] : A[0];
        const h = hx(tx, ty, 7); if (lx === 2 + Math.floor(h * 4) && ly === 2 + Math.floor(h * 13) % 4) col = A[2];
      } else {
        const base = k === 1 ? 2 : 1;
        col = GR[base];
        const cx = Math.floor(x / 6), cy = Math.floor(y / 6), h = hx(cx, cy, k), ox = Math.floor(h * 4) % 4, oy = Math.floor(h * 17) % 4, lx = x - cx * 6 - ox, ly = y - cy * 6 - oy, tp = hx(cx, cy, 99);
        if (tp < 0.42) { if (TUFO.some(([a, b]) => a === lx && b === ly)) col = GR[base - 1]; }
        else if (tp < 0.75) { if (BRILHO.some(([a, b]) => a === lx && b === ly + 1)) col = GR[base + 1]; }
        else if (tp < 0.8 && k === 1) { if (lx >= 0 && lx < 2 && ly >= 0 && ly < 2) col = FL[Math.floor(hx(cx, cy, 5) * 3)]; }
      }
      D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2];
    }
    g.putImageData(img, 0, 0);
  }
  function arvoresE(dest) {
    // as árvores são desenhadas em 2x; aqui o buffer tem KT px por unidade e começa em (X0, Y0)
    const g = dest.getContext('2d'), KT = dest.width / WW; g.setTransform(KT / 2, 0, 0, KT / 2, -X0 * KT, -Y0 * KT); g.imageSmoothingEnabled = false;
    ARV.forEach(([x, y, k]) => {
      const tp = k < 0.12 ? 'outono' : k < 0.3 ? 'redonda' : 'pinheiro', va = Math.floor(k * 1000) % 3, cv = arvoreE(tp, va);
      g.fillStyle = 'rgba(16,40,12,0.35)'; for (let j = -2; j <= 2; j++) { const w = Math.round(13 * Math.sqrt(1 - (j / 2.6) ** 2)); g.fillRect(x * 2 - w, y * 2 + j, w * 2, 1); }
      g.drawImage(cv, x * 2 - 17, y * 2 - cv.height + 2);
    });
  }
  // estilo Flow nos lugares desenhados direto no mapa (cais, ponte, arena, fazenda, pasto, forja...):
  // desenha num canvas à parte em 2x, aplica cores chapadas + contorno e cola no mapa (cache de 1/4 s)
  const FLOW_DRAW = {};
  function desenhaFlow(k, c, L, sec, night, dia) {
    if (!SP.estiloFlow) return DRAW[k](c, L, sec, night, dia);
    const R = 48, KK = 4, key =(night ? 1 : 0) + ':' + Math.floor(sec * 4);
    let e = FLOW_DRAW[k];
    if (!e || e.key !== key) {
      const cv = e ? e.cv : (() => { const z = document.createElement('canvas'); z.width = z.height = R * 2 * KK; return z; })();
      const g = cv.getContext('2d', { willReadFrequently: true }); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      g.imageSmoothingEnabled = false; g.setTransform(KK, 0, 0, KK, (R - L.x) * KK, (R - L.y) * KK);
      try { DRAW[k](g, L, sec, night, dia); } catch (er) { }
      g.setTransform(1, 0, 0, 1, 0, 0); SP.estiloFlow(cv); contornoE(cv);
      e = FLOW_DRAW[k] = { key, cv };
    }
    const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
    c.drawImage(e.cv, L.x - R, L.y - R, R * 2, R * 2); c.imageSmoothingEnabled = sm;
  }
  // ---------------- chão no estilo Flow (23/11/2026): grama e ruas desenhadas em pedaços de 32x32 unidades,
  // em 4 ou 8 px por unidade conforme o zoom, com tufos/flores/pedras recortados de texturas do Google Flow
  // (flow/mapa/grama.png e rua.png + flow/mapa/chao.js). Bordas das ruas arredondadas e contornadas.
  const CHAO = (function () {
    const D = window.CHAO_FLOW; if (!D) return null;
    const src = terr.getContext('2d').getImageData(0, 0, WW, WH).data, CL = new Uint8Array(WW * WH), PF = new Float32Array(WW * WH);
    for (let i = 0; i < WW * WH; i++) {
      const r = src[i * 4], g = src[i * 4 + 1], b = src[i * 4 + 2];
      CL[i] = ((r === 58 && g === 110 && b === 66) || (r === 64 && g === 120 && b === 70) || (r === 80 && g === 140 && b === 82)) ? 1
        : ((r === 36 && g === 74 && b === 52) || (r === 40 && g === 82 && b === 56)) ? 2
        : ((r === 124 && g === 100 && b === 70) || (r === 112 && g === 90 && b === 62)) ? 3 : 0;
    }
    // o trapiche da praia até a ponte vira um caminho de terra comum (a passarela de tábuas em degraus ficava torta)
    for (let s = 0; s <= 1; s += 0.01) {
      const tx = TRAP.x0 + (TRAP.x1 - TRAP.x0) * s, ty = TRAP.y0 + (TRAP.y1 - TRAP.y0) * s;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
        if (i * i + j * j > 4) continue;
        const ux = Math.round(tx + i - X0), uy = Math.round(ty + j - Y0), k = uy * WW + ux;
        if (ux >= 0 && uy >= 0 && ux < WW && uy < WH && CL[k]) CL[k] = 3;
      }
    }
    // campo suave das ruas (média 3x3) para bordas arredondadas
    for (let y = 1; y < WH - 1; y++) for (let x = 1; x < WW - 1; x++) {
      let s = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += CL[(y + j) * WW + x + i] === 3 ? 1 : 0;
      PF[y * WW + x] = s / 9;
    }
    const pf = (x, y) => { // bilinear
      const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
      if (x0 < 0 || y0 < 0 || x0 >= WW - 1 || y0 >= WH - 1) return 0;
      const i = y0 * WW + x0;
      return (PF[i] * (1 - fx) + PF[i + 1] * fx) * (1 - fy) + (PF[i + WW] * (1 - fx) + PF[i + WW + 1] * fx) * fy;
    };
    const hx = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const mix = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f));
    const vn = (x, y, s) => { // ruído suave (manchas orgânicas)
      const x0 = Math.floor(x), y0 = Math.floor(y); let fx = x - x0, fy = y - y0; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      const a = hx(x0, y0, s), b = hx(x0 + 1, y0, s), c = hx(x0, y0 + 1, s), d = hx(x0 + 1, y0 + 1, s);
      return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
    };
    const GB = D.grama.base, RB = D.rua.base;
    const COR = {
      grama: [mix(GB, [30, 40, 60], 0.10), GB, mix(GB, [235, 245, 200], 0.08)],
      mata: [mix(GB, [16, 30, 40], 0.42), mix(GB, [20, 36, 44], 0.32), mix(GB, [24, 40, 48], 0.24)],
      rua: [mix(RB, [60, 30, 50], 0.12), RB, mix(RB, [255, 240, 210], 0.08)],
      borda: [74, 50, 52], sombra: mix(GB, [20, 24, 50], 0.3),
    };
    const atlas = {}; ['grama', 'rua', 'arvores'].forEach(n => { const im = new Image(); im.onload = () => { atlas[n] = im; CACHE.clear(); }; im.src = 'flow/mapa/' + n + '.png?v=1'; });
    const CS = 32, CACHE = new Map(); let ARV_LIVRE = null;
    function pedaco(cx, cy, Kc) {
      const key = cx + ',' + cy + ',' + Kc; let cv = CACHE.get(key);
      if (cv) { CACHE.delete(key); CACHE.set(key, cv); return cv; }
      cv = document.createElement('canvas'); cv.width = cv.height = CS * Kc;
      const g = cv.getContext('2d'), N = CS * Kc, img = g.createImageData(N, N), d = img.data, wx0 = X0 + cx * CS, wy0 = Y0 + cy * CS;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const wx = wx0 + (i + 0.5) / Kc, wy = wy0 + (j + 0.5) / Kc, ux = Math.floor(wx - X0), uy = Math.floor(wy - Y0);
        if (ux < 0 || uy < 0 || ux >= WW || uy >= WH) continue;
        const k = CL[uy * WW + ux]; if (!k) continue;
        const p = pf(wx - X0 - 0.5, wy - Y0 - 0.5);
        // manchas grandes e suaves (2 tons) em grade de 6 unidades, com borda em degraus de pixel
        const n = vn(wx / 9, wy / 9, 3) * 0.65 + vn(wx / 3.5, wy / 3.5, 9) * 0.35;
        let col;
        if (p > 0.5) col = p < 0.5 + 1.2 / (Kc * 3) ? COR.borda : COR.rua[n < 0.36 ? 0 : n > 0.66 ? 2 : 1];
        else if (p > 0.38) col = COR.sombra;
        else col = (k === 2 ? COR.mata : COR.grama)[n < 0.37 ? 0 : n > 0.65 ? 2 : 1];
        const o = (j * N + i) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      // carimbos (em 8 px por unidade; em 4 px ficam pela metade)
      g.imageSmoothingEnabled = false;
      const esc = Kc / 8, CEL = 22; // célula de 22 px (em 8x) = 2,75 unidades
      const tipoEm = (wx, wy) => { const ux = Math.floor(wx - X0), uy = Math.floor(wy - Y0); if (ux < 0 || uy < 0 || ux >= WW || uy >= WH) return -1; const k = CL[uy * WW + ux]; return !k ? -1 : pf(wx - X0 - 0.5, wy - Y0 - 0.5) > 0.42 ? 3 : k; };
      const gx0 = Math.floor((wx0 * 8) / CEL) - 2, gy0 = Math.floor((wy0 * 8) / CEL) - 2, gx1 = Math.ceil(((wx0 + CS) * 8) / CEL) + 1, gy1 = Math.ceil(((wy0 + CS) * 8) / CEL) + 1;
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
        const h1 = hx(gx, gy, 41), h2 = hx(gx, gy, 77), h3 = hx(gx, gy, 13);
        const px = gx * CEL + h2 * CEL, py = gy * CEL + h3 * CEL, wx = px / 8, wy = py / 8, t = tipoEm(wx, wy);
        if (t < 0) continue;
        const nome = t === 3 ? 'rua' : 'grama', A = atlas[nome]; if (!A) continue;
        if (h1 > (t === 3 ? 0.16 : t === 2 ? 0.55 : 0.62)) continue;
        const L = D[nome].carimbos, s = L[Math.floor(hx(gx, gy, 5) * L.length)];
        const cw = s[2] / 8, ch = s[3] / 8;
        if (tipoEm(wx - cw / 2, wy - ch) !== t || tipoEm(wx + cw / 2, wy - ch) !== t || tipoEm(wx - cw / 2, wy) !== t || tipoEm(wx + cw / 2, wy) !== t) continue;
        g.drawImage(A, s[0], s[1], s[2], s[3], Math.round((wx - cw / 2 - wx0) * Kc), Math.round((wy - ch - wy0) * Kc), Math.max(1, Math.round(s[2] * esc)), Math.max(1, Math.round(s[3] * esc)));
      }
      // árvores por cima: do Google Flow (flow/mapa/arvores.png: carvalho, macieira, pinheiro, outono) ou as em código
      // árvores do Flow NÃO vão no chão: entram na fila por y (CHAO.arvores), atrás/na frente de casas e moradores.
      // Só as antigas (enquanto a imagem não carrega) ficam pintadas no chão.
      const AF = atlas.arvores;
      g.setTransform(Kc / 2, 0, 0, Kc / 2, -wx0 * Kc, -wy0 * Kc);
      if (!AF) ARV.forEach(([x, y, k]) => {
        if (x < wx0 - 20 || x > wx0 + CS + 20 || y < wy0 - 4 || y > wy0 + CS + 26) return;
        const tp = k < 0.12 ? 'outono' : k < 0.3 ? 'redonda' : 'pinheiro', va = Math.floor(k * 1000) % 3, tc = arvoreE(tp, va);
        g.fillStyle = 'rgba(16,40,12,0.35)'; for (let j = -2; j <= 2; j++) { const w = Math.round(13 * Math.sqrt(1 - (j / 2.6) ** 2)); g.fillRect(x * 2 - w, y * 2 + j, w * 2, 1); }
        g.drawImage(tc, x * 2 - 17, y * 2 - tc.height + 2);
      });
      CACHE.set(key, cv);
      while (CACHE.size > 260) CACHE.delete(CACHE.keys().next().value);
      return cv;
    }
    function desenha(c, ox, oy, bw, bh, Kb) {
      const Kc = Kb > 4 ? 8 : 4, sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
      const cx0 = Math.floor((ox - X0) / CS), cy0 = Math.floor((oy - Y0) / CS), cx1 = Math.floor((ox + bw - X0) / CS), cy1 = Math.floor((oy + bh - Y0) / CS);
      for (let cy = Math.max(0, cy0); cy <= Math.min(Math.ceil(WH / CS) - 1, cy1); cy++) for (let cx = Math.max(0, cx0); cx <= Math.min(Math.ceil(WW / CS) - 1, cx1); cx++)
        c.drawImage(pedaco(cx, cy, Kc), Math.round((X0 + cx * CS - ox) * Kb), Math.round((Y0 + cy * CS - oy) * Kb), CS * Kb, CS * Kb);
      c.imageSmoothingEnabled = sm;
    }
    // árvores visíveis entram na lista de objetos ordenada por y (a base do tronco é o y)
    function arvores(objs, c, ox, oy, bw, bh) {
      const AF = atlas.arvores; if (!AF) return;
      const FW = AF.width / 4, FH = AF.height, aw = FW / 8, ah = FH / 8;
      if (!ARV_LIVRE) { // tira árvores cuja copa cobriria a frente de uma casa ou prédio (as do Flow são maiores que as antigas)
        const cobre = (x, y, cx, cy, meia) => Math.abs(x - cx) < meia + 7 && y - cy > -6 && y - cy < 26;
        ARV_LIVRE = ARV.filter(([x, y]) => !casas.some(h => cobre(x, y, h.x, h.y, 14))
          && !Object.keys(PRED_FLOW).some(k => cobre(x, y, LUG[k].x, LUG[k].y, PRED_FLOW[k][2] / 2))
          && !['torre', 'santuario', 'arena', 'fazenda', 'pasto', 'cais', 'ponte'].some(k => LUG[k] && Math.hypot(x - LUG[k].x, y - LUG[k].y) < 30 + LUG[k].r));
      }
      ARV_LIVRE.forEach(([x, y, k]) => {
        if (x < ox - aw || x > ox + bw + aw || y < oy - 2 || y > oy + bh + ah) return;
        const tp = k < 0.12 ? 3 : k < 0.36 ? 0 : k < 0.5 ? 1 : 2; // outono, carvalho, macieira, pinheiro
        objs.push({ y, f: () => {
          c.fillStyle = 'rgba(20,24,50,0.30)'; c.beginPath(); c.ellipse(x + 1.2, y + 0.3, aw * 0.4, 2, 0, 0, 6.283); c.fill();
          const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
          c.drawImage(AF, tp * FW, 0, FW, FH, x - aw / 2, y - ah + 0.75, aw, ah);
          c.imageSmoothingEnabled = sm;
        } });
      });
    }
    return { desenha, arvores };
  })();
  // casas do Google Flow (flow/mapa/casas.png: 4 casas lado a lado — palha, telha, ardósia, madeira)
  const CASAS_FLOW = { w: 223, h: 267, k: 8, img: new Image(), ok: false, lit: null }; // vistas de frente (24/11)
  CASAS_FLOW.img.onload = () => { CASAS_FLOW.lit = acendeJanelas(CASAS_FLOW.img); CASAS_FLOW.ok = true; };
  CASAS_FLOW.img.src = 'flow/mapa/casas.png?v=3';
  function acendeJanelas(im) { // cópia com os vidros azul-esverdeados acesos (amarelo) para a noite
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
    let d; try { d = g.getImageData(0, 0, cv.width, cv.height); } catch (e) { return im; } // aberto como arquivo local: sem janelas acesas
    const D = d.data;
    for (let i = 0; i < D.length; i += 4) {
      const r = D[i], gg = D[i + 1], b = D[i + 2];
      if (D[i + 3] && gg > r + 35 && b > r + 15) { const l = (r + gg + b) / 765; D[i] = 255; D[i + 1] = Math.round(170 + 80 * l); D[i + 2] = Math.round(60 + 120 * l); }
    }
    g.putImageData(d, 0, 0); return cv;
  }
  function drawHouse(c, h, lit, t) {
    if (CASAS_FLOW.ok) {
      const F = CASAS_FLOW, q = Math.abs(Math.round(h.v + h.x)) % 4, src = lit ? F.lit : F.img;
      // sombra rente à base (a casa encosta no chão)
      c.fillStyle = 'rgba(20,16,40,0.40)'; c.fillRect(h.x - 13, h.y + 1, 28.5, 1.75);
      c.fillStyle = 'rgba(20,16,40,0.20)'; c.fillRect(h.x - 12, h.y + 2.75, 28, 1);
      const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
      c.drawImage(src, q * F.w, 0, F.w, F.h, h.x - F.w / (2 * F.k), h.y - F.h / F.k + 2, F.w / F.k, F.h / F.k);
      c.imageSmoothingEnabled = sm; return;
    }
    { // estilo estudo 6: casa desenhada em 2x (palha ou telha), janelas acesas à noite
      const cv = casaE(Math.abs(Math.round(h.v + h.x)), lit);
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(h.x - 14, h.y - 1, 28, 3);
      c.drawImage(cv, h.x - cv.width / 4, h.y - 24, cv.width / 2, cv.height / 2);
      return;
    }
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
  // ---------------- prédios especiais no estilo estudo 6 (canvas em 2x: 1 unidade do mundo = 2 px)
  const MAD_E = ['#3a2416', '#5e3a22', '#84542e', '#a8743e'];
  const PAREDE_E = {
    madeira: ['#4a2e1a', '#6a4428', '#8a5a34', '#a8743e'], madeiraClara: ['#5a3e26', '#7a5636', '#9a7046', '#ba8c5a'], madeiraMerc: ['#5a4028', '#7a5a38', '#9a7a52', '#b8986a'],
    pedra: ['#4a4a56', '#6e6e7a', '#8e8e9a', '#b0b0bc'], pedraLab: ['#4e4c58', '#6c6a76', '#8a8894', '#aeacb6'], pedraClara: ['#6a645a', '#8e8880', '#b0aaa0', '#d0cac0'], pedraTorre: ['#2e2a3a', '#4a4458', '#625c72', '#7e7890'],
  };
  const TETO_E = {
    telhaVerm: ['#4a1a18', '#7a2a22', '#a8402e', '#d0603e', '#f08a5a'], ardosia: ['#262a36', '#3a4052', '#525a70', '#6e7890', '#8e98b0'], telhaAzul: ['#1e3048', '#34506e', '#4e6e90', '#6a8cae', '#90b0cc'],
    telhaVerde: ['#163a22', '#2a5e36', '#3f7a4a', '#5a9a5e', '#80bc7a'], telhaVinho: ['#3a1010', '#5e1e1e', '#843636', '#a84a48', '#c86a62'],
  };
  const PREDIOS_E = {
    taverna: { w: 36, h: 15, rh: 11, ov: 4, parede: 'madeira', teto: 'telhaVerm', jan: [[-14, -12, 4, 4], [-6, -12, 4, 4], [8, -12, 4, 4]], porta: [1, 5, 9], chamine: -12, acende: true, placa: [19, -18] },
    forja: { w: 24, h: 13, rh: 7, ov: 3, parede: 'pedra', teto: 'ardosia', jan: [], porta: [-5, 9, 8, 'forno'], chamine: 6 },
    oficina: { w: 26, h: 12, rh: 8, ov: 3, parede: 'madeiraClara', teto: 'telhaAzul', jan: [], porta: [-3, 6, 8], extra: 'engrenagem' },
    mercearia: { w: 26, h: 12, rh: 9, ov: 3, parede: 'madeiraMerc', teto: 'telhaVerde', jan: [[-10, -9, 5, 4], [6, -9, 5, 4]], porta: [-2, 5, 8], acende: true, toldo: true },
    laboratorio: { w: 20, h: 12, rh: 7, ov: 3, parede: 'pedraLab', teto: 'telhaVerde', jan: [[4, -9, 3, 3, '#7dff9a']], porta: [-2, 4, 7], chamine: 4 },
    biblioteca: { w: 24, h: 13, rh: 8, ov: 3, parede: 'pedraClara', teto: 'telhaVinho', jan: [[-10, -10, 3, 4], [7, -10, 3, 4]], porta: [-3, 6, 9, 'arco'] },
  };
  const PRED_CACHE = {};
  function predioE(nome, lit) {
    if (predFlowOk(nome)) return PRED_VAZIO; // o prédio do Flow é desenhado à parte (drawPredioFlow)
    const cfg = PREDIOS_E[nome], key = nome + (cfg.acende && lit ? 1 : 0); if (PRED_CACHE[key]) return PRED_CACHE[key];
    const S2 = 2, w = cfg.w * S2, h = cfg.h * S2, rh = cfg.rh * S2, ov = cfg.ov * S2, mx = 14;
    const CW = w + ov * 2 + mx * 2, CH = h + rh + 24, cv = mkE(CW, CH), c = cv.getContext('2d');
    const R = (x, y, ww, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), ww, hh); };
    const cx = CW / 2, WB = CH - 2, WT = WB - h, X0 = cx - w / 2, X1 = cx + w / 2, PA = PAREDE_E[cfg.parede], TE = TETO_E[cfg.teto];
    // paredes
    for (let y = WT; y < WB; y++) for (let x = X0; x < X1; x++) {
      let i = x < X0 + 3 ? 3 : x > X1 - 5 ? 1 : 2;
      if (cfg.parede.startsWith('madeira')) { const lx = (x - X0) % 7; if (lx === 0) i = 0; else if (lx === 1 && i > 1) i = 3; if ((y - WT) === Math.floor(h / 2)) i = 0; }
      else { const ly = (y - WT) % 6, row = Math.floor((y - WT) / 6), lx = (x - X0 + (row % 2) * 5) % 10; if (ly === 5 || lx === 9) i = 0; else if ((ly === 0 || lx === 0) && i < 3) i++; }
      R(x, y, 1, 1, PA[i]);
    }
    for (let x = X0; x < X1; x++) { R(x, WB - 1, 1, 1, PA[0]); R(x, WT, 1, 1, PA[0]); }
    // janelas
    const vid = cfg.acende && lit ? ['#ffd36a', '#ffe9a0', '#fff6d0'] : ['#3f8a86', '#6ab8b0', '#8fd8cc'];
    cfg.jan.forEach(([ox, oy, jw, jh, cor]) => {
      const x = cx + ox * S2, y = WB + oy * S2, W2 = jw * S2, H2 = jh * S2, V = cor ? [cor, '#c8ffd6', '#ffffff'] : vid;
      R(x - 1, y - 1, W2 + 2, H2 + 2, MAD_E[0]); R(x, y, W2, H2, V[0]); R(x + 1, y + 1, 2, 3, V[2]); R(x + 1, y + 1, 1, H2 - 2, V[1]);
      if (W2 >= 8) R(x + W2 / 2, y, 1, H2, MAD_E[1]); if (H2 >= 8) R(x, y + H2 / 2, W2, 1, MAD_E[1]); R(x - 2, y + H2 + 1, W2 + 4, 2, MAD_E[2]);
    });
    // porta (ou boca do forno)
    if (cfg.porta) {
      const [ox, pw, ph, tipo] = cfg.porta, x = cx + ox * S2, W2 = pw * S2, y = WB - ph * S2;
      if (tipo === 'forno') { R(x - 2, y - 2, W2 + 4, ph * S2 + 2, PA[0]); R(x, y, W2, ph * S2, '#1e120e'); R(x - 2, y - 3, W2 + 4, 2, PA[3]); }
      else {
        R(x - 1, y - 1, W2 + 2, ph * S2 + 1, MAD_E[0]);
        for (let yy = y; yy < WB; yy++) for (let xx = x; xx < x + W2; xx++) { if (tipo === 'arco' && yy < y + 3 && (xx < x + 2 || xx > x + W2 - 3)) continue; R(xx, yy, 1, 1, xx < x + 2 ? MAD_E[3] : (xx - x) % 4 === 0 ? MAD_E[0] : MAD_E[2]); }
        R(x + W2 - 4, y + ph, 2, 2, '#f2c14e');
      }
    }
    // telhado
    const top = WT - rh + 2, wBase = w + ov * 2, wTopo = Math.round(w * 0.4);
    for (let y = top; y <= WT + 2; y++) {
      const f = (y - top) / (WT + 2 - top), ww = Math.round(wTopo + (wBase - wTopo) * f), x0 = Math.round(cx - ww / 2), x1 = x0 + ww;
      for (let x = x0; x < x1; x++) {
        const fx = (x - x0) / ww; let i = fx < 0.12 ? 4 : fx < 0.5 ? 3 : fx < 0.85 ? 2 : 1;
        if (cfg.teto === 'ardosia') { const ly = (y - top) % 4, lx = (x + Math.floor((y - top) / 4) * 3) % 7; if (ly === 3 || lx === 0) i = Math.max(0, i - 2); }
        else { const fila = Math.floor((y - top) / 5); if ((y - top) % 5 === 4) i = Math.max(0, i - 2); else if ((x + (fila % 2) * 3) % 6 === 0) i = Math.max(0, i - 1); }
        if (y >= WT) i = Math.max(0, i - 2);
        R(x, y, 1, 1, TE[i]);
      }
    }
    for (let x = cx - wTopo / 2; x < cx + wTopo / 2; x++) R(x, top - 1, 1, 2, TE[4]);
    if (cfg.toldo) for (let x = X0 - 2; x < X1 + 2; x++) for (let y = WT + 2; y < WT + 8; y++) R(x, y, 1, 1, Math.floor((x - X0) / 4) % 2 ? (y < WT + 4 ? '#f2ead6' : '#d8ceb6') : (y < WT + 4 ? '#5a9a5e' : '#3f7a4a'));
    if (cfg.toldo) for (let x = X0 - 2; x < X1 + 2; x += 4) R(x, WT + 8, 2, 1, '#3f7a4a');
    if (cfg.chamine != null) { const x = cx + cfg.chamine * S2; for (let y = top - 6; y < top + rh / 2; y++) for (let xx = x; xx < x + 8; xx++) R(xx, y, 1, 1, xx < x + 2 ? '#b8b0a8' : xx < x + 6 ? '#8e8680' : '#6a625e'); R(x - 1, top - 7, 10, 2, '#5a524e'); }
    if (cfg.placa) { const x = cx + cfg.placa[0] * S2, y = WB + cfg.placa[1] * S2; R(x + 2, y, 2, 28, MAD_E[1]); R(x - 4, y, 14, 2, MAD_E[1]); R(x - 3, y + 3, 12, 9, '#c89a3a'); R(x - 3, y + 3, 12, 2, '#e8c060'); R(x, y + 6, 6, 3, '#fff2c8'); }
    contornoE(cv, '#1a1008'); SP.vivo && SP.vivo(cv);
    return (PRED_CACHE[key] = { cv, ax: cx, ay: WB });
  }
  // prédios do Google Flow (flow/mapa/predios_a.png e predios_b.png): caixa [x, y, w, h] na folha e largura no mundo
  const PRED_FLOW = {
    taverna: ['a', [1, 1, 340, 347], 44], forja: ['a', [376, 55, 273, 293], 32], oficina: ['a', [724, 61, 261, 287], 32],
    mercearia: ['b', [1, 1, 279, 321], 32], laboratorio: ['b', [307, 20, 229, 302], 27], biblioteca: ['b', [563, 62, 279, 260], 34],
  };
  const PRED_IMG = {};
  ['a', 'b'].forEach(f => { const im = new Image(); im.onload = () => { PRED_IMG[f] = im; }; im.src = 'flow/mapa/predios_' + f + '.png?v=1'; });
  const predFlowOk = k => PRED_FLOW[k] && PRED_IMG[PRED_FLOW[k][0]];
  function drawPredioFlow(c, k, lit) {
    const [f, [sx, sy, sw, sh], alvo] = PRED_FLOW[k], L = LUG[k], s = alvo / sw, dw = alvo, dh = sh * s;
    c.fillStyle = 'rgba(20,16,40,0.38)'; c.beginPath(); c.ellipse(L.x + 2, L.y + 2.5, dw * 0.5, 2.2, 0, 0, 6.283); c.fill();
    const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
    c.drawImage(PRED_IMG[f], sx, sy, sw, sh, L.x - dw / 2, L.y - dh + 3, dw, dh);
    c.imageSmoothingEnabled = sm;
  }
  // objetos da vila do Google Flow (flow/mapa/props_a.png e props_b.png): [folha, caixa, largura no mundo]
  const PROP_FLOW = {
    barril: ['a', [64, 1, 145, 187], 4.5], banco: ['a', [274, 9, 271, 179], 10], caixote: ['a', [602, 20, 161, 168], 5.5], saco: ['a', [889, 12, 133, 176], 4],
    torre: ['m', [37, 1, 134, 393], 15], altar: ['m', [249, 249, 129, 145], 7], pilar: ['m', [482, 139, 80, 255], 3.5], barraca: ['m', [628, 187, 207, 207], 18],
    cerca: ['r', [1, 105, 287, 171], 12], poste: ['r', [405, 165, 57, 111], 2.4], boneco: ['r', [630, 31, 184, 245], 7], armas: ['r', [908, 1, 206, 275], 8],
    espantalho: ['f', [1, 1, 229, 313], 9], broto: ['f', [245, 219, 203, 95], 10], trigo: ['f', [489, 150, 176, 164], 6.5], cocho: ['f', [700, 196, 217, 118], 8],
    bote: ['p', [100, 188, 119, 109], 10], caravela: ['p', [320, 1, 317, 296], 34], ponte: ['p', [705, 165, 184, 132], 20], deck: ['p', [1030, 118, 172, 179], 13.5],
    bigorna: ['b', [37, 197, 175, 213], 6], pocoes: ['b', [262, 193, 225, 217], 8], lanterna: ['b', [552, 1, 145, 409], 5], fogueira: ['b', [751, 254, 248, 156], 15],
  };
  const PROP_IMG = {};
  ['a', 'b', 'm', 'r', 'f', 'p'].forEach(f => { const im = new Image(); im.onload = () => { PROP_IMG[f] = im; }; im.src = 'flow/mapa/props_' + f + '.png?v=1'; });
  const propFlowOk = k => PROP_FLOW[k] && PROP_IMG[PROP_FLOW[k][0]];
  function drawPropFlow(c, k, x, y, lado, semSombra) { // (x, y) = meio da base; lado < 0 espelha
    const [f, [sx, sy, sw, sh], dw] = PROP_FLOW[k], dh = sh * dw / sw;
    if (!semSombra) { c.fillStyle = 'rgba(20,16,40,0.30)'; c.beginPath(); c.ellipse(x + 0.6, y, dw * 0.45, Math.max(0.8, dw * 0.1), 0, 0, 6.283); c.fill(); }
    const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
    if (lado < 0) { c.save(); c.translate(x, 0); c.scale(-1, 1); c.drawImage(PROP_IMG[f], sx, sy, sw, sh, -dw / 2, y - dh + 0.5, dw, dh); c.restore(); }
    else c.drawImage(PROP_IMG[f], sx, sy, sw, sh, x - dw / 2, y - dh + 0.5, dw, dh);
    c.imageSmoothingEnabled = sm;
  }
  // bichos do Google Flow (flow/mapa/bichos.png, de lado olhando para a direita): [caixa, largura no mundo]
  const BICHO_FLOW = { touro: [[1, 1, 317, 245], 15], ovelha: [[371, 55, 214, 191], 7.5], gato: [[713, 75, 168, 171], 5], ave: [[1048, 101, 137, 145], 3.5] };
  const BICHO_IMG = new Image(); let bichoOk = false; BICHO_IMG.onload = () => { bichoOk = true; }; BICHO_IMG.src = 'flow/mapa/bichos.png?v=1';
  function drawBichoFlow(c, nome, x, y, lado, sobe, semSombra) { // (x, y) = meio das patas; lado < 0 olha para a esquerda
    const [[sx, sy, sw, sh], dw] = BICHO_FLOW[nome], dh = sh * dw / sw;
    if (!semSombra) { c.fillStyle = 'rgba(20,16,40,0.30)'; c.beginPath(); c.ellipse(x, y, dw * 0.42, Math.max(0.7, dw * 0.09), 0, 0, 6.283); c.fill(); }
    const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false; c.save(); c.translate(x, 0); if (lado < 0) c.scale(-1, 1);
    c.drawImage(BICHO_IMG, sx, sy, sw, sh, -dw / 2, y - dh + 0.5 - (sobe || 0), dw, dh);
    c.restore(); c.imageSmoothingEnabled = sm;
  }
  // arena, fazenda e pasto com peças do Flow: cada peça entra na fila por y (cerca da frente na frente dos bichos e moradores)
  function lugarFlow(k, objs, c, sec, dia) {
    const L = LUG[k]; if (!L) return false;
    const peca = (nome, x, y) => objs.push({ y, f: () => drawPropFlow(c, nome, x, y) });
    if (k === 'arena' && ['poste', 'boneco', 'armas'].every(propFlowOk)) {
      const x = L.x, y = L.y;
      objs.push({ y: y - 30, f: () => { for (let j = -10; j <= 10; j++) { const w = Math.sqrt(1 - (j / 10.5) ** 2) * 23; c.fillStyle = j % 3 ? '#c8a874' : '#bea06c'; c.fillRect(x - w, y + j, w * 2, 1); } } });
      for (let a = 0; a < 6.28; a += 0.4) peca('poste', x + Math.cos(a) * 24, y + Math.sin(a) * 11 + 1);
      peca('boneco', x + 10, y); peca('armas', x - 14, y - 1);
      return true;
    }
    if (k === 'fazenda' && ['broto', 'trigo', 'espantalho'].every(propFlowOk)) {
      const x = L.x, y = L.y, g = clamp(dia - 1, 1, 4);
      for (let r = 0; r < 6; r++) {
        const yy = y - 14 + r * 6;
        for (let i = -25; i <= 25; i += 10) peca('broto', x + i, yy);
        if (g > 2) for (let i = -27; i <= 27; i += 6) objs.push({ y: yy + 0.2, f: () => drawPropFlow(c, 'trigo', x + i + Math.sin(sec * 1.5 + i * 0.3 + r) * 0.3, yy - 0.5) });
      }
      peca('espantalho', x + 35, y + 2);
      return true;
    }
    if (k === 'pasto' && ['cerca', 'poste', 'cocho'].every(propFlowOk)) {
      const x = L.x, y = L.y, w = 58, h = 36;
      for (let i = 0; i < 5; i++) { peca('cerca', x - w / 2 + 6 + i * 11.6, y - h / 2); peca('cerca', x - w / 2 + 6 + i * 11.6, y + h / 2); }
      for (let j = 6; j < h; j += 6) { peca('poste', x - w / 2, y - h / 2 + j); peca('poste', x + w / 2, y - h / 2 + j); }
      peca('cocho', x - 16, y + 9);
      return true;
    }
    return false;
  }
  const PRED_VAZIO = { cv: document.createElement('canvas'), ax: 0, ay: 0 }; PRED_VAZIO.cv.width = PRED_VAZIO.cv.height = 1;
  const hdE = (c, o, x, y) => { if (o === PRED_VAZIO) return; if (o.prop) return drawPropFlow(c, o.prop, x, y); const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false; c.drawImage(o.cv, x - o.ax / 2, y - o.ay / 2, o.cv.width / 2, o.cv.height / 2); c.imageSmoothingEnabled = sm; };
  function torreE() {
    if (PRED_CACHE.torre) return PRED_CACHE.torre;
    const CW = 40, CH = 112, cv = mkE(CW, CH), c = cv.getContext('2d'), PA = PAREDE_E.pedraTorre;
    const R = (x, y, ww, hh, col) => { c.fillStyle = col; c.fillRect(x, y, ww, hh); };
    const X0 = 6, X1 = 34, WB = 110, WT = 30;
    for (let y = WT; y < WB; y++) for (let x = X0; x < X1; x++) { let i = x < X0 + 6 ? 3 : x > X1 - 7 ? 1 : 2; const ly = (y - WT) % 6, row = Math.floor((y - WT) / 6), lx = (x - X0 + (row % 2) * 5) % 10; if (ly === 5 || lx === 9) i = 0; R(x, y, 1, 1, PA[i]); }
    for (let x = X0 - 2; x < X1 + 2; x++) for (let y = WT - 4; y < WT; y++) R(x, y, 1, 1, PA[x < X0 + 4 ? 3 : 1]);
    for (let k = 0; k < 4; k++) for (let y = WT - 12; y < WT - 4; y++) for (let x = X0 - 2 + k * 9; x < X0 + 4 + k * 9; x++) R(x, y, 1, 1, PA[x < X0 + 1 + k * 9 ? 3 : 2]);
    R(18, 52, 8, 10, '#1e1a28'); R(18, 78, 8, 8, '#1e1a28'); R(16, 94, 12, 16, '#2a2032'); for (let y = 95; y < 110; y++) R(17, y, 10, 1, y % 3 ? MAD_E[1] : MAD_E[0]);
    R(20, 4, 2, 22, MAD_E[1]); for (let y = 4; y < 10; y++) for (let x = 22; x < 34 - (y - 4); x++) R(x, y, 1, 1, y < 6 ? '#7a3aaa' : '#5a2a8a');
    contornoE(cv, '#140c1c'); SP.vivo && SP.vivo(cv);
    return (PRED_CACHE.torre = { cv, ax: 20, ay: WB });
  }
  function pilarE() {
    if (PRED_CACHE.pilar) return PRED_CACHE.pilar;
    const cv = mkE(10, 20), c = cv.getContext('2d'), PA = ['#5e6270', '#8a8e9a', '#a6aab4', '#c8ccd4'];
    for (let y = 2; y < 18; y++) for (let x = 2; x < 8; x++) { c.fillStyle = PA[x < 3 ? 3 : x < 6 ? 2 : 1]; c.fillRect(x, y, 1, 1); }
    c.fillStyle = PA[3]; c.fillRect(1, 1, 8, 2); c.fillStyle = PA[0]; c.fillRect(1, 17, 8, 2);
    contornoE(cv, '#1a1820'); SP.vivo && SP.vivo(cv);
    return (PRED_CACHE.pilar = { cv, ax: 5, ay: 19 });
  }
  function propE(tipo) {
    if (propFlowOk(tipo)) return { prop: tipo };
    if (PRED_CACHE['p' + tipo]) return PRED_CACHE['p' + tipo];
    let cv, ax, ay; const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    if (tipo === 'barril') { cv = mkE(14, 16); const c = cv.getContext('2d'); for (let y = 0; y < 16; y++) { const w = 6 - (y < 2 || y > 13 ? 1 : 0); for (let x = -w; x <= w; x++) R(c, 7 + x, y, 1, 1, MAD_E[x < -3 ? 3 : x < 2 ? 2 : 1]); } [3, 12].forEach(y => R(c, 1, y, 12, 1, '#7e869c')); ax = 7; ay = 15; }
    if (tipo === 'banco') { cv = mkE(24, 8); const c = cv.getContext('2d'); R(c, 0, 0, 24, 3, MAD_E[2]); R(c, 0, 0, 24, 1, MAD_E[3]); R(c, 2, 3, 2, 5, MAD_E[1]); R(c, 20, 3, 2, 5, MAD_E[1]); ax = 12; ay = 7; }
    if (tipo === 'caixote') { cv = mkE(14, 12); const c = cv.getContext('2d'); R(c, 0, 2, 14, 10, MAD_E[2]); R(c, 0, 2, 14, 2, MAD_E[3]); R(c, 0, 6, 14, 1, MAD_E[1]); R(c, 2, 0, 3, 3, '#e8433a'); R(c, 6, 0, 3, 3, '#f0a030'); R(c, 10, 0, 3, 3, '#7ac04a'); ax = 7; ay = 11; }
    if (tipo === 'saco') { cv = mkE(10, 12); const c = cv.getContext('2d'); for (let y = 2; y < 12; y++) { const w = y < 4 ? 2 : 4; for (let x = -w; x < w; x++) R(c, 5 + x, y, 1, 1, x < -1 ? '#ecd8a4' : x < 2 ? '#d8c08a' : '#b8a06a'); } R(c, 4, 0, 2, 3, '#8a6a3a'); ax = 5; ay = 11; }
    if (tipo === 'bigorna') { cv = mkE(16, 10); const c = cv.getContext('2d'); R(c, 0, 0, 16, 3, '#7e869c'); R(c, 0, 0, 16, 1, '#b8c0d0'); R(c, 4, 3, 8, 3, '#4e5468'); R(c, 2, 6, 12, 4, '#2e3240'); ax = 8; ay = 9; }
    if (tipo === 'pocoes') { cv = mkE(20, 12); const c = cv.getContext('2d'); R(c, 0, 5, 20, 3, MAD_E[2]); R(c, 0, 5, 20, 1, MAD_E[3]); R(c, 2, 8, 2, 4, MAD_E[1]); R(c, 16, 8, 2, 4, MAD_E[1]); R(c, 2, 0, 3, 5, '#ff6ad5'); R(c, 7, 1, 4, 4, '#7dff9a'); R(c, 13, 2, 3, 3, '#6ac8ff'); ax = 10; ay = 11; }
    contornoE(cv, '#1a1008'); SP.vivo && SP.vivo(cv);
    return (PRED_CACHE['p' + tipo] = { cv, ax, ay });
  }
  function ovelhaE(pasta, k) {
    const key = 'ov' + pasta; if (PRED_CACHE[key]) return PRED_CACHE[key];
    const cv = mkE(28, 22), c = cv.getContext('2d'), L = ['#9a8e86', '#c8bfb2', '#e6e0d2', '#f6f2e8', '#ffffff'];
    for (const lx of [7, 10, 15, 18]) { c.fillStyle = '#2e2628'; c.fillRect(lx, 15, 2, 5); }
    [[9, 10, 5, 4], [14, 9, 5, 4], [18, 11, 4, 4], [11, 13, 5, 3], [16, 13, 5, 3], [12, 7, 4, 3]].forEach(([x, y, rx, ry], i) => bolhaE(c, x, y, rx, ry, L, true, 31 + i));
    const hy = pasta ? 13 : 9;
    bolhaE(c, 22, hy, 3, 3, ['#1e1618', '#2e2628', '#4a3e40', '#62565a'], false, 1);
    c.fillStyle = '#ffffff'; c.fillRect(23, hy - 1, 1, 1); c.fillStyle = '#c87a8a'; c.fillRect(24, hy + 2, 1, 1);
    contornoE(cv, '#2a2024'); SP.vivo && SP.vivo(cv);
    return (PRED_CACHE[key] = { cv, ax: 14, ay: 20 });
  }
  const DRAW = {
    taverna(c, L, t, night) {
      const x = L.x, y = L.y;
      if (!predFlowOk('taverna')) P(c, x - 22, y - 1, 44, 3, 'rgba(0,0,0,.3)');
      { hdE(c, predioE('taverna', night), x, y); hdE(c, propE('banco'), x - 9, y + 10); hdE(c, propE('barril'), x + 15, y + 1); hdE(c, propE('barril'), x + 11, y + 4); smoke(c, x - 11, y - 31, t); return; }
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
      if (!predFlowOk('forja')) P(c, x - 15, y - 1, 30, 3, 'rgba(0,0,0,.3)');
      { hdE(c, predioE('forja'), x, y); const fl = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.3);
        if (!predFlowOk('forja')) P(c, x - 4, y - 5, 8, 5, `rgba(255,${Math.round(110 + 60 * fl)},40,1)`); P(c, x - 2, y - 3, 4, 2, '#ffe08a');
        hdE(c, propE('bigorna'), x + 10, y + 7); hdE(c, propE('barril'), x - 12, y + 6); smoke(c, x + 8, y - 27, t, 'rgba(120,120,130,A)', 4); return; }
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
      if (!predFlowOk('oficina')) P(c, x - 15, y - 1, 30, 3, 'rgba(0,0,0,.3)');
      { hdE(c, predioE('oficina'), x, y); const g = Math.floor(t * 2) % 2;
        if (!predFlowOk('oficina')) P(c, x - 10, y - 10, 5, 5, '#e8b84a'); P(c, x - 9, y - 9, 3, 3, '#9a7a2a'); P(c, x - 8, y - 8, 1, 1, '#e8b84a');
        if (predFlowOk('oficina')) { } else if (g) { P(c, x - 11, y - 8, 1, 1, '#e8b84a'); P(c, x - 5, y - 8, 1, 1, '#e8b84a'); } else { P(c, x - 8, y - 11, 1, 1, '#e8b84a'); P(c, x - 8, y - 5, 1, 1, '#e8b84a'); }
        hdE(c, propE('caixote'), x + 15, y + 1); hdE(c, propE('caixote'), x + 17, y - 4); return; }
      P(c, x - 13, y - 12, 26, 12, '#8a6440'); for (let i = -13; i < 13; i += 5) P(c, x + i, y - 12, 1, 12, '#6a4a2e');
      roof(c, x, y - 20, y - 20, 8, 22, 30, ['#4e6a86', '#5e7c9a', '#3a5068']);
      P(c, x - 3, y - 8, 6, 8, '#3a261a');
      const g = Math.floor(t * 2) % 2;
      P(c, x - 10, y - 10, 5, 5, '#c9a14a'); P(c, x - 9, y - 9, 3, 3, '#8a6a2a'); P(c, x - 8, y - 8, 1, 1, '#c9a14a');
      if (g) { P(c, x - 11, y - 8, 1, 1, '#c9a14a'); P(c, x - 5, y - 8, 1, 1, '#c9a14a'); } else { P(c, x - 8, y - 11, 1, 1, '#c9a14a'); P(c, x - 8, y - 5, 1, 1, '#c9a14a'); }
      P(c, x + 12, y - 4, 5, 5, '#a0773f'); P(c, x + 12, y - 2, 5, 1, '#7a5a2e'); P(c, x + 15, y - 8, 4, 4, '#a0773f');
      P(c, x + 6, y + 4, 8, 2, '#6a4428'); P(c, x + 7, y + 3, 2, 1, '#9aa0aa'); P(c, x + 11, y + 2, 2, 2, '#c9a14a');
    },
    mercearia(c, L, t, night) {
      const x = L.x, y = L.y;
      if (!predFlowOk('mercearia')) P(c, x - 15, y - 1, 30, 3, 'rgba(0,0,0,.3)');
      { hdE(c, predioE('mercearia', night), x, y); hdE(c, propE('caixote'), x - 17, y + 1); hdE(c, propE('saco'), x + 16, y + 1); hdE(c, propE('saco'), x + 19, y + 2); return; }
      P(c, x - 13, y - 12, 26, 12, '#9a7a52'); for (let i = -13; i < 13; i += 4) P(c, x + i, y - 12, 1, 12, '#7a5a38');
      roof(c, x, y - 21, y - 21, 9, 20, 30, ['#3f7a4a', '#4f9258', '#2e5e38']);
      for (let i = -13; i < 13; i += 4) { P(c, x + i, y - 13, 2, 3, '#f2ead6'); P(c, x + i + 2, y - 13, 2, 3, '#3f7a4a'); } // toldo listrado
      P(c, x - 2, y - 8, 5, 8, '#3a261a'); P(c, x + 2, y - 4, 1, 1, '#c9a14a');
      P(c, x - 10, y - 9, 5, 4, night ? '#ffd36a' : '#2a2c3c'); P(c, x + 6, y - 9, 5, 4, night ? '#ffd36a' : '#2a2c3c');
      P(c, x - 6, y - 17, 12, 3, '#6a4428'); P(c, x - 4, y - 16, 2, 1, '#e8d8a8'); P(c, x - 1, y - 16, 1, 1, '#e8d8a8'); P(c, x + 2, y - 16, 2, 1, '#e8d8a8'); // placa
      P(c, x - 19, y - 5, 6, 5, '#a0773f'); P(c, x - 19, y - 3, 6, 1, '#7a5a2e'); P(c, x - 18, y - 6, 2, 1, '#d04a3a'); P(c, x - 15, y - 6, 2, 1, '#e0a040'); // caixote de frutas
      P(c, x + 14, y - 5, 4, 5, '#d8c08a'); P(c, x + 14, y - 6, 4, 1, '#b8a06a'); P(c, x + 18, y - 4, 3, 4, '#c8b07a'); // sacos
      P(c, x - 21, y + 1, 4, 3, '#8a6234'); P(c, x - 20, y, 2, 1, '#7ac24a');
    },
    laboratorio(c, L, t) {
      const x = L.x, y = L.y;
      if (!predFlowOk('laboratorio')) P(c, x - 13, y - 1, 26, 3, 'rgba(0,0,0,.3)');
      { hdE(c, predioE('laboratorio'), x, y); hdE(c, propE('pocoes'), x - 14, y + 7); smoke(c, x + 6, y - 25, t, 'rgba(110,230,140,A)', 4); return; }
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
      if (!predFlowOk('biblioteca')) P(c, x - 15, y - 1, 30, 3, 'rgba(0,0,0,.3)');
      { hdE(c, predioE('biblioteca'), x, y); hdE(c, propE('banco'), x + 12, y + 5); return; }
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
      if (['deck', 'bote', 'lanterna', 'caixote'].every(propFlowOk)) { // tablado de pranchas do Flow, bote balançando, lanterna e caixote
        c.fillStyle = 'rgba(10,20,40,0.30)'; c.fillRect(x - 5.5, y + 2, 13.5, 45);
        for (let j = 0; j < 4; j++) drawPropFlow(c, 'deck', x, y + 13 + j * 11, 1, true);
        drawPropFlow(c, 'bote', x + 15, y + 42 + Math.sin(t * 1.4) * 0.6, 1, true);
        drawPropFlow(c, 'caixote', x - 3, y + 8); drawPropFlow(c, 'lanterna', x + 5, y + 44);
        return;
      }
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
      if (propFlowOk('torre')) { drawPropFlow(c, 'torre', x, y + 1); return; }
      { hdE(c, torreE(), x, y); const glow = 0.6 + 0.4 * Math.sin(t * 2.3);
        if (night) { P(c, x - 1, y - 29, 4, 5, `rgba(190,130,255,${glow.toFixed(2)})`); P(c, x - 1, y - 16, 4, 4, '#8a60e0'); } return; }
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
      { const pil = propFlowOk('pilar') ? { prop: 'pilar' } : pilarE(), pts = []; for (let a = 0; a < 6.28; a += 1.05) pts.push([x + Math.cos(a) * 13, y + Math.sin(a) * 7]);
        pts.filter(p => p[1] < y).forEach(p => hdE(c, pil, p[0], p[1] + 1));
        if (propFlowOk('altar')) drawPropFlow(c, 'altar', x, y + 1); else {
        P(c, x - 4, y - 3, 8, 4, '#7e8290'); P(c, x - 4, y - 3, 8, 1, '#b4b8c4'); const f = Math.round(Math.sin(t * 8));
        P(c, x - 3, y - 6, 1, 3, '#f2ead8'); P(c, x - 3, y - 7 + (f > 0 ? 0 : 1), 1, 1, '#ffcc5c'); P(c, x + 2, y - 6, 1, 3, '#f2ead8'); P(c, x + 2, y - 7 + (f > 0 ? 1 : 0), 1, 1, '#ffcc5c'); }
        pts.filter(p => p[1] >= y).forEach(p => hdE(c, pil, p[0], p[1] + 1));
        for (let k = 0; k < 4; k++) { const a = t * 0.6 + k * 1.57, px = x + Math.cos(a) * 10, py = y - 12 + Math.sin(a * 1.3) * 4; P(c, px, py, 1, 1, night ? '#cfefff' : 'rgba(207,239,255,0.55)'); }
        return; }
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
      if (propFlowOk('ponte')) drawPropFlow(c, 'ponte', x, y + 5);
      else {
        P(c, x - 9, y - 4, 18, 8, 'rgba(0,0,0,.25)');
        P(c, x - 9, y - 5, 18, 8, '#8a6234'); for (let i = -9; i < 9; i += 3) P(c, x + i, y - 5, 1, 8, '#6e4c28');
        P(c, x - 9, y - 7, 18, 1, '#5e3c24'); P(c, x - 9, y + 3, 18, 1, '#5e3c24');
        P(c, x - 9, y - 8, 2, 3, '#5e3c24'); P(c, x + 7, y - 8, 2, 3, '#5e3c24'); P(c, x - 9, y + 2, 2, 3, '#5e3c24'); P(c, x + 7, y + 2, 2, 3, '#5e3c24');
      }
      // trapiche: liga a praia à ponte (por ele os viajantes chegam até lá)
      if (!CHAO) for (let yy = TRAP.y1; yy <= TRAP.y0; yy++) {
        const cx = Math.round(TRAP.x0 + (yy - TRAP.y0) / (TRAP.y1 - TRAP.y0) * (TRAP.x1 - TRAP.x0));
        P(c, cx - 2, yy + 1, 5, 1, 'rgba(0,0,0,.22)'); P(c, cx - 2, yy, 5, 1, (yy >> 1) % 2 ? '#8a6234' : '#7a5530');
        if ((yy - TRAP.y1) % 9 === 4) { P(c, cx - 3, yy, 1, 3, '#5e3c24'); P(c, cx + 3, yy, 1, 3, '#5e3c24'); }
      }
    }
  };
  function drawFire(c, t) {
    const x = FIRE.x, y = FIRE.y;
    if (propFlowOk('fogueira')) drawPropFlow(c, 'fogueira', x, y + 6); // anel de pedras e lenha do Flow; as chamas continuam animadas por cima
    else {
      for (let a = 0; a < 6.28; a += 0.785) P(c, x + Math.round(9 * Math.cos(a)) - 1, y + 3 + Math.round(4.5 * Math.sin(a)) - 1, 3, 2, '#7a7a86');
      P(c, x - 6, y + 2, 12, 2, '#6a4428'); P(c, x - 4, y + 4, 8, 1, '#4a2e1a');
    }
    const h = 9 + (Math.floor(t * 12) % 3);
    c.fillStyle = '#f06e1e'; c.beginPath(); c.moveTo(x - 5, y + 3); c.lineTo(x + 5, y + 3); c.lineTo(x + 2, y - h / 2); c.lineTo(x, y - h); c.lineTo(x - 2, y - h / 2); c.closePath(); c.fill();
    c.fillStyle = '#ffbe3c'; c.beginPath(); c.moveTo(x - 3, y + 3); c.lineTo(x + 3, y + 3); c.lineTo(x + 1, y - h / 2 + 2); c.lineTo(x, y - h + 4); c.lineTo(x - 1, y - h / 2 + 2); c.closePath(); c.fill();
    P(c, x - 1, y, 2, 3, '#fff096');
    for (let i = 0; i < 14; i++) { const life = (t * 0.9 + i * 0.37) % 1; if (life > 0.9) continue; P(c, x + Math.round(7 * Math.sin(i * 2.1 + t * 2)), y - 8 - life * 34, 1, 1, `rgb(255,${Math.round(200 - 110 * life)},60)`); }
  }
  const LANTERNAS = [[344, 318], [416, 320], [380, 342], [352, 274]];
  function drawLantern(c, x, y, night) {
    if (propFlowOk('lanterna')) {
      drawPropFlow(c, 'lanterna', x, y);
      if (night) { c.fillStyle = 'rgba(255,214,110,0.9)'; c.fillRect(x + 0.6, y - 10.6, 1.4, 1.6); }
      return;
    }
    P(c, x, y - 9, 1, 9, '#3a2a1e'); P(c, x - 1, y - 12, 3, 3, night ? '#ffd36a' : '#6a5a3a'); P(c, x - 1, y - 13, 3, 1, '#3a2a1e');
  }
  function drawSheep(c, x, y, t, k) {
    if (bichoOk) { const s = k % 2 ? 1 : -1, pasta = Math.floor(t * 0.7 + k * 1.3) % 4 === 0; drawBichoFlow(c, 'ovelha', x, y, s, pasta ? 0 : Math.abs(Math.sin(t * 3 + k)) * 0.25); return; }
    x = Math.round(x); y = Math.round(y);
    { const s = k % 2 ? 1 : -1, pasta = Math.floor(t * 0.7 + k * 1.3) % 4 === 0 ? 1 : 0, o = ovelhaE(pasta);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 6, y, 12, 2);
      c.save(); c.translate(x, 0); c.scale(s, 1); hdE(c, o, 0, y); c.restore(); return; }
    P(c, x - 3, y, 7, 2, 'rgba(0,0,0,.25)');
    P(c, x - 3, y - 4, 7, 4, '#f2efe6'); P(c, x - 2, y - 5, 5, 1, '#f2efe6'); P(c, x - 3, y - 1, 7, 1, '#d6d2c6');
    const s = k % 2 ? 1 : -1; P(c, s > 0 ? x + 3 : x - 5, y - 5, 3, 3, '#3a3236');
    P(c, x - 2, y, 1, 1, '#3a3236'); P(c, x + 2, y, 1, 1, '#3a3236');
  }

  // ---------------------------------------------------------------- DOM / estado
  const stage = document.getElementById('ilha');
  const ctx = stage.getContext('2d');
  // 23/11/2026: moradores com metade do tamanho no mundo (ESCALA_PERS) e zoom dobrado — casas, árvores e ruas
  // ficam proporcionais aos moradores. O buffer usa até 8 px por unidade (K muda com o zoom); o chão fica pronto em 4x.
  window.ESCALA_PERS = 0.5;
  let K = 8; const KT = 4;
  const terrK = document.createElement('canvas'); terrK.width = WW * KT; terrK.height = WH * KT;
  { const g = terrK.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(terr, 0, 0, WW * KT, WH * KT); }
  if (!CHAO) { repintaChaoE(terrK); arvoresE(terrK); } // com o chão do Flow, grama, ruas e árvores vêm em pedaços (CHAO) // (árvores já vêm no estilo Flow; o filtro no chão inteiro em 4x deixava a abertura lenta)
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
  function defaultScale() { return clamp(Math.round(Math.min(vw, vh) / 430) * 2, 4, 12); }

  // ---------------------------------------------------------------- render
  function render(t) {
    const S = cam.s * dpr;
    K = Math.max(2, Math.min(8, Math.ceil(S)));
    const bw = Math.ceil(stage.width / S) + 2, bh = Math.ceil(stage.height / S) + 2;
    if (buf.width !== bw * K || buf.height !== bh * K) { buf.width = bw * K; buf.height = bh * K; lightC.width = bw * K; lightC.height = bh * K; }
    const hrs = localHours(t), night = darkness(hrs) > 0.3, dia = diaDe(t), sec = t / 1000;

    // personagens
    frameChars = [];
    MOR.forEach(m => {
      if (JOGADOS.has(m.id)) return;
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
    cam.x = clamp(cam.x, X0, X0 + WW); cam.y = clamp(cam.y, Y0, Y0 + WH);
    const ox = Math.round(cam.x - bw / 2 + offPx() / cam.s), oy = Math.round(cam.y - bh / 2);
    lastOx = ox; lastOy = oy;

    const c = bctx;
    c.imageSmoothingEnabled = false;
    c.setTransform(K, 0, 0, K, 0, 0);
    c.fillStyle = '#0e243e'; c.fillRect(0, 0, bw, bh);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(terrK, (X0 - ox) * K, (Y0 - oy) * K, WW * K, WH * K);
    if (CHAO) CHAO.desenha(c, ox, oy, bw, bh, K);
    c.setTransform(K, 0, 0, K, -ox * K, -oy * K);

    // agua animada
    const fi = Math.floor(sec * 2.5);
    for (let i = 0; i < waterPts.length; i += 2) if ((fi + i) % 7 === 0) P(c, waterPts[i], waterPts[i + 1], 1, 1, '#4a7aa8');
    for (let i = 0; i < shorePts.length; i += 2) {
      const x = shorePts[i], y = shorePts[i + 1];
      if (Math.sin(sec * 1.6 + idist(x, y) * 80 + x * 0.05) > 0.85) P(c, x, y, 1, 1, '#5a8cb0');
    }

    // objetos ordenados por y
    const places = placesAt(t), objs = [];
    const lugarFeito = new Set();
    places.forEach(k => { if (lugarFlow(k, objs, c, sec, dia)) lugarFeito.add(k); });
    places.forEach(k => { if (predFlowOk(k)) objs.push({ y: LUG[k].y - 0.5, f: () => drawPredioFlow(c, k, night) }); });
    // lugares cujo prédio já é do Flow: os objetos em volta também são, então desenha direto (sem o filtro em 4x)
    places.forEach(k => { if (DRAW[k] && !lugarFeito.has(k)) objs.push({ y: k === 'arena' || k === 'fazenda' || k === 'pasto' ? LUG[k].y - 30 : k === 'cais' ? LUG[k].y - 2 : LUG[k].y, f: () => predFlowOk(k) ? DRAW[k](c, LUG[k], sec, night, dia) : desenhaFlow(k, c, LUG[k], sec, night, dia) }); });
    const sleepers = new Set();
    frameChars.forEach(q => { if (q.p.hidden && q.m._casaObj) sleepers.add(q.m._casaObj); });
    casas.forEach(h => {
      if (!h.donos.some(m => arrived(m, t))) return;
      const anyHome = h.donos.some(m => { const q = frameChars.find(z => z.m === m); return q && q.p.leg.pl === 'casa' && !q.p.hidden; });
      const lit = night && (anyHome || (hrs >= 18 && hrs < 22.5));
      objs.push({ y: h.y, f: () => { drawHouse(c, h, lit, sec); if (!sleepers.has(h)) smoke(c, h.x + 5, h.y - 28, sec); } });
    });
    if (CHAO) CHAO.arvores(objs, c, ox, oy, bw, bh);
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
    c.setTransform(K, 0, 0, K, 0, 0);
    if (cl === 'nublado') { c.fillStyle = 'rgba(30,40,60,0.14)'; c.fillRect(0, 0, bw, bh); }
    if (cl === 'chuva') {
      c.fillStyle = 'rgba(20,30,50,0.22)'; c.fillRect(0, 0, bw, bh);
      c.fillStyle = 'rgba(180,200,230,0.55)';
      for (let i = 0; i < 160; i++) { const x = (rnd('r', i) * bw + sec * 40) % bw, y = (rnd('ry', i) * bh + sec * 150 + i * 7) % bh; c.fillRect(Math.round(x), Math.round(y), 1, 3); }
    }

    // noite e luzes
    const dk = darkness(hrs);
    if (dk > 0.01) {
      lctx.setTransform(K, 0, 0, K, 0, 0);
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
      c.drawImage(lightC, 0, 0, bw, bh);
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
    const fs = cam.s >= 8 ? 16 : cam.s >= 4 ? 12 : 8;
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
      if (cam.s >= 6 || focus || p.arriving) {
        ctx.font = `${fs}px Silkscreen, monospace`;
        const label = p.arriving ? m.nome.toUpperCase() + ' CHEGOU!' : m.nome.toUpperCase();
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,16,0.9)'; ctx.lineJoin = 'round';
        ctx.strokeText(label, sx, sy);
        ctx.fillStyle = p.arriving ? '#ffd046' : focus ? '#ffd046' : '#f4f1e8'; ctx.fillText(label, sx, sy);
      }
      const fr = frase(m, p, t);
      if (fr && cam.s >= 4) {
        ctx.font = `${fs === 16 ? 14 : 12}px "Pixelify Sans", monospace`;
        const w = Math.ceil(ctx.measureText(fr).width) + 12, h = fs === 16 ? 22 : 18;
        const bx = Math.round(sx - w / 2), by = Math.round(sy - (cam.s >= 6 ? fs + 4 : 4) - h);
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
    if (JOGADOS.has(m.id)) return { txt: 'Jogando agora: @' + JOGADOS.get(m.id), cls: 'ativo', p: null, jogado: true };
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
    $('c-lugar').textContent = e.jogado ? 'Controlado pelo dono no modo viajante' : e.p ? (e.p.viagem ? 'Andando pela ilha' : placeName(e.p.leg.pl, m)) : 'Ainda no mar';
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
    if (cam.s < 8) cam.s = Math.min(12, Math.max(8, cam.s));
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
  // todos os personagens sob o toque (para escolher quando estão amontoados)
  function hitAll(cx, cy) {
    const r = stage.getBoundingClientRect();
    const wx = (cx - r.left) / cam.s + lastOx, wy = (cy - r.top) / cam.s + lastOy, out = [];
    frameChars.forEach(q => {
      if (q.p.hidden) return;
      const hb = SP.hitBox(q.m.visual), pad = cam.s <= 2 ? 4 : 2;
      if (wx >= q.p.x + hb.l - pad && wx <= q.p.x + hb.r + pad && wy >= q.p.y + hb.t - pad && wy <= q.p.y + hb.b + pad) out.push(q);
    });
    return out.sort((a, b) => b.p.y - a.p.y);
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
  function zoom(d) { cam.s = clamp(cam.s + d * (cam.s >= 4 ? 2 : 1), 1, 12); }
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
    hitAll, posAt, MOR, BY, casas, LUG, estado, cam, seguir, pararSeguir,
    rnd, diaDe, DIA2, FIRE, P, hooks: HOOKS, bicho: (...a) => bichoOk && (drawBichoFlow(...a), true), casaFlow: () => CASAS_FLOW.ok, prop: (c, k, x, y, lado, semSombra) => propFlowOk(k) && (drawPropFlow(c, k, x, y, lado, semSombra), true), jogados: JOGADOS, arrived: (m, t) => t >= m._ch, localHours,
    andavel: (x, y) => {
      if (x > LUG.ponte.x - 9 && x < LUG.ponte.x + 9 && y > LUG.ponte.y - 5 && y < LUG.ponte.y + 4) return true; // tábuas da ponte
      if (y >= TRAP.y1 && y <= TRAP.y0 + 2 && Math.abs(x - (TRAP.x0 + (y - TRAP.y0) / (TRAP.y1 - TRAP.y0) * (TRAP.x1 - TRAP.x0))) < 3) return true; // trapiche
      if (Math.hypot(x - LUG.cais.sx, y - LUG.cais.sy) < 9) return true; // cais
      if (idist(x, y) >= 0.985 || (((x - LAKE.x) / LAKE.rx) ** 2 + ((y - LAKE.y) / LAKE.ry) ** 2) < 1.1) return false;
      if (Math.hypot(x - FIRE.x, (y - FIRE.y - 2) / 0.7) < 8) return false; // fogueira
      const agora = Date.now();
      for (const h of casas) if (x > h.x - 10 && x < h.x + 10 && y > h.y - 11 && y < h.y - 1 && h.donos.some(m => agora >= m._ch)) return false; // paredes das casas
      for (const k of ['taverna', 'forja', 'oficina', 'laboratorio', 'biblioteca', 'torre', 'mercearia']) { const L = LUG[k]; if (Math.abs(x - L.x) < 11 && y > L.y - 14 && y < L.y - 2) return false; }
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
