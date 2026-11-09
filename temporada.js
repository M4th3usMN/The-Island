/* A Grande Ilha — TEMPORADA (as atualizações de novembro e dezembro, todas ligadas de uma vez).
   1. Atributos (Força, Agilidade, Inteligência, Carisma) com efeito real e REPUTAÇÃO contada no servidor.
   2. A primeira votação que muda o mapa: Fortaleza do Dragão (Igor) x Muralha da Costa Sul.
      O canteiro já aparece no mapa; quem vencer é erguido aos poucos pelas entregas da comunidade.
   3. Missão de história com prazo (O Espião) e o primeiro evento em que todos participam (Vigília da Costa Sul).
   4. Moeda TIC grátis por missões, pedidos e eventos; ranking Top 10 do servidor.
   5. Profissões que dependem umas das outras (Igor faz tábuas e pedras, Kasseki faz pregos) e casas melhoráveis.
   6. Lojas dos membros (feira, só TIC) e compra de TIC pelo Mercado Pago.
   7. Equipamentos com poderes (Armeiro) e o evento de Natal (19 a 26/12).
   Regra da ilha: toda ação de personagem tem minijogo (o mesmo motor da pesca, em oficios.js). */
(function () {
  'use strict';
  const G = window.GrandeIlha, SP = window.IlhaSprites, K = window.IlhaComunidade, J = window.IlhaJogo, O = window.IlhaOficios;
  if (!G || !K || !J || !O) return;
  const S = J.S, esc = K.esc, L = G.LUG;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const nivel = xp => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 60));
  const moradorDe = ar => G.MOR.find(m => m.arroba && m.arroba.toLowerCase() === ar) || null;
  const fmtData = t => new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const falta = t => { let s = Math.max(0, Math.round((t - Date.now()) / 1000)); const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}min` : `${m}min`; };
  const PREVIA_NATAL = /natal=1/.test(location.search);

  // ---------------------------------------------------------------- dados da temporada
  const REP = [[0, 'Forasteiro', '#a9b3a6'], [20, 'Conhecido', '#9ad0ff'], [80, 'Respeitado', '#7ad08a'], [200, 'Herói da Ilha', '#ffd046'], [500, 'Lenda', '#ff8a5a']];
  const repNv = r => { let i = 0; REP.forEach(([m], k) => { if (r >= m) i = k; }); return i; };
  const ATR = [
    { k: 'for', n: 'Força', i: '💪', d: '+4% de chance de coletar em dobro (madeira, minério, trigo, ervas)' },
    { k: 'agi', n: 'Agilidade', i: '🏃', d: '+3% de velocidade e faixa dos minijogos 3% maior' },
    { k: 'int', n: 'Inteligência', i: '📖', d: '+3% de XP em tudo o que você faz' },
    { k: 'car', n: 'Carisma', i: '💬', d: '+5% de reputação ganha (contado no servidor)' }
  ];
  const EQUIP = {
    luvas_ferreiro: { n: 'Luvas do Ferreiro', i: '🧤', r: 'comum', tic: 15, slot: 'mãos', d: 'Faixa dos minijogos 20% maior', forja: { minerio: 2, pao: 1 }, quem: 'kasseki' },
    botas_andarilho: { n: 'Botas do Andarilho', i: '🥾', r: 'comum', tic: 15, slot: 'pés', d: '+15% de velocidade', forja: { madeira: 3, erva: 2 }, quem: 'kasseki' },
    lanterna_costa: { n: 'Lanterna da Costa', i: '🏮', r: 'comum', tic: 15, slot: 'extra', d: 'Cada patrulha do evento vale 2', forja: { lamina: 1, madeira: 2 }, quem: 'kasseki' },
    lamina_runica: { n: 'Lâmina Rúnica', i: '🗡️', r: 'raro', tic: 40, slot: 'mãos', d: '+25% de chance de coletar em dobro' },
    manto_aprendiz: { n: 'Manto do Aprendiz', i: '🧥', r: 'raro', tic: 40, slot: 'corpo', d: '+10% de XP' },
    amuleto_dragao: { n: 'Amuleto do Dragão', i: '🐉', r: 'epico', tic: 80, slot: 'extra', d: '+20% de reputação ganha' }
  };
  const RAR = { comum: ['#b8bcc8', 'COMUM'], raro: ['#4aa0ff', 'RARO'], epico: ['#b070ff', 'ÉPICO'] };
  const PACOTES = [['tic20', 'Bronze', 2, 20], ['tic55', 'Prata', 5, 55], ['tic120', 'Ouro', 10, 120], ['tic260', 'Diamante', 20, 260]];
  // novos materiais e receitas (profissões que dependem umas das outras)
  Object.assign(O.ITENS, { tabua: { n: 'Tábua', i: '🪚' }, prego: { n: 'Pregos', i: '📌' }, pedra: { n: 'Pedra lapidada', i: '🧱' } });
  O.RECEITAS.push(
    { item: 'tabua', quem: 'igor', onde: 'oficina', verbo: 'SERRAR', pede: { madeira: 2 }, sai: 2, xp: 10, fala: 'Me traz 2 madeiras que eu serro em tábuas retinhas.', jogo: { tipo: 'faixa', golpes: 2, vel: 1.3, larg: 0.24, txt: 'Serre quando o marcador passar na faixa' } },
    { item: 'pedra', quem: 'igor', onde: 'oficina', verbo: 'LAPIDAR', pede: { minerio: 2 }, xp: 12, fala: 'Com 2 minérios eu lapido uma pedra boa para muro.', jogo: { tipo: 'reacao', golpes: 2, janela: 800, txt: 'Bata no cinzel quando a pedra brilhar' } },
    { item: 'prego', quem: 'kasseki', onde: 'forja', verbo: 'FORJAR', pede: { minerio: 1, pao: 1 }, sai: 3, xp: 12, fala: '1 minério e 1 pão para quem bate o ferro: te faço 3 pregos.', jogo: { tipo: 'faixa', golpes: 2, vel: 1.5, larg: 0.22, txt: 'Bata no ferro quando o marcador passar na faixa' } }
  );
  const CASA_NV = [
    null,
    { n: 'Cerca e jardim', pede: { tabua: 4, prego: 2 } },
    { n: 'Chaminé, lanterna e varanda', pede: { tabua: 6, prego: 4, pedra: 3 } },
    { n: 'Torre de vigia com bandeira', pede: { tabua: 8, prego: 6, pedra: 6 } }
  ];
  // lugares no mapa
  const FORTALEZA = { x: 300, y: 100 }, MURALHA = [[318, 490], [356, 494], [430, 494], [478, 490]];
  const POSTOS = [{ x: 330, y: 486, n: 'Posto do Oeste' }, { x: 432, y: 488, n: 'Posto do Cais' }, { x: 520, y: 470, n: 'Posto do Leste' }];
  const FEIRA = { x: 418, y: 326 };
  const NATAL_ARV = { x: 350, y: 292 };
  const PRESENTES = [[248, 330], [470, 300], [560, 380], [300, 420], [430, 230], [620, 300], [200, 260], [390, 470]];
  const ESPIAO = { prazo: Date.parse('2026-11-16T21:00:00-03:00'), pistas: [
    { id: 'cais', x: 392, y: 520, n: 'pegadas molhadas no cais', txt: 'Procure as pegadas quando a lanterna iluminar' },
    { id: 'ponte', x: 596, y: 146, n: 'um bilhete escondido na ponte', txt: 'Puxe o bilhete quando ele aparecer entre as tábuas' },
    { id: 'floresta', x: 300, y: 150, n: 'restos de uma fogueira de sinal', txt: 'Ache as brasas quando elas brilharem' }] };

  // ---------------------------------------------------------------- estado (servidor)
  const T = { eco: null, res: null, rank: null, pedido: 0, jogo: null };
  function ler() {
    const eu = S.eu ? '?eu=' + encodeURIComponent(S.eu.arroba) : '';
    fetch('/temporada/resumo' + eu, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { if (j && j.votacao) { T.res = j; redesenha(); } }).catch(() => { });
  }
  ler(); setInterval(ler, 60e3);
  const natalAtivo = () => PREVIA_NATAL || (T.res && T.res.natal && Date.now() >= T.res.natal.inicio && Date.now() <= T.res.natal.fim);
  const eventoAtivo = () => T.res && T.res.evento && T.res.evento.ativo;
  J.aoMsg.push(m => {
    if (m.t === 'eco') {
      const antes = T.eco; T.eco = m; redesenha();
      if (m.ganho && (m.ganho.tic || m.ganho.rep)) S.eu.emote = { txt: `${m.ganho.tic ? '+' + m.ganho.tic + ' TIC ' : ''}${m.ganho.rep ? '+' + m.ganho.rep + ' rep' : ''}`, ate: Date.now() + 2200 };
      if (antes && repNv(m.rep) > repNv(antes.rep)) J.anuncia({ titulo: 'REPUTAÇÃO!', texto: `Agora você é ${REP[repNv(m.rep)][1]} na ilha.${repNv(m.rep) === 2 ? ' Você já pode abrir a sua loja na Feira.' : ''}`, acao: 'VER', fn: () => abrir(0), dur: 7000 });
      if (m.aviso) J.anuncia({ titulo: 'TIC', texto: m.aviso, dur: 6000 });
    }
    if (m.t === 'votacao' && T.res) { T.res.votacao = Object.assign({}, m.res, { meu: T.res.votacao.meu }); redesenha(); }
    if (m.t === 'evento' && T.res) { Object.assign(T.res.evento, { total: m.total, participantes: m.participantes }); redesenha(); }
    if (m.t === 'casas' && T.res) { T.res.casas = m.casas; }
    if (m.t === 'voto') { if (m.res) { T.res.votacao = m.res; } if (m.erro) J.anuncia({ titulo: 'VOTAÇÃO', texto: m.erro, dur: 4000 }); else J.anuncia({ titulo: 'VOTO REGISTRADO!', texto: `Seu voto vale ${m.peso} pela sua reputação. +5 TIC e +5 de reputação.`, dur: 6000 }); redesenha(); }
    if (m.t === 'patrulha') { if (m.erro) J.anuncia({ titulo: 'VIGÍLIA', texto: m.erro, dur: 4000 }); else { T.res.evento.meu = m.meu; S.eu.emote = { txt: `Patrulha +${m.n} 🔥`, ate: Date.now() + 2000 }; } }
    if (m.t === 'casa') { if (m.erro) J.anuncia({ titulo: 'CASA', texto: m.erro, dur: 4000 }); else { T.res.casas[S.eu.arroba] = m.nivel; J.anuncia({ titulo: 'CASA MELHORADA!', texto: `${CASA_NV[m.nivel].n}: todo mundo vê no mapa. +15 de reputação.`, dur: 6000 }); } }
    if (m.t === 'oferta') { if (m.erro) J.anuncia({ titulo: 'FEIRA', texto: m.erro, dur: 5000 }); else { O.ITENS[m.o.item] && add(m.o.item, -m.o.q); J.anuncia({ titulo: 'NA FEIRA!', texto: `${m.o.q}x ${nomeItem(m.o.item)} por ${m.o.preco} TIC na sua loja.`, dur: 5000 }); redesenhaModal(); } }
    if (m.t === 'retirar' && m.ok) { add(m.item, m.q); redesenhaModal(); }
    if (m.t === 'comprar') { if (m.erro) J.anuncia({ titulo: 'FEIRA', texto: m.erro, dur: 4000 }); else { add(m.item, m.q); J.anuncia({ titulo: 'COMPRADO!', texto: `${m.q}x ${nomeItem(m.item)} da loja de @${m.de}.`, dur: 5000 }); redesenhaModal(); } }
    if (m.t === 'equip') { if (m.erro) J.anuncia({ titulo: 'ARMEIRO', texto: m.erro, dur: 4000 }); else { equipar(m.id, true); J.anuncia({ titulo: 'EQUIPAMENTO NOVO!', texto: `${EQUIP[m.id].i} ${EQUIP[m.id].n}: ${EQUIP[m.id].d}. Já está equipado.`, dur: 6000 }); redesenhaModal(); } }
    if (m.t === 'pix' || m.t === 'pixstatus') pixMsg(m);
  });
  // pede o saldo ao entrar
  setInterval(() => { if (S.on && S.eu && !T.pedido) { T.pedido = 1; J.envia({ t: 'eco' }); ler(); } if (!S.on) { T.pedido = 0; T.eco = null; } }, 700);
  const ganho = k => { if (S.on) J.envia({ t: 'ganho', k }); };
  J.ganho = ganho;

  // ---------------------------------------------------------------- atributos e equipamentos (efeitos reais)
  const attr = () => { const p = S.perfil; if (!p.attr) p.attr = { for: 0, agi: 0, int: 0, car: 0 }; return p.attr; };
  const pontos = () => { const a = attr(); return 3 + (nivel(S.perfil.xp) - 1) - (a.for + a.agi + a.int + a.car); };
  const tenho = id => !!(T.eco && T.eco.equip && T.eco.equip.includes(id));
  const usando = id => tenho(id) && (S.perfil.eqp || []).includes(id);
  function equipar(id, liga) {
    const p = S.perfil; p.eqp = (p.eqp || []).filter(x => x !== id && EQUIP[x] && EQUIP[x].slot !== (liga ? EQUIP[id].slot : '_'));
    if (liga) p.eqp.push(id); J.salvar();
  }
  J.bonus = {
    xp: () => S.perfil ? 1 + attr().int * 0.03 + (usando('manto_aprendiz') ? 0.1 : 0) : 1,
    vel: () => S.perfil ? 1 + Math.min(10, attr().agi) * 0.03 + (usando('botas_andarilho') ? 0.15 : 0) : 1,
    faixa: () => S.perfil ? 1 + Math.min(10, attr().agi) * 0.03 + (usando('luvas_ferreiro') ? 0.2 : 0) : 1,
    dobro: () => S.perfil ? Math.min(0.6, attr().for * 0.04 + (usando('lamina_runica') ? 0.25 : 0)) : 0,
    ganho
  };

  // ---------------------------------------------------------------- inventário (o mesmo da mochila)
  const inv = () => { const p = S.perfil; if (!p.inv) p.inv = {}; return p.inv; };
  const add = (k, n) => { const v = inv(); v[k] = Math.max(0, Math.min(99, (v[k] || 0) + n)); J.salvar(); };
  const nomeItem = k => O.ITENS[k] ? O.ITENS[k].i + ' ' + O.ITENS[k].n : k;
  const temTudo = pede => Object.entries(pede).every(([k, n]) => (inv()[k] || 0) >= n);
  const pedeTxt = pede => Object.entries(pede).map(([k, n]) => `${n} ${O.ITENS[k] ? O.ITENS[k].i : k}`).join(' + ');

  // ---------------------------------------------------------------- minijogo próprio (mesmas regras da pesca) para patrulha, pistas, obra e presentes
  function minijogo(cfg, fim) {
    const e = S.eu;
    T.jogo = Object.assign({ hits: 0, falhas: 0, t0: Date.now(), x: e.tx, y: e.ty, fim, z0: 0.2 + Math.random() * 0.5, larg0: (cfg.larg || 0.25) * J.bonus.faixa(), fase: 'espera', prox: Date.now() + 900 + Math.random() * 1600, cor: 0, troca: Date.now() }, cfg);
    J.anuncia({ titulo: cfg.titulo, texto: cfg.txt + ' · toque no botão (ou Espaço)', dur: 4000 });
  }
  const cursor = j => { const u = ((Date.now() - j.t0) / 1000 * (j.vel || 1.2)) % 2; return u < 1 ? u : 2 - u; };
  function aperta() {
    const j = T.jogo; if (!j) return;
    const ok = j.tipo === 'faixa' ? (c => c >= j.z0 && c <= j.z0 + j.larg0)(cursor(j)) : j.tipo === 'reacao' ? j.fase === 'agora' : j.cor === 0;
    if (ok) {
      j.hits++; S.eu.emote = { txt: j.hits >= j.golpes ? 'Conseguiu!' : `${j.hits}/${j.golpes}`, ate: Date.now() + 1000 };
      if (j.tipo === 'faixa') { j.larg0 = Math.max(0.1, j.larg0 * 0.8); j.z0 = 0.05 + Math.random() * (0.9 - j.larg0); }
      if (j.tipo === 'reacao') { j.fase = 'espera'; j.prox = Date.now() + 900 + Math.random() * 1600; }
      if (j.hits >= j.golpes) { T.jogo = null; j.fim(true); }
    } else {
      j.falhas++; S.eu.emote = { txt: j.tipo === 'reacao' ? 'Cedo demais!' : 'Errou!', ate: Date.now() + 1000 };
      if (j.tipo === 'reacao') { j.fase = 'espera'; j.prox = Date.now() + 1000 + Math.random() * 1600; }
      if (j.falhas >= 3) { T.jogo = null; S.eu.emote = { txt: 'Não foi dessa vez...', ate: Date.now() + 1600 }; j.fim(false); }
    }
  }
  function tickJogo() {
    const j = T.jogo; if (!j) return; const agora = Date.now();
    if (Math.hypot(S.eu.tx - j.x, S.eu.ty - j.y) > 2) { T.jogo = null; S.eu.emote = { txt: 'Parou.', ate: agora + 900 }; return; }
    if (j.tipo === 'reacao') { if (j.fase === 'espera' && agora > j.prox) { j.fase = 'agora'; j.prox = agora + (j.janela || 800); } else if (j.fase === 'agora' && agora > j.prox) { j.fase = 'espera'; j.prox = agora + 1000 + Math.random() * 1600; j.falhas++; S.eu.emote = { txt: 'Demorou!', ate: agora + 900 }; if (j.falhas >= 3) { T.jogo = null; j.fim(false); } } }
    if (j.tipo === 'cores' && agora - j.troca > 650) { j.troca = agora; const r = Math.random(); j.cor = r < 0.36 ? 0 : r < 0.7 ? 1 : 2; }
  }

  // ---------------------------------------------------------------- ações no mapa (botão de ação da temporada)
  const minhaCasa = () => { const m = S.eu && moradorDe(S.eu.arroba); return m && m._casaObj && m._casaObj.donos[0] === m ? m._casaObj : null; };
  const nivelCasa = ar => (T.res && T.res.casas && T.res.casas[ar]) || 0;
  const hist = () => { const p = S.perfil; if (!p.hist) p.hist = {}; if (!p.hist.espiao) p.hist.espiao = { passo: 0, pistas: {} }; return p.hist.espiao; };
  function presenteHoje() { const d = G.diaDe(Date.now()); const [x, y] = PRESENTES[d % PRESENTES.length]; return { x, y, dia: d }; }
  function acaoPerto() {
    if (!S.on || !S.eu) return null;
    const e = S.eu;
    if (eventoAtivo()) { const p = POSTOS.find(q => dist(e, q) < 14); if (p) return { i: '🔥', txt: 'PATRULHAR', f: () => patrulhar(p) }; }
    const h = hist();
    if (h.passo === 1 && Date.now() < ESPIAO.prazo) { const p = ESPIAO.pistas.find(q => !h.pistas[q.id] && dist(e, q) < 16); if (p) return { i: '🔍', txt: 'INVESTIGAR', f: () => investigar(p) }; }
    const c = minhaCasa(), n = c ? nivelCasa(S.eu.arroba) : 0;
    if (c && n < 3 && dist(e, { x: c.x, y: c.y + 6 }) < 18) { const nx = CASA_NV[n + 1]; return { i: '🔨', txt: `OBRA (${pedeTxt(nx.pede)})`, f: () => obra(n + 1), off: !temTudo(nx.pede) }; }
    if (natalAtivo()) { const pr = presenteHoje(); if (dist(e, pr) < 14 && !(S.perfil.natal || {})[pr.dia]) return { i: '🎁', txt: 'ABRIR PRESENTE', f: () => abrirPresente(pr) }; }
    if (dist(e, FEIRA) < 16) return { i: '⚖️', txt: 'FEIRA', f: () => abrir(4) };
    return null;
  }
  function patrulhar(p) {
    minijogo({ titulo: 'VIGÍLIA · ' + p.n.toUpperCase(), tipo: 'faixa', golpes: 2, vel: 1.3, larg: 0.26, txt: 'Acenda a tocha e vigie o mar: acerte a faixa' }, ok => {
      if (ok) { J.envia({ t: 'patrulha', n: usando('lanterna_costa') ? 2 : 1 }); J.ganhaXp(6); }
    });
  }
  function investigar(p) {
    minijogo({ titulo: 'O ESPIÃO · PISTA', tipo: 'reacao', golpes: 2, janela: 800, txt: p.txt }, ok => {
      if (!ok) return;
      const h = hist(); h.pistas[p.id] = Date.now(); J.ganhaXp(15); J.salvar();
      const n = Object.keys(h.pistas).length;
      J.anuncia({ titulo: `PISTA ${n}/3`, texto: `Você achou ${p.n}.${n >= 3 ? ' Leve as pistas até o Abdula.' : ''}`, dur: 6000 });
      if (n >= 3) h.passo = 2;
    });
  }
  function obra(n) {
    const nx = CASA_NV[n]; if (!temTudo(nx.pede)) return;
    minijogo({ titulo: 'OBRA · ' + nx.n.toUpperCase(), tipo: 'faixa', golpes: 3, vel: 1.4, larg: 0.24, txt: 'Martele as tábuas quando o marcador passar na faixa' }, ok => {
      if (!ok) return;
      Object.entries(nx.pede).forEach(([k, q]) => add(k, -q)); J.ganhaXp(40);
      J.envia({ t: 'casa', n });
    });
  }
  function abrirPresente(pr) {
    minijogo({ titulo: 'PRESENTE DE NATAL', tipo: 'cores', golpes: 2, txt: 'Desamarre a fita só quando ela ficar VERDE' }, ok => {
      if (!ok) return;
      const p = S.perfil; p.natal = p.natal || {}; p.natal[pr.dia] = 1; J.salvar();
      const premio = ['pao', 'madeira', 'erva', 'minerio', 'tabua', 'prego'][pr.dia % 6]; add(premio, 2); J.ganhaXp(30); ganho('presente');
      J.anuncia({ titulo: '🎁 FELIZ NATAL!', texto: `Dentro do presente: 2x ${nomeItem(premio)}. Amanhã tem outro escondido pela ilha!`, dur: 6000 });
    });
  }
  let bT = null;
  function botao() {
    const barra = document.querySelector('.jogo-barra'); if (!barra) return;
    if (!bT) {
      bT = document.createElement('button'); bT.type = 'button'; bT.className = 'jb jb-acao tp-acao'; bT.hidden = true;
      bT.onclick = () => { if (T.jogo) aperta(); else { const a = acaoPerto(); if (a && !a.off) a.f(); } };
      const bI = document.createElement('button'); bI.type = 'button'; bI.className = 'jb'; bI.id = 'jb-ilha'; bI.innerHTML = '<i>🏰</i><span>ILHA</span>'; bI.setAttribute('aria-label', 'Temporada: herói, votação, evento, ranking, casa, feira');
      bI.onclick = () => abrir(0);
      const ref = barra.querySelector('#jb-falar'); barra.insertBefore(bI, ref); barra.insertBefore(bT, ref);
    }
    if (!S.on) { bT.hidden = true; return; }
    if (T.jogo) {
      const j = T.jogo, pronto = (j.tipo === 'reacao' && j.fase === 'agora') || (j.tipo === 'cores' && j.cor === 0);
      bT.hidden = false; bT.disabled = false; bT.innerHTML = `<i>${pronto ? '❗' : '👆'}</i><span>${pronto ? 'AGORA!' : 'TOCAR'} · ${j.hits}/${j.golpes}</span>`; bT.classList.toggle('pulsa', pronto); return;
    }
    bT.classList.remove('pulsa');
    const a = acaoPerto(); bT.hidden = !a;
    if (a) { bT.innerHTML = `<i>${a.i}</i><span>${esc(a.txt)}</span>`; bT.disabled = !!a.off; }
    const tic = document.querySelector('#jb-ilha span'); if (tic && T.eco) tic.textContent = `${T.eco.tic} TIC`;
  }
  setInterval(() => { if (S.on) tickJogo(); else T.jogo = null; botao(); }, 90);
  window.addEventListener('keydown', e => {
    if (!S.on || /INPUT|TEXTAREA/.test(e.target.tagName) || !(e.code === 'Space' || e.code === 'KeyE')) return;
    if (T.jogo || (bT && !bT.hidden && !bT.disabled && !document.querySelector('.jb-acao:not(.tp-acao):not([hidden])'))) { e.preventDefault(); e.stopImmediatePropagation(); bT.click(); }
  }, true);

  // conversar: missão de história (Yukine → pistas → Abdula → Egil) e o Armeiro
  J.aoConversar.unshift(m => {
    if (!S.on || T.jogo) return false;
    const h = hist(), dentro = Date.now() < ESPIAO.prazo, fala = (id, txt) => { S.falas = S.falas.filter(f => f.quem !== id); S.falas.push({ quem: id, txt, ate: Date.now() + 6000 }); };
    if (m.id === 'yukine' && h.passo === 0 && dentro) {
      if (!T.eco || repNv(T.eco.rep) < 1) { fala('yukine', 'Os ancestrais só falam com quem a ilha conhece. Volte quando for Conhecido.'); return true; }
      h.passo = 1; J.salvar(); fala('yukine', 'Lira me mostrou: alguém manda sinais ao Reino do Sul. Procure no cais, na ponte e na floresta.');
      J.anuncia({ titulo: 'MISSÃO DE HISTÓRIA: O ESPIÃO', texto: `Ache 3 pistas (cais, ponte e floresta) antes de ${fmtData(ESPIAO.prazo)}.`, acao: 'VER', fn: () => abrir(1), dur: 8000 });
      return true;
    }
    if (m.id === 'abdula' && h.passo === 2 && dentro) {
      h.passo = 3; J.salvar(); fala('abdula', 'Tá bom, tá bom! Eu só vendia mapas... mas não fui eu quem acendeu a fogueira de sinal!');
      J.anuncia({ titulo: 'O ESPIÃO', texto: 'O Abdula confessou que vendia mapas, mas jura que não é o espião. Leve tudo ao Egil Montfort.', dur: 8000 });
      return true;
    }
    if (m.id === 'egil' && h.passo === 3 && dentro) {
      h.passo = 4; h.feito = Date.now(); J.salvar(); J.ganhaXp(120); ganho('historia:espiao');
      fala('egil', 'Mapas vendidos e um sinal no escuro... O espião ainda está entre nós. Você fez bem.');
      J.anuncia({ titulo: 'MISSÃO CUMPRIDA: O ESPIÃO', texto: 'Título "Caçador de Espiões", +120 XP, +50 TIC e +30 de reputação. O resto da história vem no próximo episódio!', dur: 9000 });
      return true;
    }
    return false;
  });

  // ---------------------------------------------------------------- painel da temporada
  let abaAtual = 0, modalAberto = false;
  const redesenhaModal = () => { if (modalAberto && !document.querySelector('.modal').hidden && document.querySelector('.tp-raiz')) abrir(abaAtual); };
  const redesenha = () => { };
  const barraHtml = (v, meta) => `<div class="md-barra"><s style="width:${Math.min(100, Math.round(v / Math.max(1, meta) * 100))}%"></s></div>`;
  function abrir(aba) {
    if (!S.on) { J.anuncia({ titulo: 'A ILHA', texto: 'Toque em JOGAR e entre com o seu @ para votar, patrulhar, ganhar TIC e subir no ranking.', dur: 5000 }); return; }
    abaAtual = aba || 0; modalAberto = true;
    const nomes = ['HERÓI', 'HISTÓRIA', 'RANKING', 'CASA', 'FEIRA'];
    if (natalAtivo()) nomes.push('NATAL');
    K.abrir('A ILHA · TEMPORADA', '<div class="tp-raiz"><div class="abas" role="tablist"></div><div class="aba-corpo"></div></div>', el => {
      K.abas(el.querySelector('.tp-raiz'), nomes, abaAtual, (i, corpo) => { abaAtual = i; [abaHeroi, abaHistoria, abaRanking, abaCasa, abaFeira, abaNatal][i](corpo); });
    });
  }
  function topo() {
    const e = T.eco || { tic: 0, rep: 0 }, n = repNv(e.rep), prox = REP[n + 1];
    return `<div class="tp-topo"><div class="tp-tic"><b>${e.tic}</b><span>TIC</span></div><div class="tp-rep"><span>REPUTAÇÃO</span><b style="color:${REP[n][2]}">${REP[n][1].toUpperCase()}</b>
      ${barraHtml(prox ? e.rep - REP[n][0] : 1, prox ? prox[0] - REP[n][0] : 1)}<small>${e.rep} pontos${prox ? ` · faltam ${prox[0] - e.rep} para ${prox[1]}` : ' · reputação máxima'}</small></div></div>`;
  }
  function abaHeroi(c) {
    const a = attr(), pt = pontos();
    c.innerHTML = topo() + `
      <h3 class="of-h">ATRIBUTOS ${pt > 0 ? `<em class="tp-pts">${pt} ponto${pt > 1 ? 's' : ''} para distribuir</em>` : ''}</h3>
      <ul class="tp-attr">${ATR.map(x => `<li><i>${x.i}</i><div><b>${x.n} <span>${a[x.k]}</span></b><small>${x.d}</small></div><button type="button" class="b-linha tp-mais" data-k="${x.k}" ${pt > 0 && a[x.k] < 10 ? '' : 'disabled'}>+1</button></li>`).join('')}</ul>
      <p class="m-nota">Você ganha 1 ponto a cada nível. Agora: +${Math.round((J.bonus.xp() - 1) * 100)}% XP · +${Math.round((J.bonus.vel() - 1) * 100)}% velocidade · ${Math.round(J.bonus.dobro() * 100)}% coleta em dobro.</p>
      <h3 class="of-h">REPUTAÇÃO VALE DE VERDADE</h3>
      <ul class="tp-lista">${REP.map(([min, n, cor], i) => `<li class="${T.eco && T.eco.rep >= min ? 'ok' : ''}"><b style="color:${cor}">${n}</b><small>${min} pts · ${['começo de todo viajante', 'libera a missão de história e votos', 'abre a sua loja na Feira e voto vale 2', 'voto vale 3', 'voto vale 4'][i]}</small></li>`).join('')}</ul>
      <p class="m-nota">Ganhe reputação e TIC com missões do dia (+5 TIC), pedidos (+8 TIC), dia perfeito (+10 TIC), coletas, fabricação, votação, evento e história. Tudo é contado no servidor, com limite por dia.</p>
      <h3 class="of-h">ARMEIRO · EQUIPAMENTOS COM PODERES</h3>
      <ul class="tp-equip">${Object.entries(EQUIP).map(([id, q]) => { const t = tenho(id), u = usando(id); return `<li style="--r:${RAR[q.r][0]}"><i>${q.i}</i><div><b>${q.n}</b><small>${RAR[q.r][1]} · ${q.slot} · ${q.d}${q.forja ? ` · forja com ${(G.BY[q.quem] || {}).nome || q.quem}: ${pedeTxt(q.forja)}` : ''}</small></div>
        ${t ? `<button type="button" class="${u ? 'b-ouro' : 'b-linha'} tp-usar" data-id="${id}">${u ? 'USANDO' : 'USAR'}</button>` : `<span class="tp-bts">${q.forja ? `<button type="button" class="b-linha tp-forja" data-id="${id}" ${temTudo(q.forja) ? '' : 'disabled'}>FORJAR</button>` : ''}<button type="button" class="b-ouro tp-comp" data-id="${id}" ${T.eco && T.eco.tic >= q.tic ? '' : 'disabled'}>${q.tic} TIC</button></span>`}</li>`; }).join('')}</ul>
      <p class="m-nota">Um equipamento por lugar do corpo (mãos, corpo, pés, extra). Os poderes valem para coletar, andar, ganhar XP e no evento; nas guerras que estão por vir, eles vão pesar ainda mais.</p>`;
    c.querySelectorAll('.tp-mais').forEach(b => b.onclick = () => { if (pontos() > 0) { attr()[b.dataset.k]++; J.salvar(); abaHeroi(c); } });
    c.querySelectorAll('.tp-usar').forEach(b => b.onclick = () => { equipar(b.dataset.id, !usando(b.dataset.id)); abaHeroi(c); });
    c.querySelectorAll('.tp-comp').forEach(b => b.onclick = () => J.envia({ t: 'equip_compra', id: b.dataset.id }));
    c.querySelectorAll('.tp-forja').forEach(b => b.onclick = () => {
      const q = EQUIP[b.dataset.id]; K.fechar();
      const lug = L.forja; J.anuncia({ titulo: 'FORJAR ' + q.n.toUpperCase(), texto: `Vá até a forja e jogue o minijogo do ferreiro.`, dur: 4000 });
      setTimeout(() => minijogo({ titulo: 'FORJA · ' + q.n.toUpperCase(), tipo: 'faixa', golpes: 3, vel: 1.5, larg: 0.22, txt: 'Bata no ferro quando o marcador passar na faixa' }, ok => {
        if (!ok || !temTudo(q.forja)) return; Object.entries(q.forja).forEach(([k, n]) => add(k, -n)); J.ganhaXp(25); J.envia({ t: 'equip_forja', id: b.dataset.id });
      }), dist(S.eu, { x: lug.sx, y: lug.sy }) < 40 ? 200 : 999999);
      if (dist(S.eu, { x: lug.sx, y: lug.sy }) >= 40) { S.camLivre = true; G.cam.x = lug.sx; G.cam.y = lug.sy - 8; }
    });
  }
  function abaHistoria(c) {
    const v = T.res && T.res.votacao, ev = T.res && T.res.evento, h = hist(), dentro = Date.now() < ESPIAO.prazo;
    const passos = ['Fale com o Yukine no santuário (precisa ser Conhecido)', 'Ache 3 pistas: cais, ponte e floresta (minijogo de investigar)', 'Confronte o Abdula', 'Leve as provas ao Egil Montfort', 'Cumprida!'];
    const totV = v ? v.ops.reduce((s, o) => s + o.v, 0) : 0;
    c.innerHTML = (v ? `<div class="md-bloco tp-voto"><h3>🗳️ VOTAÇÃO QUE MUDA O MAPA</h3><p><b>${esc(v.titulo)}</b> ${v.encerrada ? 'Encerrada.' : `Termina ${fmtData(v.fim)} (faltam ${falta(v.fim)}).`} O canteiro já está no mapa; quem vencer é erguido com as entregas da ilha.</p>
      ${v.ops.map(o => `<div class="tp-op ${v.meu === o.id ? 'meu' : ''}"><div><b>${esc(o.n)}</b>${barraHtml(o.v, totV || 1)}<small>${o.v} voto${o.v === 1 ? '' : 's'}${v.vencedor === o.id ? ' · VENCEU' : ''}</small></div>${!v.meu && !v.encerrada ? `<button type="button" class="b-ouro tp-votar" data-op="${o.id}">VOTAR</button>` : v.meu === o.id ? '<span class="tp-selo">SEU VOTO</span>' : ''}</div>`).join('')}
      <p class="m-nota">${v.votantes} pessoas votaram. O seu voto pesa pela sua reputação (Respeitado vale 2, Herói 3, Lenda 4). Votar dá +5 TIC.</p></div>` : '<p>Carregando a votação...</p>') +
      (ev ? `<div class="md-bloco"><h3>🔥 EVENTO: ${esc(ev.titulo).toUpperCase()}</h3><p>${ev.ativo ? `Até ${fmtData(ev.fim)}.` : 'Fora do horário.'} A ilha inteira vigia o mar contra o Reino do Sul. Vá a um dos 3 postos na praia do sul (tochas 🔥 no mapa) e jogue o minijogo da patrulha.</p>
      ${barraHtml(ev.total, ev.meta)}<small>${ev.total}/${ev.meta} patrulhas · ${ev.participantes} participantes · você: ${ev.meu || 0}</small>
      ${ev.top && ev.top.length ? `<p class="m-nota">Quem mais vigiou: ${ev.top.map(t => '@' + esc(t.arroba) + ' (' + t.n + ')').join(' · ')}</p>` : ''}
      <p class="m-nota">Se a ilha chegar à meta, todo mundo com pelo menos 3 patrulhas ganha 30 TIC e 20 de reputação.</p>
      ${ev.total >= ev.meta && (ev.meu || 0) >= 3 ? '<button type="button" class="b-ouro" id="tp-premio">PEGAR PRÊMIO DO EVENTO</button>' : ''}<button type="button" class="b-linha" id="tp-postos">VER OS POSTOS</button></div>` : '') +
      `<div class="md-bloco"><h3>📜 MISSÃO DE HISTÓRIA: O ESPIÃO</h3><p>${dentro ? `Prazo: ${fmtData(ESPIAO.prazo)} (faltam ${falta(ESPIAO.prazo)}).` : 'O prazo acabou.'} Alguém está mandando sinais ao Reino do Sul.</p>
      <ol class="jg-missoes">${passos.slice(0, 4).map((p, i) => `<li class="${h.passo > i ? 'ok' : ''}"><i>${h.passo > i ? '✓' : i + 1}</i><div><b>${esc(p)}</b>${i === 1 && h.passo >= 1 ? `<small>${Object.keys(h.pistas).length}/3 pistas</small>` : ''}</div></li>`).join('')}</ol>
      <p class="m-nota">Prêmio: título Caçador de Espiões, 120 XP, 50 TIC e 30 de reputação.</p></div>`;
    c.querySelectorAll('.tp-votar').forEach(b => b.onclick = () => J.envia({ t: 'votar', op: b.dataset.op }));
    const pr = c.querySelector('#tp-premio'); if (pr) pr.onclick = () => ganho('evento:costa1');
    const po = c.querySelector('#tp-postos'); if (po) po.onclick = () => { K.fechar(); S.camLivre = true; G.pararSeguir(); G.cam.x = POSTOS[1].x; G.cam.y = POSTOS[1].y - 10; if (G.cam.s < 3) G.cam.s = 3; };
  }
  function abaRanking(c) {
    c.innerHTML = topo() + '<p>Carregando o ranking...</p>';
    fetch('/temporada/ranking?eu=' + encodeURIComponent(S.eu.arroba), { cache: 'no-store' }).then(r => r.json()).then(j => {
      T.rank = j;
      c.innerHTML = topo() + `<h3 class="of-h">TOP 10 DA ILHA (XP)</h3>
        <ol class="tp-rank">${j.top.map((t, i) => `<li class="${t.arroba === S.eu.arroba ? 'eu' : ''}"><em>${i + 1}</em><b>@${esc(t.arroba)}</b><small>NV ${t.lv} · ${t.xp} XP · ${esc(t.repNome)}</small></li>`).join('') || '<li>Ninguém ainda. Seja o primeiro!</li>'}</ol>
        <p class="tp-pos">${j.pos ? `Você está em <b>#${j.pos}</b> de ${j.total} jogadores.` : `${j.total} jogadores no ranking. Jogue para aparecer!`}</p>
        <h3 class="of-h">MAIS RESPEITADOS</h3><ol class="tp-rank">${j.repTop.map((t, i) => `<li><em>${i + 1}</em><b>@${esc(t.arroba)}</b><small>${t.rep} de reputação · ${esc(t.nome)}</small></li>`).join('')}</ol>`;
    }).catch(() => { c.innerHTML = topo() + '<p>Não deu para carregar o ranking agora.</p>'; });
  }
  function abaCasa(c) {
    const casa = minhaCasa(), n = casa ? nivelCasa(S.eu.arroba) : 0, v = inv();
    const mats = ['madeira', 'minerio', 'tabua', 'prego', 'pedra'].map(k => `<li class="${v[k] ? '' : 'vazio'}"><i>${O.ITENS[k].i}</i><b>${v[k] || 0}</b><span>${O.ITENS[k].n}</span></li>`).join('');
    c.innerHTML = `<p>As casas dos moradores podem ser melhoradas em 3 etapas, e a ilha inteira vê no mapa. Cada etapa usa materiais de profissões diferentes: <b>tábuas e pedras do Igor</b>, <b>pregos do Kasseki</b>, que precisam de madeira do lenhador, minério da pedreira e pão do Lucas.</p>
      <ul class="of-inv">${mats}</ul>
      <ol class="jg-missoes">${CASA_NV.slice(1).map((x, i) => `<li class="${n > i ? 'ok' : ''}"><i>${n > i ? '✓' : i + 1}</i><div><b>${esc(x.n)}</b><small>${pedeTxt(x.pede)}${n === i ? (temTudo(x.pede) ? ' · você tem tudo!' : '') : ''}</small></div></li>`).join('')}</ol>
      ${casa ? `<p class="m-nota">Vá até a porta da sua casa e toque em <b>OBRA</b> para martelar (minijogo). Cada etapa dá +15 de reputação.</p><button type="button" class="b-ouro" id="tp-casa">IR PARA A MINHA CASA</button>`
        : '<p class="m-nota">Só os moradores têm casa. Comente NOME - PROFISSÃO - HISTÓRIA no Instagram ou no YouTube para virar morador. Viajantes podem fabricar e vender materiais na Feira para os moradores.</p>'}
      <h3 class="of-h">QUEM FAZ O QUÊ</h3><ul class="of-lista">${O.RECEITAS.filter(r => ['tabua', 'pedra', 'prego'].includes(r.item)).map(r => `<li><i>${O.ITENS[r.item].i}</i><div><b>${O.ITENS[r.item].n} · com ${esc((G.BY[r.quem] || {}).nome || r.quem)}</b><small>${pedeTxt(r.pede)} → ${r.sai || 1} · ${esc(r.jogo.txt)}</small></div></li>`).join('')}</ul>`;
    const b = c.querySelector('#tp-casa'); if (b) b.onclick = () => { K.fechar(); S.camLivre = true; G.cam.x = casa.x; G.cam.y = casa.y - 8; if (G.cam.s < 4) G.cam.s = 4; };
  }
  function abaFeira(c) {
    const e = T.eco || { tic: 0, rep: 0 }, pode = repNv(e.rep) >= 2, v = inv();
    c.innerHTML = topo() + '<p>Carregando a feira...</p>';
    fetch('/temporada/mercado', { cache: 'no-store' }).then(r => r.json()).then(j => {
      const of = j.ofertas || [], minhas = of.filter(o => o.a === S.eu.arroba), outras = of.filter(o => o.a !== S.eu.arroba);
      const porLoja = {}; outras.forEach(o => { (porLoja[o.a] = porLoja[o.a] || []).push(o); });
      const itens = Object.keys(O.ITENS).filter(k => v[k] > 0);
      c.innerHTML = topo() + `<p>A Feira fica do lado da fogueira (⚖️ no mapa). Cada loja é de um jogador de verdade, e tudo é pago em TIC, que vai direto para o dono da loja.</p>
        <h3 class="of-h">LOJAS DOS MEMBROS</h3>${Object.keys(porLoja).length ? Object.entries(porLoja).map(([ar, os]) => { const mo = moradorDe(ar); return `<div class="tp-loja"><b>🏪 Loja de ${mo ? esc(mo.nome) + ' · ' : ''}@${esc(ar)}</b><ul class="of-lista">${os.map(o => `<li><i>${O.ITENS[o.item] ? O.ITENS[o.item].i : '📦'}</i><div><b>${o.q}x ${esc(O.ITENS[o.item] ? O.ITENS[o.item].n : o.item)}</b><small>${o.preco} TIC</small></div><button type="button" class="b-ouro tp-compra" data-id="${o.id}" ${e.tic >= o.preco ? '' : 'disabled'}>COMPRAR</button></li>`).join('')}</ul></div>`; }).join('') : '<p class="m-nota">Ainda não tem lojas abertas. Seja o primeiro a vender!</p>'}
        <h3 class="of-h">MINHA LOJA</h3>${pode ? `${minhas.length ? `<ul class="of-lista">${minhas.map(o => `<li><i>${O.ITENS[o.item] ? O.ITENS[o.item].i : '📦'}</i><div><b>${o.q}x ${esc(O.ITENS[o.item] ? O.ITENS[o.item].n : o.item)}</b><small>${o.preco} TIC</small></div><button type="button" class="b-linha tp-retira" data-id="${o.id}">RETIRAR</button></li>`).join('')}</ul>` : ''}
          ${itens.length ? `<div class="tp-vender"><select id="tp-item">${itens.map(k => `<option value="${k}">${O.ITENS[k].i} ${esc(O.ITENS[k].n)} (${v[k]})</option>`).join('')}</select><input id="tp-q" type="number" min="1" max="10" value="1" aria-label="Quantidade"><input id="tp-p" type="number" min="1" max="500" value="5" aria-label="Preço em TIC"><button type="button" class="b-ouro" id="tp-vende">VENDER</button></div><p class="m-nota">Quantidade · preço em TIC. Até 4 ofertas por loja.</p>` : '<p class="m-nota">Sua mochila está vazia. Colete e fabrique para ter o que vender.</p>'}`
        : `<p class="m-nota">Para abrir a sua loja você precisa ser <b>Respeitado</b> (80 de reputação). Você tem ${e.rep}.</p>`}
        ${e.vendas && e.vendas.length ? `<p class="m-nota">Últimas vendas: ${e.vendas.map(x => `${x.q}x ${esc(nomeItem(x.item))} para @${esc(x.para)} (+${x.preco})`).join(' · ')}</p>` : ''}
        <h3 class="of-h">COMPRAR TIC (PIX)</h3><ul class="tp-pacotes">${PACOTES.map(([id, n, r, t]) => `<li><b>${t} TIC</b><small>${n}</small><button type="button" class="b-ouro tp-pix" data-id="${id}">R$ ${r},00</button></li>`).join('')}</ul>
        <p class="m-nota">O Pix é confirmado sozinho pelo Mercado Pago e o TIC cai na hora no @ que está jogando. TIC não volta a ser dinheiro. Tudo o que dá para comprar com TIC também dá para ganhar jogando. Menor de idade: peça para um responsável.</p>`;
      c.querySelectorAll('.tp-compra').forEach(b => b.onclick = () => J.envia({ t: 'comprar', id: +b.dataset.id }));
      c.querySelectorAll('.tp-retira').forEach(b => b.onclick = () => J.envia({ t: 'retirar', id: +b.dataset.id }));
      c.querySelectorAll('.tp-pix').forEach(b => b.onclick = () => pedePix(b.dataset.id));
      const vd = c.querySelector('#tp-vende'); if (vd) vd.onclick = () => {
        const item = c.querySelector('#tp-item').value, q = Math.max(1, Math.min(10, +c.querySelector('#tp-q').value | 0)), preco = Math.max(1, Math.min(500, +c.querySelector('#tp-p').value | 0));
        if ((inv()[item] || 0) < q) { J.anuncia({ titulo: 'FEIRA', texto: 'Você não tem tudo isso na mochila.', dur: 3000 }); return; }
        J.envia({ t: 'oferta', item, q, preco });
      };
    }).catch(() => { c.innerHTML = topo() + '<p>Não deu para abrir a feira agora.</p>'; });
  }
  function abaNatal(c) {
    const pr = presenteHoje(), aberto = (S.perfil.natal || {})[pr.dia];
    c.innerHTML = `<div class="md-bloco"><h3>🎄 NATAL NA ILHA</h3><p>A árvore está acesa na fogueira e a ilha está coberta de neve. Todo dia tem <b>um presente escondido</b> em algum lugar da ilha: ache, abra no minijogo e ganhe materiais, 30 XP e 15 TIC.</p>
      <p>${aberto ? 'Você já abriu o presente de hoje. Amanhã tem outro!' : 'O presente de hoje ainda está escondido. Dica: procure o brilho dourado 🎁 no mapa.'}</p></div>`;
  }

  // ---------------------------------------------------------------- Pix dos pacotes de TIC
  let pixAtual = null, pixPoll = null;
  function pedePix(id) { pixAtual = { id }; J.envia({ t: 'pix', item: id }); K.abrir('COMPRAR TIC', '<p>Gerando o Pix no Mercado Pago...</p>'); }
  function pixMsg(m) {
    if (!pixAtual) return;
    if (m.t === 'pix') {
      if (m.erro) { K.abrir('COMPRAR TIC', `<p>${esc(m.erro)}</p>`); pixAtual = null; return; }
      pixAtual.pid = m.id;
      K.abrir('PIX · ' + PACOTES.find(p => p[0] === m.item)[3] + ' TIC', `<div class="lj-pix"><img alt="QR Code do Pix" src="data:image/png;base64,${m.img}" width="220" height="220" style="image-rendering:pixelated;background:#fff;padding:8px"><p>Valor: <b>R$ ${Number(m.valor).toFixed(2).replace('.', ',')}</b></p><textarea readonly rows="3" style="width:100%">${esc(m.qr)}</textarea><div class="m-botoes"><button type="button" class="b-ouro" id="tp-copia">COPIAR PIX</button></div><p class="m-nota">Esperando o pagamento... o TIC cai sozinho quando o Mercado Pago confirmar.</p></div>`, el => {
        el.querySelector('#tp-copia').onclick = e => { const t = el.querySelector('textarea'); t.select(); try { navigator.clipboard.writeText(t.value); } catch (er) { document.execCommand('copy'); } e.currentTarget.textContent = 'COPIADO!'; };
      });
      clearInterval(pixPoll); pixPoll = setInterval(() => { if (pixAtual && pixAtual.pid) J.envia({ t: 'pixstatus', id: pixAtual.pid }); else clearInterval(pixPoll); }, 5000);
    }
    if (m.t === 'pixstatus' && pixAtual && m.id === pixAtual.pid && m.status === 'approved') {
      clearInterval(pixPoll); pixAtual = null; J.envia({ t: 'eco' });
      K.abrir('COMPRA CONFIRMADA!', '<p>O seu TIC já está na conta. Obrigado por apoiar a ilha! 🏝️</p>');
    }
  }

  // ---------------------------------------------------------------- desenho no mapa
  const P = (c, x, y, w, h, cor) => { c.fillStyle = cor; c.fillRect(Math.round(x), Math.round(y), w, h); };
  function estagio() {
    const v = T.res && T.res.votacao; if (!v) return { qual: null, f: 0 };
    const com = (O.comunidade || {}), f = v.encerrada ? Math.min(1, (com.total || 0) / Math.max(1, com.meta || 300)) : 0;
    return { qual: v.encerrada ? v.vencedor : null, f, lider: v.lider };
  }
  function placa(c, x, y, cor) { P(c, x, y - 9, 1, 9, '#5a3a22'); P(c, x - 4, y - 12, 9, 5, '#c9a46a'); P(c, x - 4, y - 12, 9, 1, '#e2c48a'); P(c, x - 3, y - 10, 7, 1, cor || '#5a3a22'); P(c, x - 4, y - 8, 9, 1, '#8a6a42'); }
  function canteiro(c, x, y, w) {
    for (let i = -w; i <= w; i += 6) { P(c, x + i, y - 3, 1, 4, '#8a6a42'); P(c, x + i, y - 3, 1, 1, '#e8483a'); }
    P(c, x - w, y - 2, w * 2 + 1, 1, 'rgba(232,72,58,.55)');
  }
  // textura de pedra: juntas horizontais e tijolos alternados
  function juntas(c, x0, y0, w, h) {
    for (let yy = 3; yy < h; yy += 3) { c.fillStyle = 'rgba(60,56,50,.35)'; c.fillRect(x0, y0 + yy, w, 1); for (let xx = ((yy / 3) % 2) * 3; xx < w; xx += 6) c.fillRect(x0 + xx, y0 + yy - 2, 1, 2); }
  }
  function fortaleza(c, x, y, f, t) {
    // pedra clara, telhado vermelho do dragão; cresce em 4 etapas
    const pedra = '#9a948a', luz = '#b8b2a6', sombra = '#6e6a62', tel = '#a8322c', tel2 = '#7a2420';
    P(c, x - 22, y - 1, 44, 3, 'rgba(0,0,0,.3)');
    P(c, x - 20, y - 4, 40, 4, sombra); P(c, x - 20, y - 4, 40, 1, luz); // fundação
    if (f < 0.25) {
      // canteiro: contorno da obra, pilhas de pedra e madeira e um guindaste de madeira
      P(c, x - 20, y - 16, 1, 12, '#8a6a42'); P(c, x + 19, y - 16, 1, 12, '#8a6a42'); P(c, x - 20, y - 16, 40, 1, 'rgba(201,164,106,.6)');
      [[-15, 0], [-10, 0], [-12, -3]].forEach(([dx, dy]) => { P(c, x + dx, y - 7 + dy, 5, 3, pedra); P(c, x + dx, y - 7 + dy, 5, 1, luz); });
      [[3, 0], [3, -2], [3, -4]].forEach(([dx, dy]) => P(c, x + dx, y - 6 + dy, 9, 2, dy % 4 ? '#a8743e' : '#8a5a32'));
      P(c, x + 15, y - 24, 1, 20, '#6a4a2a'); P(c, x + 6, y - 24, 12, 1, '#6a4a2a'); P(c, x + 7, y - 23, 1, 5 + Math.floor(t / 600) % 3, '#3a3a3a'); P(c, x + 6, y - 18 + Math.floor(t / 600) % 3, 3, 2, pedra);
      return;
    }
    const hm = f < 0.5 ? 8 : f < 0.75 ? 14 : 18;
    P(c, x - 18, y - 4 - hm, 36, hm, pedra); juntas(c, x - 18, y - 4 - hm, 36, hm); P(c, x - 18, y - 4 - hm, 36, 1, luz); P(c, x + 17, y - 4 - hm, 1, hm, sombra);
    if (hm >= 14) { P(c, x - 13, y - hm + 1, 2, 4, '#2a2c3c'); P(c, x + 11, y - hm + 1, 2, 4, '#2a2c3c'); }
    for (let i = 0; i < 6; i++) P(c, x - 18 + i * 7, y - 6 - hm, 4, 2, pedra); // ameias
    P(c, x - 3, y - 11, 6, 7, '#3a261a'); P(c, x - 3, y - 11, 6, 1, '#5a3a22');
    if (f < 0.5) { for (let i = 0; i < 5; i++) P(c, x - 20 + i * 10, y - 4 - hm - 6, 1, hm + 6, '#8a6a42'); P(c, x - 20, y - 4 - hm - 6, 41, 1, '#8a6a42'); return; } // andaimes
    // torre de observação
    const th = f < 0.75 ? 14 : 26;
    P(c, x + 6, y - 4 - hm - th, 10, th, pedra); juntas(c, x + 6, y - 4 - hm - th, 10, th); P(c, x + 6, y - 4 - hm - th, 10, 1, luz); P(c, x + 15, y - 4 - hm - th, 1, th, sombra);
    P(c, x + 9, y - 4 - hm - th + 5, 3, 4, '#2a2c3c');
    if (f >= 0.75) { P(c, x + 5, y - 6 - hm - th, 12, 2, tel); P(c, x + 7, y - 8 - hm - th, 8, 2, tel); P(c, x + 9, y - 10 - hm - th, 4, 2, tel2); }
    if (f >= 1) {
      // bandeiras do dragão e plataforma de pouso
      const o = Math.floor(t / 300) % 2;
      [[x - 16, y - 4 - hm], [x + 11, y - 10 - hm - th]].forEach(([bx, by]) => { P(c, bx, by - 10, 1, 10, '#4a3a2a'); P(c, bx + 1, by - 10, 5 + o, 3, '#c8302a'); P(c, bx + 2, by - 9, 2, 1, '#ffd046'); });
      P(c, x - 16, y - 5 - hm, 14, 1, '#c9a46a'); P(c, x - 12, y - 4 - hm - 3, 6, 1, '#ffd046');
    }
  }
  function muralha(c, x, y, f, t) {
    const pedra = '#9a948a', luz = '#b8b2a6', sombra = '#6e6a62';
    if (f < 0.25) { canteiro(c, x, y, 16); P(c, x - 6, y - 4, 5, 3, pedra); P(c, x + 3, y - 4, 5, 3, pedra); return; }
    const h = f < 0.5 ? 4 : f < 0.75 ? 7 : 9;
    P(c, x - 18, y - 1, 36, 2, 'rgba(0,0,0,.3)'); P(c, x - 17, y - h, 34, h, pedra); juntas(c, x - 17, y - h, 34, h); P(c, x - 17, y - h, 34, 1, luz); P(c, x - 17, y - 1, 34, 1, sombra);
    if (f >= 0.75) for (let i = 0; i < 6; i++) P(c, x - 17 + i * 6, y - h - 2, 3, 2, pedra);
    if (f >= 1) { const o = Math.floor(t / 400) % 2; P(c, x, y - h - 9, 1, 8, '#4a3a2a'); P(c, x + 1, y - h - 9, 4 + o, 3, '#2f6aa8'); }
  }
  function tocha(c, x, y, t, acesa) {
    P(c, x, y - 9, 1, 9, '#5a3a22'); P(c, x - 1, y - 10, 3, 2, '#3a2a1a');
    if (acesa) { const f = Math.floor(t / 120) % 3; P(c, x - 1, y - 13 - (f === 1 ? 1 : 0), 3, 3, '#ff8a2a'); P(c, x, y - 14 - f % 2, 1, 2, '#ffd046'); }
  }
  function barraca(c, x, y) {
    // a Feira: barraca listrada com balança
    P(c, x - 11, y - 1, 22, 2, 'rgba(0,0,0,.28)');
    P(c, x - 9, y - 8, 18, 7, '#8a5a32'); P(c, x - 9, y - 8, 18, 1, '#a8743e');
    for (let i = 0; i < 5; i++) P(c, x - 11 + i * 4.4, y - 15, 4, 4, i % 2 ? '#f1ead8' : '#c8433a');
    P(c, x - 11, y - 11, 22, 1, '#7a2a24'); P(c, x - 10, y - 11, 1, 10, '#5a3a22'); P(c, x + 9, y - 11, 1, 10, '#5a3a22');
    P(c, x - 6, y - 10, 3, 2, '#e2c070'); P(c, x - 1, y - 10, 2, 2, '#4ac07a'); P(c, x + 3, y - 10, 3, 2, '#9fd0e0');
  }
  function melhorias(c, h, n, t) {
    const x = h.x, y = h.y;
    if (n >= 1) { // cerca e jardim
      for (let i = -15; i <= 15; i += 3) P(c, x + i, y + 1, 1, 3, '#c9a46a');
      P(c, x - 15, y + 2, 31, 1, '#a8844a'); P(c, x - 2, y + 1, 4, 3, 'rgba(0,0,0,0)');
      [[-13, '#e84a8a'], [-10, '#ffd046'], [10, '#e84a8a'], [13, '#9ad0ff']].forEach(([dx, cor]) => { P(c, x + dx, y - 2, 2, 1, cor); P(c, x + dx, y - 1, 2, 1, '#4a8a3a'); });
    }
    if (n >= 2) { // varanda, lanterna e caixas de flores
      P(c, x - 9, y - 12, 18, 1, '#6a4a2a'); P(c, x - 7, y - 5, 3, 1, '#4a8a3a'); P(c, x + 4, y - 5, 3, 1, '#4a8a3a');
      P(c, x - 12, y - 8, 1, 8, '#3a2a1a'); const lit = Math.floor(t / 500) % 4; P(c, x - 13, y - 10, 3, 3, lit ? '#ffd36a' : '#ffb84a');
    }
    if (n >= 3) { // torre de vigia com bandeira
      P(c, x + 10, y - 26, 7, 26, '#8a6a4a'); P(c, x + 10, y - 26, 7, 1, '#a8885a'); P(c, x + 16, y - 26, 1, 26, 'rgba(0,0,0,.25)');
      P(c, x + 9, y - 28, 9, 2, '#7a2430'); P(c, x + 12, y - 22, 3, 3, '#2a2c3c');
      const o = Math.floor(t / 350) % 2; P(c, x + 13, y - 36, 1, 8, '#4a3a2a'); P(c, x + 14, y - 36, 5 + o, 3, '#ffd046');
    }
  }
  const NEVE = Array.from({ length: 140 }, (_, i) => [G.rnd('neve', i, 'x'), G.rnd('neve', i, 'y'), 0.5 + G.rnd('neve', i, 'v')]);
  function arvoreNatal(c, x, y, t) {
    P(c, x - 9, y - 1, 18, 2, 'rgba(0,0,0,.3)'); P(c, x - 1, y - 4, 3, 4, '#5a3a22');
    [[0, 9], [5, 7], [10, 5], [14, 3]].forEach(([dy, w], i) => P(c, x - w, y - 8 - dy, w * 2 + 1, 5, i % 2 ? '#2a6a3a' : '#2f7a42'));
    P(c, x - 1, y - 26, 3, 3, '#ffd046'); P(c, x, y - 27, 1, 1, '#fff6b0');
    const k = Math.floor(t / 400);
    [[-6, -9, '#e84a3a'], [5, -10, '#4aa0ff'], [-3, -14, '#ffd046'], [3, -18, '#e84a3a'], [-1, -21, '#4ac07a'], [6, -6, '#ffd046'], [-7, -6, '#b070ff']].forEach(([dx, dy, cor], i) => { if ((i + k) % 3) P(c, x + dx, y + dy, 1, 1, cor); });
    P(c, x - 7, y - 3, 4, 3, '#c8302a'); P(c, x - 6, y - 3, 1, 3, '#ffd046'); P(c, x + 4, y - 3, 4, 3, '#2f6aa8'); P(c, x + 5, y - 3, 1, 3, '#f1ead8');
  }
  G.hooks.push((objs, c, info) => {
    const t = info.t, st = estagio();
    // votação: canteiro dos dois projetos até sair o resultado; depois só o vencedor, crescendo com as entregas
    if (!st.qual || st.qual === 'fortaleza') objs.push({ y: FORTALEZA.y, f: () => { if (st.qual) fortaleza(c, FORTALEZA.x, FORTALEZA.y, st.f, t); else { canteiro(c, FORTALEZA.x, FORTALEZA.y + 3, 24); fortaleza(c, FORTALEZA.x, FORTALEZA.y, 0.1, t); placa(c, FORTALEZA.x - 24, FORTALEZA.y + 2, '#c8302a'); } } });
    if (!st.qual || st.qual === 'muralha') MURALHA.forEach(([x, y], i) => objs.push({ y, f: () => { if (st.qual) muralha(c, x, y, st.f, t); else { canteiro(c, x, y, 14); if (i === 1) placa(c, x + 20, y, '#2f6aa8'); } } }));
    // evento: 3 postos de vigia na praia do sul
    if (eventoAtivo()) POSTOS.forEach(p => objs.push({ y: p.y, f: () => tocha(c, p.x, p.y, t + p.x * 7, true) }));
    // a Feira
    objs.push({ y: FEIRA.y, f: () => barraca(c, FEIRA.x, FEIRA.y) });
    // casas melhoradas (todo mundo vê) e plaquinha de loja na casa de quem vende
    const casas = (T.res && T.res.casas) || {}, lojas = new Set((T.res && T.res.lojas) || []);
    G.MOR.forEach(m => {
      if (!m.arroba || !m._casaObj || m._casaObj.donos[0] !== m || !G.arrived(m, t)) return;
      const ar = m.arroba.toLowerCase(), n = casas[ar] || 0, h = m._casaObj;
      if (n) objs.push({ y: h.y + 0.5, f: () => melhorias(c, h, n, t) });
      if (lojas.has(ar)) objs.push({ y: h.y + 3, f: () => placa(c, h.x - 15, h.y + 4, '#ffd046') });
    });
    // Natal
    if (natalAtivo()) {
      objs.push({ y: NATAL_ARV.y, f: () => arvoreNatal(c, NATAL_ARV.x, NATAL_ARV.y, t) });
      const pr = presenteHoje(); if (!(S.perfil && (S.perfil.natal || {})[pr.dia])) objs.push({ y: pr.y, f: () => { const b = Math.floor(t / 300) % 2; P(c, pr.x - 3, pr.y - 5, 7, 5, '#c8302a'); P(c, pr.x, pr.y - 5, 1, 5, '#ffd046'); P(c, pr.x - 3, pr.y - 3, 7, 1, '#ffd046'); P(c, pr.x - 1, pr.y - 7, 3, 2, '#ffd046'); if (b) P(c, pr.x + 3, pr.y - 9, 1, 1, '#fff6b0'); } });
    }
  });
  // neve por cima de tudo (no Natal) e marcadores em tela
  window.IlhaTexto.push((ctx, scr, fs, info) => {
    const t = info.t;
    if (natalAtivo()) {
      const W = ctx.canvas.width / (window.devicePixelRatio || 1), H = ctx.canvas.height / (window.devicePixelRatio || 1);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      NEVE.forEach(([nx, ny, v], i) => { const x = (nx * W + Math.sin(t / 900 + i) * 12) % W, y = (ny * H + t / 1000 * 28 * v) % H; ctx.fillRect(Math.round(x), Math.round(y), v > 1.1 ? 3 : 2, v > 1.1 ? 3 : 2); });
    }
    const sobe = Math.round(Math.sin(t / 260) * 2);
    ctx.font = `${fs + 2}px sans-serif`; ctx.textAlign = 'center';
    const marca = (x, y, txt) => { const [sx, sy] = scr(x, y); ctx.fillText(txt, sx, sy + sobe); };
    marca(FEIRA.x, FEIRA.y - 24, '⚖️');
    if (!S.on) return;
    if (eventoAtivo()) POSTOS.forEach(p => marca(p.x, p.y - 22, '🔥'));
    const h = hist(); if (h.passo === 1 && Date.now() < ESPIAO.prazo) ESPIAO.pistas.forEach(p => { if (!h.pistas[p.id]) marca(p.x, p.y - 18, '🔍'); });
    const st = estagio(); if (!st.qual) { marca(FORTALEZA.x, FORTALEZA.y - 34, '🗳️'); }
    const j = T.jogo; if (!j || !S.eu) return;
    const [px, py] = scr(S.eu.x, S.eu.y - 34), Wb = 96, Hb = 12, x0 = px - Wb / 2, y0 = py - Hb;
    ctx.fillStyle = 'rgba(10,12,16,.88)'; ctx.fillRect(x0 - 4, y0 - 4, Wb + 8, Hb + 8);
    ctx.font = `bold ${Math.max(9, fs)}px Silkscreen, monospace`;
    if (j.tipo === 'faixa') { ctx.fillStyle = '#3a3f4a'; ctx.fillRect(x0, y0, Wb, Hb); ctx.fillStyle = '#ffd046'; ctx.fillRect(x0 + j.z0 * Wb, y0, j.larg0 * Wb, Hb); ctx.fillStyle = '#fff'; ctx.fillRect(x0 + cursor(j) * Wb - 1.5, y0 - 3, 3, Hb + 6); }
    else if (j.tipo === 'reacao') { const ok = j.fase === 'agora'; ctx.fillStyle = ok ? '#ffd046' : '#3a3f4a'; ctx.fillRect(x0, y0, Wb, Hb); ctx.fillStyle = ok ? '#1a1410' : '#cfd3da'; ctx.fillText(ok ? 'AGORA!' : 'espere...', px, y0 + Hb - 2); }
    else { ctx.fillStyle = ['#4ac07a', '#a04ad0', '#c8433a'][j.cor]; ctx.fillRect(x0, y0, Wb, Hb); ctx.fillStyle = '#0a0c10'; ctx.fillText(['VERDE', 'ROXA', 'VERMELHA'][j.cor], px, y0 + Hb - 2); }
    for (let i = 0; i < j.golpes; i++) { ctx.fillStyle = i < j.hits ? '#4ac07a' : 'rgba(255,255,255,.3)'; ctx.fillRect(px - j.golpes * 5 + i * 10, y0 + Hb + 6, 7, 4); }
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < j.falhas ? '#c8433a' : 'rgba(255,255,255,.12)'; ctx.fillRect(px + Wb / 2 - 22 + i * 8, y0 - 12, 5, 4); }
  });

  // bloco na aba de missões e aviso no painel ao vivo
  const blocoMissoes = corpo => {
    if (!S.on) return;
    const d = document.createElement('div'); d.className = 'md-bloco';
    const v = T.res && T.res.votacao, ev = T.res && T.res.evento;
    d.innerHTML = `<h3>🏰 TEMPORADA DA ILHA</h3><p>${v && !v.encerrada && !v.meu ? '🗳️ Vote no que a ilha constrói primeiro. ' : ''}${ev && ev.ativo ? `🔥 Vigília da Costa Sul: ${ev.total}/${ev.meta}. ` : ''}📜 Missão de história com prazo · 🏆 ranking · 🏠 casas · ⚖️ feira · ⚔️ equipamentos.</p><button type="button" class="b-ouro">ABRIR A TEMPORADA</button>`;
    d.querySelector('button').onclick = () => abrir(1); corpo.prepend(d);
  };
  window.IlhaTemporada = { abrir, bloco: blocoMissoes, ganho, EQUIP, REP, T };
  setTimeout(() => { const F = window.IlhaFeed; if (F) F.push({ k: 'chegada', html: '<b>Temporada nova!</b> Vote no que a ilha constrói primeiro, patrulhe a costa sul e ganhe TIC. Toque em JOGAR e depois em 🏰 ILHA.', dur: 16000 }); }, 15000);
})();
