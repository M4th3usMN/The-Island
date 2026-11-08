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
  // asa desenhada à mão (pixel por pixel) e "fechada" comprimindo as colunas em direção ao ombro
  const ASA_MAPA = [
    'LL......................',
    'LOLL....................',
    'LOOOLL..................',
    'LOMOOOLLL...............',
    'LOMDMOOOOLLL............',
    'LOMDDMOMOOOOLLL.........',
    'LOMDDDOMDMOOOOOLLL......',
    'OMDDDOMDDDOMOOOOOOLL....',
    'OMDDDOMDDDOMDDMOOOOOL...',
    'OMDDOMDDDDOMDDDOMDDOOL..',
    'OMDDOMDDDOMDDDDOMDDDOOO.',
    'OODDOMDDDOMDDDOMDDDDDOO.',
    'O.OOOODDOOODDOOODDDDOO..',
    '....O..OO...OO..OOOO....',
    '........................'];
  const ASA_COR = { L: '#ffb060', O: '#f07a2a', M: '#b8501e', D: '#7a2e14' };
  function asaGrade(abre) {
    const w0 = ASA_MAPA[0].length, h0 = ASA_MAPA.length, ombro = w0 - 2;
    const G = new Grade(w0 + 2, h0 + 8), sobe = Math.round((1 - abre) * 5);
    for (let x = 0; x < w0; x++) {
      const src = Math.round(ombro - (ombro - x) / abre); if (src < 0) continue;
      for (let y = 0; y < h0; y++) { const ch = ASA_MAPA[y][src]; if (ch && ch !== '.') G.set(x + 1, y + 3 - Math.round(sobe * (1 - x / w0)), ASA_COR[ch]); }
    }
    G.acabamento();
    return G;
  }
  const CICLO = [1, 0.62, 0.28, 0.62];
  function asas(g, t) {
    fundo(g, '#d4d8dc');
    const q = CICLO[Math.floor(t * 6) % 4], G = asaGrade(q);
    G.pinta(g, 35, 22); G.pinta(g, 59, 22, true);
  }
  // ---------------------------------------------------------------- 4. aura de brasas (anel de chamas)
  function chama(G, x, y, s, f) {
    const h = Math.round(s * (1.7 + f * 0.3));
    G.poli([[x - s, y], [x - s, y - h * 0.5], [x, y - h], [x + s, y - h * 0.5], [x + s, y]], '#ff6a1a');
    G.poli([[x - s + 1, y], [x - s + 1, y - h * 0.4], [x, y - h + 2], [x + s - 1, y - h * 0.4], [x + s - 1, y]], '#ffb83a');
    if (s > 2) G.poli([[x - 1, y], [x - 1, y - h * 0.3], [x, y - h * 0.55], [x + 1, y - h * 0.3], [x + 1, y]], '#fff0a0');
  }
  function aura(g, t) {
    fundo(g, '#2a2e4c');
    const G = new Grade(60, 50);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + t * 1.2, x = 30 + Math.round(Math.cos(a) * 20), y = 42 + Math.round(Math.sin(a) * 5);
      chama(G, x, y, Math.sin(a) > 0 ? 4 : 3, Math.sin(t * 8 + i * 1.9));
    }
    chama(G, 30, 42, 7, Math.sin(t * 6)); chama(G, 23, 40, 4, Math.sin(t * 7 + 1)); chama(G, 37, 40, 4, Math.sin(t * 7 + 2));
    G.acabamento(K);
    G.pinta(g, 30, 14);
    for (let i = 0; i < 10; i++) { const u = (t * 0.6 + i / 10) % 1; g.fillStyle = ['#fff0a0', '#ffb83a', '#ff6a1a'][i % 3]; g.fillRect(40 + (i * 7) % 40, Math.round(52 - u * 40), 1, u < 0.5 ? 2 : 1); }
  }
  // ---------------------------------------------------------------- 5. Brasinha voando (pose da referência), vermelha
  const DR = tom('#e84a2a', '#a8261a', '#ff7a4a'), DR2 = tom('#c8361e', '#8a1c12', '#e8582e'), BAR = tom('#f8c890', '#e09a5a', '#ffe4c0'), CHIF = tom('#b8bccc', '#7a7e90', '#e8ecf4'), ASAD = tom('#f8c890', '#e09a5a', '#ffe4c0');
  function brasinha(g, t) {
    fundo(g, '#2a2e4c');
    const G = new Grade(54, 56), asa = Math.floor(t * 5) % 2, cauda = Math.round(Math.sin(t * 3));
    // asa grande para cima (atrás)
    G.poli([[26, 22], [30, 10], [40, 4 - asa * 3], [52, 1 - asa * 4], [48, 10 - asa * 2], [42, 16 - asa], [36, 24], [30, 28]], ASAD);
    G.poli([[26, 22], [30, 10], [40, 4 - asa * 3], [52, 1 - asa * 4], [50, 4 - asa * 3], [40, 7 - asa * 2], [32, 13]], DR);
    // rabo enrolando para baixo
    G.linha(22, 40, 24, 45, DR, 4); G.linha(24, 45, 28, 48, DR, 3); G.linha(28, 48, 25, 51 + cauda, DR, 2); G.linha(25, 51 + cauda, 22, 49 + cauda, DR, 2);
    G.linha(20, 41, 22, 46, BAR, 2);
    // corpo
    G.elipse(22, 33, 8, 10, DR);
    G.poli([[16, 26], [22, 25], [21, 40], [16, 38]], BAR); // barriga
    // braço e pernas
    G.elipse(17, 33, 2.5, 3, DR2); G.elipse(19, 42, 3, 2.5, DR2); G.elipse(26, 41, 3, 2.5, DR2);
    // espinhos nas costas
    [[28, 24], [30, 29], [30, 34], [28, 39]].forEach(([x, y]) => G.poli([[x, y], [x + 3, y + 1], [x, y + 3]], CHIF));
    // cabeça
    G.elipse(18, 18, 10, 9, DR);
    G.poli([[4, 20], [10, 16], [14, 22], [10, 26], [5, 25]], DR); // focinho
    // chifres prateados
    G.poli([[13, 10], [12, 1], [17, 9]], CHIF); G.poli([[19, 9], [22, 0], [24, 10]], CHIF); G.poli([[24, 12], [30, 7], [27, 15]], CHIF); G.poli([[8, 13], [3, 9], [10, 15]], CHIF);
    G.acabamento(false, new Set([BAR, ASAD]));
    // olhos (vermelhos como na referência? aqui azuis e grandes)
    const pisca = (t % 4) < 0.15;
    [[10, 16], [18, 16]].forEach(([x, y], k) => { if (pisca) G.linha(x, y + 2, x + 4, y + 2, K); else { G.ret(x, y, 5, 4, '#ffffff'); G.ret(x + 1, y + 1, 3, 3, k ? '#2a6ad8' : '#2a6ad8'); G.ret(x + 2, y + 1, 1, 3, K); G.set(x + 1, y + 1, '#ffffff'); } });
    G.set(5, 22, '#5a0e10'); G.linha(6, 25, 11, 25, '#5a0e10');
    G.linha(16, 28, 21, 28, RAMPA[BAR][0]); G.linha(16, 32, 21, 32, RAMPA[BAR][0]); G.linha(16, 36, 21, 36, RAMPA[BAR][0]);
    G.acabamento();
    const voo = Math.round(Math.sin(t * 2.2) * 2);
    G.pinta(g, 37, 15 + voo);
    const f = (t % 3) / 3; if (f < 0.4) { const k = f / 0.4; g.fillStyle = k < 0.5 ? '#ffb83a' : '#a0a4b4'; g.fillRect(Math.round(37 - k * 10), Math.round(33 + voo - k * 4), 2, 2); g.fillRect(Math.round(34 - k * 12), Math.round(31 + voo - k * 6), 1, 1); }
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

  const ARTES = { tricornio, capa, asas, aura, brasinha, nome, moldura, bandeira, teste };
  window.IlhaLojaPixel = { asaGrade, W, H, desenha: (g, id, t, arroba) => { g.save(); g.imageSmoothingEnabled = false; g.clearRect(0, 0, W, H); (ARTES[id] || teste)(g, t, arroba); g.restore(); } };
})();
