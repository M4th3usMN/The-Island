/* Evento do Episódio 4: o dragão.
   Até POUSO, a sombra de um dragão circula sobre o mar em volta da ilha.
   No horário de POUSO ele desce do céu e pousa na praia, ao lado do cais, e fica lá
   (respirando, de vez em quando soltando fumaça) até o resultado da votação do Ep. 5.
   Tudo calculado pelo relógio, então todo mundo vê a mesma coisa ao mesmo tempo. */
(function () {
  'use strict';
  const G = window.GrandeIlha, D = window.Dragao;
  if (!G || !D) return;
  const POUSO = Date.parse('2026-11-06T09:00:00-04:00'); // 9h de Manaus = 10h de Brasília (sexta, post do Ep. 4)
  const DESCIDA = 24e3;                                   // tempo da descida até tocar a areia
  const PRAIA = { x: 462, y: 522 };                       // areia à direita do cais
  const VOLTA = 150e3;                                    // uma volta da sombra em volta da ilha
  const CX = 380, CY = 300, RX = 352, RY = 292;

  function sombraEm(t) {
    const a = (t / VOLTA) * Math.PI * 2;
    // a órbita varia um pouco de tamanho para não parecer um trilho
    const k = 1 + 0.05 * Math.sin(t / 41e3);
    return { x: CX + Math.cos(a) * RX * k, y: CY + Math.sin(a) * RY * k, lado: Math.sin(a) > 0 ? -1 : 1 };
  }
  let preta = null;
  function silhueta(c, x, y, lado, esc, alfa) {
    if (!preta) { const sp = D.sprite('cima'); preta = document.createElement('canvas'); preta.width = sp.width; preta.height = sp.height; const p = preta.getContext('2d'); p.drawImage(sp, 0, 0); p.globalCompositeOperation = 'source-in'; p.fillStyle = '#000'; p.fillRect(0, 0, sp.width, sp.height); }
    c.save(); c.globalAlpha = alfa; c.imageSmoothingEnabled = false; c.translate(Math.round(x), Math.round(y)); c.scale((lado < 0 ? -1 : 1) * esc, esc * 0.55);
    c.drawImage(preta, -24, -23);
    // olhos vermelhos piscando: dá para ver a sombra até de noite
    if (Math.sin(Date.now() / 700) > -0.7) { c.globalAlpha = 0.95; c.fillStyle = '#ff3a2a'; c.fillRect(13, -7, 1, 1); c.fillRect(15, -7, 1, 1); }
    c.restore();
  }

  G.hooks.push((objs, c, info) => {
    const t = info.t;
    if (t < POUSO - 90e3) {
      // sombra rondando o mar
      const s = sombraEm(t);
      objs.push({ y: -1e4, f: () => silhueta(c, s.x, s.y, s.lado, 1.6, info.night ? 0.5 : 0.32) });
      return;
    }
    if (t < POUSO) {
      // últimos 90 s: a sombra sai da órbita e vem em linha para a praia
      const f = (t - (POUSO - 90e3)) / 90e3, s = sombraEm(POUSO - 90e3);
      const x = s.x + (PRAIA.x - s.x) * f, y = s.y + (PRAIA.y + 6 - s.y) * f;
      objs.push({ y: -1e4, f: () => silhueta(c, x, y, PRAIA.x < s.x ? -1 : 1, 1.6 - f * 0.5, 0.32 + f * 0.1) });
      return;
    }
    const k = Math.min(1, (t - POUSO) / DESCIDA), e = 1 - Math.pow(1 - k, 3);
    const alt = (1 - e) * 120;                       // altura no céu (pixels acima da praia)
    const bate = Math.floor(info.sec * (k < 1 ? 5 : 0.8)) % 2;
    objs.push({ y: PRAIA.y - 1e4 * 0, f: () => {
      // sombra no chão, crescendo conforme ele desce
      c.save(); c.globalAlpha = 0.22 + 0.18 * e; c.fillStyle = '#000';
      const w = Math.round(14 + 22 * e); c.fillRect(PRAIA.x - w, PRAIA.y + 1, w * 2, 2); c.restore();
      if (k < 1) D.desenha(c, PRAIA.x, PRAIA.y - alt, bate ? 'cima' : 'baixo', -1, 1);
      else {
        const I = window.IlhaDragao, agora = Date.now(), mastiga = I && I.mastigaAte > agora, feliz = I && I.felizAte > agora;
        const resp = mastiga ? (Math.floor(agora / 110) % 2) - 1 : Math.round(Math.sin(info.sec * 1.4) * 0.6);
        D.desenha(c, PRAIA.x, PRAIA.y + resp, feliz && Math.floor(agora / 300) % 2 ? 'cima' : 'pousado', -1, 1);
        // corações quando come um peixe (Missão do Dragão)
        if (mastiga || feliz) for (let i = 0; i < (feliz ? 6 : 3); i++) {
          const u = ((agora / 1400) + i / (feliz ? 6 : 3)) % 1, hx = PRAIA.x - 16 + i * 5 - u * 4, hy = PRAIA.y - 34 - u * 18;
          c.fillStyle = `rgba(255,90,130,${(1 - u).toFixed(2)})`; c.fillRect(Math.round(hx), Math.round(hy), 1, 1); c.fillRect(Math.round(hx) + 2, Math.round(hy), 1, 1); c.fillRect(Math.round(hx), Math.round(hy) + 1, 3, 1); c.fillRect(Math.round(hx) + 1, Math.round(hy) + 2, 1, 1);
        }
        // fumaça saindo do focinho a cada ~9 s
        const ciclo = (info.sec % 9) / 9;
        if (ciclo < 0.3) for (let i = 0; i < 4; i++) {
          const u = ciclo / 0.3, px = PRAIA.x - 20 - i * 3 - u * 8, py = PRAIA.y - 33 - i * 2 - u * 6;
          c.fillStyle = `rgba(200,200,200,${(0.5 - u * 0.5).toFixed(2)})`; c.fillRect(Math.round(px), Math.round(py), 2, 2);
        }
      }
    } });
  });

  // avisos no painel ao vivo (para todos, jogando ou só assistindo)
  const F = () => window.IlhaFeed;
  let avisou = false, pousou = Date.now() >= POUSO;
  setTimeout(() => {
    if (!F()) return;
    if (Date.now() < POUSO && !avisou) { avisou = true; F().push({ k: 'chegada', html: '<b>Uma sombra enorme</b> sobrevoa o mar em volta da ilha...', dur: 25000 }); }
    else if (Date.now() < POUSO + 10 * 60e3) { pousou = true; F().push({ k: 'chegada', html: '<b>O DRAGÃO POUSOU NA PRAIA!</b> Vote no Ep. 4: A ou B', dur: 40000 }); }
    else if (Date.now() < POUSO + 6 * 3600e3) F().push({ k: 'chegada', html: '<b>O DRAGÃO</b> está na praia, ao lado do cais', dur: 20000 });
  }, 4000);
  setInterval(() => {
    if (!pousou && Date.now() >= POUSO) { pousou = true; if (F()) F().push({ k: 'chegada', html: '<b>O DRAGÃO POUSOU NA PRAIA!</b> Vote no Ep. 4: A ou B', dur: 40000 }); }
  }, 1000);
  window.IlhaDragao = { POUSO, PRAIA, mastigaAte: 0, felizAte: 0 };
})();
