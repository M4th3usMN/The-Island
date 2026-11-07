/* A Grande Ilha — companheiros que andam junto com um morador (ex.: o touro do Guilherme).
   Desenhados ao lado do dono, na mesma posição da rotina, só quando o dono está visível. */
(function () {
  'use strict';
  const G = window.GrandeIlha;
  if (!G || !G.hooks) return;
  function touro(c, x, y, lado, passo) {
    const P = (dx, dy, w, h, cor) => { c.fillStyle = cor; c.fillRect(Math.round(x + (lado < 0 ? -dx - w : dx)), Math.round(y + dy), w, h); };
    const p = passo ? 1 : 0;
    P(-6, -7, 11, 5, '#5a3a24'); P(-6, -7, 11, 1, '#7a5232');           // corpo
    P(5, -9, 4, 4, '#5a3a24'); P(8, -7, 2, 2, '#c89a7a');                  // cabeça e focinho
    P(5, -10, 1, 1, '#f1ead8'); P(8, -10, 1, 1, '#f1ead8');                // chifres
    P(7, -8, 1, 1, '#140c08');                                             // olho
    P(-5, -2, 2, 2 + p, '#3a2418'); P(-1, -2, 2, 3 - p, '#3a2418'); P(2, -2, 2, 2 + p, '#3a2418'); // patas
    P(-7, -7, 1, 4, '#3a2418');                                            // rabo
    P(-4, -9, 6, 2, '#4a4e58'); P(-3, -10, 4, 1, '#6a6e7a');               // oficina portátil nas costas
  }
  // passarinho que voa em volta do Jester (o flautista)
  function ave(c, x, y, lado, passo, sec) {
    const a = sec * 2.2, bx = Math.round(x + Math.cos(a) * 9), by = Math.round(y - 16 + Math.sin(a * 2) * 3);
    c.fillStyle = '#e8483a'; c.fillRect(bx, by, 2, 1); c.fillStyle = '#3a6ac8'; c.fillRect(bx - 1, by - (Math.floor(sec * 8) % 2), 1, 1); c.fillRect(bx + 2, by - (Math.floor(sec * 8) % 2), 1, 1);
  }
  // Mick, o gato fiel do Felk (laranja, cauda listrada)
  function mick(c, x, y, lado, passo, sec) {
    const P = (dx, dy, w, h, cor) => { c.fillStyle = cor; c.fillRect(Math.round(x + (lado < 0 ? -dx - w : dx)), Math.round(y + dy), w, h); };
    const p = passo ? 1 : 0;
    P(-3, -4, 6, 3, '#e88a2a'); P(-3, -4, 6, 1, '#f4a84a');               // corpo
    P(2, -7, 3, 3, '#e88a2a'); P(2, -8, 1, 1, '#e88a2a'); P(4, -8, 1, 1, '#e88a2a'); // cabeça e orelhas
    P(3, -6, 1, 1, '#2a8a3a');                                             // olho verde
    P(-2, -1, 1, 1 + p, '#b8661a'); P(2, -1, 1, 2 - p, '#b8661a');        // patas
    const w = Math.round(Math.sin(sec * 4)); P(-4, -7 + w, 1, 4, '#e88a2a'); P(-4, -6 + w, 1, 1, '#b8661a'); // cauda listrada
  }
  const COMP = { guilherme: { dx: -11, dy: 2, draw: touro }, jester: { dx: 0, dy: 0, draw: ave }, felk: { dx: -8, dy: 1, draw: mick } };
  G.hooks.push((objs, c, info) => {
    Object.keys(COMP).forEach(id => {
      const m = G.BY[id]; if (!m || (G.jogados && G.jogados.has(id))) return;
      const q = G.posAt(m, info.t); if (!q || q.hidden || q.sleeping) return;
      const q2 = G.posAt(m, info.t - 400) || q, lado = q.x < q2.x ? -1 : 1, k = COMP[id];
      const x = q.x + k.dx * lado, y = q.y + k.dy;
      objs.push({ y: y + (id === 'jester' ? 20 : 0), f: () => k.draw(c, x, y, lado, q.walking && Math.floor(info.sec * 6) % 2, info.sec) });
    });
  });
})();
