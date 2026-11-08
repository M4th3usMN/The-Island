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
  Grade.prototype.pinta = function (g, ox, oy, espelho) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.c[y * this.w + x]; if (!c) continue; g.fillStyle = c; g.fillRect(ox + (espelho ? this.w - 1 - x : x), oy + y, 1, 1); }
  };

  // ---------------------------------------------------------------- fundo em faixas (com pontilhado entre elas)
  function fundo(g, t, cores, chao) {
    const n = cores.length, faixa = Math.ceil(62 / n);
    cores.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * faixa, W, faixa + 1); });
    for (let i = 1; i < n; i++) { g.fillStyle = cores[i - 1]; for (let x = 0; x < W; x += 2) g.fillRect(x + (i % 2), i * faixa, 1, 1); }
    // brilho atrás do item
    g.fillStyle = 'rgba(255,240,200,.10)'; for (let r = 30; r > 8; r -= 6) { g.beginPath(); g.arc(60, 34, r, 0, 7); g.fill(); }
    g.fillStyle = chao[0]; g.fillRect(0, 62, W, 13); g.fillStyle = chao[1]; g.fillRect(0, 62, W, 1);
    for (let x = 3; x < W; x += 9) { g.fillStyle = chao[1]; g.fillRect(x, 66 + (x % 3), 2, 1); }
    // estrelinhas piscando
    for (let i = 0; i < 9; i++) { if (Math.sin(t * 2 + i * 1.7) < 0.3) continue; g.fillStyle = 'rgba(255,255,255,.75)'; const x = (i * 29 + 7) % W, y = (i * 17 + 4) % 54; g.fillRect(x, y, 1, 1); if (Math.sin(t * 2 + i * 1.7) > 0.8) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } }
  }
  function sombra(g, cx, y, w) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx - w, y, w * 2, 2); g.fillRect(cx - w + 2, y - 1, w * 2 - 4, 1); g.fillRect(cx - w + 2, y + 2, w * 2 - 4, 1); }

  // ---------------------------------------------------------------- 1. tricórnio pirata
  const MARROM = tom('#3a2a20', '#22160e', '#5a4232'), OURO = tom('#e8b830', '#a8761e', '#fff0a0'), OSSO = tom('#f4efe2', '#c8c0b0', '#ffffff'), PENA = tom('#e8483a', '#a8202a', '#ffa060');
  function tricornio(g, t) {
    fundo(g, t, ['#f8b46a', '#f09a5a', '#e07a4a', '#c85a3a'], ['#6a3a24', '#8a5232']);
    const G = new Grade(46, 30), sw = Math.round(Math.sin(t * 2.4));
    // pena
    G.poli([[31, 13], [34 + sw, 2], [38 + sw, 0], [37 + sw, 5], [34, 14]], PENA);
    // copa
    G.poli([[11, 16], [13, 8], [18, 5], [28, 5], [33, 8], [35, 16]], MARROM);
    // aba de três pontas
    G.poli([[1, 18], [6, 14], [14, 15], [23, 12], [32, 15], [40, 14], [45, 18], [40, 22], [23, 24], [6, 22]], MARROM);
    G.acabamento(false);
    // fita dourada e borda
    G.linha(12, 15, 34, 15, OURO); G.linha(12, 16, 34, 16, RAMPA[OURO][0]);
    for (let x = 3; x <= 43; x++) { const y = x < 23 ? 21 + Math.round((23 - Math.abs(x - 23)) / 12) : 21 + Math.round((23 - Math.abs(x - 23)) / 12); G.set(x, y, OURO); }
    // caveira
    G.ret(21, 7, 5, 4, OSSO); G.ret(22, 11, 3, 1, OSSO); G.set(22, 8, '#140c10'); G.set(24, 8, '#140c10'); G.set(23, 10, '#140c10');
    G.linha(19, 12, 27, 14, OSSO); G.linha(27, 12, 19, 14, OSSO);
    G.acabamento();
    sombra(g, 60, 60, 20); G.pinta(g, 37, 26 + Math.round(Math.sin(t * 1.6)));
  }
  // ---------------------------------------------------------------- 2. capa de veludo
  const VERM = tom('#c42a3e', '#7a1424', '#f05a6a'), FORRO = tom('#2a1238', '#160818', '#3a1a4a'), PELE = tom('#f0ecf4', '#b8b0c8', '#ffffff'), RUBI = tom('#e01a2a', '#8a0a14', '#ff9aa0');
  function capa(g, t) {
    fundo(g, t, ['#5a4a8a', '#4a3a7a', '#3a2a66', '#2a1e50'], ['#1e1638', '#2e2450']);
    const G = new Grade(40, 50), s = Math.round(Math.sin(t * 1.5) * 1.5);
    // capa (forma de sino, barra recortada)
    G.poli([[13, 4], [27, 4], [33, 12], [36 + s, 30], [38 + s, 46], [33 + s, 44], [29 + s, 48], [24 + s, 45], [20 + s, 48], [16 + s, 45], [11 + s, 48], [6 + s, 44], [2 + s, 46], [4 + s, 30], [7, 12]], VERM);
    // abertura (forro escuro)
    G.poli([[18, 10], [22, 10], [24 + s, 30], [25 + s, 45], [20 + s, 47], [15 + s, 45], [16 + s, 30]], FORRO);
    G.acabamento(false, new Set([FORRO]));
    // dobras
    [8, 13, 27, 32].forEach((x, i) => { for (let y = 16; y < 44; y++) G.set(x + Math.round((y - 16) / 10) * (i < 2 ? -1 : 1) + (y > 30 ? s : 0), y, RAMPA[VERM][i % 2 ? 2 : 0]); });
    // barra dourada
    for (let x = 2; x <= 38; x++) { const y = [46, 44, 48, 45, 48, 45, 48, 44, 46]; }
    G.linha(3 + s, 45, 6 + s, 43, OURO); G.linha(33 + s, 43, 37 + s, 45, OURO);
    // gola de pele
    G.elipse(20, 6, 11, 4, PELE);
    for (let i = 0; i < 5; i++) G.set(13 + i * 3.5, 7 + (i % 2), '#2a2030');
    // fecho de ouro com rubi
    G.elipse(20, 11, 3, 3, OURO); G.ret(19, 10, 2, 2, RUBI); G.set(19, 10, '#ffffff');
    G.acabamento();
    sombra(g, 60, 61, 18); G.pinta(g, 40, 13);
  }
  // ---------------------------------------------------------------- 3. asas de dragão
  const ASA = tom('#e86a2a', '#a83a1a', '#ffa050'), MEMB = tom('#b8401e', '#7a2410', '#d85a2a'), OSSOA = '#5a1a10';
  function asaGrade(bate) {
    const G = new Grade(30, 26), b = bate;
    // membrana: do ombro (28,22) até a ponta (2,2+b), borda de baixo recortada
    G.poli([[28, 22], [22, 10 + b], [12, 3 + b], [2, 2 + b], [4, 12 + b], [8, 9 + b], [10, 18 + b], [14, 13 + b], [17, 22], [21, 17], [24, 24]], ASA);
    // gomos escuros
    G.poli([[22, 11 + b], [12, 4 + b], [5, 4 + b], [6, 9 + b], [9, 8 + b], [11, 15 + b], [14, 12 + b], [17, 19], [20, 16]], MEMB);
    G.acabamento(false);
    // ossos
    G.linha(28, 22, 22, 10 + b, OSSOA); G.linha(22, 10 + b, 12, 3 + b, OSSOA); G.linha(12, 3 + b, 2, 2 + b, OSSOA);
    G.linha(22, 10 + b, 8, 9 + b, OSSOA); G.linha(22, 10 + b, 14, 13 + b, OSSOA); G.linha(22, 10 + b, 21, 17, OSSOA);
    G.set(1, 1 + b, '#f4e4c8'); G.set(2, 1 + b, '#f4e4c8');
    G.acabamento();
    return G;
  }
  function asas(g, t) {
    fundo(g, t, ['#6a2a5a', '#5a1e4a', '#4a163a', '#36102c'], ['#1e0a18', '#2e1424']);
    const bate = Math.floor(t * 4) % 2 ? -2 : 0, G = asaGrade(bate);
    sombra(g, 60, 61, 24);
    G.pinta(g, 30, 22); G.pinta(g, 61, 22, true);
    for (let i = 0; i < 6; i++) { const u = (t * 0.5 + i / 6) % 1; g.fillStyle = i % 2 ? '#ffb04a' : '#ff7a2a'; g.fillRect(36 + i * 9, Math.round(58 - u * 44), 1, 1 + (u < 0.4 ? 1 : 0)); }
  }
  // ---------------------------------------------------------------- 4. aura de brasas
  function chama(G, x, y, s, f) {
    const h = Math.round(s * (1.6 + f * 0.3));
    G.poli([[x - s, y], [x - s, y - h * 0.5], [x, y - h], [x + s, y - h * 0.5], [x + s, y]], '#ff7a1a');
    G.poli([[x - s + 1, y], [x - s + 1, y - h * 0.4], [x, y - h + 2], [x + s - 1, y - h * 0.4], [x + s - 1, y]], '#ffb83a');
    if (s > 2) G.poli([[x - 1, y], [x - 1, y - h * 0.3], [x, y - h * 0.55], [x + 1, y - h * 0.3], [x + 1, y]], '#fff0a0');
  }
  function aura(g, t) {
    fundo(g, t, ['#24306a', '#1c2656', '#141c44', '#0e1432'], ['#14200e', '#22301a']);
    // anel de brilho no chão
    g.fillStyle = 'rgba(255,140,40,.35)'; for (let r = 0; r < 3; r++) { g.fillRect(36 + r * 3, 58 + r, 48 - r * 6, 1); g.fillRect(36 + r * 3, 63 - r, 48 - r * 6, 1); }
    const G = new Grade(60, 50);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + t * 1.2, x = 30 + Math.round(Math.cos(a) * 20), y = 44 + Math.round(Math.sin(a) * 4);
      const f = Math.sin(t * 8 + i * 1.9), s = Math.sin(a) > 0 ? 4 : 3;
      chama(G, x, y, s, f);
    }
    chama(G, 30, 44, 7, Math.sin(t * 6)); chama(G, 23, 42, 4, Math.sin(t * 7 + 1)); chama(G, 37, 42, 4, Math.sin(t * 7 + 2));
    G.acabamento('#7a2a10');
    G.pinta(g, 30, 14);
    for (let i = 0; i < 12; i++) { const u = (t * 0.6 + i / 12) % 1; g.fillStyle = ['#fff0a0', '#ffb83a', '#ff7a1a'][i % 3]; g.fillRect(40 + (i * 7) % 40, Math.round(54 - u * 48), 1, u < 0.5 ? 2 : 1); }
  }
  // ---------------------------------------------------------------- 5. Brasinha, o bebê dragão
  const DR = tom('#e8482a', '#a82418', '#ff7a4a'), BAR = tom('#f8d8a0', '#e0a860', '#fff2d0'), CHIF = tom('#c8ccd8', '#8a90a0', '#ffffff'), ASAD = tom('#ffb070', '#d87a40', '#ffd8a8');
  function brasinha(g, t) {
    fundo(g, t, ['#2c3470', '#262c60', '#1e2450', '#181c40'], ['#c8a868', '#e0c890']);
    g.fillStyle = '#4a7ac8'; g.fillRect(0, 60, W, 2);
    g.fillStyle = '#fff6d8'; g.fillRect(96, 8, 6, 6); g.fillRect(95, 9, 8, 4); g.fillRect(97, 7, 4, 8);
    const G = new Grade(48, 52), asa = Math.floor(t * 5) % 2, cauda = Math.round(Math.sin(t * 3));
    // asa de trás
    G.poli([[30, 22], [36, 8 - asa * 2], [46, 4 - asa * 3], [44, 14 - asa], [40, 18], [36, 26]], ASAD);
    G.linha(30, 22, 46, 4 - asa * 3, DR);
    // rabo enrolado
    G.linha(26, 40, 34, 44, DR, 3); G.linha(34, 44, 38, 40 + cauda, DR, 3); G.linha(38, 40 + cauda, 36, 36 + cauda, DR, 2); G.set(35, 35 + cauda, BAR);
    // corpo
    G.elipse(24, 34, 9, 10, DR);
    G.elipse(22, 36, 5, 7, BAR);
    // patinhas
    G.elipse(18, 44, 3, 2, DR); G.elipse(27, 44, 3, 2, DR);
    G.elipse(15, 30, 2, 3, DR);
    // cabeça grande
    G.elipse(18, 17, 11, 10, DR);
    G.elipse(8, 21, 6, 5, DR); // focinho
    // chifres
    G.poli([[14, 8], [12, 1], [17, 7]], CHIF); G.poli([[21, 7], [23, 0], [25, 8]], CHIF); G.poli([[26, 10], [31, 6], [28, 13]], CHIF);
    // espinhos nas costas
    [[29, 22], [31, 27], [32, 32]].forEach(([x, y]) => G.poli([[x, y], [x + 3, y - 1], [x + 1, y + 2]], CHIF));
    G.acabamento(false, new Set([BAR]));
    // asa da frente
    G.poli([[28, 25], [33, 13 - asa * 2], [42, 10 - asa * 3], [40, 19 - asa], [36, 23], [32, 30]], ASAD);
    G.linha(28, 25, 42, 10 - asa * 3, RAMPA[DR][0]);
    // barriga listrada
    for (let y = 32; y < 42; y += 3) G.linha(19, y, 25, y, RAMPA[BAR][0]);
    // olho grande
    const pisca = (t % 4) < 0.15;
    if (pisca) G.linha(16, 17, 21, 17, '#140c10');
    else { G.ret(16, 13, 6, 7, '#ffffff'); G.ret(17, 14, 4, 5, '#2a6ad8'); G.ret(18, 15, 2, 4, '#0a0610'); G.set(17, 14, '#ffffff'); G.set(20, 17, '#9ad0ff'); }
    // narina, sorriso e bochecha
    G.set(4, 19, '#5a0e10'); G.set(7, 19, '#5a0e10'); G.linha(5, 24, 11, 24, '#5a0e10'); G.ret(11, 21, 2, 1, '#ff8aa0');
    G.acabamento();
    const pulo = Math.abs(Math.round(Math.sin(t * 2.5) * 3));
    sombra(g, 60, 61, 14); G.pinta(g, 36, 15 - pulo);
    // fumacinha
    const f = (t % 3) / 3; if (f < 0.4) { const k = f / 0.4; g.fillStyle = k < 0.5 ? '#ffb83a' : '#c8c8c8'; g.fillRect(Math.round(38 - k * 10), Math.round(30 - pulo - k * 6), 2, 2); g.fillRect(Math.round(35 - k * 12), Math.round(28 - pulo - k * 8), 1, 1); }
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
  function nome(g, t, arroba) {
    fundo(g, t, ['#1e5a5a', '#184a4c', '#123a3e', '#0c2a30'], ['#0a1e22', '#163236']);
    const txt = ('@' + (arroba || 'seunome')).toLowerCase().slice(0, 16);
    const dobro = txt.length <= 9, largura = txt.length * 4 * (dobro ? 2 : 1) - 1;
    const G = new Grade(largura + 22, 18);
    coroa(G, 1, 4);
    G.acabamento(false);
    const TXT = '#ffd84a';
    // letras em dobro (cada pixel vira 2x2) para ficar bem legível
    const L = new Grade(txt.length * 4, 5);
    [...txt].forEach((ch, k) => letra(L, ch, k * 4, 0, TXT));
    const z = dobro ? 2 : 1;
    for (let y = 0; y < 5; y++) for (let x = 0; x < txt.length * 4; x++) if (L.get(x, y)) G.ret(18 + x * z, (dobro ? 4 : 7) + y * z, z, z, y < 2 ? '#fff0a0' : y > 3 ? '#e8a830' : TXT);
    G.acabamento();
    // brilho passando pelas letras
    const sx = Math.round(((t * 0.6) % 1.6) * (largura + 22)) - 6;
    for (let y = 0; y < 18; y++) for (let x = sx; x < sx + 3; x++) { const c = G.get(x - Math.round(y / 3), y); if (c && c !== '#140c10') G.set(x - Math.round(y / 3), y, '#fffbe0'); }
    const ox = Math.round(60 - G.w / 2);
    // placa
    g.fillStyle = '#140c10'; g.fillRect(ox - 6, 22, G.w + 12, 26); g.fillStyle = '#2a1a0c'; g.fillRect(ox - 5, 23, G.w + 10, 24);
    g.fillStyle = '#e8b830'; g.fillRect(ox - 5, 23, G.w + 10, 1); g.fillRect(ox - 5, 46, G.w + 10, 1); g.fillRect(ox - 5, 23, 1, 24); g.fillRect(ox + G.w + 4, 23, 1, 24);
    G.pinta(g, ox, 26);
    for (let i = 0; i < 5; i++) { const a = t * 1.3 + i * 1.3; if (Math.sin(a * 2) < 0) continue; g.fillStyle = '#fff6c8'; const x = Math.round(60 + Math.cos(a) * 46), y = Math.round(34 + Math.sin(a) * 20); g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
  }
  // ---------------------------------------------------------------- 7. moldura de ouro (ornamentos em espiral)
  function ornamento(G, x, y) { G.ret(x, y, 7, 7, OURO); G.ret(x + 1, y + 1, 5, 5, RAMPA[OURO][0]); G.ret(x + 2, y + 2, 3, 3, OURO); G.set(x + 3, y + 3, RAMPA[OURO][0]); G.set(x + 4, y + 2, RAMPA[OURO][0]); G.ret(x + 1, y + 1, 5, 1, RAMPA[OURO][2]); }
  function moldura(g, t) {
    fundo(g, t, ['#5aa87a', '#4a9a6c', '#3e8a5e', '#327a50'], ['#24583a', '#30704a']);
    const G = new Grade(38, 46);
    // barras
    G.ret(3, 3, 32, 4, OURO); G.ret(3, 39, 32, 4, OURO); G.ret(3, 3, 4, 40, OURO); G.ret(31, 3, 4, 40, OURO);
    G.acabamento(false);
    G.ret(4, 4, 30, 1, RAMPA[OURO][2]); G.ret(4, 4, 1, 38, RAMPA[OURO][2]);
    // ornamentos nos cantos e no meio de cada lado
    [[1, 1], [30, 1], [1, 38], [30, 38], [15, 1], [15, 38], [1, 19], [30, 19]].forEach(([x, y]) => ornamento(G, x, y));
    G.acabamento();
    // retrato dentro (silhueta)
    g.fillStyle = '#2a2050'; g.fillRect(48, 20, 24, 32); g.fillStyle = '#3a3070'; g.fillRect(48, 20, 24, 11);
    g.fillStyle = '#120e24'; g.fillRect(57, 26, 6, 6); g.fillRect(56, 27, 8, 4); g.fillRect(53, 35, 14, 17); g.fillRect(55, 33, 10, 3);
    sombra(g, 60, 62, 16); G.pinta(g, 41, 13);
    // reflexo passando
    const u = Math.floor((t * 14) % 60); if (u < 30) { g.fillStyle = 'rgba(255,255,255,.25)'; for (let y = 0; y < 32; y++) g.fillRect(48 + ((u + y / 2) | 0) % 24, 20 + y, 2, 1); }
  }
  // ---------------------------------------------------------------- 8. bandeira na casa (mastro com base e bandeira tremulando)
  const AZUL = tom('#2a62c8', '#1a3a8a', '#4a8ae8'), MASTRO = tom('#5a6470', '#3a424c', '#8a96a4'), CASA = tom('#a8845a', '#7a5a38', '#c8a478'), TELHA = tom('#c84a2a', '#8a2a18', '#e86a4a');
  function bandeira(g, t) {
    fundo(g, t, ['#7ac8f8', '#6ab8f0', '#5aa8e8', '#4a98e0'], ['#3a9a3a', '#5ab84a']);
    // nuvens
    g.fillStyle = '#ffffff'; [[14, 10], [78, 6]].forEach(([x, y], i) => { const dx = Math.round(Math.sin(t * 0.3 + i) * 3); g.fillRect(x + dx, y, 14, 3); g.fillRect(x + 3 + dx, y - 2, 7, 2); });
    // casa
    const C = new Grade(40, 34);
    C.ret(4, 14, 30, 18, CASA); C.poli([[0, 15], [19, 1], [38, 15]], TELHA);
    C.acabamento(false);
    for (let y = 17; y < 32; y += 3) C.linha(5, y, 32, y, RAMPA[CASA][0]);
    C.ret(16, 21, 6, 11, '#5a3418'); C.set(20, 26, '#e8b830');
    [[7, 19], [26, 19]].forEach(([x, y]) => { C.ret(x, y, 5, 5, '#ffd86a'); C.linha(x + 2, y, x + 2, y + 4, '#5a3418'); C.linha(x, y + 2, x + 4, y + 2, '#5a3418'); C.ret(x - 1, y + 5, 7, 1, '#6a4428'); C.set(x, y + 4, '#ff6aa0'); C.set(x + 2, y + 4, '#ffd046'); C.set(x + 4, y + 4, '#ff6aa0'); });
    C.acabamento();
    C.pinta(g, 24, 30);
    // cerca
    for (let x = 18; x < 66; x += 4) { if (x > 38 && x < 48) continue; g.fillStyle = '#140c10'; g.fillRect(x - 1, 56, 4, 8); g.fillStyle = '#f4ecd8'; g.fillRect(x, 57, 2, 6); }
    g.fillStyle = '#f4ecd8'; g.fillRect(16, 59, 50, 1);
    // mastro com base
    const M = new Grade(44, 60), onda = t * 5;
    M.ret(4, 4, 3, 40, MASTRO); M.ret(1, 44, 9, 2, MASTRO); M.ret(0, 46, 11, 3, MASTRO);
    M.elipse(5.5, 2.5, 3, 3, OURO);
    // bandeira ondulando
    const pts = [], baixo = [];
    for (let x = 0; x <= 24; x += 3) { const dy = Math.round(Math.sin(onda - x * 0.3) * 2 * (x / 24)); pts.push([7 + x, 6 + dy]); baixo.unshift([7 + x, 22 + dy]); }
    M.poli(pts.concat(baixo), AZUL);
    M.acabamento(false);
    // coroa no meio da bandeira
    const cy = 10 + Math.round(Math.sin(onda - 12 * 0.3));
    M.poli([[14, cy + 7], [14, cy + 2], [16, cy + 4], [19, cy], [22, cy + 4], [24, cy + 2], [24, cy + 7]], OURO);
    M.acabamento();
    M.pinta(g, 68, 14);
  }
  function teste(g, t) { fundo(g, t, ['#4a5a6a', '#3a4a5a', '#2a3a4a', '#1a2a3a'], ['#141c24', '#24303c']); const G = new Grade(30, 12); G.ret(1, 1, 28, 10, OURO); G.acabamento(); G.pinta(g, 45, 30); g.fillStyle = '#140c10'; g.font = '8px Silkscreen, monospace'; g.textAlign = 'center'; g.fillText('R$ 1', 60, 39); }

  const ARTES = { tricornio, capa, asas, aura, brasinha, nome, moldura, bandeira, teste };
  window.IlhaLojaPixel = { W, H, desenha: (g, id, t, arroba) => { g.save(); g.imageSmoothingEnabled = false; g.clearRect(0, 0, W, H); (ARTES[id] || teste)(g, t, arroba); g.restore(); } };
})();
