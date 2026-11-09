/* Loja da Ilha — itens em pixel art de verdade (120x75), com contorno preto e sombreado em 3 tons,
   no estilo das referências: formas limpas, contorno escuro, luz em cima/esquerda e sombra embaixo/direita. */
(function () {
  'use strict';
  const W = 120, H = 75;

  // ---------------------------------------------------------------- mini motor de pixel art
  function Grade(w, h) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); }
  Grade.prototype.set = function (x, y, cor) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = cor; };
  Grade.prototype.get = function (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.c[y * this.w + x] : null; };
  Grade.prototype.ret = function (x, y, w, h, cor) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, cor); };
  Grade.prototype.poli = function (pts, cor) {
    const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, cor);
    }
  };
  Grade.prototype.elipse = function (cx, cy, rx, ry, cor) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, cor); } };
  Grade.prototype.linha = function (x0, y0, x1, y1, cor, esp) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (esp > 1) this.ret(Math.round(x - (esp - 1) / 2), Math.round(y - (esp - 1) / 2), esp, esp, cor); else this.set(x, y, cor); }
  };
  // rampa de cores: cada cor base tem [sombra, base, luz]
  const RAMPA = {};
  function tom(base, sombra, luz) { RAMPA[base] = [sombra, base, luz]; return base; }
  // sombreado automático + contorno preto
  Grade.prototype.acabamento = function (contorno, semLuz) {
    const w = this.w, h = this.h, o = this.c.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = o[y * w + x]; if (!c || !RAMPA[c] || (semLuz && semLuz.has(c))) continue;
      const vz = (dx, dy) => { const xx = x + dx, yy = y + dy; return xx < 0 || yy < 0 || xx >= w || yy >= h ? null : o[yy * w + xx]; };
      if (vz(0, -1) !== c || vz(-1, 0) === null) this.c[y * w + x] = RAMPA[c][2];
      if (vz(0, 1) !== c && vz(0, 1) !== null || vz(0, 1) === null || vz(1, 0) === null) this.c[y * w + x] = RAMPA[c][0];
    }
    if (contorno === false) return;
    const p = this.c.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (p[y * w + x]) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < w && yy < h && p[yy * w + xx]; })) this.c[y * w + x] = contorno || '#140c10';
    }
  };
  Grade.prototype.pinta = function (g, ox, oy, espelho, z) {
    z = z || 1;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.c[y * this.w + x]; if (!c) continue; g.fillStyle = c; g.fillRect(ox + (espelho ? this.w - 1 - x : x) * z, oy + y * z, z, z); }
  };

  // ---------------------------------------------------------------- fundo liso (como nas referências)
  function fundo(g, cor) { g.fillStyle = cor; g.fillRect(0, 0, W, H); }
  const K = '#140c10';

  // ---------------------------------------------------------------- 1. tricórnio pirata (chapéu arredondado, caveira, pena)
  const CINZA = tom('#5a5f6e', '#3a3e4a', '#80869a'), OURO = tom('#e8b830', '#a8761e', '#fff0a0'), OSSO = tom('#f4efe2', '#c8c0b0', '#ffffff'), PENA = tom('#e8483a', '#a8202a', '#ff9a60');
  function tricornio(g, t) {
    fundo(g, '#f6ece8');
    const G = new Grade(44, 30), sw = Math.round(Math.sin(t * 2.4));
    G.elipse(22, 15, 15, 11, CINZA);           // copa arredondada
    G.poli([[31, 13], [35 + sw, 2], [41 + sw, 0], [39 + sw, 6], [35, 14]], PENA);
    G.ret(2, 19, 40, 6, CINZA); G.elipse(22, 22, 20, 4, CINZA); // aba
    G.acabamento(false);
    G.ret(7, 19, 30, 2, '#2a2c34');             // faixa escura
    G.ret(17, 9, 9, 7, OSSO); G.ret(18, 16, 7, 2, OSSO);
    G.ret(18, 11, 2, 2, K); G.ret(23, 11, 2, 2, K); G.set(21, 14, K); G.set(20, 17, K); G.set(22, 17, K);
    G.acabamento();
    G.pinta(g, 38, 24 + Math.round(Math.sin(t * 1.6)));
  }
  // ---------------------------------------------------------------- 2. capa com capuz (estilo da referência), em veludo vermelho
  const VERM = tom('#d8384a', '#8a1a2a', '#ff7a88'), VERM2 = tom('#a82434', '#6a1020', '#d84a5a'), BORDA = tom('#ffe8a0', '#e8b830', '#ffffff'), OCO = '#1a0a10';
  function capa(g, t) {
    fundo(g, '#d4d8dc');
    const G = new Grade(44, 56), s = Math.round(Math.sin(t * 1.5));
    // manto
    G.poli([[8, 22], [36, 22], [40, 34], [42 + s, 47], [36 + s, 45], [33 + s, 49], [28 + s, 45], [22, 47], [16 + s, 45], [11 + s, 49], [8 + s, 45], [2 + s, 47], [4, 34]], VERM);
    // capuz
    G.poli([[22, 2], [30, 6], [34, 14], [35, 22], [9, 22], [10, 14], [14, 6]], VERM);
    // gola larga (ombreiras)
    G.poli([[4, 22], [16, 18], [22, 24], [28, 18], [40, 22], [38, 27], [28, 26], [22, 30], [16, 26], [6, 27]], VERM2);
    G.acabamento(false);
    // dobras
    [[10, -1], [15, 0], [29, 0], [34, 1]].forEach(([x, d]) => { for (let y = 30; y < 45; y++) G.set(x + Math.round((y - 30) / 9) * d + (y > 40 ? s : 0), y, RAMPA[VERM][0]); });
    [[12], [32]].forEach(([x]) => { for (let y = 31; y < 44; y++) G.set(x + (y > 40 ? s : 0), y, RAMPA[VERM][2]); });
    // abertura do capuz (rosto escuro) e frente aberta
    G.poli([[22, 8], [28, 12], [29, 20], [22, 25], [15, 20], [16, 12]], OCO);
    G.poli([[20, 30], [24, 30], [26 + s, 46], [18 + s, 46]], OCO);
    // bordas claras
    G.linha(22, 7, 29, 11, BORDA); G.linha(22, 7, 15, 11, BORDA); G.linha(16, 26, 22, 30, BORDA); G.linha(28, 26, 22, 30, BORDA);
    // fecho de ouro
    G.ret(21, 29, 3, 3, OURO); G.set(22, 30, '#e01a2a');
    G.acabamento();
    G.pinta(g, 38, 11);
  }
  // ---------------------------------------------------------------- 3. asas de dragão (par, como a referência)
  const ASA = tom('#f07a2a', '#b8481a', '#ffb060'), MEMB = tom('#a8401a', '#6a2410', '#c85a2a');
  // asa fina (como a referência): membrana escura entre ossos finos laranja, borda de baixo recortada.
  // "abre" de 1 (aberta) a ~0.3 (fechada): os pontos se aproximam da junta.
  function asaGrade(abre) {
    const G = new Grade(34, 24), J = [31, 21];
    const P = ([x, y]) => [Math.round(J[0] - (J[0] - x) * abre), Math.round(y + (1 - abre) * (J[1] - y) * 0.25 - (1 - abre) * 3 * (1 - (J[0] - x) / 30))];
    const W = P([24, 4]), T = P([2, 7]), A = P([13, 2]);
    const F = [P([3, 13]), P([10, 17]), P([18, 19])], C = [P([6, 10]), P([12, 14]), P([19, 16]), P([25, 17])];
    // membrana
    G.poli([J, W, A, T, C[0], F[0], C[1], F[1], C[2], F[2], C[3]], '#5e1e10');
    G.poli([W, A, T, C[0], P([12, 9]), P([20, 9])], '#8a3418');
    // ossos finos
    G.linha(J[0], J[1], W[0], W[1], '#f07a2a', 2);
    G.linha(W[0], W[1], A[0], A[1], '#ffa858'); G.linha(A[0], A[1], T[0], T[1], '#ffa858');
    F.forEach(f => G.linha(W[0], W[1], f[0], f[1], '#ff8a3a'));
    G.linha(W[0], W[1] - 1, A[0], A[1] - 1, '#ffd08a');
    G.set(T[0] - 1, T[1] - 1, '#f4e4c8'); G.set(W[0], W[1] - 2, '#f4e4c8');
    G.acabamento();
    return G;
  }
  const CICLO = [1, 0.62, 0.28, 0.62];
  function asas(g, t) {
    fundo(g, '#d4d8dc');
    const q = (window.__lojaQuadro != null ? CICLO[window.__lojaQuadro] : CICLO[Math.floor(t * 5) % 4]), G = asaGrade(q);
    G.pinta(g, 61 - G.w, 18); G.pinta(g, 59, 18, true);
  }
  // ---------------------------------------------------------------- 4. aura de brasas (anel de chamas)
  function chama(G, x, y, s, f) {
    const h = Math.round(s * (1.7 + f * 0.3));
    G.poli([[x - s, y], [x - s, y - h * 0.5], [x, y - h], [x + s, y - h * 0.5], [x + s, y]], '#ff6a1a');
    G.poli([[x - s + 1, y], [x - s + 1, y - h * 0.4], [x, y - h + 2], [x + s - 1, y - h * 0.4], [x + s - 1, y]], '#ffb83a');
    if (s > 2) G.poli([[x - 1, y], [x - 1, y - h * 0.3], [x, y - h * 0.55], [x + 1, y - h * 0.3], [x + 1, y]], '#fff0a0');
  }
  // círculo de fogo no chão: miolo vermelho em anéis + borda de chamas que tremulam (3 quadros)
  function aura(g, t) {
    fundo(g, '#8a8c90');
    const G = new Grade(66, 36), cx = 33, cy = 24, rx = 28, ry = 9, q = Math.floor(t * 7) % 3;
    // miolo em anéis
    G.elipse(cx, cy, rx, ry, '#c8301e'); G.elipse(cx, cy, rx - 4, ry - 2, '#a8261a'); G.elipse(cx, cy, rx - 9, ry - 3.5, '#c8301e'); G.elipse(cx, cy, rx - 14, ry - 5, '#8a1c12');
    for (let k = -1; k <= 1; k++) G.linha(cx - 10, cy + k * 2, cx + 10, cy + k * 2, '#a8261a');
    // borda: anel laranja e amarelo
    for (let i = 0; i < 360; i += 2) {
      const a = i * Math.PI / 180, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      G.set(x, y, '#ff6a1a'); G.set(cx + Math.cos(a) * (rx + 0.8), cy + Math.sin(a) * (ry + 0.6), '#e8481a'); G.set(cx + Math.cos(a) * (rx - 1.2), cy + Math.sin(a) * (ry - 1), '#ffb83a'); G.set(cx + Math.cos(a) * (rx - 2.2), cy + Math.sin(a) * (ry - 1.8), '#ffe04a');
    }
    // chamas em pé na borda de trás (variam a cada quadro)
    const CH = [[6, 4], [12, 7], [18, 5], [24, 9], [31, 6], [37, 10], [43, 6], [49, 8], [55, 5], [59, 4]];
    CH.forEach(([x, h], i) => {
      const hh = h + ((i + q) % 3 === 0 ? 2 : (i + q) % 3 === 1 ? 0 : -1), y = Math.round(cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)));
      for (let k = 0; k < hh; k++) { G.set(x, y - k, k > hh - 3 ? '#ffe04a' : '#ffb83a'); if (k < hh * 0.65) { G.set(x - 1, y - k, '#ff6a1a'); G.set(x + 1, y - k, '#ff8a1a'); } if (k < hh * 0.3) { G.set(x - 2, y - k, '#e8481a'); G.set(x + 2, y - k, '#e8481a'); } }
      G.set(x, y - hh, '#fff0a0');
    });
    // chamas baixas na frente
    [[10, 2], [20, 3], [32, 2], [44, 3], [54, 2]].forEach(([x, h], i) => {
      const y = Math.round(cy + ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2))) - 1, hh = h + ((i + q) % 2);
      for (let k = 0; k < hh + 1; k++) { G.set(x, y - k, k >= hh - 1 ? '#ffe04a' : '#ffb83a'); if (k < hh - 1) { G.set(x - 1, y - k, '#ff6a1a'); G.set(x + 1, y - k, '#ff6a1a'); } }
    });
    G.acabamento(false);
    G.pinta(g, 27, 22);
    // faíscas subindo
    for (let i = 0; i < 8; i++) { const u = (t * 0.7 + i / 8) % 1; g.fillStyle = u < 0.5 ? '#ffe04a' : '#ff7a1a'; g.fillRect(34 + (i * 13) % 52, Math.round(46 - u * 30), 1, 1 + (u < 0.3 ? 1 : 0)); }
  }
  // ---------------------------------------------------------------- 5. Brasinha (dragãozinho chibi, cabeção quadrado, pixels grandes)
  // mapa feito à mão; cada pixel vira 3x3 na carta
  const BR_MAPA = [
    '..KK...KK.......',
    '.KCCK.KCCK......',
    '.KRRRKRRRK......',
    'KRRRRRRRRRK.....',
    'KRRKRRKRRRKB....',
    'KRRKRRKRRRRKB...',
    'KRRRRRRRRRRKBB..',
    '.KRRRRRRRRRRKBK.',
    '..KRRKKRRRRRRKBK',
    '..KRPPKRRRRRRRK.',
    '.KPPPKRRRKRRRK..',
    '.KPPPKRRKKPPK...',
    '..KKK.KKK.KKK...'];
  const BR_COR = { K: '#140c10', R: '#e8483a', C: '#8a8e9c', B: '#5a8ad8', P: '#f8c49a' };
  function brasinha(g, t) {
    fundo(g, '#f4f4f2');
    const z = 3, pulo = Math.floor(t * 2.4) % 2, pisca = (t % 4) < 0.15, w = BR_MAPA[0].length, h = BR_MAPA.length;
    const ox = Math.round(60 - w * z / 2), oy = 58 - h * z - pulo * z;
    // sombra no chão
    g.fillStyle = '#d4d4d4'; g.fillRect(ox - 6, 58, w * z + 12, 3); g.fillRect(ox - 10, 59, 3, 2);
    BR_MAPA.forEach((l, y) => [...l].forEach((ch, x) => {
      if (ch === '.') return;
      let c = BR_COR[ch];
      if (ch === 'K' && pisca && y === 4 || ch === 'K' && pisca && y === 5 && (x === 3 || x === 6)) c = (y === 5) ? '#140c10' : BR_COR.R;
      g.fillStyle = c; g.fillRect(ox + x * z, oy + y * z, z, z);
    }));
    // sombra mais escura embaixo do vermelho e brilho no topo da cabeça
    // fumacinha
    const f = (t % 3) / 3; if (f < 0.3) { const k = f / 0.3; g.fillStyle = '#b0b0b8'; g.fillRect(Math.round(ox - 4 - k * 8), Math.round(oy + 6 * z - k * 6), 3, 3); }
  }
  // fonte de pixel própria (3x5) para o nome dourado: legível em qualquer aparelho
  const FONTE = {
    a: '.#.#.####.##.#', b: '##.#.###.#.###.', c: '.###..#..#...##', d: '##.#.##.##.###.', e: '####..##.#..###', f: '####..##.#..#..', g: '.###..#.##.#.##', h: '#.##.####.##.#', i: '###.#..#..#.###',
    j: '..#..#..##.#.#.', k: '#.##.###.#.##.#', l: '#..#..#..#..###', m: '#.#####.##.##.#', n: '##.#.##.##.##.#', o: '.#.#.##.##.#.#.', p: '##.#.###.#..#..', q: '.#.#.##.##.#..#', r: '##.#.###.#.##.#',
    s: '.###...#...###.', t: '###.#..#..#..#.', u: '#.##.##.##.#.#.', v: '#.##.##.##.#.#.', w: '#.##.##.######.#', x: '#.##.#.#.#.##.#', y: '#.##.#.#..#..#.', z: '###..#.#.#..###',
    '0': '.#.#.##.##.#.#.', '1': '.#.##..#..#.###', '2': '##...#.#.#..###', '3': '##...#.#...###.', '4': '#.##.####..#..#', '5': '####..##...###.', '6': '.###..##.#.#.#.', '7': '###..#.#..#..#.', '8': '.#.#.#.#.#.#.#.', '9': '.#.#.#.##..###.',
    '@': '.#.#.###.#...##', '_': '............###', '.': '.............#.', '-': '......###......'
  };
  function letra(G, ch, x, y, cor) { const f = FONTE[ch] || FONTE['-']; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if ((f[j * 3 + i] || '.') === '#') G.set(x + i, y + j, cor); }
  // ---------------------------------------------------------------- 6. nome dourado com coroa
  function coroa(G, x, y) {
    G.poli([[x, y + 9], [x, y + 2], [x + 3, y + 5], [x + 6, y], [x + 9, y + 5], [x + 12, y + 2], [x + 12, y + 9]], OURO);
    G.ret(x, y + 8, 13, 2, RAMPA[OURO][0]);
    G.acabamento(false);
    G.set(x + 6, y + 6, '#e01a2a'); G.set(x + 3, y + 7, '#2a7ad8'); G.set(x + 9, y + 7, '#2a7ad8'); G.set(x + 6, y - 1, '#fff0a0');
  }
  function coroa(G, x, y) {
    G.poli([[x, y + 10], [x, y + 3], [x + 3, y + 6], [x + 7, y], [x + 11, y + 6], [x + 14, y + 3], [x + 14, y + 10]], OURO);
    G.ret(x, y + 9, 15, 2, OURO);
    G.acabamento(false);
    G.ret(x + 1, y + 9, 13, 1, RAMPA[OURO][0]); G.set(x + 7, y + 6, '#e01a2a'); G.set(x + 3, y + 8, '#2a7ad8'); G.set(x + 11, y + 8, '#2a7ad8');
    G.ret(x + 6, y - 2, 3, 2, OURO);
  }
  function nome(g, t, arroba) {
    fundo(g, '#f4f4f0');
    const txt = ('@' + (arroba || 'seunome')).toLowerCase().slice(0, 16);
    const dobro = txt.length <= 8, z = dobro ? 2 : 1, largura = txt.length * 4 * z - z;
    const G = new Grade(largura + 22, 18);
    coroa(G, 1, 4);
    const TXT = '#ffd84a', L = new Grade(txt.length * 4, 5);
    [...txt].forEach((ch, k) => letra(L, ch, k * 4, 0, TXT));
    for (let y = 0; y < 5; y++) for (let x = 0; x < txt.length * 4; x++) if (L.get(x, y)) G.ret(19 + x * z, (dobro ? 5 : 8) + y * z, z, z, y < 2 ? '#fff0a0' : y > 3 ? '#e8a830' : TXT);
    G.acabamento();
    const sx = Math.round(((t * 0.6) % 1.6) * (largura + 22)) - 6;
    for (let y = 0; y < 18; y++) for (let x = sx; x < sx + 3; x++) { const xx = x - Math.round(y / 3), c = G.get(xx, y); if (c && c !== K) G.set(xx, y, '#fffbe0'); }
    G.pinta(g, Math.round(60 - G.w / 2), 28);
    for (let i = 0; i < 4; i++) { const a = t * 1.3 + i * 1.6; if (Math.sin(a * 2) < 0) continue; g.fillStyle = '#e8b830'; const x = Math.round(60 + Math.cos(a) * 40), y = Math.round(36 + Math.sin(a) * 16); g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
  }
  // ---------------------------------------------------------------- 7. moldura de ouro (vazia, ornamentos em espiral, como a referência)
  function ornamento(G, x, y) {
    G.ret(x, y, 8, 8, OURO);
    const esp = ['########', '#......#', '#.####.#', '#.#..#.#', '#.#.##.#', '#.#....#', '#.######', '########'];
    esp.forEach((l, j) => [...l].forEach((ch, i) => { if (ch === '.') G.set(x + i, y + j, RAMPA[OURO][0]); }));
  }
  function moldura(g, t) {
    fundo(g, '#5aa87a');
    const G = new Grade(40, 46);
    G.ret(4, 4, 32, 4, OURO); G.ret(4, 38, 32, 4, OURO); G.ret(4, 4, 4, 38, OURO); G.ret(32, 4, 4, 38, OURO);
    G.acabamento(false);
    G.ret(5, 5, 30, 1, RAMPA[OURO][2]); G.ret(5, 5, 1, 36, RAMPA[OURO][2]); G.ret(33, 5, 1, 36, RAMPA[OURO][2]); G.ret(5, 39, 30, 1, RAMPA[OURO][2]);
    [[2, 2], [30, 2], [2, 36], [30, 36], [16, 2], [16, 36], [2, 19], [30, 19]].forEach(([x, y]) => ornamento(G, x, y));
    G.acabamento();
    G.pinta(g, 40, 13);
    const u = Math.floor((t * 12) % 50); if (u < 22) { g.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 3; k++) g.fillRect(45 + u + k, 17, 1, 1); }
  }
  // ---------------------------------------------------------------- 8. bandeira no mastro (como a referência): bandeira do Brasil
  const MASTRO = tom('#5a6470', '#3a424c', '#8a96a4'), VERDE = tom('#1aa84a', '#0e7a32', '#4ac86a'), AMAR = '#ffd21a', AZULB = '#1a3a9a';
  function bandeira(g, t) {
    fundo(g, '#64c8f4');
    const M = new Grade(46, 52), onda = t * 4;
    M.ret(6, 6, 4, 38, MASTRO); M.ret(2, 44, 12, 2, MASTRO); M.ret(0, 46, 16, 4, MASTRO);
    M.elipse(8, 3.5, 4, 4, OURO);
    const dy = x => Math.round(Math.sin(onda - x * 0.35) * 1.5);
    const pts = [], baixo = [];
    for (let x = 0; x <= 32; x += 4) { pts.push([10 + x, 8 + dy(x)]); baixo.unshift([10 + x, 30 + dy(x)]); }
    M.poli(pts.concat(baixo), VERDE);
    M.acabamento(false);
    // losango amarelo e círculo azul (acompanham a onda)
    const o = dy(16);
    M.poli([[13, 19 + o], [26, 11 + o], [39, 19 + o], [26, 27 + o]], AMAR);
    M.elipse(26, 19 + o, 5.5, 5.5, AZULB);
    M.linha(21, 18 + o, 31, 20 + o, '#ffffff'); M.set(24, 22 + o, '#ffffff'); M.set(28, 17 + o, '#ffffff'); M.set(27, 22 + o, '#ffffff');
    M.acabamento();
    M.pinta(g, 37, 12);
  }
  function teste(g, t) { fundo(g, '#d4d8dc'); const G = new Grade(30, 12); G.ret(1, 1, 28, 10, OURO); G.acabamento(); G.pinta(g, 45, 30); g.fillStyle = K; g.font = '8px Silkscreen, monospace'; g.textAlign = 'center'; g.fillText('R$ 1', 60, 39); }


  // ---------------------------------------------------------------- artes desenhadas pelo criador da ilha (itens-loja/*.png)
  const IMG = {};
  ['asas', 'asas_anjo', 'dragao', 'dragao_verde', 'dragao_verde_asa', 'chapeu', 'bandeira', 'capa', 'moldura'].forEach(n => { const i = new Image(); i.src = 'itens-loja/' + n + '.png'; IMG[n] = i; });
  const pronta = i => i && i.complete && i.naturalWidth;
  // ANIMAÇÃO POR CÓDIGO: desenha a imagem linha a linha, cada linha deslocada por off(linha) -> pano ondulando, ponta do chapéu balançando
  function linhas(g, img, x, y, k, off) { for (let r = 0; r < img.height; r++) g.drawImage(img, 0, r, img.width, 1, x + off(r), y + r * k, img.width * k, k + 0.02); }
  const ondaChapeu = t => r => r < 9 ? Math.sin(t * 3) * Math.pow(1 - r / 9, 1.5) * 1.6 : 0;
  const ondaBandeira = t => r => r >= 16 && r <= 53 ? Math.sin(t * 3 - r * 0.28) * 1.3 * ((r - 16) / 37) : 0;
  // centro visível do card: (60, 37); área útil ~80x50. Escala em passos de 0.5 (pixels inteiros na tela 2x).
  function figura(g, img, maxW, maxH, dy, liso) {
    if (!pronta(img)) return null;
    let k = Math.floor(Math.min(maxW / img.width, maxH / img.height) * 2) / 2;
    if (k < 0.5 || liso) k = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * k, h = img.height * k;
    return { x: Math.round((60 - w / 2) * 2) / 2, y: Math.round((38 - h / 2 + (dy || 0)) * 2) / 2, w, h, k };
  }
  const sombra = (g, w, y) => { g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(Math.round(60 - w / 2), y, Math.round(w), 2); };
  const flutua = t => Math.round(Math.sin(t * 2.2) * 1.5);
  function imgChapeu(g, t) { fundo(g, '#c8d2d0'); const f = figura(g, IMG.chapeu, 70, 44); if (!f) return; sombra(g, f.w * 0.8, f.y + f.h + 3); const o = ondaChapeu(t); linhas(g, IMG.chapeu, f.x, f.y + flutua(t) - 1, f.k, r => o(r) * f.k); }
  function imgCapa(g, t) { fundo(g, '#c8d2d0'); const f = figura(g, IMG.capa, 70, 50); if (!f) return; const o = Math.sin(t * 2) * 0.03; g.save(); g.translate(60, f.y); g.transform(1, 0, o, 1, 0, 0); g.drawImage(IMG.capa, -f.w / 2, 0, f.w, f.h); g.restore(); }
  const imgAsas = (g, t) => asasCard(g, t, IMG.asas);
  // asas de anjo: batem + penas brilhando
  function imgAsasAnjo(g, t) {
    asasCard(g, t, IMG.asas_anjo, '#9aa8b8');
    for (let i = 0; i < 4; i++) { const u = (t * 0.6 + i / 4) % 1, x = Math.round(30 + i * 19 + Math.sin(t + i) * 3), y = Math.round(56 - u * 34); g.fillStyle = `rgba(255,255,255,${(1 - u).toFixed(2)})`; g.fillRect(x, y, 1, 1); if (u < 0.4) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } }
  }
  function asasCard(g, t, img, cor) {
    fundo(g, cor || '#c8d2d0'); const f = figura(g, img, 84, 44); if (!f) return;
    const meio = Math.floor(img.width / 2), bate = 1 - 0.35 * (0.5 + 0.5 * Math.sin(t * 5)), base = f.y + f.h;
    [[0, meio, -1], [meio, img.width - meio, 1]].forEach(([sx, sw, lado]) => {
      g.save(); g.translate(60, base); g.scale(1, bate);
      g.drawImage(img, sx, 0, sw, img.height, lado < 0 ? -sw * f.k : 0, -f.h, sw * f.k, f.h); g.restore();
    });
  }
  function imgDragao(g, t) {
    fundo(g, '#c8d2d0'); const f = figura(g, IMG.dragao, 70, 46); if (!f) return;
    const pulo = Math.round(Math.abs(Math.sin(t * 2.4 * Math.PI)) * 3) * 0.5;
    sombra(g, f.w * 0.7, f.y + f.h - 1); g.drawImage(IMG.dragao, f.x, f.y - pulo, f.w, f.h);
  }
  // ESMERALDA (dragão verde voando): pairando, asa batendo pela raiz, rabo balançando e piscando os olhos vermelhos
  function dragaoVerde(g, x, y, k, t) {
    const corpo = IMG.dragao_verde, asa = IMG.dragao_verde_asa; if (!pronta(corpo) || !pronta(asa)) return;
    const ang = -Math.sin(t * 9) * 0.38;
    g.save(); g.translate(x + 18 * k, y + 13 * k); g.rotate(ang); g.drawImage(asa, -18 * k, -13 * k, asa.width * k, asa.height * k); g.restore();
    linhas(g, corpo, x, y, k, r => r >= 22 ? Math.round(Math.sin(t * 4 - r * 0.5) * (r - 22) / 8) * k : 0);
    if (t % 3.4 < 0.16) { g.fillStyle = '#4caf47'; [[3, 10], [8, 10]].forEach(([cx, cy]) => g.fillRect(x + cx * k, y + cy * k, k, 3 * k)); }
  }
  function imgDragaoVerde(g, t) {
    fundo(g, '#c8d2d0'); const f = figura(g, IMG.dragao_verde, 70, 52, 2); if (!f) return;
    const voo = Math.sin(t * 3) * 2.5; sombra(g, f.w * (0.55 - voo * 0.03), f.y + f.h + 3);
    dragaoVerde(g, f.x, Math.round((f.y - 1 + voo) * 2) / 2, f.k, t);
  }
  function imgBandeira(g, t) {
    fundo(g, '#c8d2d0'); const f = figura(g, IMG.bandeira, 70, 56, 0, true); if (!f) return;
    const o = ondaBandeira(t); linhas(g, IMG.bandeira, f.x, f.y, f.k, r => o(r) * f.k);
  }
  function imgMoldura(g, t) {
    fundo(g, '#3a2a20'); const f = figura(g, IMG.moldura, 70, 52, 0, true); if (!f) return;
    g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(IMG.moldura, f.x, f.y, f.w, f.h); g.restore();
    const b = 0.5 + 0.5 * Math.sin(t * 3); g.fillStyle = `rgba(255,240,180,${(0.5 * b).toFixed(2)})`; g.fillRect(Math.round(f.x + f.w * 0.75), Math.round(f.y + f.h * 0.2), 1, 3); g.fillRect(Math.round(f.x + f.w * 0.75) - 1, Math.round(f.y + f.h * 0.2) + 1, 3, 1);
  }
  const ARTES = { tricornio: imgChapeu, capa: imgCapa, asas: imgAsas, asas_anjo: imgAsasAnjo, dragao_verde: imgDragaoVerde, aura, brasinha: imgDragao, nome, moldura: imgMoldura, bandeira: imgBandeira, teste };
  window.IlhaLojaPixel = { IMG, linhas, dragaoVerde, ondaChapeu, ondaBandeira, asaGrade, W: W * 2, H: H * 2, desenha: (g, id, t, arroba) => { g.save(); g.imageSmoothingEnabled = false; g.clearRect(0, 0, W * 2, H * 2); g.scale(2, 2); (ARTES[id] || teste)(g, t, arroba); g.restore(); } };
})();
