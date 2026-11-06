/* A Grande Ilha — MISSÃO DO DRAGÃO (missão especial do Ep. 5).
   1. Werner conta a história da dragãozinha dele (conversa com páginas).
   2. Jester toca a canção que acalma dragões e dança (melodia de verdade, notas no ar).
   3. Pescar 5 peixes no cais (lançar, esperar, puxar na hora certa).
   4. Entregar os 5 peixes ao dragão na praia, um por um.
   Prêmio: carta única do Dragão (+5% de XP), conquista "Amigo do Dragão" (+150 XP).
   O progresso fica no perfil do jogador (perfil.dragao), então dá para fazer em dias diferentes. */
(function () {
  'use strict';
  const G = window.GrandeIlha, SP = window.IlhaSprites, K = window.IlhaComunidade, J = window.IlhaJogo;
  if (!G || !SP || !K || !J) return;
  const S = J.S, esc = K.esc;
  const PEIXES = 5, CAIS = G.LUG.cais;
  const PRAIA = () => (window.IlhaDragao ? window.IlhaDragao.PRAIA : { x: 462, y: 522 });
  const pousou = () => !window.IlhaDragao || Date.now() >= window.IlhaDragao.POUSO;
  const st = () => { const p = S.perfil; if (!p.dragao) p.dragao = { passo: 0, peixes: 0, dados: 0 }; return p.dragao; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const PASSOS = [
    { t: 'O CUIDADOR', d: 'Converse com o Werner e ouça a história dele.', dica: 'O Werner passa o dia no cais, perto do dragão.' },
    { t: 'A MELODIA', d: 'Encontre o Jester e dance a canção que acalma dragões.', dica: 'O Jester fica no cais ao meio-dia e no fim da tarde, e na taverna à noite.' },
    { t: 'PEIXE FRESCO', d: `Pesque ${PEIXES} peixes no cais.`, dica: 'Vá até a ponta do cais e toque em PESCAR.' },
    { t: 'A CONFIANÇA', d: `Entregue os ${PEIXES} peixes ao dragão, na praia.`, dica: 'Chegue perto do dragão e toque em ALIMENTAR.' }
  ];

  // ---------------------------------------------------------------- diálogo com páginas
  const dlg = document.createElement('div');
  dlg.className = 'dlg px'; dlg.hidden = true; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-live', 'polite');
  dlg.innerHTML = '<canvas width="24" height="30" aria-hidden="true"></canvas><div class="dlg-c"><b></b><p></p><div class="dlg-b"><button type="button" class="b-ouro">CONTINUAR ▶</button></div></div>';
  document.body.appendChild(dlg);
  let dlgFim = null, dlgPags = [], dlgI = 0, digita = null;
  function dialogo(id, pags, botaoFinal, fim) {
    const m = G.BY[id];
    const c = dlg.querySelector('canvas').getContext('2d'); c.clearRect(0, 0, 24, 30); SP.drawCharacter(c, 12, 27, m.visual, { t: 1, side: 1 });
    dlg.querySelector('b').textContent = m.nome.toUpperCase() + ' · ' + m.profissao.toUpperCase();
    dlgPags = pags; dlgI = 0; dlgFim = fim; dlg.dataset.final = botaoFinal; dlg.hidden = false; pagina();
  }
  function pagina() {
    const p = dlg.querySelector('p'), btn = dlg.querySelector('button'), txt = dlgPags[dlgI];
    clearInterval(digita); p.textContent = ''; let k = 0;
    btn.textContent = dlgI === dlgPags.length - 1 ? dlg.dataset.final : 'CONTINUAR ▶';
    digita = setInterval(() => { k += 2; p.textContent = txt.slice(0, k); if (k >= txt.length) clearInterval(digita); }, 22);
    setTimeout(() => btn.focus({ preventScroll: true }), 30);
  }
  dlg.querySelector('button').addEventListener('click', () => {
    const p = dlg.querySelector('p');
    if (p.textContent.length < dlgPags[dlgI].length) { clearInterval(digita); p.textContent = dlgPags[dlgI]; return; }
    if (dlgI < dlgPags.length - 1) { dlgI++; pagina(); return; }
    dlg.hidden = true; const f = dlgFim; dlgFim = null; if (f) f();
  });

  // ---------------------------------------------------------------- música (flauta) e dança do Jester
  let audio = null;
  function melodia(dur) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const N = [523, 587, 659, 784, 880, 784, 659, 587, 523, 659, 784, 1047, 880, 784, 659, 523, 587, 659, 587, 523];
      const passo = dur / N.length, t0 = audio.currentTime + 0.05;
      N.forEach((f, i) => {
        const o = audio.createOscillator(), v = audio.createOscillator(), vg = audio.createGain(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = f; v.frequency.value = 5.5; vg.gain.value = f * 0.012; v.connect(vg); vg.connect(o.frequency);
        const a = t0 + i * passo; g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(0.11, a + 0.06); g.gain.linearRampToValueAtTime(0.07, a + passo * 0.7); g.gain.linearRampToValueAtTime(0, a + passo * 0.98);
        o.connect(g); g.connect(audio.destination); o.start(a); v.start(a); o.stop(a + passo); v.stop(a + passo);
      });
    } catch (e) { /* sem som, a dança continua */ }
  }
  let danca = null; // { ate, x, y }
  function dancar() {
    const m = G.BY.jester, p = G.posAt(m, Date.now()); if (!p) return;
    const DUR = 9;
    danca = { ate: Date.now() + DUR * 1000, x: p.x, y: p.y, ini: Date.now() };
    J.ocultos.set('jester', 'danca'); G.jogados.set('jester', 'danca');
    melodia(DUR);
    S.eu.emote = { txt: '♪ dançando ♫', ate: Date.now() + DUR * 1000 };
    setTimeout(() => {
      danca = null; J.ocultos.delete('jester'); G.jogados.delete('jester');
      S.falas = S.falas.filter(f => f.quem !== 'jester');
      S.falas.push({ quem: 'jester', txt: 'Agora ele vai confiar em você!', ate: Date.now() + 5000 });
      avancaPasso(1);
    }, DUR * 1000);
  }

  // ---------------------------------------------------------------- pesca
  let pesca = null; // { fase: 'lanca'|'espera'|'fisgou'|'puxa'|'escapou', t0, ate, boia:{x,y}, x, y }
  function aguaPerto() {
    const e = S.eu; if (!e || dist(e, { x: CAIS.x, y: CAIS.sy }) > 34) return null;
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) for (let r = 12; r <= 30; r += 3) { const x = e.x + dx * r, y = e.y + dy * r; if (!G.andavel(x, y)) return { x, y: y + 2 }; }
    return null;
  }
  function acaoPesca() {
    const agora = Date.now();
    if (!pesca) {
      const b = aguaPerto(); if (!b) return;
      pesca = { fase: 'lanca', t0: agora, x: S.eu.x, y: S.eu.y, boia: b, espera: 1800 + Math.random() * 3200 };
      S.eu.s = b.x < S.eu.x ? -1 : 1; atualiza(); return;
    }
    if (pesca.fase === 'fisgou') { pesca.fase = 'puxa'; pesca.t0 = agora; atualiza(); return; }
  }
  function tickPesca() {
    if (!pesca) return;
    const agora = Date.now(), e = S.eu;
    if (Math.hypot(e.tx - pesca.x, e.ty - pesca.y) > 2) { pesca = null; atualiza(); return; } // andou: recolheu a linha
    const k = agora - pesca.t0;
    if (pesca.fase === 'lanca' && k > 600) { pesca.fase = 'espera'; pesca.t0 = agora; atualiza(); }
    else if (pesca.fase === 'espera' && k > pesca.espera) { pesca.fase = 'fisgou'; pesca.t0 = agora; atualiza(); }
    else if (pesca.fase === 'fisgou' && k > 1300) { pesca.fase = 'escapou'; pesca.t0 = agora; S.eu.emote = { txt: 'Escapou...', ate: agora + 1800 }; atualiza(); }
    else if (pesca.fase === 'escapou' && k > 700) { pesca = null; atualiza(); }
    else if (pesca.fase === 'puxa' && k > 800) {
      const s = st(); s.peixes = Math.min(99, (s.peixes || 0) + 1); J.salvar();
      S.eu.emote = { txt: `+1 peixe! (${s.peixes})`, ate: agora + 2200 };
      if (s.passo === 2 && s.peixes >= PEIXES) avancaPasso(2);
      pesca = null; atualiza();
    }
  }

  // ---------------------------------------------------------------- alimentar o dragão
  let voo = null; // peixe voando até a boca do dragão
  function alimentar() {
    const s = st(); if (s.passo !== 3 || voo || (s.peixes || 0) < 1 || !pertoDragao()) return;
    const P = PRAIA();
    voo = { t0: Date.now(), de: { x: S.eu.x, y: S.eu.y - 10 }, para: { x: P.x - 15, y: P.y - 27 } };
    S.eu.s = P.x < S.eu.x ? -1 : 1;
    setTimeout(() => {
      voo = null; s.peixes--; s.dados = (s.dados || 0) + 1; J.salvar();
      if (window.IlhaDragao) window.IlhaDragao.mastigaAte = Date.now() + 1400;
      S.eu.emote = { txt: s.dados >= PEIXES ? 'Ele confia em você!' : `Ele gostou! (${s.dados}/${PEIXES})`, ate: Date.now() + 2200 };
      if (s.dados >= PEIXES) premio();
      atualiza();
    }, 750);
    atualiza();
  }
  const pertoDragao = () => pousou() && S.eu && dist(S.eu, PRAIA()) < 40;
  function premio() {
    const s = st(); s.passo = 4; J.salvar();
    if (window.IlhaDragao) window.IlhaDragao.felizAte = Date.now() + 6000;
    setTimeout(() => {
      J.ganhaCarta('esp:dragao', { c: 'dragao' });
      J.revisa();
      J.anuncia({ titulo: 'CARTA ÚNICA!', texto: 'Você ganhou a confiança do dragão. A carta mais forte da ilha agora é sua.', acao: 'VER', fn: () => J.abrirCarta('esp:dragao'), dur: 9000 });
      atualiza();
    }, 900);
  }

  // ---------------------------------------------------------------- passos e conversas
  function avancaPasso(de) {
    const s = st(); if (s.passo !== de) return;
    s.passo = de + 1; J.salvar();
    if (s.passo === 3 && (s.peixes || 0) < PEIXES) s.passo = 2; // ainda faltam peixes
    if (s.passo === 2 && (s.peixes || 0) >= PEIXES) s.passo = 3;
    const prox = PASSOS[s.passo];
    if (prox) J.anuncia({ titulo: 'MISSÃO DO DRAGÃO', texto: `${de + 1}/4 feito! Agora: ${prox.d}`, acao: 'VER', fn: abrir, dur: 6500 });
    atualiza();
  }
  J.aoConversar.push(m => {
    if (!S.on) return false;
    const s = st();
    if (m.id === 'werner' && s.passo === 0) {
      dialogo('werner', [
        'Quando eu era criança, meu pai achou um ovo vermelho entre as pedras de um vulcão apagado. Ninguém acreditou que ia chocar.',
        'Chocou. Era uma dragãozinha do tamanho de um gato. Dei o nome de Brasa. Ela dormia no meu colo e queimava todos os meus cobertores.',
        'Um dia vieram caçadores com correntes. A Brasa me empurrou para dentro de uma caverna e voou para longe, para que eles seguissem ela, e não eu.',
        'Nunca mais a vi. Desde então eu cuido de todo dragão que encontro. Esse aqui da praia tem o mesmo olhar dela...',
        'Ele ainda tem medo de todo mundo. Procure o Jester: tem uma canção que acalma dragões. Me ajuda a ganhar a confiança dele?'
      ], 'VOU AJUDAR', () => avancaPasso(0));
      return true;
    }
    if (m.id === 'jester' && s.passo === 1 && !danca) {
      dialogo('jester', [
        'Uma canção para acalmar um dragão? Essa eu sei de cor! Minha avó tocava para os dragões das montanhas.',
        'Mas não basta tocar: dragão só confia em quem dança junto. Pronto? Um, dois, três...'
      ], '♪ DANÇAR ♪', dancar);
      return true;
    }
    if (m.id === 'werner' && s.passo >= 1 && s.passo < 4) {
      S.falas = S.falas.filter(f => f.quem !== 'werner');
      S.falas.push({ quem: 'werner', txt: s.passo === 1 ? 'Procure o Jester e a canção dele.' : s.passo === 2 ? `Ele adora peixe. Traga ${PEIXES}!` : 'Agora entregue os peixes a ele.', ate: Date.now() + 4500 });
      return true;
    }
    return false;
  });

  // ---------------------------------------------------------------- botões na barra do viajante
  let bM = null, bP = null, bA = null;
  function montaBotoes() {
    const barra = document.querySelector('.jogo-barra'); if (!barra || bM) return;
    bM = document.createElement('button'); bM.type = 'button'; bM.className = 'jb jb-dragao'; bM.innerHTML = '<i>🐉</i><span>0/4</span>'; bM.setAttribute('aria-label', 'Missão do Dragão'); bM.onclick = abrir;
    bP = document.createElement('button'); bP.type = 'button'; bP.className = 'jb jb-acao'; bP.hidden = true; bP.onclick = acaoPesca;
    bA = document.createElement('button'); bA.type = 'button'; bA.className = 'jb jb-acao'; bA.hidden = true; bA.onclick = alimentar;
    const ref = barra.querySelector('#jb-falar'); barra.insertBefore(bM, ref); barra.insertBefore(bP, ref); barra.insertBefore(bA, ref);
  }
  function atualiza() {
    montaBotoes(); if (!bM) return;
    const s = S.on ? st() : null;
    bM.hidden = !S.on;
    if (!s) { bP.hidden = bA.hidden = true; return; }
    bM.querySelector('span').textContent = s.passo >= 4 ? '★' : `${s.passo}/4`;
    // pescar
    const pode = !!aguaPerto() || !!pesca;
    bP.hidden = !pode;
    if (pode) {
      const f = pesca ? pesca.fase : '';
      bP.innerHTML = f === 'fisgou' ? '<i>❗</i><span>PUXAR!</span>' : f ? `<i>🎣</i><span>${f === 'escapou' ? 'ESCAPOU' : f === 'puxa' ? 'PEGOU!' : 'ESPERE...'}</span>` : `<i>🎣</i><span>PESCAR · ${s.peixes || 0}</span>`;
      bP.classList.toggle('pulsa', f === 'fisgou'); bP.disabled = !!f && f !== 'fisgou';
    }
    // alimentar
    const al = s.passo === 3 && pertoDragao();
    bA.hidden = !al;
    if (al) { bA.innerHTML = `<i>🐟</i><span>ALIMENTAR · ${s.dados || 0}/${PEIXES}</span>`; bA.disabled = !!voo || (s.peixes || 0) < 1; }
  }
  setInterval(() => { if (S.on) { tickPesca(); atualiza(); } else if (bM) { bM.hidden = bP.hidden = bA.hidden = true; } }, 120);
  window.addEventListener('keydown', e => {
    if (!S.on || /INPUT|TEXTAREA/.test(e.target.tagName) || !dlg.hidden) return;
    if (e.code === 'Space' || e.code === 'KeyE') { if (bP && !bP.hidden && !bP.disabled) { e.preventDefault(); acaoPesca(); } else if (bA && !bA.hidden && !bA.disabled) { e.preventDefault(); alimentar(); } }
  });

  // ---------------------------------------------------------------- janela da missão e bloco na aba MISSÕES
  function passosHtml(s) {
    return PASSOS.map((p, i) => {
      const cls = s.passo > i ? 'ok' : s.passo === i ? 'agora' : '';
      let extra = '';
      if (i === 2) extra = ` <em>(${Math.min(PEIXES, s.peixes || 0)}/${PEIXES} peixes)</em>`;
      if (i === 3 && s.passo === 3) extra = ` <em>(${s.dados || 0}/${PEIXES} entregues)</em>`;
      return `<li class="md-passo ${cls}"><i>${s.passo > i ? '✓' : i + 1}</i><div><b>${i + 1} · ${p.t}</b><span>${esc(p.d)}${extra}</span>${s.passo === i ? `<small>${esc(p.dica)}</small>` : ''}</div></li>`;
    }).join('');
  }
  function abrir() {
    if (!S.on) { J.anuncia({ titulo: 'MISSÃO DO DRAGÃO', texto: 'Toque em JOGAR e entre com o seu @ para fazer a missão.', dur: 5000 }); return; }
    const s = st(), feito = s.passo >= 4;
    K.abrir('MISSÃO DO DRAGÃO', `<p>${feito ? 'Você ganhou a confiança do dragão! A carta única é sua.' : 'O dragão ainda tem medo de todo mundo. Ganhe a confiança dele e leve a carta mais rara da ilha.'}</p>
      <ol class="md-passos">${passosHtml(s)}</ol>
      <div class="md-barra"><s style="width:${Math.min(100, s.passo / 4 * 100)}%"></s></div>
      <div class="md-premio"><span aria-hidden="true">🐉</span><div><b>RECOMPENSA</b>Carta única do Dragão (+5% de XP nas missões) · conquista "Amigo do Dragão" (+150 XP)</div></div>
      <div class="m-botoes" style="margin-top:12px">${feito ? '<button type="button" class="b-ouro" id="md-carta">VER A CARTA</button>' : ''}<button type="button" class="b-linha" id="md-ir">${s.passo === 3 ? 'IR ATÉ O DRAGÃO' : s.passo === 2 ? 'IR AO CAIS' : 'ACHAR ' + (s.passo === 0 ? 'O WERNER' : 'O JESTER')}</button></div>`, el => {
      const c = el.querySelector('#md-carta'); if (c) c.onclick = () => J.abrirCarta('esp:dragao');
      const ir = el.querySelector('#md-ir'); if (ir) ir.onclick = () => {
        K.fechar(); S.camLivre = true;
        const alvo = s.passo === 3 ? PRAIA() : s.passo === 2 ? { x: CAIS.x, y: CAIS.sy } : G.posAt(G.BY[s.passo === 0 ? 'werner' : 'jester'], Date.now());
        if (alvo) { G.pararSeguir(); G.cam.x = alvo.x; G.cam.y = alvo.y - 8; if (G.cam.s < 4) G.cam.s = 4; }
      };
    });
  }
  function bloco(corpo) {
    if (!S.on) return;
    const s = st(), d = document.createElement('div'); d.className = 'md-bloco';
    d.innerHTML = `<h3>MISSÃO ESPECIAL · O DRAGÃO</h3><p>${s.passo >= 4 ? 'Concluída! A carta única do dragão é sua.' : `Passo ${s.passo + 1} de 4: ${esc(PASSOS[s.passo].d)}`}</p><button type="button" class="b-ouro">VER A MISSÃO</button>`;
    d.querySelector('button').onclick = abrir; corpo.prepend(d);
  }

  // ---------------------------------------------------------------- desenho no mapa
  const fx = (c, x, y, w, h, cor) => { c.fillStyle = cor; c.fillRect(Math.round(x), Math.round(y), w, h); };
  function peixe(c, x, y, lado) { fx(c, x - 2, y, 4, 2, '#9ab8d0'); fx(c, x - 2, y, 4, 1, '#c8dcea'); fx(c, x + (lado > 0 ? -3 : 2), y, 1, 2, '#6a8aa8'); fx(c, x + (lado > 0 ? 1 : -2), y, 1, 1, '#1a1a2a'); }
  G.hooks.push((objs, c, info) => {
    const agora = Date.now();
    // Jester dançando
    if (danca && agora < danca.ate) {
      const m = G.BY.jester, k = (agora - danca.ini) / 1000, pulo = Math.abs(Math.sin(k * 6)) * 3, lado = Math.floor(k / 0.4) % 2 ? 1 : -1;
      objs.push({ y: danca.y, f: () => {
        SP.drawCharacter(c, danca.x, danca.y - pulo, m.visual, { t: info.sec * 2, walking: true, side: lado });
        for (let i = 0; i < 4; i++) { const u = (k * 0.7 + i / 4) % 1; fx(c, danca.x - 6 + i * 4 + Math.sin(u * 6) * 3, danca.y - 20 - u * 16, 1, 2, `rgba(255,208,70,${(1 - u).toFixed(2)})`); }
      } });
    }
    if (!S.on || !S.eu) return;
    const e = S.eu;
    // vara, linha, boia e peixe
    if (pesca) {
      const lado = pesca.boia.x < e.x ? -1 : 1, mx = e.x + lado * 4, my = e.y - 10, px2 = e.x + lado * 9, py2 = e.y - 17;
      const k = Math.min(1, (agora - pesca.t0) / 600);
      let bx = pesca.boia.x, by = pesca.boia.y;
      if (pesca.fase === 'lanca') { bx = px2 + (pesca.boia.x - px2) * k; by = py2 + (pesca.boia.y - py2) * k - Math.sin(k * Math.PI) * 10; }
      if (pesca.fase === 'espera') by += Math.sin(agora / 300) * 0.6;
      if (pesca.fase === 'fisgou') by += (Math.floor(agora / 90) % 2) * 1.5;
      objs.push({ y: e.y + 0.5, f: () => {
        c.strokeStyle = '#6a4428'; c.lineWidth = 1; c.beginPath(); c.moveTo(mx, my); c.lineTo(px2, py2); c.stroke();
        if (pesca.fase !== 'puxa') {
          c.strokeStyle = 'rgba(230,230,230,0.8)'; c.beginPath(); c.moveTo(px2, py2); c.quadraticCurveTo((px2 + bx) / 2, Math.max(py2, by) + 4, bx, by); c.stroke();
          fx(c, bx - 1, by - 1, 2, 1, '#e8483a'); fx(c, bx - 1, by, 2, 1, '#f2f2f2');
          if (pesca.fase === 'fisgou') for (let i = 0; i < 3; i++) fx(c, bx - 3 + i * 3, by + 2, 1, 1, 'rgba(200,230,255,0.9)');
        } else {
          const u = Math.min(1, (agora - pesca.t0) / 700), fx2 = pesca.boia.x + (e.x - pesca.boia.x) * u, fy = pesca.boia.y + (e.y - 14 - pesca.boia.y) * u - Math.sin(u * Math.PI) * 18;
          c.strokeStyle = 'rgba(230,230,230,0.8)'; c.beginPath(); c.moveTo(px2, py2); c.lineTo(fx2, fy); c.stroke();
          peixe(c, fx2, fy, lado); if (u < 0.5) for (let i = 0; i < 4; i++) fx(c, pesca.boia.x - 3 + i * 2, pesca.boia.y - i % 2, 1, 1, '#c8e4ff');
        }
      } });
    }
    // peixe voando para o dragão
    if (voo) {
      const u = Math.min(1, (agora - voo.t0) / 700), x = voo.de.x + (voo.para.x - voo.de.x) * u, y = voo.de.y + (voo.para.y - voo.de.y) * u - Math.sin(u * Math.PI) * 16;
      objs.push({ y: 9999, f: () => peixe(c, x, y, voo.para.x < voo.de.x ? -1 : 1) });
    }
  });
  // marcadores de missão (na tela, por cima de tudo)
  window.IlhaTexto.push((ctx, scr, fs, info) => {
    if (!S.on || !S.perfil) return;
    const s = st(), t = info.t, sobe = Math.round(Math.sin(t / 250) * 2);
    const marca = (x, y, txt, cor) => {
      const [sx, sy] = scr(x, y); ctx.font = `bold ${fs + 4}px Silkscreen, monospace`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,12,16,.9)';
      ctx.strokeText(txt, sx, sy + sobe); ctx.fillStyle = cor; ctx.fillText(txt, sx, sy + sobe);
    };
    if (s.passo === 0 || s.passo === 1) { const m = G.BY[s.passo === 0 ? 'werner' : 'jester'], p = m && G.posAt(m, t); if (p && !p.hidden && !(danca && s.passo === 1)) marca(p.x, p.y - 30, '!', '#ffd046'); }
    if (s.passo === 2) marca(CAIS.x, CAIS.sy - 22, '🎣', '#ffd046');
    if (s.passo === 3 && pousou()) { const P = PRAIA(); marca(P.x - 4, P.y - 44, '♥', '#ff6a8a'); }
  });

  window.IlhaMissaoDragao = { abrir, bloco, atualiza };
})();
