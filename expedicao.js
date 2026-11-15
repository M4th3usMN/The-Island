/* A Grande Ilha — EXPEDIÇÕES (ilhas de tier, inspiradas no sistema de zonas e tiers de MMOs sandbox).
   No cais, o capitão Bordon leva o jogador (pago em TIC, cobrado no servidor) para uma ilha distante.
   Lá o jogador anda em tempo real, luta com monstros (eles atacam depois de um "preparo" que dá para
   esquivar), perde vida e coleta recursos que só existem nessas ilhas, cada um com o seu minijogo.
   Tudo o que for coletado vai numa bolsa: só entra na mochila quando o jogador volta pelo barco.
   Se a vida zerar: na T1 ele volta com tudo; na T2 perde metade da bolsa.
   Com os materiais novos, os moradores fabricam espadas, escudos, poções e a casa de pedra e carvalho. */
(function () {
  'use strict';
  const G = window.GrandeIlha, SP = window.IlhaSprites, K = window.IlhaComunidade, J = window.IlhaJogo, O = window.IlhaOficios;
  if (!G || !SP || !K || !J || !O) return;
  const S = J.S, esc = K.esc;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const nivel = xp => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 150));

  // ---------------------------------------------------------------- itens e receitas novos
  Object.assign(O.ITENS, {
    cobre: { n: 'Cobre', i: '🟠' }, pinho: { n: 'Pinho', i: '🌲' }, ferro: { n: 'Ferro', i: '⚙️' }, carvalho: { n: 'Carvalho', i: '🌳' },
    couro: { n: 'Couro', i: '🟫' }, seda: { n: 'Seda de aranha', i: '🕸️' },
    espada_cobre: { n: 'Espada de cobre', i: '⚔️' }, espada_ferro: { n: 'Espada de ferro', i: '🔪' },
    escudo_pinho: { n: 'Escudo de pinho', i: '🛡️' }, escudo_carvalho: { n: 'Escudo de carvalho', i: '🔰' }, pocao: { n: 'Poção de vida', i: '🍷' }
  });
  O.RECEITAS.push(
    { item: 'espada_cobre', quem: 'kasseki', onde: 'forja', verbo: 'FORJAR', pede: { cobre: 3, pinho: 1 }, xp: 30, fala: 'Cobre da Ilhota das Gaivotas? Me traz 3 e um pinho para o cabo que eu te faço uma espada.', jogo: { tipo: 'faixa', golpes: 3, vel: 1.6, larg: 0.22, txt: 'Bata no cobre 3 vezes quando o marcador passar na faixa' } },
    { item: 'espada_ferro', quem: 'kasseki', onde: 'forja', verbo: 'FORJAR', pede: { ferro: 3, carvalho: 1, couro: 1 }, xp: 50, fala: 'Ferro do Bosque Sombrio, carvalho para o cabo e couro para a empunhadura.', jogo: { tipo: 'faixa', golpes: 4, vel: 1.8, larg: 0.2, txt: 'Ferro é duro: 4 golpes certeiros na faixa' } },
    { item: 'escudo_pinho', quem: 'igor', onde: 'oficina', verbo: 'MONTAR', pede: { pinho: 4, cobre: 1 }, xp: 25, fala: '4 pinhos e um aro de cobre: escudo leve para as ilhas.', jogo: { tipo: 'faixa', golpes: 3, vel: 1.3, larg: 0.24, txt: 'Pregue as tábuas do escudo na faixa' } },
    { item: 'escudo_carvalho', quem: 'igor', onde: 'oficina', verbo: 'MONTAR', pede: { carvalho: 4, ferro: 2, couro: 1 }, xp: 45, fala: 'Carvalho com reforço de ferro aguenta mordida de lobo.', jogo: { tipo: 'faixa', golpes: 4, vel: 1.5, larg: 0.2, txt: 'Encaixe as placas de ferro na faixa' } },
    { item: 'pocao', quem: 'daniel', onde: 'laboratorio', verbo: 'PREPARAR', pede: { erva: 2, seda: 1 }, xp: 20, fala: 'A seda das aranhas do bosque segura a cura no corpo. 2 ervas e 1 seda.', jogo: { tipo: 'cores', golpes: 3, txt: 'Misture só quando o caldeirão ficar VERDE' } }
  );
  const ARMAS = [['espada_ferro', 15], ['espada_cobre', 10], ['lamina_enc', 8], ['lamina', 6]];
  const ESCUDOS = [['escudo_carvalho', 0.35], ['escudo_pinho', 0.2]];
  const COMIDAS = [['pocao', 70], ['remedio', 45], ['pao', 20]];

  // ---------------------------------------------------------------- as ilhas
  const ILHAS = {
    t1: { id: 't1', tier: 1, nome: 'Ilhota das Gaivotas', tic: 5, lv: 1, chao: ['#5f9a4a', '#6aa652', '#57904a'], areia: '#d8c48a', morte: 'nada',
      desc: 'Praias e capim baixo. Bom para começar.', recursos: ['cobre', 'pinho'], monstros: { caranguejo: 6, javali: 4 } },
    t2: { id: 't2', tier: 2, nome: 'Bosque Sombrio', tic: 15, lv: 3, chao: ['#2f5636', '#365f3c', '#2a4c30'], areia: '#a89a6a', morte: 'metade',
      desc: 'Mata fechada, lobos em bando e aranhas nas árvores.', recursos: ['ferro', 'carvalho'], monstros: { lobo: 6, aranha: 5 } }
  };
  const RECURSO = {
    cobre: { tipo: 'rocha', cor: '#c97a3a', jogo: { tipo: 'reacao', golpes: 2, janela: 850 }, verbo: 'MINERAR', xp: 4 },
    pinho: { tipo: 'pinheiro', cor: '#2f6a3a', jogo: { tipo: 'faixa', golpes: 3, vel: 1.3, larg: 0.26 }, verbo: 'CORTAR', xp: 4 },
    ferro: { tipo: 'rocha', cor: '#8aa0b8', jogo: { tipo: 'reacao', golpes: 3, janela: 650 }, verbo: 'MINERAR', xp: 7 },
    carvalho: { tipo: 'carvalho', cor: '#3f6a2a', jogo: { tipo: 'faixa', golpes: 3, vel: 1.6, larg: 0.2 }, verbo: 'CORTAR', xp: 7 }
  };
  const MONSTRO = {
    caranguejo: { nome: 'Caranguejo', hp: 18, dano: 4, vel: 14, aggro: 40, alcance: 10, cd: 1400, prep: 480, xp: 8, drop: ['cobre', 0.5, 1] },
    javali: { nome: 'Javali', hp: 30, dano: 7, vel: 22, aggro: 55, alcance: 11, cd: 1600, prep: 520, xp: 14, drop: ['couro', 0.6, 1] },
    lobo: { nome: 'Lobo', hp: 40, dano: 9, vel: 30, aggro: 70, alcance: 11, cd: 1150, prep: 400, xp: 20, drop: ['couro', 0.7, 2] },
    aranha: { nome: 'Aranha', hp: 32, dano: 8, vel: 24, aggro: 60, alcance: 12, cd: 1250, prep: 430, xp: 18, drop: ['seda', 0.7, 1] }
  };
  const DURACAO = 10 * 60e3, BOLSA_MAX = 30, W = 320, H = 320, DOCA = { x: 160, y: 292 };

  // ---------------------------------------------------------------- vida
  const attr = () => (S.perfil && S.perfil.attr) || {};
  const hpMax = () => 100 + Math.min(10, attr().for | 0) * 5;
  function vida() {
    const p = S.perfil; if (!p) return 0;
    if (typeof p.hp !== 'number') { p.hp = hpMax(); p.hpT = Date.now(); }
    if (!X) { // na ilha principal a vida volta devagar: 1 ponto a cada 20 s
      const n = Math.floor((Date.now() - (p.hpT || Date.now())) / 20e3);
      if (n > 0) { p.hp = Math.min(hpMax(), p.hp + n); p.hpT = (p.hpT || Date.now()) + n * 20e3; }
      if (p.hp >= hpMax()) p.hpT = Date.now();
    }
    return p.hp = clamp(p.hp, 0, hpMax());
  }
  const inv = () => { const p = S.perfil; if (!p.inv) p.inv = {}; return p.inv; };
  const arma = () => { const v = inv(); const a = ARMAS.find(([k]) => v[k] > 0); return a ? { id: a[0], dano: a[1] } : { id: null, dano: 3 }; };
  const escudo = () => { const v = inv(); const a = ESCUDOS.find(([k]) => v[k] > 0); return a ? { id: a[0], def: a[1] } : { id: null, def: 0 }; };
  function comer() {
    const v = inv(), c = COMIDAS.find(([k]) => v[k] > 0); if (!c) return false;
    if (vida() >= hpMax()) return false;
    v[c[0]]--; S.perfil.hp = Math.min(hpMax(), S.perfil.hp + c[1]); J.salvar();
    if (X) numero(X.eu.x, X.eu.y - 18, '+' + c[1], '#4ac07a');
    return c;
  }

  // ---------------------------------------------------------------- mapa da ilha (gerado pela semente do tier)
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function geraIlha(def) {
    const r = rng(def.tier * 7919 + 13), ondas = Array.from({ length: 5 }, () => [r() * 6, 0.05 + r() * 0.08]);
    const raio = a => 128 + ondas.reduce((s, [f, k], i) => s + Math.sin(a * (i + 2) + f) * 128 * k / (i + 1), 0);
    const terra = (x, y) => { const dx = x - 160, dy = y - 156; return Math.hypot(dx, dy) < raio(Math.atan2(dy, dx)) || (Math.abs(x - DOCA.x) < 4 && y > 270 && y < 300); };
    const borda = (x, y) => { const dx = x - 160, dy = y - 156; return Math.hypot(dx, dy) > raio(Math.atan2(dy, dx)) - 9; };
    // chão desenhado uma vez só
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.fillStyle = '#1d3d5c'; c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!terra(x, y)) { if (r() < 0.01) { c.fillStyle = '#2a5276'; c.fillRect(x, y, 2, 1); } continue; }
      const n = (Math.sin(x * 0.11) + Math.cos(y * 0.13) + Math.sin((x + y) * 0.05)) / 3;
      c.fillStyle = borda(x, y) ? def.areia : def.chao[n > 0.25 ? 1 : n < -0.25 ? 2 : 0]; c.fillRect(x, y, 1, 1);
    }
    c.fillStyle = '#6a4a2a'; c.fillRect(DOCA.x - 3, 270, 7, 30); c.fillStyle = '#8a643a'; for (let y = 271; y < 300; y += 3) c.fillRect(DOCA.x - 3, y, 7, 1);
    // nós de recurso e enfeites, longe da doca
    const livre = (x, y, l, d) => terra(x, y) && !borda(x, y) && Math.hypot(x - DOCA.x, y - 262) > 30 && l.every(o => Math.hypot(o.x - x, o.y - y) > d);
    const nos = [], enfeites = [];
    def.recursos.forEach(k => { let n = 0, t = 0; while (n < 9 && t++ < 900) { const x = 20 + r() * 280, y = 20 + r() * 260; if (livre(x, y, nos, 22)) { nos.push({ k, x, y, usos: 3, volta: 0 }); n++; } } });
    for (let t = 0; t < 600 && enfeites.length < 60; t++) { const x = 10 + r() * 300, y = 10 + r() * 280; if (livre(x, y, nos.concat(enfeites), 10)) enfeites.push({ x, y, k: r() < 0.6 ? 'mato' : 'pedrinha', v: r() }); }
    return { def, chao: cv, terra, borda, nos, enfeites, r };
  }

  // ---------------------------------------------------------------- estado da expedição
  let X = null; // null = na ilha principal
  const ov = document.createElement('div'); ov.id = 'expedicao'; ov.hidden = true; ov.className = 'px';
  ov.innerHTML = `<canvas></canvas>
    <div class="ex-hud"><b class="ex-nome"></b><span class="ex-tempo"></span><div class="ex-vida"><s></s><em></em></div><span class="ex-bolsa"></span></div>
    <div class="ex-aviso" hidden></div>
    <div class="ex-bts"><button type="button" class="ex-b ex-comer"><i>🍞</i><span>COMER</span></button><button type="button" class="ex-b ex-coletar" hidden><i>⛏️</i><span>COLETAR</span></button><button type="button" class="ex-b ex-voltar" hidden><i>⛵</i><span>VOLTAR</span></button><button type="button" class="ex-b ex-atacar"><i>⚔️</i><span>ATACAR</span></button></div>
    <div class="ex-dica">Mexa: setas/WASD ou arraste o dedo · Atacar: Espaço · Coletar: E · Comer: Q</div>`;
  document.body.appendChild(ov);
  const cv = ov.querySelector('canvas'), ctx = cv.getContext('2d');
  const css = document.createElement('style');
  css.textContent = `#expedicao{position:fixed;inset:0;z-index:60;background:#0b1626;touch-action:none;user-select:none;-webkit-user-select:none}
  #expedicao canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}
  .ex-hud{position:absolute;left:10px;right:10px;top:10px;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;background:rgba(17,26,34,.88);border:3px solid #2c3b38;padding:8px 10px;color:#f1ead8;font-size:12px}
  .ex-nome{font-family:Silkscreen,monospace;color:#ffd046;font-size:13px}.ex-tempo{font-family:Silkscreen,monospace;color:#a9b3a6}
  .ex-vida{position:relative;flex:1;min-width:120px;height:14px;background:#3a1010;border:2px solid #000}.ex-vida s{position:absolute;inset:0;right:auto;background:#c8433a;text-decoration:none}
  .ex-vida em{position:absolute;inset:0;text-align:center;font:9px/10px Silkscreen,monospace;color:#fff;font-style:normal}.ex-bolsa{color:#d3a55a}
  .ex-aviso{position:absolute;left:50%;top:76px;transform:translateX(-50%);background:#111a22;border:3px solid #ffd046;color:#f1ead8;padding:8px 12px;font-size:13px;max-width:86vw;text-align:center}
  .ex-bts{position:absolute;right:10px;bottom:14px;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
  .ex-b{display:flex;align-items:center;gap:6px;background:#111a22;border:3px solid #2c3b38;color:#f1ead8;font:11px Silkscreen,monospace;padding:10px 12px;min-width:110px}
  .ex-b i{font-style:normal;font-size:18px}.ex-atacar{border-color:#c8433a;padding:16px 14px;font-size:13px}.ex-b.pulsa{border-color:#ffd046}
  .ex-dica{position:absolute;left:10px;bottom:10px;max-width:46vw;color:#a9b3a6;font-size:11px;background:rgba(11,22,38,.7);padding:4px 6px}
  @media (max-width:700px){.ex-dica{display:none}}`;
  document.head.appendChild(css);
  const $ = s => ov.querySelector(s);

  function embarca(def) {
    const mapa = geraIlha(def), r = mapa.r;
    const monstros = [];
    Object.entries(def.monstros).forEach(([k, n]) => { for (let i = 0; i < n; i++) monstros.push(novoMonstro(mapa, k)); });
    X = { def, mapa, monstros, t0: Date.now(), fim: Date.now() + DURACAO, bolsa: {}, eu: { x: DOCA.x, y: 262, side: 1, dir: 'up', atk: 0, inv: 0, anda: false },
      nums: [], jogo: null, abates: 0, avisou: false, golpes: [] };
    S.eu.emote = { txt: '⛵ Expedição!', ate: Date.now() + 4000 };
    ov.hidden = false; resize(); aviso(`${def.nome} · Tier ${def.tier}. O Bordon espera no cais por 10 minutos. ${def.morte === 'nada' ? 'Aqui, se cair, você volta com tudo.' : 'Cuidado: se cair, perde metade da bolsa.'}`, 6000);
    J.salvar(); requestAnimationFrame(loop);
  }
  function novoMonstro(mapa, k) {
    const r = mapa.r; let x, y, t = 0;
    do { x = 20 + r() * 280; y = 20 + r() * 250; t++; } while ((!mapa.terra(x, y) || mapa.borda(x, y) || Math.hypot(x - DOCA.x, y - 262) < 70 || (X && dist({ x, y }, X.eu) < 80)) && t < 400);
    const d = MONSTRO[k]; return { k, d, x, y, sx: x, sy: y, hp: d.hp, est: 'vaga', alvo: null, prox: 0, prepAte: 0, cdAte: 0, flash: 0, side: 1, morto: 0 };
  }
  function volta(motivo) {
    if (!X) return;
    const def = X.def, b = X.bolsa, perdeu = {};
    if (motivo === 'caiu' && def.morte === 'metade') Object.keys(b).forEach(k => { const p = Math.ceil(b[k] / 2); perdeu[k] = p; b[k] -= p; });
    const v = inv(); Object.entries(b).forEach(([k, n]) => { if (n > 0) v[k] = Math.min(99, (v[k] || 0) + n); });
    const p = S.perfil; p.exp = p.exp || { viagens: 0, abates: 0 }; p.exp.viagens++; p.exp.abates += X.abates;
    if (motivo === 'caiu') { p.hp = Math.round(hpMax() * 0.25); p.hpT = Date.now(); } else p.hpT = Date.now();
    const trouxe = Object.entries(b).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${O.ITENS[k].i}`).join(' ') || 'nada';
    const perda = Object.entries(perdeu).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${O.ITENS[k].i}`).join(' ');
    X = null; ov.hidden = true; J.salvar();
    J.anuncia({ titulo: motivo === 'caiu' ? 'VOCÊ CAIU!' : 'DE VOLTA À ILHA', texto: motivo === 'caiu'
      ? `O Bordon te puxou para o barco. Trouxe: ${trouxe}.${perda ? ' Perdeu: ' + perda + '.' : ''} Coma algo para recuperar a vida.`
      : `${motivo === 'tempo' ? 'O tempo acabou e o Bordon zarpou. ' : ''}Trouxe para a mochila: ${trouxe}.`, dur: 9000 });
  }

  // ---------------------------------------------------------------- controles
  const teclas = new Set(); let stick = null;
  window.addEventListener('keydown', e => {
    if (!X || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'KeyJ') { if (X.jogo) apertaJogo(); else ataca(); return; }
    if (e.code === 'KeyE') { if (X.jogo) apertaJogo(); else coleta(); return; }
    if (e.code === 'KeyQ') { comer(); return; }
    if (e.code === 'KeyR' && pertoDoca()) { volta('barco'); return; }
    teclas.add(e.code);
  }, true);
  window.addEventListener('keyup', e => { if (X) { teclas.delete(e.code); e.stopImmediatePropagation(); } }, true);
  cv.addEventListener('pointerdown', e => { if (!X) return; cv.setPointerCapture(e.pointerId); stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY }; });
  cv.addEventListener('pointermove', e => { if (stick && e.pointerId === stick.id) { stick.x = e.clientX; stick.y = e.clientY; } });
  const solta = e => { if (stick && e.pointerId === stick.id) stick = null; };
  cv.addEventListener('pointerup', solta); cv.addEventListener('pointercancel', solta);
  $('.ex-atacar').onclick = () => { if (X && X.jogo) apertaJogo(); else ataca(); };
  $('.ex-coletar').onclick = () => { if (X && X.jogo) apertaJogo(); else coleta(); };
  $('.ex-comer').onclick = () => { if (!comer()) aviso(vida() >= hpMax() ? 'Sua vida já está cheia.' : 'Sem comida! Traga pão, remédio ou poção na mochila.', 2500); };
  $('.ex-voltar').onclick = () => volta('barco');
  function direcao() {
    let dx = 0, dy = 0;
    if (teclas.has('ArrowLeft') || teclas.has('KeyA')) dx--; if (teclas.has('ArrowRight') || teclas.has('KeyD')) dx++;
    if (teclas.has('ArrowUp') || teclas.has('KeyW')) dy--; if (teclas.has('ArrowDown') || teclas.has('KeyS')) dy++;
    if (stick) { const sx = stick.x - stick.x0, sy = stick.y - stick.y0, m = Math.hypot(sx, sy); if (m > 8) { dx = sx / Math.max(m, 40); dy = sy / Math.max(m, 40); } }
    const m = Math.hypot(dx, dy); return m > 1 ? [dx / m, dy / m] : [dx, dy];
  }
  const pertoDoca = () => X && Math.hypot(X.eu.x - DOCA.x, X.eu.y - 272) < 18;
  const noPerto = () => X && X.mapa.nos.find(n => n.usos > 0 && dist(n, X.eu) < 15);
  const andavel = (x, y) => X.mapa.terra(x, y) && !X.mapa.nos.some(n => n.usos > 0 && Math.hypot(n.x - x, n.y - 2 - y) < 6);

  // ---------------------------------------------------------------- combate
  function ataca() {
    const e = X.eu, agora = Date.now(); if (agora < e.atk) return;
    e.atk = agora + 450; e.golpe = agora;
    const a = arma(), dano = a.dano + Math.min(10, attr().for | 0), fx = e.side;
    let acertou = 0;
    X.monstros.forEach(m => {
      if (m.morto) return;
      const dx = m.x - e.x, dy = m.y - e.y, d = Math.hypot(dx, dy);
      if (d < 9 || (d < 20 && dx * fx > -4)) {
        const crit = Math.random() < 0.1, v = Math.round(dano * (crit ? 1.5 : 1) * (0.85 + Math.random() * 0.3));
        m.hp -= v; m.flash = agora; m.est = 'caca'; acertou++;
        const k = 7 / Math.max(1, d); m.x += dx * k; m.y += dy * k;
        numero(m.x, m.y - 14, (crit ? '!' : '') + v, crit ? '#ffd046' : '#fff');
        if (m.hp <= 0) mata(m);
      }
    });
    bip(acertou ? 300 : 200, 0.05);
  }
  function mata(m) {
    m.morto = Date.now(); X.abates++; J.ganhaXp(m.d.xp);
    const [item, chance, q] = m.d.drop;
    if (Math.random() < chance) poeNaBolsa(item, q);
    numero(m.x, m.y - 22, '+' + m.d.xp + ' XP', '#bea0ff');
  }
  function poeNaBolsa(k, n) {
    const tot = Object.values(X.bolsa).reduce((s, v) => s + v, 0), cabe = Math.min(n, BOLSA_MAX - tot);
    if (cabe <= 0) { aviso('A bolsa está cheia (30). Volte ao barco para guardar na mochila.', 3500); return; }
    X.bolsa[k] = (X.bolsa[k] || 0) + cabe; numero(X.eu.x, X.eu.y - 26, `+${cabe} ${O.ITENS[k].i}`, '#d3a55a');
  }
  function apanha(m) {
    const e = X.eu, agora = Date.now(); if (agora < e.inv) return;
    const v = Math.max(1, Math.round(m.d.dano * (1 - escudo().def) * (0.85 + Math.random() * 0.3)));
    S.perfil.hp = vida() - v; e.inv = agora + 350; e.flash = agora;
    numero(e.x, e.y - 20, '-' + v, '#ff4a3a'); bip(120, 0.12);
    if (X.jogo) { X.jogo = null; aviso('Atacado! O minijogo foi interrompido.', 2000); }
    if (S.perfil.hp <= 0) volta('caiu');
  }
  function numero(x, y, txt, cor) { if (X) X.nums.push({ x, y, txt, cor, t: Date.now() }); }

  // ---------------------------------------------------------------- coleta com minijogo (no estilo da pesca)
  function coleta() {
    const n = noPerto(); if (!n) return;
    const tot = Object.values(X.bolsa).reduce((s, v) => s + v, 0); if (tot >= BOLSA_MAX) { aviso('A bolsa está cheia (30). Volte ao barco.', 3000); return; }
    const R = RECURSO[n.k], fx = J.bonus ? J.bonus.faixa() : 1;
    X.jogo = Object.assign({}, R.jogo, { no: n, t0: Date.now(), hits: 0, falhas: 0, x: X.eu.x, y: X.eu.y, larg0: (R.jogo.larg || 0.25) * fx, z0: 0.2 + Math.random() * 0.5, fase: 'espera', prox: Date.now() + 800 + Math.random() * 1500 });
  }
  const cursor = j => { const u = ((Date.now() - j.t0) / 1000 * j.vel) % 2; return u < 1 ? u : 2 - u; };
  function apertaJogo() {
    const j = X.jogo; if (!j) return;
    const ok = j.tipo === 'faixa' ? (cursor(j) >= j.z0 && cursor(j) <= j.z0 + j.larg0) : j.fase === 'agora';
    if (ok) {
      j.hits++; bip(880, 0.06); j.flash = Date.now();
      if (j.tipo === 'faixa') { j.larg0 = Math.max(0.1, j.larg0 * 0.8); j.z0 = 0.05 + Math.random() * (0.9 - j.larg0); }
      else { j.fase = 'espera'; j.prox = Date.now() + 800 + Math.random() * 1500; }
      if (j.hits >= j.golpes) {
        const n = j.no, dobro = J.bonus && Math.random() < J.bonus.dobro() ? 2 : 1;
        X.jogo = null; poeNaBolsa(n.k, dobro); J.ganhaXp(RECURSO[n.k].xp);
        if (--n.usos <= 0) n.volta = Date.now() + 60e3;
      }
    } else {
      j.falhas++; bip(150, 0.15);
      if (j.tipo === 'reacao') { j.fase = 'espera'; j.prox = Date.now() + 900 + Math.random() * 1500; }
      if (j.falhas >= 3) { X.jogo = null; aviso('Não foi dessa vez.', 1500); }
    }
  }

  // ---------------------------------------------------------------- simulação
  let ult = 0;
  function passo(dt) {
    const e = X.eu, agora = Date.now();
    // jogador
    const [dx, dy] = X.jogo ? [0, 0] : direcao(), vel = 46 * (J.bonus ? J.bonus.vel() : 1);
    e.anda = !!(dx || dy);
    if (e.anda) {
      const nx = e.x + dx * vel * dt, ny = e.y + dy * vel * dt;
      if (andavel(nx, e.y)) e.x = nx; if (andavel(e.x, ny)) e.y = ny;
      if (dx) e.side = dx > 0 ? 1 : -1; e.dir = dy < -0.5 ? 'up' : 'down';
    }
    const j = X.jogo;
    if (j && j.tipo === 'reacao') {
      if (j.fase === 'espera' && agora > j.prox) { j.fase = 'agora'; j.prox = agora + j.janela; bip(520, 0.04); }
      else if (j.fase === 'agora' && agora > j.prox) { j.falhas++; j.fase = 'espera'; j.prox = agora + 900 + Math.random() * 1500; bip(150, 0.15); if (j.falhas >= 3) { X.jogo = null; aviso('Demorou demais.', 1500); } }
    }
    // monstros
    X.monstros.forEach((m, i) => {
      if (m.morto) { if (agora - m.morto > 45e3) X.monstros[i] = novoMonstro(X.mapa, m.k); return; }
      const d = dist(m, e), D = m.d;
      if (m.est === 'prepara') {
        if (agora >= m.prepAte) { m.est = 'caca'; m.cdAte = agora + D.cd; m.golpe = agora; if (dist(m, e) < D.alcance + 4) apanha(m); }
        return;
      }
      if (m.est === 'vaga' && d < D.aggro) m.est = 'caca';
      if (m.est === 'caca' && (d > D.aggro * 2 || Math.hypot(m.x - m.sx, m.y - m.sy) > 120)) { m.est = 'vaga'; m.alvo = { x: m.sx, y: m.sy }; }
      let tx, ty, v = D.vel;
      if (m.est === 'caca') {
        if (d < D.alcance && agora > m.cdAte) { m.est = 'prepara'; m.prepAte = agora + D.prep; return; }
        tx = e.x; ty = e.y; if (d < D.alcance - 2) v = 0;
      } else {
        if (!m.alvo || agora > m.prox) { m.alvo = { x: m.sx + (Math.random() - 0.5) * 50, y: m.sy + (Math.random() - 0.5) * 50 }; m.prox = agora + 2000 + Math.random() * 3000; }
        tx = m.alvo.x; ty = m.alvo.y; v *= 0.4;
      }
      const ddx = tx - m.x, ddy = ty - m.y, dd = Math.hypot(ddx, ddy);
      if (dd > 1 && v) { const nx = m.x + ddx / dd * v * dt, ny = m.y + ddy / dd * v * dt; if (X.mapa.terra(nx, ny)) { m.x = nx; m.y = ny; } m.side = ddx > 0 ? 1 : -1; m.anda = true; } else m.anda = false;
    });
    // monstros não se empilham
    for (let a = 0; a < X.monstros.length; a++) for (let b = a + 1; b < X.monstros.length; b++) {
      const p = X.monstros[a], q = X.monstros[b]; if (p.morto || q.morto) continue;
      const d = dist(p, q); if (d < 8 && d > 0) { const k = (8 - d) / d / 2; p.x -= (q.x - p.x) * k; p.y -= (q.y - p.y) * k; q.x += (q.x - p.x) * k; q.y += (q.y - p.y) * k; }
    }
    X.mapa.nos.forEach(n => { if (n.usos <= 0 && agora > n.volta) n.usos = 3; });
    X.nums = X.nums.filter(n => agora - n.t < 1100);
    if (!X.avisou && X.fim - agora < 60e3) { X.avisou = true; aviso('Falta 1 minuto! Volte ao barco ou o Bordon leva o que você tiver na bolsa.', 5000); }
    if (agora >= X.fim) volta('tempo');
  }

  // ---------------------------------------------------------------- desenho
  let dpr = 1, esc2 = 3;
  function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); esc2 = clamp(Math.round(Math.min(innerWidth, innerHeight) / 105), 3, 7); }
  window.addEventListener('resize', () => { if (X) resize(); });
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  function desenhaNo(n, t) {
    const x = Math.round(n.x), y = Math.round(n.y), R = RECURSO[n.k], vazio = n.usos <= 0;
    P(x - 6, y, 12, 2, 'rgba(0,0,0,.25)');
    if (R.tipo === 'rocha') {
      P(x - 6, y - 7, 12, 7, vazio ? '#5a5650' : '#7d7a76'); P(x - 5, y - 9, 9, 3, vazio ? '#6a6660' : '#9a968e'); P(x + 5, y - 6, 1, 6, '#5e5b57');
      if (!vazio) { P(x - 3, y - 5, 2, 2, R.cor); P(x + 2, y - 7, 2, 1, R.cor); P(x, y - 3, 1, 1, R.cor); }
    } else if (R.tipo === 'pinheiro') {
      P(x - 1, y - 4, 3, 4, '#5a3a22');
      if (vazio) { P(x - 2, y - 2, 5, 2, '#7a5a32'); return; }
      [[0, 7], [4, 5], [8, 3]].forEach(([dy, w]) => P(x - w, y - 9 - dy, w * 2 + 1, 5, R.cor)); P(x, y - 21, 1, 2, R.cor);
    } else {
      P(x - 1, y - 6, 3, 6, '#5a3a22');
      if (vazio) { P(x - 3, y - 2, 7, 2, '#7a5a32'); return; }
      P(x - 7, y - 16, 15, 10, R.cor); P(x - 5, y - 18, 11, 3, R.cor); P(x - 6, y - 15, 4, 3, '#4f7a36'); P(x + 2, y - 11, 4, 2, '#2f5a22');
    }
  }
  function desenhaMonstro(m, t) {
    const x = Math.round(m.x), y = Math.round(m.y), s = m.side, pisca = t - m.flash < 120, prep = m.est === 'prepara';
    const b = m.anda ? Math.round(Math.sin(t / 90)) : 0;
    P(x - 6, y, 12, 2, 'rgba(0,0,0,.3)');
    const cor = (c) => pisca ? '#ffffff' : c;
    if (m.k === 'caranguejo') {
      P(x - 5, y - 5 + b, 10, 4, cor('#d0582a')); P(x - 4, y - 6 + b, 8, 1, cor('#e87a44'));
      P(x - 8, y - 6, 3, 2, cor('#d0582a')); P(x + 5, y - 6, 3, 2, cor('#d0582a')); P(x - 3, y - 8 + b, 1, 2, '#111'); P(x + 2, y - 8 + b, 1, 2, '#111');
      for (let i = -1; i <= 1; i++) { P(x - 6, y - 2 + i, 1, 1, '#a04020'); P(x + 5, y - 2 + i, 1, 1, '#a04020'); }
    } else if (m.k === 'javali') {
      P(x - 7, y - 7 + b, 13, 6, cor('#6a4a32')); P(x - 7, y - 8 + b, 11, 1, cor('#4a3222'));
      P(x + (s > 0 ? 5 : -9), y - 6 + b, 4, 4, cor('#7a5a3e')); P(x + (s > 0 ? 8 : -9), y - 3 + b, 1, 2, '#f1ead8'); P(x + (s > 0 ? 6 : -7), y - 6 + b, 1, 1, '#111');
      P(x - 6, y - 1, 2, 2, '#3a2a1a'); P(x + 3, y - 1, 2, 2, '#3a2a1a');
    } else if (m.k === 'lobo') {
      P(x - 7, y - 7 + b, 12, 5, cor('#6e737c')); P(x - 7, y - 8 + b, 10, 1, cor('#8a8f98'));
      const hx = x + (s > 0 ? 4 : -9); P(hx, y - 10 + b, 5, 5, cor('#7c818a')); P(hx + (s > 0 ? 1 : 3), y - 12 + b, 1, 2, cor('#5a5f68')); P(hx + (s > 0 ? 3 : 1), y - 12 + b, 1, 2, cor('#5a5f68'));
      P(hx + (s > 0 ? 3 : 1), y - 8 + b, 1, 1, prep ? '#ff3a2a' : '#ffd046');
      P(x + (s > 0 ? -9 : 5), y - 8 + b, 4, 2, cor('#5a5f68'));
      P(x - 6, y - 2, 1, 2, '#4a4f58'); P(x - 3, y - 2, 1, 2, '#4a4f58'); P(x + 1, y - 2, 1, 2, '#4a4f58'); P(x + 3, y - 2, 1, 2, '#4a4f58');
    } else {
      P(x - 4, y - 7 + b, 8, 6, cor('#2a2030')); P(x - 3, y - 9 + b, 6, 2, cor('#3a2a44'));
      for (let i = 0; i < 4; i++) { const k = i % 2 ? b : -b; P(x - 8, y - 6 + i * 2 + k, 4, 1, '#1a1420'); P(x + 4, y - 6 + i * 2 - k, 4, 1, '#1a1420'); }
      P(x - 2, y - 8 + b, 1, 1, prep ? '#ff3a2a' : '#c8433a'); P(x + 1, y - 8 + b, 1, 1, prep ? '#ff3a2a' : '#c8433a'); P(x - 1, y - 5 + b, 2, 1, '#a04ad0');
    }
    if (prep) { const u = 1 - (m.prepAte - t) / m.d.prep; ctx.globalAlpha = 0.35 + 0.4 * u; P(x - 1, y - 18, 2, 4, '#ff3a2a'); P(x - 1, y - 13, 2, 1, '#ff3a2a'); ctx.globalAlpha = 1; }
    if (m.hp < m.d.hp) { P(x - 6, y - 15, 12, 2, '#3a1010'); P(x - 6, y - 15, Math.max(1, Math.round(12 * m.hp / m.d.hp)), 2, '#c8433a'); }
  }
  function desenha() {
    const e = X.eu, t = Date.now(), s = esc2 * dpr, vw = cv.width / s, vh = cv.height / s;
    const ox = Math.round(clamp(e.x - vw / 2, -40, W + 40 - vw)), oy = Math.round(clamp(e.y - 8 - vh / 2, -40, H + 40 - vh));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1d3d5c'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(s, 0, 0, s, -ox * s, -oy * s);
    ctx.drawImage(X.mapa.chao, 0, 0);
    // ondas na borda
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2 + t / 4000, rx = 160 + Math.cos(a) * 150, ry = 156 + Math.sin(a) * 146; if (!X.mapa.terra(rx, ry)) P(rx, ry, 3, 1, 'rgba(200,220,240,.35)'); }
    // barco na doca
    const bb = Math.round(Math.sin(t / 600)); P(DOCA.x + 6, 292 + bb, 18, 3, '#5a3a1e'); P(DOCA.x + 8, 295 + bb, 14, 2, '#3e2814'); P(DOCA.x + 16, 278 + bb, 1, 14, '#3e2814'); P(DOCA.x + 11, 279 + bb, 5, 9, '#c9bfa4');
    const objs = [];
    X.mapa.enfeites.forEach(f => objs.push({ y: f.y, f: () => f.k === 'mato' ? (P(f.x, f.y - 2, 1, 2, '#2a5a2a'), P(f.x + 1, f.y - 3, 1, 3, '#3a7a3a'), P(f.x + 2, f.y - 2, 1, 2, '#2a5a2a')) : P(f.x, f.y - 1, 3, 2, '#8a8680') }));
    X.mapa.nos.forEach(n => objs.push({ y: n.y, f: () => desenhaNo(n, t) }));
    X.monstros.forEach(m => { if (!m.morto) objs.push({ y: m.y, f: () => desenhaMonstro(m, t) }); });
    const vis = (S.eu && (S.eu.mor ? S.eu.mor.visual : S.eu.look)) || { tipo: 'humano' };
    objs.push({ y: e.y, f: () => {
      if (t - (e.flash || 0) < 150) ctx.globalAlpha = 0.5;
      SP.drawCharacter(ctx, Math.round(e.x), Math.round(e.y), vis, { t: t / 1000, walking: e.anda, side: e.side, dir: e.dir });
      ctx.globalAlpha = 1;
      if (t - (e.golpe || 0) < 160) { const u = (t - e.golpe) / 160; for (let i = 0; i < 5; i++) { const a = -1 + i * 0.5; P(e.x + e.side * (6 + Math.cos(a) * 9 * (0.6 + u)), e.y - 8 + Math.sin(a) * 9, 2, 1, '#f1ead8'); } }
    } });
    objs.sort((a, b) => a.y - b.y).forEach(o => o.f());
    // névoa no bosque
    if (X.def.tier >= 2) { ctx.fillStyle = 'rgba(20,30,40,.18)'; ctx.fillRect(ox, oy, vw, vh); }
    // números e minijogo (em coordenadas da tela)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scr = (x, y) => [(x - ox) * esc2, (y - oy) * esc2];
    ctx.textAlign = 'center'; ctx.font = `bold ${Math.max(11, esc2 * 4)}px Silkscreen, monospace`;
    X.nums.forEach(n => { const u = (t - n.t) / 1100, [x, y] = scr(n.x, n.y - u * 10); ctx.globalAlpha = 1 - u; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(n.txt, x, y); ctx.fillStyle = n.cor; ctx.fillText(n.txt, x, y); }); ctx.globalAlpha = 1;
    const no = noPerto();
    if (no && !X.jogo) { const [x, y] = scr(no.x, no.y - 24); ctx.font = `${Math.max(12, esc2 * 4)}px sans-serif`; ctx.fillText(RECURSO[no.k].tipo === 'rocha' ? '⛏️' : '🪓', x, y + Math.round(Math.sin(t / 250) * 3)); }
    const j = X.jogo;
    if (j) {
      const [px, py] = scr(e.x, e.y - 30), Wb = 120, Hb = 14, x0 = px - Wb / 2, y0 = py - Hb;
      ctx.fillStyle = 'rgba(10,12,16,.9)'; ctx.fillRect(x0 - 4, y0 - 4, Wb + 8, Hb + 8);
      if (j.tipo === 'faixa') { ctx.fillStyle = '#3a3f4a'; ctx.fillRect(x0, y0, Wb, Hb); ctx.fillStyle = '#ffd046'; ctx.fillRect(x0 + j.z0 * Wb, y0, j.larg0 * Wb, Hb); ctx.fillStyle = '#fff'; ctx.fillRect(x0 + cursor(j) * Wb - 1.5, y0 - 3, 3, Hb + 6); }
      else { const ok = j.fase === 'agora'; ctx.fillStyle = ok ? '#ffd046' : '#3a3f4a'; ctx.fillRect(x0, y0, Wb, Hb); ctx.fillStyle = ok ? '#1a1410' : '#cfd3da'; ctx.font = 'bold 11px Silkscreen, monospace'; ctx.fillText(ok ? 'AGORA!' : 'espere a rocha rachar...', px, y0 + Hb - 3); }
      for (let i = 0; i < j.golpes; i++) { ctx.fillStyle = i < j.hits ? '#4ac07a' : 'rgba(255,255,255,.3)'; ctx.fillRect(px - j.golpes * 6 + i * 12, y0 + Hb + 6, 9, 4); }
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i < j.falhas ? '#c8433a' : 'rgba(255,255,255,.15)'; ctx.fillRect(px + Wb / 2 - 24 + i * 8, y0 - 12, 5, 4); }
    }
  }
  function hud() {
    const resta = Math.max(0, X.fim - Date.now()), mm = Math.floor(resta / 60e3), ss = Math.floor(resta / 1000) % 60, hp = vida(), mx = hpMax();
    $('.ex-nome').textContent = `T${X.def.tier} · ${X.def.nome.toUpperCase()}`;
    $('.ex-tempo').textContent = `⛵ ${mm}:${String(ss).padStart(2, '0')}`;
    $('.ex-vida s').style.width = (hp / mx * 100) + '%'; $('.ex-vida em').textContent = `VIDA ${hp}/${mx}`;
    const tot = Object.values(X.bolsa).reduce((s, v) => s + v, 0);
    $('.ex-bolsa').textContent = `🎒 ${tot}/${BOLSA_MAX} ` + Object.entries(X.bolsa).filter(([, n]) => n).map(([k, n]) => `${O.ITENS[k].i}${n}`).join(' ');
    const no = noPerto(), bc = $('.ex-coletar'), bv = $('.ex-voltar');
    bc.hidden = !no && !X.jogo;
    if (X.jogo) { const pronto = X.jogo.tipo === 'reacao' && X.jogo.fase === 'agora'; bc.innerHTML = `<i>${pronto ? '❗' : '👆'}</i><span>${pronto ? 'AGORA!' : 'TOCAR'} ${X.jogo.hits}/${X.jogo.golpes}</span>`; bc.classList.toggle('pulsa', pronto); }
    else if (no) { bc.innerHTML = `<i>${RECURSO[no.k].tipo === 'rocha' ? '⛏️' : '🪓'}</i><span>${RECURSO[no.k].verbo} ${O.ITENS[no.k].n.toUpperCase()}</span>`; bc.classList.remove('pulsa'); }
    bv.hidden = !pertoDoca();
    const c = COMIDAS.find(([k]) => inv()[k] > 0); $('.ex-comer').innerHTML = c ? `<i>${O.ITENS[c[0]].i}</i><span>COMER (+${c[1]}) · ${inv()[c[0]]}</span>` : '<i>🍞</i><span>SEM COMIDA</span>';
    $('.ex-atacar span').textContent = `ATACAR · ${arma().dano + Math.min(10, attr().for | 0)}`;
  }
  let avisoAte = 0;
  function aviso(txt, dur) { const a = $('.ex-aviso'); a.textContent = txt; a.hidden = false; avisoAte = Date.now() + (dur || 3000); }
  function loop(ts) {
    if (!X) return;
    const dt = Math.min(0.05, ult ? (ts - ult) / 1000 : 0.016); ult = ts;
    passo(dt); if (!X) { ult = 0; return; }
    desenha(); hud();
    if (Date.now() > avisoAte) $('.ex-aviso').hidden = true;
    requestAnimationFrame(loop);
  }
  let audio = null;
  function bip(f, d) { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime; o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + d); } catch (e) { } }

  // ---------------------------------------------------------------- o cais: escolher a ilha e pagar o barco
  const CAIS = { x: G.LUG.cais.sx, y: G.LUG.cais.sy };
  const ticAgora = () => { const T = window.IlhaTemporada && window.IlhaTemporada.T; return T && T.eco ? T.eco.tic : 0; };
  let esperando = null;
  function abrir() {
    if (!S.on) { J.anuncia({ titulo: 'EXPEDIÇÕES', texto: 'Toque em JOGAR e entre com o seu @ para viajar com o Bordon.', dur: 5000 }); return; }
    const lv = nivel(S.perfil.xp), hp = vida(), mx = hpMax(), a = arma(), es = escudo(), tic = ticAgora();
    const lista = Object.values(ILHAS).map(d => {
      const pode = lv >= d.lv, paga = tic >= d.tic;
      return `<li class="${pode ? 'pode' : ''}"><i>${d.tier === 1 ? '🏝️' : '🌲'}</i><div><b>T${d.tier} · ${esc(d.nome)}</b><small>${esc(d.desc)} Recursos: ${d.recursos.map(k => O.ITENS[k].i + ' ' + O.ITENS[k].n).join(', ')}. Monstros: ${Object.keys(d.monstros).map(k => MONSTRO[k].nome).join(', ')}. Se cair: ${d.morte === 'nada' ? 'volta com tudo' : 'perde metade da bolsa'}.${pode ? '' : ` Precisa do nível ${d.lv}.`}</small></div><button type="button" class="b-ouro ex-ir" data-id="${d.id}" ${pode && paga ? '' : 'disabled'}>${d.tic} TIC</button></li>`;
    }).join('');
    K.abrir('⛵ EXPEDIÇÕES COM O BORDON', `<p>O capitão Bordon leva você para ilhas distantes, com monstros e materiais que não existem aqui. Você tem <b>10 minutos</b> em cada viagem, e o que coletar só entra na mochila quando você voltar pelo barco.</p>
      <div class="tp-topo"><div class="tp-tic"><b>${tic}</b><span>TIC</span></div><div class="tp-rep"><span>SUA VIDA</span><b style="color:${hp < mx * 0.4 ? '#c8433a' : '#4ac07a'}">${hp}/${mx}</b><small>Arma: ${a.id ? O.ITENS[a.id].n : 'os punhos'} (dano ${a.dano}) · Defesa: ${es.id ? O.ITENS[es.id].n + ' (-' + Math.round(es.def * 100) + '%)' : 'nenhuma'}</small></div></div>
      <ul class="of-lista">${lista}</ul>
      <p class="m-nota">A vida volta sozinha devagar na ilha principal, ou na hora comendo pão (+20), remédio (+45) ou poção de vida (+70). Os monstros piscam um sinal vermelho antes de atacar: saia de perto para escapar. Com o cobre, o ferro, as madeiras, o couro e a seda, o Kasseki forja espadas, o Igor monta escudos, o Daniel prepara poções e você ergue a casa de pedra e carvalho.</p>`, el => {
      el.querySelectorAll('.ex-ir').forEach(b => b.onclick = () => {
        const d = ILHAS[b.dataset.id]; if (vida() < 15) { J.anuncia({ titulo: 'EXPEDIÇÃO', texto: 'Você está muito ferido. Coma algo antes de embarcar.', dur: 4000 }); return; }
        esperando = d.id; b.disabled = true; b.textContent = '...'; J.envia({ t: 'barco', ilha: d.id });
        setTimeout(() => { if (esperando === d.id) { esperando = null; J.anuncia({ titulo: 'EXPEDIÇÃO', texto: 'O Bordon não respondeu. Tente de novo.', dur: 4000 }); } }, 8000);
      });
    });
  }
  J.aoMsg.push(m => {
    if (m.t !== 'barco') return;
    const id = esperando; esperando = null;
    if (m.erro) { J.anuncia({ titulo: 'EXPEDIÇÃO', texto: m.erro, dur: 5000 }); return; }
    if (m.ok && ILHAS[m.ilha] && id === m.ilha) { K.fechar(); embarca(ILHAS[m.ilha]); }
  });

  // botão no cais
  let bE = null;
  setInterval(() => {
    const barra = document.querySelector('.jogo-barra');
    if (barra && !bE) { bE = document.createElement('button'); bE.type = 'button'; bE.className = 'jb jb-acao'; bE.hidden = true; bE.innerHTML = '<i>⛵</i><span>EXPEDIÇÃO</span>'; bE.onclick = abrir; barra.insertBefore(bE, barra.querySelector('#jb-falar')); }
    if (bE) bE.hidden = !(S.on && S.eu && !X && Math.hypot(S.eu.x - CAIS.x, S.eu.y - CAIS.y) < 28);
    if (!S.on && X) { X = null; ov.hidden = true; }
  }, 250);
  // marcador ⛵ no cais
  window.IlhaTexto.push((c, scr, fs, info) => {
    if (!S.on || X) return; const [sx, sy] = scr(CAIS.x + 14, CAIS.y - 10); c.font = `${fs + 2}px sans-serif`; c.textAlign = 'center'; c.fillText('⛵', sx, sy + Math.round(Math.sin(info.t / 260) * 2));
  });
  setTimeout(() => { const F = window.IlhaFeed; if (F) F.push({ k: 'chegada', html: '<b>Novidade: expedições!</b> No cais, o Bordon leva você para ilhas com monstros e materiais novos. Toque em JOGAR e vá até o ⛵.', dur: 16000 }); }, 22000);

  window.IlhaExpedicao = { abrir, ILHAS, MONSTRO, vida, hpMax, get emExpedicao() { return !!X; }, _embarca: embarca };
})();
