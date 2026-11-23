/* Barcos em pixel art no estilo Flow (cores chapadas, contorno #140e1a, desenhados em código).
   window.Barcos.sprite(tipo, quadro) -> canvas ('bote' 28x16, 'caravela' 64x60); quadro 0/1 balança.
   window.Barcos.desenha(ctx, x, y, tipo, quadro, lado, escala): (x, y) = linha d'água no meio do casco.
   No mapa: a caravela do Bordon fica atracada no cais. */
(function () {
  const OUT = '#140e1a';
  const MAD = ['#3a2416', '#5e3a22', '#84542e', '#a8743e'], VELA = ['#b8ab92', '#d8ccb2', '#f2ead8'], CORDA = '#c9a46a';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function contorno(cv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, d = g.getImageData(0, 0, W, H).data;
    const a = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
    const o = mk(W, H), og = o.getContext('2d'); og.fillStyle = OUT;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) og.fillRect(x, y, 1, 1);
    og.drawImage(cv, 0, 0); return o;
  }
  // monta um sprite por camadas: cada camada ganha contorno próprio (linha entre as partes)
  function camadas(W, H, fns) {
    const out = mk(W, H), G = out.getContext('2d');
    fns.forEach(fn => { const k = mk(W, H), g = k.getContext('2d'); fn((x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }); G.drawImage(contorno(k), 0, 0); });
    return out;
  }
  function casco(r, x0, x1, y0, h, bal) {
    for (let j = 0; j < h; j++) {
      const enc = Math.round(j * 0.9), a = x0 + enc + (j === 0 ? -2 : 0), b = x1 - enc + (j === 0 ? 3 : 0);
      for (let x = a; x <= b; x++) r(x, y0 + j + bal, 1, 1, j === 0 ? MAD[3] : (x - a) / (b - a) > 0.7 ? MAD[1] : j % 3 === 2 ? MAD[1] : MAD[2]);
    }
  }
  const CACHE = {};
  function sprite(tipo, q) {
    q = q ? 1 : 0; const key = tipo + q; if (CACHE[key]) return CACHE[key];
    let cv;
    if (tipo === 'caravela') {
      const bal = q;
      cv = camadas(64, 60, [
        r => { casco(r, 8, 54, 44, 9, bal); r(46, 40 + bal, 12, 5, MAD[2]); r(46, 40 + bal, 12, 1, MAD[3]); r(10, 41 + bal, 8, 4, MAD[2]); for (let x = 14; x < 50; x += 6) r(x, 48 + bal, 2, 2, MAD[0]); },
        r => { r(30, 8 + bal, 2, 37, MAD[1]); r(46, 18 + bal, 2, 23, MAD[1]); r(24, 10 + bal, 14, 1, MAD[0]); r(41, 20 + bal, 12, 1, MAD[0]); },
        r => { for (let j = 0; j < 22; j++) { const w = 14 + Math.round(Math.sin(j / 21 * Math.PI) * 3) + q; r(24 - (w - 14) / 2 + 1, 11 + j + bal, w, 1, j < 3 ? VELA[2] : (j % 7 === 6 ? VELA[0] : VELA[1])); } r(25, 12 + bal, 2, 18, VELA[2]); r(29, 15 + bal, 4, 4, '#b8402a'); r(30, 16 + bal, 2, 2, '#e0a836'); },
        r => { for (let j = 0; j < 15; j++) { const w = 11 + Math.round(Math.sin(j / 14 * Math.PI) * 2) + q; r(41 - (w - 11) / 2 + 1, 21 + j + bal, w, 1, j % 6 === 5 ? VELA[0] : VELA[1]); } r(42, 22 + bal, 2, 12, VELA[2]); },
        r => { r(30, 3 + bal, 1, 5, MAD[1]); r(31, 3 + bal, 6, 4, '#b8402a'); r(31, 3 + bal, 6, 1, '#d8603e'); },
      ]);
      // cordas: do topo dos mastros até a proa e a popa (linhas contínuas por trás do casco)
      const g = cv.getContext('2d'); g.fillStyle = CORDA; g.globalCompositeOperation = 'destination-over';
      const corda = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); };
      corda(31, 8 + bal, 57, 40 + bal); corda(30, 8 + bal, 6, 43 + bal); corda(47, 18 + bal, 58, 40 + bal);
      g.globalCompositeOperation = 'source-over';
    } else {
      cv = camadas(28, 16, [
        r => { casco(r, 3, 23, 7, 6, 0); r(5, 8, 17, 1, MAD[0]); },
        r => { r(11, 6, 6, 2, MAD[1]); },
        r => { r(-1 + q * 2, 4 + q, 7, 2, MAD[3]); r(22 - q * 2, 4 + q, 7, 2, MAD[3]); },
      ]);
    }
    return (CACHE[key] = cv);
  }
  function desenha(ctx, x, y, tipo, q, lado, escala) {
    const s = escala || 1, sp = sprite(tipo || 'bote', q);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(y)); ctx.scale((lado < 0 ? -1 : 1) * s, s);
    // reflexo/espuma na água
    ctx.fillStyle = 'rgba(242,234,216,0.55)'; ctx.fillRect(-sp.width / 2 + 3, 0, sp.width - 6, 1);
    ctx.drawImage(sp, -sp.width / 2, -sp.height + (tipo === 'caravela' ? 8 : 4)); ctx.restore();
  }
  window.Barcos = { sprite, desenha };
  // caravela atracada no cais (sobe e desce devagar); desenhada em meia escala porque o mapa é 2x
  const H = window.IlhaHooks = window.IlhaHooks || [];
  H.push((objs, c, info) => {
    const q = Math.floor(info.sec * 1.2) % 2, x = 412, y = 549;
    // caravela do Google Flow (via GrandeIlha.prop); sem ela, o desenho em código
    const G = window.GrandeIlha;
    objs.push({ y: y - 1, f: () => { if (!(G && G.prop && G.prop(c, 'caravela', x + 4, y + 3 + Math.sin(info.sec * 0.9) * 0.4, -1, true))) desenha(c, x, y, 'caravela', q, -1, 0.5); } });
  });
})();
