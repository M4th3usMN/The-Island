/* Dragão em pixel art (48x32), visto de lado, virado para a direita.
   Poses: 'cima' e 'baixo' (asas batendo, voando) e 'pousado' (asas meio fechadas, patas no chão).
   window.Dragao.sprite(pose) devolve um canvas pronto (cacheado); window.Dragao.desenha(ctx, x, y, pose, lado, escala)
   desenha com os pés/barriga em (x, y). Usado nos vídeos e na capa padrão. */
(function () {
  const W = 48, H = 46, OY = 12;
  const COR = {
    contorno: '#2a0a10', corpo: '#b3242e', luz: '#e04a3c', sombra: '#7e1520',
    barriga: '#f2bc68', barrigaSombra: '#d18a3e', asa: '#6e1a2a', asaLuz: '#9a2a3a', osso: '#e04a3c',
    chifre: '#f1ead8', olho: '#ffe27a', pupila: '#2a0a10', garra: '#f1ead8'
  };
  function grade() { return Array.from({ length: H }, () => new Array(W).fill(null)); }
  function px(g, x, y, c) { x = Math.round(x); y = Math.round(y + OY); if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; }
  function elipse(g, cx, cy, rx, ry, c, f) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2; if (d <= 1) px(g, x, y, f ? f(x, y, d) : c); } }
  function linha(g, a, b, r, c) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2); for (let i = 0; i <= n; i++) { const t = n ? i / n : 0, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, rr = typeof r === 'function' ? r(t) : r; elipse(g, x, y, rr, rr, c); } }
  function poligono(g, pts, c) {
    let y0 = Infinity, y1 = -Infinity; pts.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    for (let y = Math.floor(y0); y <= y1; y++) for (let x = 0; x < W; x++) {
      let dentro = false; const X = x + 0.5, Y = y + 0.5;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > Y) !== (yj > Y) && X < (xj - xi) * (Y - yi) / (yj - yi) + xi) dentro = !dentro; }
      if (dentro) px(g, x, y, c);
    }
  }
  function osso(g, a, b) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])); for (let i = 0; i <= n; i++) px(g, a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n, COR.osso); }

  // asa de morcego: braço do ombro até o pulso, dedos do pulso até as pontas, membrana recortada entre eles
  function asa(g, pose, traseira) {
    const dx = traseira ? -4 : 0, O = [23 + dx, 12], raiz = [15 + dx, 14];
    let T;
    if (pose === 'cima') T = [[38, -9], [27, -9], [14, -4]];
    else if (pose === 'baixo') T = [[31, 31], [23, 32], [16, 28]];
    else T = [[34, -4], [26, -4], [16, 1]];
    T = T.map(([x, y]) => [x + dx, y + (traseira ? 2 : 0)]);
    const pulso = [O[0] + (T[0][0] - O[0]) * 0.55, O[1] + (T[0][1] - O[1]) * 0.55];
    const rec = (a, b) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return [m[0] + (O[0] - m[0]) * 0.32, m[1] + (O[1] - m[1]) * 0.32]; };
    const mem = traseira ? ['#4a1428', '#561a30'] : ['#6a1e3a', '#8a2c48'];
    poligono(g, [O, pulso, T[0], rec(T[0], T[1]), pulso], mem[1]);
    poligono(g, [pulso, T[0], rec(T[0], T[1]), T[1], rec(T[1], T[2]), T[2], rec(T[2], raiz), raiz, O], mem[0]);
    poligono(g, [pulso, T[1], rec(T[1], T[2]), T[2], pulso], mem[1]);
    const osso = traseira ? '#9a3040' : '#e0563e';
    linha(g, O, pulso, 0.9, osso);
    T.forEach(t => { const n = Math.ceil(Math.hypot(t[0] - pulso[0], t[1] - pulso[1])); for (let i = 0; i <= n; i++) px(g, pulso[0] + (t[0] - pulso[0]) * i / n, pulso[1] + (t[1] - pulso[1]) * i / n, osso); });
    if (!traseira) px(g, pulso[0], pulso[1] - 1, COR.garra);
  }

  function monta(pose) {
    const g = grade();
    const voo = pose !== 'pousado', bate = pose === 'baixo' ? 1 : 0;
    // asa de trás (mais escura, fica atrás do corpo)
    asa(g, pose, true);
    // cauda: sai do quadril e ondula até a ponta em forma de seta
    const cauda = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; cauda.push([16 - t * 15, 16 + Math.sin(t * 3.2 + (voo ? 0.6 : 1.6)) * (voo ? 2.2 : 3.2) + (voo ? 0 : t * 4)]); }
    for (let i = 0; i < cauda.length - 1; i++) linha(g, cauda[i], cauda[i + 1], 2.4 - i * 0.17, COR.corpo);
    const pt = cauda[cauda.length - 1];
    poligono(g, [[pt[0] + 1, pt[1] - 1], [pt[0] - 3, pt[1] - 3], [pt[0] - 2, pt[1] + 1], [pt[0] + 1, pt[1] + 2]], COR.sombra);
    // patas de trás
    if (voo) { linha(g, [17, 18], [14, 21], 1.2, COR.sombra); px(g, 13, 22, COR.garra); }
    else { linha(g, [17, 18], [16, 24], 1.6, COR.sombra); linha(g, [16, 24], [18, 26], 1, COR.sombra); px(g, 19, 26, COR.garra); px(g, 17, 27, COR.garra); }
    // corpo com barriga clara
    elipse(g, 22, 16, 8.2, 4.6, null, (x, y, d) => y >= 16 + (x - 22) * -0.1 ? (y > 18 ? COR.barrigaSombra : COR.barriga) : (d < 0.45 && y < 15 ? COR.luz : COR.corpo));
    // pescoço curvo até a cabeça
    const pescoco = [[27, 14], [30, 11], [32.5, 8.5], [34.5, 6.5]];
    for (let i = 0; i < pescoco.length - 1; i++) linha(g, pescoco[i], pescoco[i + 1], 2.4 - i * 0.25, COR.corpo);
    // cabeça: crânio, focinho, mandíbula, chifres, olho, narina
    elipse(g, 36.5, 5.5, 3.2, 2.6, COR.corpo);
    poligono(g, [[37, 3.6], [43.5, 5.2], [43.5, 7.3], [37, 7.6]], COR.corpo);
    poligono(g, [[37, 7.2], [42.5, 7.6], [41.5, 8.8], [37, 8.8]], COR.barriga);
    px(g, 42, 5, COR.contorno);
    linha(g, [35, 3.4], [32.5, 0.6], 0.6, COR.chifre); linha(g, [36.6, 3], [35.2, 0.2], 0.5, COR.chifre);
    px(g, 37, 4, COR.olho); px(g, 38, 4, COR.pupila);
    px(g, 41, 7, COR.garra); px(g, 39, 7, COR.garra);
    // espinhos nas costas
    [[19, 11], [25, 11.2], [31, 8.6]].forEach(([x, y]) => px(g, x, y, COR.chifre));
    // patas da frente
    if (voo) { linha(g, [26, 19], [28, 21.5], 1, COR.sombra); px(g, 29, 22, COR.garra); }
    else { linha(g, [26, 19], [27, 25], 1.4, COR.sombra); px(g, 28, 26, COR.garra); px(g, 26, 26, COR.garra); }
    // asa da frente por cima do corpo
    asa(g, pose, false);
    // contorno automático: todo pixel vazio encostado no desenho vira linha escura
    const out = grade();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x]) { out[y][x] = g[y][x]; continue; }
      const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (g[y + dy] || [])[x + dx]);
      if (viz) out[y][x] = COR.contorno;
    }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    out.forEach((row, j) => row.forEach((col, i) => { if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } }));
    return c;
  }
  const cache = {};
  const sprite = pose => cache[pose] || (cache[pose] = monta(pose));
  // (x, y) = ponto embaixo da barriga/patas; lado -1 vira para a esquerda
  function desenha(ctx, x, y, pose, lado, escala) {
    const s = escala || 1, sp = sprite(pose || 'cima');
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(y)); ctx.scale((lado < 0 ? -1 : 1) * s, s);
    ctx.drawImage(sp, -24, -39); ctx.restore();
  }
  window.Dragao = { sprite, desenha, W, H };
})();
