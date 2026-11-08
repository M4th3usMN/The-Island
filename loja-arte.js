/* Loja da Ilha — ilustrações em alta resolução para as cartas da loja (288x180, desenho suave com luz e sombra).
   No mapa os itens continuam em pixel art, no mesmo estilo da ilha. */
(function () {
  'use strict';
  const W = 288, H = 180;
  const TAU = Math.PI * 2;
  function grad(g, x0, y0, x1, y1, stops) { const l = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => l.addColorStop(o, c)); return l; }
  function radial(g, x, y, r0, r1, stops) { const l = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => l.addColorStop(o, c)); return l; }
  function brilho(g, x, y, r, cor, a) { g.fillStyle = radial(g, x, y, 0, r, [[0, cor.replace('A', a)], [1, cor.replace('A', 0)]]); g.fillRect(x - r, y - r, r * 2, r * 2); }
  function estrela(g, x, y, r, cor) { g.save(); g.translate(x, y); g.fillStyle = cor; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); }
  function fundo(g, t, c1, c2, luz) {
    g.fillStyle = grad(g, 0, 0, 0, H, [[0, c1], [1, c2]]); g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, H * 0.48); g.rotate(t * 0.12);
    for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.fillStyle = luz.replace('A', i % 2 ? 0.05 : 0.09); g.beginPath(); g.moveTo(0, 0); g.lineTo(-18, -220); g.lineTo(18, -220); g.fill(); }
    g.restore();
    brilho(g, W / 2, H * 0.48, 110, luz, 0.35);
    for (let i = 0; i < 18; i++) { const u = (t * 0.08 + i / 18) % 1; g.fillStyle = `rgba(255,255,255,${(0.5 * (1 - u)).toFixed(2)})`; g.beginPath(); g.arc((i * 61) % W, H - u * H, 1 + (i % 3) * 0.5, 0, TAU); g.fill(); }
  }
  function sombraChao(g, x, y, w) { g.fillStyle = radial(g, x, y, 0, w, [[0, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]); g.save(); g.scale(1, 0.22); g.beginPath(); g.arc(x, y / 0.22, w, 0, TAU); g.fill(); g.restore(); }
  const contorno = (g, w) => { g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = 'rgba(15,8,10,.9)'; g.lineWidth = w || 3; g.stroke(); };

  // ---------------------------------------------------------------- 1. tricórnio
  function tricornio(g, t) {
    fundo(g, t, '#ffb36a', '#b8442e', 'rgba(255,230,150,A)');
    const cx = 144, cy = 112, bob = Math.sin(t * 1.6) * 3;
    sombraChao(g, cx, 158, 70);
    g.save(); g.translate(cx, cy + bob); g.scale(0.88, 0.88);
    // pena
    const sw = Math.sin(t * 2.2) * 0.06;
    g.save(); g.translate(38, -30); g.rotate(-0.5 + sw);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(10, -30, 30, -55, 22, -80); g.bezierCurveTo(5, -60, -10, -35, 0, 0); g.fillStyle = grad(g, 0, 0, 20, -80, [[0, '#b8202a'], [0.5, '#f04a3a'], [1, '#ffb04a']]); g.fill(); contorno(g, 2.5);
    g.strokeStyle = 'rgba(255,240,200,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(2, -2); g.bezierCurveTo(10, -30, 22, -55, 20, -76); g.stroke();
    for (let i = 1; i < 9; i++) { g.strokeStyle = 'rgba(120,10,20,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(4 + i * 1.6, -i * 8.5); g.lineTo(12 + i * 2, -i * 8.5 - 6); g.stroke(); }
    g.restore();
    // aba (três pontas)
    g.beginPath(); g.moveTo(-82, 8); g.quadraticCurveTo(-60, -30, -30, -22); g.quadraticCurveTo(0, -40, 30, -22); g.quadraticCurveTo(60, -30, 82, 8); g.quadraticCurveTo(0, 26, -82, 8); g.closePath();
    g.fillStyle = grad(g, 0, -40, 0, 26, [[0, '#4a3628'], [0.6, '#2a1c14'], [1, '#160e0a']]); g.fill(); contorno(g, 3.5);
    // copa
    g.beginPath(); g.moveTo(-40, -14); g.bezierCurveTo(-42, -58, 42, -58, 40, -14); g.quadraticCurveTo(0, -4, -40, -14); g.fillStyle = grad(g, -40, -58, 40, -10, [[0, '#5a4232'], [0.5, '#3a2a1e'], [1, '#22160e']]); g.fill(); contorno(g, 3);
    // fita dourada
    g.beginPath(); g.moveTo(-40, -16); g.quadraticCurveTo(0, -6, 40, -16); g.lineTo(40, -24); g.quadraticCurveTo(0, -14, -40, -24); g.closePath(); g.fillStyle = grad(g, -40, 0, 40, 0, [[0, '#b8862e'], [0.5, '#ffe27a'], [1, '#b8862e']]); g.fill(); contorno(g, 2);
    g.beginPath(); g.moveTo(-80, 8); g.quadraticCurveTo(0, 25, 80, 8); g.strokeStyle = '#e8b830'; g.lineWidth = 3; g.stroke();
    // caveira
    g.save(); g.translate(0, -38);
    g.beginPath(); g.arc(0, 0, 9, Math.PI, 0); g.lineTo(6, 7); g.lineTo(-6, 7); g.closePath(); g.fillStyle = '#f6f1e4'; g.fill(); contorno(g, 2);
    g.fillStyle = '#1a1010'; g.beginPath(); g.arc(-3.5, 0, 2.6, 0, TAU); g.arc(3.5, 0, 2.6, 0, TAU); g.fill();
    g.strokeStyle = '#f6f1e4'; g.lineWidth = 3; g.beginPath(); g.moveTo(-12, 12); g.lineTo(12, 20); g.moveTo(12, 12); g.lineTo(-12, 20); g.stroke();
    g.restore();
    // reflexo
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-30, -44); g.quadraticCurveTo(-20, -52, -6, -52); g.stroke();
    g.restore();
  }
  // ---------------------------------------------------------------- 2. capa
  function capa(g, t) {
    fundo(g, t, '#4a3a7a', '#160e2a', 'rgba(220,190,255,A)');
    const cx = 144, sway = Math.sin(t * 1.4) * 5;
    sombraChao(g, cx, 164, 74);
    g.save(); g.translate(cx, 30);
    // forro
    g.beginPath(); g.moveTo(-26, 8); g.bezierCurveTo(-60, 50, -70 + sway, 110, -62 + sway, 128); g.lineTo(62 + sway, 128); g.bezierCurveTo(70 + sway, 110, 60, 50, 26, 8); g.closePath(); g.fillStyle = '#2a1040'; g.fill();
    // capa
    g.beginPath(); g.moveTo(-28, 4); g.bezierCurveTo(-64, 46, -76 + sway, 104, -68 + sway, 130); g.quadraticCurveTo(-40 + sway, 122, -22 + sway, 132); g.quadraticCurveTo(0 + sway, 124, 22 + sway, 132); g.quadraticCurveTo(40 + sway, 122, 68 + sway, 130); g.bezierCurveTo(76 + sway, 104, 64, 46, 28, 4); g.closePath();
    g.fillStyle = grad(g, -70, 0, 70, 0, [[0, '#5a0a1a'], [0.3, '#a8203a'], [0.5, '#d83a50'], [0.7, '#a8203a'], [1, '#5a0a1a']]); g.fill(); contorno(g, 3.5);
    // dobras
    [-34, -12, 12, 34].forEach((x, i) => { g.beginPath(); g.moveTo(x * 0.5, 20); g.quadraticCurveTo(x * 1.1 + sway * 0.6, 80, x * 1.4 + sway, 124); g.strokeStyle = i % 2 ? 'rgba(255,120,140,.35)' : 'rgba(40,0,10,.45)'; g.lineWidth = 5; g.stroke(); });
    // barra dourada
    g.beginPath(); g.moveTo(-68 + sway, 130); g.quadraticCurveTo(-40 + sway, 122, -22 + sway, 132); g.quadraticCurveTo(0 + sway, 124, 22 + sway, 132); g.quadraticCurveTo(40 + sway, 122, 68 + sway, 130); g.strokeStyle = grad(g, -70, 0, 70, 0, [[0, '#b8862e'], [0.5, '#ffe27a'], [1, '#b8862e']]); g.lineWidth = 6; g.stroke();
    // gola de pele
    g.beginPath(); g.ellipse(0, 6, 36, 12, 0, 0, TAU); g.fillStyle = grad(g, 0, -6, 0, 18, [[0, '#ffffff'], [1, '#c8c0d0']]); g.fill(); contorno(g, 3);
    for (let i = -3; i <= 3; i++) { g.fillStyle = '#1a1018'; g.beginPath(); g.ellipse(i * 9, 8 + Math.abs(i), 1.6, 2.6, 0, 0, TAU); g.fill(); }
    // fecho com rubi
    g.beginPath(); g.arc(0, 18, 9, 0, TAU); g.fillStyle = grad(g, -9, 9, 9, 27, [[0, '#ffe27a'], [1, '#b8862e']]); g.fill(); contorno(g, 2.5);
    g.beginPath(); g.arc(0, 18, 5, 0, TAU); g.fillStyle = radial(g, -1.5, 16.5, 0.5, 5, [[0, '#ff9aa0'], [1, '#c01020']]); g.fill();
    estrela(g, -2, 15, 3 + Math.sin(t * 3), '#ffffff');
    g.restore();
  }
  // ---------------------------------------------------------------- 3. asas
  function asas(g, t) {
    fundo(g, t, '#5a1a4a', '#14060e', 'rgba(255,120,60,A)');
    const cx = 144, cy = 96, bate = Math.sin(t * 3) * 0.12;
    sombraChao(g, cx, 164, 90);
    [-1, 1].forEach(k => {
      g.save(); g.translate(cx + k * 10, cy); g.scale(k, 1); g.rotate(-bate);
      // membrana
      g.beginPath(); g.moveTo(0, 0); g.lineTo(40, -50); g.quadraticCurveTo(80, -78, 118, -62); g.quadraticCurveTo(108, -30, 112, 4); g.quadraticCurveTo(96, -6, 84, 20); g.quadraticCurveTo(70, 4, 54, 30); g.quadraticCurveTo(36, 14, 14, 30); g.closePath();
      g.fillStyle = grad(g, 0, -70, 110, 30, [[0, '#ff8a4a'], [0.45, '#c8382a'], [1, '#5a0e14']]); g.fill(); contorno(g, 3.5);
      // veias da membrana
      g.strokeStyle = 'rgba(255,180,120,.35)'; g.lineWidth = 1.5; [[60, -40, 88, 0], [70, -55, 108, -20], [45, -25, 60, 22]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 + 6, (b + d) / 2, c, d); g.stroke(); });
      // ossos
      g.strokeStyle = '#3a0a10'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(40, -50); g.quadraticCurveTo(80, -78, 118, -62); g.stroke();
      g.lineWidth = 4; [[40, -50, 112, 4], [40, -50, 84, 20], [40, -50, 54, 30]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
      g.strokeStyle = 'rgba(255,150,120,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(2, -3); g.lineTo(40, -52); g.quadraticCurveTo(80, -80, 116, -65); g.stroke();
      // garras
      g.fillStyle = '#f4e4c8'; [[118, -62], [40, -50]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y - 10); g.lineTo(x + 2, y + 2); g.closePath(); g.fill(); contorno(g, 1.5); });
      g.restore();
    });
    // brasas
    for (let i = 0; i < 14; i++) { const u = (t * 0.4 + i / 14) % 1; g.fillStyle = `rgba(255,${150 + (i % 3) * 40},60,${(1 - u).toFixed(2)})`; g.beginPath(); g.arc(70 + (i * 37) % 150, 160 - u * 140, 1.5 + (i % 2), 0, TAU); g.fill(); }
  }
  // ---------------------------------------------------------------- 4. aura
  function aura(g, t) {
    fundo(g, t, '#1a2a5a', '#06080f', 'rgba(255,150,60,A)');
    const cx = 144, cy = 112;
    g.save(); g.translate(cx, cy);
    brilho(g, 0, 0, 90, 'rgba(255,120,30,A)', 0.55 + Math.sin(t * 3) * 0.1);
    // anel de fogo no chão
    g.save(); g.scale(1, 0.32);
    for (let r = 74; r > 40; r -= 6) { g.beginPath(); g.arc(0, 140, r, 0, TAU); g.strokeStyle = `rgba(255,${120 + (74 - r) * 3},40,${(0.15 + (74 - r) / 120).toFixed(2)})`; g.lineWidth = 5; g.stroke(); }
    g.restore();
    // chamas espiralando
    for (let i = 0; i < 26; i++) {
      const u = (t * 0.35 + i / 26) % 1, a = i * 2.4 + t * 1.5, r = 44 - u * 22, x = Math.cos(a) * r, y = 40 - u * 120 + Math.sin(a) * 6;
      const s = (1 - u) * 9 + 2;
      g.save(); g.translate(x, y);
      g.beginPath(); g.moveTo(0, -s * 1.6); g.quadraticCurveTo(s, -s * 0.2, 0, s); g.quadraticCurveTo(-s, -s * 0.2, 0, -s * 1.6);
      g.fillStyle = radial(g, 0, 0, 0, s * 1.4, [[0, `rgba(255,250,200,${(1 - u).toFixed(2)})`], [0.5, `rgba(255,170,60,${(0.9 * (1 - u)).toFixed(2)})`], [1, 'rgba(255,80,20,0)']]); g.fill();
      g.restore();
    }
    // núcleo
    brilho(g, 0, -20, 34, 'rgba(255,240,180,A)', 0.6);
    for (let i = 0; i < 6; i++) estrela(g, Math.cos(t + i) * 50, -30 + Math.sin(t * 1.3 + i) * 40, 3 + (i % 2) * 2, '#fff6c8');
    g.restore();
  }
  // ---------------------------------------------------------------- 5. Brasinha (bebê dragão)
  function brasinha(g, t) {
    fundo(g, t, '#2a3a7a', '#0e1430', 'rgba(255,200,120,A)');
    g.fillStyle = grad(g, 0, 140, 0, 180, [[0, '#e0c890'], [1, '#b8985a']]); g.fillRect(0, 142, W, 38);
    g.fillStyle = 'rgba(80,140,220,.6)'; g.fillRect(0, 136, W, 7);
    g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(236, 34, 14, 0, TAU); g.fill(); brilho(g, 236, 34, 40, 'rgba(255,240,200,A)', 0.4);
    const cx = 146, cy = 132, pulo = Math.abs(Math.sin(t * 2.4)) * -6;
    sombraChao(g, cx, 152, 50 + pulo);
    g.save(); g.translate(cx, cy + pulo);
    const R1 = '#ff6a4a', R2 = '#d83a2a', R3 = '#9a1e18';
    // rabo
    const cw = Math.sin(t * 3) * 6;
    g.beginPath(); g.moveTo(28, -8); g.bezierCurveTo(56, -4, 62, -26 + cw, 50, -34 + cw); g.bezierCurveTo(46, -22 + cw, 40, -14, 26, -16); g.closePath(); g.fillStyle = grad(g, 26, 0, 60, -30, [[0, R2], [1, R1]]); g.fill(); contorno(g);
    g.beginPath(); g.moveTo(50, -34 + cw); g.lineTo(60, -42 + cw); g.lineTo(54, -28 + cw); g.closePath(); g.fillStyle = '#ffb04a'; g.fill(); contorno(g, 2);
    // asinha de trás
    const asa = Math.sin(t * 8) * 0.25;
    g.save(); g.translate(10, -44); g.rotate(-0.4 - asa);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(14, -30, 36, -26); g.quadraticCurveTo(30, -14, 34, -4); g.quadraticCurveTo(22, -8, 18, 4); g.quadraticCurveTo(8, -2, 0, 0); g.fillStyle = grad(g, 0, -30, 36, 4, [[0, '#ffa060'], [1, R3]]); g.fill(); contorno(g, 2.5);
    g.restore();
    // corpo
    g.beginPath(); g.ellipse(6, -22, 30, 26, 0, 0, TAU); g.fillStyle = radial(g, -6, -34, 4, 40, [[0, R1], [0.7, R2], [1, R3]]); g.fill(); contorno(g, 3.5);
    // barriga
    g.beginPath(); g.ellipse(0, -16, 17, 18, 0, 0, TAU); g.fillStyle = grad(g, 0, -34, 0, 2, [[0, '#fff0c8'], [1, '#f0c078']]); g.fill();
    for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(200,140,60,.6)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, -28 + i * 7, 12 - Math.abs(i - 1.5) * 2, 2.5, 0, 0, Math.PI); g.stroke(); }
    // patinhas
    [[-16, -2], [16, -2]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 9, 6, 0, 0, TAU); g.fillStyle = R2; g.fill(); contorno(g, 2.5); g.fillStyle = '#fff'; [-4, 0, 4].forEach(d => { g.beginPath(); g.arc(x + d, y + 4, 1.4, 0, TAU); g.fill(); }); });
    // cabeça grande
    g.save(); g.translate(-12, -58); g.rotate(Math.sin(t * 1.2) * 0.05);
    g.beginPath(); g.ellipse(0, 0, 30, 26, 0, 0, TAU); g.fillStyle = radial(g, -8, -10, 4, 36, [[0, R1], [0.7, R2], [1, R3]]); g.fill(); contorno(g, 3.5);
    // focinho
    g.beginPath(); g.ellipse(-26, 8, 16, 12, 0, 0, TAU); g.fillStyle = radial(g, -30, 2, 2, 18, [[0, R1], [1, R2]]); g.fill(); contorno(g, 3);
    g.fillStyle = R3; g.beginPath(); g.ellipse(-34, 4, 2.5, 1.8, 0, 0, TAU); g.ellipse(-26, 3, 2.5, 1.8, 0, 0, TAU); g.fill();
    // sorriso
    g.strokeStyle = '#5a0e10'; g.lineWidth = 2; g.beginPath(); g.moveTo(-38, 12); g.quadraticCurveTo(-28, 19, -16, 13); g.stroke();
    // chifrinhos
    [[2, -24, -0.2], [16, -20, 0.3]].forEach(([x, y, r]) => { g.save(); g.translate(x, y); g.rotate(r); g.beginPath(); g.moveTo(-5, 2); g.quadraticCurveTo(0, -14, 4, -16); g.quadraticCurveTo(6, -6, 5, 2); g.closePath(); g.fillStyle = grad(g, 0, -16, 0, 2, [[0, '#fff8e0'], [1, '#e8c070']]); g.fill(); contorno(g, 2); g.restore(); });
    // olho enorme e brilhante
    const pisca = (t % 4) < 0.14;
    if (pisca) { g.strokeStyle = '#1a0a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(-6, -2); g.quadraticCurveTo(4, 4, 14, -2); g.stroke(); }
    else {
      g.beginPath(); g.ellipse(4, -2, 12, 13, 0, 0, TAU); g.fillStyle = '#ffffff'; g.fill(); contorno(g, 2.5);
      g.beginPath(); g.ellipse(2, 0, 8, 10, 0, 0, TAU); g.fillStyle = radial(g, 2, 4, 1, 10, [[0, '#4ab0ff'], [0.6, '#1a5aa8'], [1, '#0a1a3a']]); g.fill();
      g.beginPath(); g.ellipse(2, 1, 4, 6, 0, 0, TAU); g.fillStyle = '#0a0610'; g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-1, -4, 3, 0, TAU); g.fill(); g.beginPath(); g.arc(5, 4, 1.4, 0, TAU); g.fill();
    }
    // bochecha
    g.fillStyle = 'rgba(255,140,160,.6)'; g.beginPath(); g.ellipse(-12, 12, 6, 3.5, 0, 0, TAU); g.fill();
    g.restore();
    // asinha da frente
    g.save(); g.translate(18, -40); g.rotate(-0.2 + asa);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(16, -32, 40, -28); g.quadraticCurveTo(34, -16, 38, -4); g.quadraticCurveTo(26, -8, 22, 4); g.quadraticCurveTo(10, -2, 0, 0); g.fillStyle = grad(g, 0, -30, 40, 4, [[0, '#ffb070'], [1, R2]]); g.fill(); contorno(g, 2.5);
    g.restore();
    // fumacinha de fogo
    const f = (t % 3) / 3;
    if (f < 0.5) for (let i = 0; i < 4; i++) { const u = f / 0.5; g.fillStyle = `rgba(255,${180 - i * 30},60,${(1 - u).toFixed(2)})`; g.beginPath(); g.arc(-56 - u * 26 - i * 6, -50 - u * 14 - i * 3, 5 - i + u * 3, 0, TAU); g.fill(); }
    g.restore();
  }
  // ---------------------------------------------------------------- 6. nome dourado
  function nome(g, t, arroba) {
    fundo(g, t, '#1a5a5a', '#061418', 'rgba(255,220,120,A)');
    const txt = '@' + (arroba || 'seunome');
    g.save(); g.translate(144, 96);
    // placa
    const w = Math.max(170, Math.min(250, txt.length * 17 + 40));
    g.beginPath(); g.roundRect(-w / 2, -34, w, 60, 10); g.fillStyle = grad(g, 0, -34, 0, 26, [[0, '#3a2410'], [1, '#160a04']]); g.fill();
    g.lineWidth = 5; g.strokeStyle = grad(g, -w / 2, 0, w / 2, 0, [[0, '#b8862e'], [0.5, '#ffe27a'], [1, '#b8862e']]); g.stroke();
    g.beginPath(); g.roundRect(-w / 2 + 7, -27, w - 14, 46, 6); g.strokeStyle = 'rgba(255,226,122,.35)'; g.lineWidth = 1.5; g.stroke();
    // coroa
    g.save(); g.translate(0, -46);
    g.beginPath(); g.moveTo(-18, 8); g.lineTo(-20, -8); g.lineTo(-9, 0); g.lineTo(0, -12); g.lineTo(9, 0); g.lineTo(20, -8); g.lineTo(18, 8); g.closePath(); g.fillStyle = grad(g, 0, -12, 0, 8, [[0, '#fff2a8'], [1, '#c9962a']]); g.fill(); contorno(g, 2.5);
    g.fillStyle = '#e84a4a'; g.beginPath(); g.arc(0, 2, 3, 0, TAU); g.fill(); g.fillStyle = '#3a9ae8'; g.beginPath(); g.arc(-11, 3, 2, 0, TAU); g.arc(11, 3, 2, 0, TAU); g.fill();
    g.restore();
    // texto dourado com brilho passando
    let fs = 30; g.font = `700 ${fs}px Silkscreen, monospace`; while (g.measureText(txt).width > w - 30 && fs > 14) { fs -= 2; g.font = `700 ${fs}px Silkscreen, monospace`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#5a3008'; g.fillText(txt, 2, 2);
    const sx = ((t * 0.5) % 1.6 - 0.3) * w - w / 2;
    g.fillStyle = grad(g, sx - 30, 0, sx + 30, 0, [[0, '#e8b830'], [0.5, '#fffbe0'], [1, '#e8b830']]); g.fillText(txt, 0, 0);
    g.restore();
    for (let i = 0; i < 7; i++) { const a = t * 0.8 + i; estrela(g, 144 + Math.cos(a * 1.3) * 120, 96 + Math.sin(a) * 60, 4 + Math.sin(t * 4 + i) * 2, '#fff6c8'); }
  }
  // ---------------------------------------------------------------- 7. moldura
  function moldura(g, t) {
    fundo(g, t, '#6a4428', '#1e120a', 'rgba(255,220,150,A)');
    g.save(); g.translate(144, 96); g.scale(0.82, 0.82);
    const fw = 92, fh = 128;
    // moldura dourada ornamentada
    g.beginPath(); g.roundRect(-fw / 2 - 14, -fh / 2 - 14, fw + 28, fh + 28, 10); g.fillStyle = grad(g, -60, -80, 60, 80, [[0, '#fff2a8'], [0.3, '#e8b830'], [0.7, '#a8761e'], [1, '#ffe27a']]); g.fill(); contorno(g, 3.5);
    g.beginPath(); g.roundRect(-fw / 2 - 5, -fh / 2 - 5, fw + 10, fh + 10, 6); g.strokeStyle = 'rgba(90,50,10,.7)'; g.lineWidth = 3; g.stroke();
    for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(255,255,220,.5)'; g.beginPath(); g.arc(-fw / 2 - 8 + i * (fw + 16) / 9, -fh / 2 - 9, 1.6, 0, TAU); g.arc(-fw / 2 - 8 + i * (fw + 16) / 9, fh / 2 + 9, 1.6, 0, TAU); g.fill(); }
    // interior: carta
    g.beginPath(); g.rect(-fw / 2, -fh / 2, fw, fh); g.fillStyle = grad(g, 0, -fh / 2, 0, fh / 2, [[0, '#4a3a8a'], [1, '#1a1440']]); g.fill();
    brilho(g, 0, -10, 50, 'rgba(255,230,160,A)', 0.35);
    // silhueta do herói
    g.fillStyle = '#0e0a1e'; g.beginPath(); g.arc(0, -20, 15, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-30, 40); g.quadraticCurveTo(-28, 0, 0, -2); g.quadraticCurveTo(28, 0, 30, 40); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,226,122,.85)'; g.beginPath(); g.rect(-fw / 2 + 8, fh / 2 - 22, fw - 16, 14); g.fill();
    // joias nos cantos
    [[-fw / 2 - 7, -fh / 2 - 7, '#e84a4a'], [fw / 2 + 7, -fh / 2 - 7, '#3a9ae8'], [-fw / 2 - 7, fh / 2 + 7, '#3a9ae8'], [fw / 2 + 7, fh / 2 + 7, '#e84a4a']].forEach(([x, y, c]) => {
      g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fillStyle = radial(g, x - 3, y - 3, 1, 9, [[0, '#ffffff'], [0.3, c], [1, '#1a0a10']]); g.fill(); contorno(g, 2);
    });
    // topo com rubi
    g.beginPath(); g.moveTo(-16, -fh / 2 - 14); g.quadraticCurveTo(0, -fh / 2 - 34, 16, -fh / 2 - 14); g.closePath(); g.fillStyle = '#e8b830'; g.fill(); contorno(g, 2.5);
    g.beginPath(); g.arc(0, -fh / 2 - 22, 5, 0, TAU); g.fillStyle = '#e84a4a'; g.fill();
    // brilho passando no vidro
    const u = (t * 0.35) % 1.4; g.save(); g.beginPath(); g.rect(-fw / 2, -fh / 2, fw, fh); g.clip(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(-fw + u * fw * 2, -fh); g.lineTo(-fw + 24 + u * fw * 2, -fh); g.lineTo(-fw / 2 + 24 + u * fw * 2, fh); g.lineTo(-fw / 2 + u * fw * 2, fh); g.fill(); g.restore();
    g.restore();
  }
  // ---------------------------------------------------------------- 8. bandeira na casa
  function bandeira(g, t) {
    g.fillStyle = grad(g, 0, 0, 0, H, [[0, '#7ac0f0'], [1, '#c8e8ff']]); g.fillRect(0, 0, W, H);
    [[50, 30, 1], [210, 22, 0.8]].forEach(([x, y, s]) => { g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(x + Math.sin(t * 0.3) * 8, y, 26 * s, 9 * s, 0, 0, TAU); g.ellipse(x + 14 * s + Math.sin(t * 0.3) * 8, y - 6 * s, 16 * s, 9 * s, 0, 0, TAU); g.fill(); });
    g.fillStyle = grad(g, 0, 120, 0, 180, [[0, '#6ac85a'], [1, '#3a8a3a']]); g.fillRect(0, 128, W, 52);
    g.save(); g.translate(120, 136);
    sombraChao(g, 0, 8, 70);
    // casa
    g.beginPath(); g.rect(-50, -54, 100, 56); g.fillStyle = grad(g, -50, 0, 50, 0, [[0, '#b8946a'], [1, '#8a6a44']]); g.fill(); contorno(g, 3);
    for (let y = -46; y < 0; y += 9) { g.strokeStyle = 'rgba(80,50,20,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-50, y); g.lineTo(50, y); g.stroke(); }
    g.beginPath(); g.moveTo(-62, -52); g.lineTo(0, -92); g.lineTo(62, -52); g.closePath(); g.fillStyle = grad(g, 0, -92, 0, -52, [[0, '#e86a4a'], [1, '#a8301e']]); g.fill(); contorno(g, 3);
    for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(90,20,10,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-52 + i * 6, -58 - i * 8); g.lineTo(52 - i * 6, -58 - i * 8); g.stroke(); }
    g.beginPath(); g.roundRect(-11, -30, 22, 32, [8, 8, 0, 0]); g.fillStyle = '#5a3418'; g.fill(); contorno(g, 2.5); g.fillStyle = '#e8b830'; g.beginPath(); g.arc(6, -12, 2, 0, TAU); g.fill();
    [[-34, -38], [22, -38]].forEach(([x, y]) => { g.beginPath(); g.rect(x, y, 14, 14); g.fillStyle = radial(g, x + 7, y + 7, 1, 12, [[0, '#fff2b0'], [1, '#e8a830']]); g.fill(); contorno(g, 2.5); g.strokeStyle = '#5a3418'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 7, y); g.lineTo(x + 7, y + 14); g.moveTo(x, y + 7); g.lineTo(x + 14, y + 7); g.stroke(); });
    // floreiras
    [[-36, -22], [20, -22]].forEach(([x, y]) => { g.fillStyle = '#6a4428'; g.fillRect(x - 2, y, 18, 6); ['#ff6aa0', '#ffd046', '#ff6aa0', '#ffffff'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + 1 + i * 4.5, y - 2 + Math.sin(t * 2 + i) * 0.6, 2.6, 0, TAU); g.fill(); }); });
    // cerca
    for (let x = -80; x <= 80; x += 12) { if (x > -14 && x < 14) continue; g.fillStyle = '#f4ecd8'; g.beginPath(); g.moveTo(x - 4, 10); g.lineTo(x - 4, -6); g.lineTo(x, -11); g.lineTo(x + 4, -6); g.lineTo(x + 4, 10); g.closePath(); g.fill(); g.strokeStyle = 'rgba(60,40,20,.6)'; g.lineWidth = 1.5; g.stroke(); }
    g.restore();
    // mastro e bandeira tremulando
    g.save(); g.translate(196, 162); g.scale(0.9, 0.9);
    g.fillStyle = grad(g, -3, 0, 3, 0, [[0, '#7a5434'], [1, '#4a2e18']]); g.fillRect(-3, -132, 6, 134);
    g.beginPath(); g.arc(0, -134, 5, 0, TAU); g.fillStyle = '#ffe27a'; g.fill(); contorno(g, 2);
    g.beginPath(); g.moveTo(3, -126);
    for (let x = 0; x <= 60; x += 5) g.lineTo(3 + x, -126 + Math.sin(t * 4 - x * 0.12) * 4 * (x / 60));
    for (let x = 60; x >= 0; x -= 5) g.lineTo(3 + x, -86 + Math.sin(t * 4 - x * 0.12) * 4 * (x / 60));
    g.closePath(); g.fillStyle = grad(g, 0, -126, 60, -86, [[0, '#3a7ad8'], [1, '#1a3a8a']]); g.fill(); contorno(g, 2.5);
    g.save(); g.translate(33, -106 + Math.sin(t * 4 - 30 * 0.12) * 2);
    g.beginPath(); g.moveTo(-10, 6); g.lineTo(-12, -6); g.lineTo(-5, 0); g.lineTo(0, -9); g.lineTo(5, 0); g.lineTo(12, -6); g.lineTo(10, 6); g.closePath(); g.fillStyle = '#ffd046'; g.fill(); contorno(g, 1.5);
    g.restore();
    g.restore();
  }
  // ---------------------------------------------------------------- teste
  function teste(g, t) { fundo(g, t, '#3a4a5a', '#10161e', 'rgba(255,255,255,A)'); g.fillStyle = '#ffd046'; g.font = '700 26px Silkscreen, monospace'; g.textAlign = 'center'; g.fillText('TESTE · R$ 1', 144, 100); }

  const ARTES = { tricornio, capa, asas, aura, brasinha, nome, moldura, bandeira, teste };
  window.IlhaLojaArte = { W, H, desenha: (g, id, t, arroba) => { g.save(); g.clearRect(0, 0, W, H); (ARTES[id] || teste)(g, t, arroba); g.restore(); } };
})();
