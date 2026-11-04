/* A Grande Ilha — modo viajante.
   Quem quiser entra com o @ do Instagram, monta um personagem e anda pela ilha junto
   com os outros visitantes (servidor: classe Vila em worker.js). Conversa com os
   moradores, cumpre as missões do dia e desbloqueia conquistas. Os moradores dos
   comentários continuam exatamente iguais: os viajantes só visitam. */
(function () {
  'use strict';
  const G = window.GrandeIlha, SP = window.IlhaSprites, ROT = window.IlhaRotinas, K = window.IlhaComunidade;
  if (!G || !K) return;
  const $ = id => document.getElementById(id);
  const { store, esc, limpaArroba, abrir, fechar, abas, anuncia, copiar } = K;
  const VEL = 34, EMOTES = ['Oi!', 'Que ilha linda!', 'Bora explorar?', '♥', 'Haha!', 'Até mais!'];
  const nivel = xp => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 60));
  const xpNivel = lv => 60 * (lv - 1) ** 2;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // o @ de quem comentou liga o viajante ao próprio morador (campo arroba em moradores.js)
  const moradorDe = arroba => G.MOR.find(m => m.arroba && m.arroba.toLowerCase() === arroba) || null;
  const moradorAtivo = (arroba, t) => { const m = moradorDe(arroba); return m && t >= m._ch + 120e3 ? m : null; };
  const visualDe = v => (v.mor ? v.mor.visual : v.look);
  const nomeDe = v => (v.mor ? v.mor.nome.toUpperCase() : '@' + v.arroba);

  // ---------------------------------------------------------------- estado
  const S = { ws: null, on: false, eu: null, outros: new Map(), perfil: null, codigo: '', camLivre: false, conversa: null, falas: [], fim: false, tent: 0, ping: null, mudou: false };
  window.IlhaJogo = { get on() { return S.on; }, S };

  // ---------------------------------------------------------------- visual
  const PALETA = {
    pele: ['#f4d0b4', '#f0c4a0', '#e0a882', '#c99a74', '#a87452', '#8a5a3a', '#6e432c', '#4e2e1e'],
    corCabelo: ['#1a120e', '#3a2a1a', '#6a3e2a', '#b88a4a', '#e2c070', '#c0461e', '#e2e2e2', '#6a4ad0', '#3a8a6a'],
    roupa: ['#3a6a8a', '#b8424e', '#5a7a3a', '#d68a3a', '#6b4a8a', '#2a2a2e', '#e6e2d6', '#c8a24a', '#2f8a8a', '#8a2e5a'],
    calca: ['#3a3028', '#2a3a5a', '#4a4038', '#1c1c20', '#5a4630', '#3c3656']
  };
  const CABELOS = [['curto', 'Curto'], ['longo', 'Longo'], ['rabo', 'Rabo'], ['espetado', 'Espetado'], ['coque', 'Coque'], ['careca', 'Careca']];
  const CHAPEUS = [['', 'Nenhum'], ['palha', 'Palha'], ['capuz', 'Capuz'], ['gorro', 'Gorro'], ['bandana', 'Bandana'], ['faixa', 'Faixa'], ['oculos', 'Óculos'], ['marinheiro', 'Marinheiro']];
  const sorteia = l => l[Math.floor(Math.random() * l.length)];
  function lookAleatorio() {
    const v = { tipo: 'humano', pele: sorteia(PALETA.pele), cabelo: sorteia(CABELOS)[0], corCabelo: sorteia(PALETA.corCabelo), roupa: sorteia(PALETA.roupa), calca: sorteia(PALETA.calca) };
    const ch = sorteia(CHAPEUS)[0]; if (ch) { v.chapeu = ch; v.corChapeu = sorteia(PALETA.roupa); }
    if (Math.random() < 0.3) v.barba = v.corCabelo;
    return v;
  }
  function editorVisual(el, look, mudou) {
    const linhaCores = (k, nome) => `<div class="jg-op"><span>${nome}</span><div class="jg-cores" data-k="${k}">${PALETA[k].map(c => `<button type="button" data-v="${c}" style="--c:${c}" aria-label="${nome} ${c}"></button>`).join('')}</div></div>`;
    const linhaOpc = (k, nome, ops) => `<div class="jg-op"><span>${nome}</span><div class="jg-opc" data-k="${k}">${ops.map(([v, n]) => `<button type="button" data-v="${v}">${n}</button>`).join('')}</div></div>`;
    el.innerHTML = `<div class="jg-editor"><div class="jg-prev"><canvas width="16" height="20"></canvas><button type="button" class="b-linha" data-sortear>SORTEAR</button></div><div class="jg-ops">
      ${linhaCores('pele', 'Pele')}${linhaOpc('cabelo', 'Cabelo', CABELOS)}${linhaCores('corCabelo', 'Cor do cabelo')}
      ${linhaCores('roupa', 'Roupa')}${linhaCores('calca', 'Calça')}${linhaOpc('chapeu', 'Chapéu', CHAPEUS)}
      ${linhaOpc('barba', 'Barba', [['', 'Sem'], ['sim', 'Com']])}${linhaOpc('manto', 'Roupa longa', [['', 'Não'], ['sim', 'Sim']])}</div></div>`;
    const cv = el.querySelector('canvas'), c = cv.getContext('2d');
    const pinta = () => {
      c.clearRect(0, 0, 16, 20); SP.drawCharacter(c, 8, 17, look, { t: 0, side: 1, dir: 'down' });
      el.querySelectorAll('[data-k]').forEach(g => {
        const k = g.dataset.k;
        const atual = k === 'barba' ? (look.barba ? 'sim' : '') : k === 'manto' ? (look.manto ? 'sim' : '') : (look[k] || '');
        g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === atual)));
      });
      mudou(look);
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-sortear')) { Object.keys(look).forEach(k => delete look[k]); Object.assign(look, lookAleatorio()); pinta(); return; }
      const g = b.closest('[data-k]'); if (!g) return;
      const k = g.dataset.k, v = b.dataset.v;
      if (k === 'barba') { if (v) look.barba = look.corCabelo; else delete look.barba; }
      else if (k === 'manto') { if (v) look.manto = true; else delete look.manto; }
      else if (k === 'chapeu') { if (v) { look.chapeu = v; look.corChapeu = look.corChapeu || look.roupa; } else { delete look.chapeu; delete look.corChapeu; } }
      else { look[k] = v; if (k === 'corCabelo' && look.barba) look.barba = v; }
      pinta();
    });
    pinta();
  }

  // ---------------------------------------------------------------- perfil, missões e conquistas
  const LUGARES = Object.keys(G.LUG);
  const novoPerfil = () => ({ v: 1, xp: 0, lugares: {}, conversas: {}, passos: 0, missoes: 0, cumprimentos: 0, dias: [], conquistas: {}, diaria: null });
  const conta = o => Object.keys(o || {}).length;
  const eApoiador = arroba => (K.ativos(Date.now()) || []).some(a => a.arroba === arroba);
  const chegados = () => G.MOR.filter(m => G.arrived(m, Date.now()));
  const CONQ = [
    { id: 'chegada', nome: 'Terra à vista', desc: 'Desembarque na ilha pela primeira vez', xp: 20, ok: () => true },
    { id: 'curioso', nome: 'Curioso', desc: 'Visite 5 lugares diferentes', xp: 40, ok: p => conta(p.lugares) >= 5 },
    { id: 'explorador', nome: 'Explorador', desc: 'Visite todos os lugares da ilha', xp: 150, ok: p => LUGARES.every(k => p.lugares[k]) },
    { id: 'papo', nome: 'Bom de papo', desc: 'Converse com 3 moradores', xp: 30, ok: p => conta(p.conversas) >= 3 },
    { id: 'amigo', nome: 'Amigo da vila', desc: 'Converse com 10 moradores diferentes', xp: 100, ok: p => conta(p.conversas) >= 10 },
    { id: 'todos', nome: 'Conhece todo mundo', desc: 'Converse com todos os moradores da ilha', xp: 200, ok: p => chegados().every(m => p.conversas[m.id]) },
    { id: 'andarilho', nome: 'Andarilho', desc: 'Caminhe 3.000 passos', xp: 80, ok: p => p.passos >= 3000 },
    { id: 'coruja', nome: 'Coruja da madrugada', desc: 'Fique na fogueira entre meia-noite e 4h', xp: 60 },
    { id: 'madrugador', nome: 'Madrugador', desc: 'Vá ao pasto entre 5h e 7h, quando as ovelhas saem', xp: 60 },
    { id: 'recepcao', nome: 'Comitê de boas-vindas', desc: 'Esteja no cais quando um morador desembarcar', xp: 80 },
    { id: 'diaperfeito', nome: 'Dia perfeito', desc: 'Complete as 3 missões de um dia', xp: 50 },
    { id: 'missoes10', nome: 'Mão na massa', desc: 'Complete 10 missões', xp: 100, ok: p => p.missoes >= 10 },
    { id: 'fiel', nome: 'Visitante fiel', desc: 'Entre na ilha em 3 dias diferentes', xp: 80, ok: p => p.dias.length >= 3 },
    { id: 'sociavel', nome: 'Sociável', desc: 'Cumprimente 5 viajantes de perto', xp: 60, ok: p => p.cumprimentos >= 5 },
    { id: 'apoiador', nome: 'Coração da ilha', desc: 'Tenha o selo de apoiador', xp: 100, ok: () => S.eu && eApoiador(S.eu.arroba) },
    { id: 'veterano', nome: 'Veterano', desc: 'Chegue ao nível 5', xp: 0, ok: p => nivel(p.xp) >= 5 }
  ];

  function missoesDoDia(dia) {
    const r = k => G.rnd('missao', dia, k);
    const lug = ['taverna', 'forja', 'oficina', 'laboratorio', 'biblioteca', 'arena', 'fazenda', 'pasto', 'cais', 'torre', 'santuario', 'ponte'];
    const L = lug[Math.floor(r('l') * lug.length)];
    const mor = G.MOR.filter(m => G.arrived(m, G.DIA2 + (dia - 1) * 864e5)), M = mor[Math.floor(r('m') * mor.length)] || G.MOR[0];
    const extra = [
      { k: 'conversar', meta: 3, xp: 40, txt: 'Converse com 3 moradores diferentes' },
      { k: 'passos', meta: 400, xp: 30, txt: 'Caminhe 400 passos pela ilha' },
      { k: 'fogueira', meta: 60, xp: 30, txt: 'Fique 1 minuto perto da fogueira' }
    ];
    if (K.APO.length) extra.push({ k: 'mascote', meta: 1, xp: 30, txt: 'Visite o mascote de um apoiador' });
    return [
      { k: 'lugar:' + L, meta: 1, xp: 30, txt: 'Visite: ' + G.LUG[L].nome },
      { k: 'encontrar:' + M.id, meta: 1, xp: 50, txt: `Encontre ${M.nome} (${M.profissao.toLowerCase()}) e puxe conversa` },
      extra[Math.floor(r('x') * extra.length)]
    ];
  }
  function diaria() {
    const p = S.perfil, dia = G.diaDe(Date.now());
    if (!p.diaria || p.diaria.dia !== dia) p.diaria = { dia, prog: {}, feitas: {}, conv: {}, bonus: 0 };
    if (!p.dias.includes(dia)) { p.dias.push(dia); p.dias = p.dias.slice(-30); }
    return p.diaria;
  }
  function ganhaXp(n) {
    const p = S.perfil, antes = nivel(p.xp); p.xp += n;
    const lv = nivel(p.xp);
    if (S.eu) S.eu.lv = lv;
    if (lv > antes) anuncia({ titulo: `NÍVEL ${lv}!`, texto: `@${S.eu.arroba} subiu de nível. Continue explorando!`, dur: 5000 });
  }
  function conquista(id) {
    const p = S.perfil, c = CONQ.find(x => x.id === id);
    if (!c || p.conquistas[id]) return;
    p.conquistas[id] = Date.now(); ganhaXp(c.xp); S.mudou = true;
    anuncia({ titulo: 'CONQUISTA!', texto: `${c.nome}: ${c.desc}${c.xp ? ` (+${c.xp} XP)` : ''}`, acao: 'VER', fn: () => abrirPainel(1), dur: 6000 });
  }
  function avanca(k, n, absoluto) {
    const d = diaria(), ms = missoesDoDia(d.dia), m = ms.find(x => x.k === k);
    if (!m || d.feitas[k]) return;
    d.prog[k] = absoluto ? n : (d.prog[k] || 0) + n;
    if (d.prog[k] >= m.meta) {
      d.feitas[k] = 1; S.perfil.missoes++; ganhaXp(m.xp); S.mudou = true;
      anuncia({ titulo: 'MISSÃO CUMPRIDA!', texto: `${m.txt} (+${m.xp} XP)`, dur: 5000 });
      if (ms.every(x => d.feitas[x.k]) && !d.bonus) { d.bonus = 1; ganhaXp(50); conquista('diaperfeito'); }
    }
    atualizaBarra();
  }
  function revisa() { CONQ.forEach(c => { if (c.ok && !S.perfil.conquistas[c.id] && c.ok(S.perfil)) conquista(c.id); }); }

  function registra(tipo, v) {
    if (!S.on || !S.perfil) return;
    const p = S.perfil;
    if (tipo === 'lugar') { if (!p.lugares[v]) { p.lugares[v] = 1; S.mudou = true; } avanca('lugar:' + v, 1, true); }
    if (tipo === 'conversa') {
      const d = diaria();
      if (!p.conversas[v]) { p.conversas[v] = 1; S.mudou = true; }
      if (!d.conv[v]) { d.conv[v] = 1; avanca('conversar', conta(d.conv), true); }
      avanca('encontrar:' + v, 1, true);
    }
    if (tipo === 'passos') { p.passos += v; avanca('passos', v); }
    if (tipo === 'fogueira') avanca('fogueira', v);
    if (tipo === 'mascote') avanca('mascote', 1, true);
    if (tipo === 'cumprimento') { p.cumprimentos++; S.mudou = true; }
    revisa();
  }
  const salvaLocal = () => { if (S.eu) store.set('perfil:' + S.eu.arroba, S.perfil); };
  setInterval(() => {
    if (!S.on || !S.mudou) return;
    S.mudou = false; salvaLocal(); envia({ t: 'perfil', perfil: S.perfil });
  }, 5000);

  function lugarDe(x, y) {
    for (const k of LUGARES) {
      if (k === 'floresta') continue;
      const L = G.LUG[k];
      if (Math.hypot(x - L.x, y - L.y) < Math.max(20, L.r + 14) || Math.hypot(x - L.sx, y - L.sy) < 16) return k;
    }
    if (((x - 350) / 175) ** 2 + ((y - 138) / 78) ** 2 < 0.8) return 'floresta';
    return null;
  }

  // a cada meio segundo: onde o viajante está, o que está acontecendo perto dele
  let passosAcum = 0;
  setInterval(() => {
    atualizaJogados();
    if (!S.on) return;
    const t = Date.now(), eu = S.eu, h = G.localHours(t), aqui = lugarDe(eu.x, eu.y);
    if (aqui) registra('lugar', aqui);
    if (aqui === 'fogueira') { registra('fogueira', 0.5); if (h < 4) conquista('coruja'); }
    if (aqui === 'pasto' && h >= 5 && h < 7) conquista('madrugador');
    if (G.MOR.some(m => { const q = G.posAt(m, t); return q && q.arriving && Math.hypot(q.x - eu.x, q.y - eu.y) < 48; })) conquista('recepcao');
    if ((K.quadro() || []).some(q => Math.hypot(q.p.x - eu.x, q.p.y - eu.y) < 16)) registra('mascote');
    if (passosAcum >= 1) { const n = Math.floor(passosAcum); passosAcum -= n; registra('passos', n); }
    if (S.conversa) {
      const m = G.BY[S.conversa], q = m && G.posAt(m, t);
      if (!q || q.hidden) S.conversa = null;
      else if (Math.hypot(q.x - eu.x, q.y - eu.y) < 24) { conversar(m); S.conversa = null; }
      else vaiPara(q.x, q.y + 4, true);
    }
    S.falas = S.falas.filter(f => f.ate > t);
  }, 500);

  function atualizaJogados() {
    const t = Date.now(), J = G.jogados; J.clear();
    if (!S.on) return;
    [S.eu, ...S.outros.values()].forEach(v => {
      const antes = v.mor, m = moradorAtivo(v.arroba, t);
      if (m && !antes && v === S.eu) {
        // o morador acabou de chegar à ilha: o dono assume o personagem onde ele estiver
        const p = G.posAt(m, t);
        if (p && !p.hidden) { v.x = v.tx = p.x; v.y = v.ty = p.y; envia({ t: 'alvo', x: v.x, y: v.y }); }
        anuncia({ titulo: 'VOCÊ É ' + m.nome.toUpperCase() + '!', texto: `Agora você controla o seu morador (${m.profissao.toLowerCase()}). Quando sair, ele volta à rotina.`, dur: 7000 });
        setTimeout(atualizaUI, 50);
      }
      v.mor = m;
      if (m) J.set(m.id, v.arroba);
    });
  }
  function conversar(m) {
    const R = ROT[m.rotina] || {}, linhas = (R.social || []).concat(R.trabalho || []);
    const txt = linhas.length ? linhas[Math.floor(Math.random() * linhas.length)] : '...';
    S.falas = S.falas.filter(f => f.quem !== m.id);
    S.falas.push({ quem: m.id, txt, ate: Date.now() + 4500 });
    registra('conversa', m.id);
  }

  // ---------------------------------------------------------------- rede
  function envia(m) { if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(m)); }
  function conectar(arroba, codigo, look, fim) {
    if (S.ws) { try { S.ws.close(); } catch (e) { } }
    let ws, respondeu = false;
    try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/jogo'); }
    catch (e) { fim('Não deu para conectar à ilha agora.'); return; }
    S.ws = ws; S.fim = false;
    ws.onopen = () => ws.send(JSON.stringify({ t: 'entrar', arroba, codigo, look }));
    ws.onmessage = e => {
      if (e.data === 'pong') return;
      let m; try { m = JSON.parse(e.data); } catch (err) { return; }
      if (m.t === 'erro') { respondeu = true; fim(m.motivo, m.precisaCodigo); try { ws.close(); } catch (err) { } return; }
      if (m.t === 'ok') { respondeu = true; entrou(m, codigo); fim(null); return; }
      if (ws === S.ws) recebe(m);
    };
    ws.onclose = () => {
      clearInterval(S.ping);
      if (ws !== S.ws) return;
      if (!respondeu) { fim('A ilha não respondeu. Tente de novo em instantes.'); return; }
      if (S.on && !S.fim) {
        S.on = false; atualizaUI();
        if (S.tent++ < 6) setTimeout(() => { if (!S.fim) conectar(arroba, store.get('codigo:' + arroba, ''), S.eu.look, () => { }); }, Math.min(30000, 1500 * 2 ** S.tent));
      }
    };
  }
  function entrou(m, codigo) {
    const arroba = m.eu.arroba, voltou = !!S.eu && S.eu.arroba === arroba;
    const pos = voltou ? { x: S.eu.x, y: S.eu.y } : { x: m.eu.x, y: m.eu.y };
    S.eu = Object.assign({}, m.eu, pos, { tx: pos.x, ty: pos.y, s: 1 });
    const meu = moradorDe(arroba), ativo = moradorAtivo(arroba, Date.now());
    if (ativo && !voltou) {
      const p = G.posAt(ativo, Date.now()), h = ativo._home;
      const q = p && !p.hidden ? p : h ? { x: h.x, y: h.y + 4 } : null;
      if (q) { S.eu.x = S.eu.tx = q.x; S.eu.y = S.eu.ty = q.y; }
    }
    S.eu.mor = ativo;
    if (m.codigo) store.set('codigo:' + arroba, m.codigo); else if (codigo) store.set('codigo:' + arroba, codigo);
    S.codigo = store.get('codigo:' + arroba, '');
    const local = store.get('perfil:' + arroba, null);
    S.perfil = Object.assign(novoPerfil(), m.perfil && (!local || (m.perfil.xp || 0) >= (local.xp || 0)) ? m.perfil : local || {});
    S.eu.lv = nivel(S.perfil.xp);
    S.outros = new Map((m.outros || []).map(o => [o.id, Object.assign(o, { tx: o.x, ty: o.y, s: 1 })]));
    S.on = true; S.tent = 0; S.camLivre = false;
    store.set('jogador', { arroba, look: m.eu.look }); store.set('jogando', 1);
    clearInterval(S.ping); S.ping = setInterval(() => { try { S.ws.send('ping'); } catch (e) { } }, 45000);
    G.pararSeguir(); if (G.cam.s < 4) G.cam.s = 4; G.cam.x = S.eu.x; G.cam.y = S.eu.y - 8;
    if (S.eu.x !== m.eu.x || S.eu.y !== m.eu.y) envia({ t: 'alvo', x: S.eu.x, y: S.eu.y });
    if (!voltou) {
      diaria(); revisa(); S.mudou = true;
      if (ativo) anuncia({ titulo: 'VOCÊ É ' + ativo.nome.toUpperCase() + '!', texto: 'Você está jogando com o seu morador. Ande, converse e cumpra missões. Quando sair, ele volta à rotina.', dur: 8000 });
      else if (meu) anuncia({ titulo: 'BEM-VINDO, ' + meu.nome.toUpperCase() + '!', texto: `Seu morador chega de barco ${new Date(meu._ch).getTime() > Date.now() ? 'em breve' : 'agora'}. Até lá, você explora como viajante.`, dur: 8000 });
      else anuncia({ titulo: 'VOCÊ DESEMBARCOU!', texto: 'Toque no chão para andar e num morador para conversar. Veja suas missões em ⚑.', dur: 7000 });
    }
    atualizaJogados();
    atualizaUI();
    if (m.codigo) mostraCodigo(m.codigo, true);
  }
  function recebe(m) {
    const o = S.outros.get(m.id);
    if (m.t === 'entrou') S.outros.set(m.id, Object.assign(m, { tx: m.x, ty: m.y, s: 1 }));
    else if (m.t === 'saiu') { S.outros.delete(m.id); atualizaJogados(); }
    else if (m.t === 'alvo' && o) { o.tx = m.x; o.ty = m.y; }
    else if (m.t === 'visual' && o) o.look = m.look;
    else if (m.t === 'lv' && o) o.lv = m.lv;
    else if (m.t === 'emote') { const v = m.id === S.eu.id ? S.eu : o; if (v) v.emote = { txt: EMOTES[m.i] || '', ate: Date.now() + 4000 }; }
    else if (m.t === 'fim') { S.fim = true; S.on = false; store.set('jogando', 0); atualizaUI(); anuncia({ titulo: 'VOCÊ SAIU DA ILHA', texto: m.motivo, dur: 6000 }); }
    if (m.t === 'entrou' || m.t === 'saiu') atualizaBarra();
  }
  function sair() {
    S.fim = true; S.on = false; store.set('jogando', 0);
    if (S.mudou) { salvaLocal(); envia({ t: 'perfil', perfil: S.perfil }); }
    setTimeout(() => { try { S.ws && S.ws.close(); } catch (e) { } }, 200);
    S.outros.clear(); G.jogados.clear(); atualizaUI(); fechar();
  }

  // ---------------------------------------------------------------- movimento
  let ultimoEnvio = 0, envioPendente = null;
  function vaiPara(x, y, silencioso) {
    if (!S.on) return;
    S.eu.tx = x; S.eu.ty = y;
    if (!silencioso) S.camLivre = false;
    const agora = Date.now();
    clearTimeout(envioPendente);
    if (agora - ultimoEnvio > 150) { ultimoEnvio = agora; envia({ t: 'alvo', x, y }); }
    else envioPendente = setTimeout(() => { ultimoEnvio = Date.now(); envia({ t: 'alvo', x: S.eu.tx, y: S.eu.ty }); }, 160);
  }
  function passo(v, dt, meu) {
    const dx = v.tx - v.x, dy = v.ty - v.y, d = Math.hypot(dx, dy);
    if (!meu && d > 140) { v.x = v.tx; v.y = v.ty; v.anda = false; return; }
    if (d < 0.6) { v.anda = false; return; }
    const st = Math.min(d, VEL * dt), nx = v.x + dx / d * st, ny = v.y + dy / d * st;
    if (meu && !G.andavel(nx, ny)) { v.tx = v.x; v.ty = v.y; v.anda = false; envia({ t: 'alvo', x: v.x, y: v.y }); return; }
    v.x = nx; v.y = ny; v.anda = true;
    if (Math.abs(dx) > 0.4) v.s = dx > 0 ? 1 : -1;
    v.dir = dy < -Math.abs(dx) ? 'up' : 'down';
    if (meu) passosAcum += st / 2;
  }
  const teclas = new Set();
  const DIRS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
  window.addEventListener('keydown', e => {
    if (!S.on || !DIRS[e.code] || /INPUT|TEXTAREA/.test(e.target.tagName) || !document.querySelector('.modal').hidden) return;
    e.preventDefault(); teclas.add(e.code);
  });
  window.addEventListener('keyup', e => { if (teclas.delete(e.code) && !teclas.size && S.on) vaiPara(S.eu.x, S.eu.y); });
  window.addEventListener('blur', () => teclas.clear());
  setInterval(() => {
    if (!S.on || !teclas.size) return;
    let dx = 0, dy = 0; teclas.forEach(k => { dx += DIRS[k][0]; dy += DIRS[k][1]; });
    if (!dx && !dy) return;
    const n = Math.hypot(dx, dy), x = S.eu.x + dx / n * 10, y = S.eu.y + dy / n * 10;
    if (G.andavel(x, y)) vaiPara(x, y);
  }, 120);

  // tocar no chão anda; tocar num morador vai até ele e puxa conversa
  window.IlhaClique = (cx, cy, q) => {
    if (!S.on) return false;
    S.camLivre = false;
    if (q) {
      if (Math.hypot(q.p.x - S.eu.x, q.p.y - S.eu.y) < 24) conversar(q.m);
      else { S.conversa = q.m.id; vaiPara(q.p.x, q.p.y + 4); }
      return true;
    }
    S.conversa = null;
    const w = G.toWorld(cx, cy);
    if (G.andavel(w.x, w.y)) { vaiPara(w.x, w.y); S.marca = { x: w.x, y: w.y, ate: Date.now() + 600 }; }
    return true;
  };
  const stage = $('ilha'); let arrasto = null;
  stage.addEventListener('pointerdown', e => { arrasto = { x: e.clientX, y: e.clientY }; });
  stage.addEventListener('pointermove', e => { if (arrasto && Math.abs(e.clientX - arrasto.x) + Math.abs(e.clientY - arrasto.y) > 6) S.camLivre = true; });
  stage.addEventListener('pointerup', () => { arrasto = null; });

  // ---------------------------------------------------------------- desenho
  let ultimoT = 0;
  const fase = id => { let h = 0; for (const ch of String(id)) h = h * 31 + ch.charCodeAt(0) | 0; return (h >>> 0) % 100 / 10; };
  G.hooks.push((objs, c, info) => {
    const dt = Math.min(0.6, Math.max(0, (info.t - ultimoT) / 1000)); ultimoT = info.t;
    if (!S.on) return;
    // passos pequenos: mesmo com poucos quadros por segundo, ninguém atravessa parede
    for (let r = dt; r > 0; r -= 0.05) { const d = Math.min(0.05, r); passo(S.eu, d, true); S.outros.forEach(o => passo(o, d, false)); }
    [S.eu, ...S.outros.values()].forEach(v => objs.push({ y: v.y, f: () => SP.drawCharacter(c, v.x, v.y, visualDe(v), { t: info.sec + fase(v.id), walking: v.anda, side: v.s, dir: v.dir || 'down' }) }));
    if (S.marca && S.marca.ate > info.t) { const k = (S.marca.ate - info.t) / 600 * 3; objs.push({ y: S.marca.y - 1, f: () => { G.P(c, S.marca.x - k, S.marca.y, 1, 1, '#ffd046'); G.P(c, S.marca.x + k, S.marca.y, 1, 1, '#ffd046'); G.P(c, S.marca.x, S.marca.y - k / 2, 1, 1, '#ffd046'); G.P(c, S.marca.x, S.marca.y + k / 2, 1, 1, '#ffd046'); } }); }
    if (!S.camLivre && !G.cam.follow) { G.cam.x += (S.eu.x - G.cam.x) * 0.15; G.cam.y += (S.eu.y - 8 - G.cam.y) * 0.15; }
  });
  function bolha(ctx, sx, sy, txt, fs) {
    ctx.font = `${fs === 16 ? 14 : 12}px "Pixelify Sans", monospace`;
    const w = Math.ceil(ctx.measureText(txt).width) + 12, h = fs === 16 ? 22 : 18;
    const bx = Math.round(sx - w / 2), by = Math.round(sy - h);
    ctx.fillStyle = '#f7f2e4'; ctx.fillRect(bx, by, w, h); ctx.fillRect(bx + 2, by - 2, w - 4, h + 4);
    ctx.fillStyle = '#1b1a1f'; ctx.fillRect(Math.round(sx) - 2, by + h + 2, 4, 3);
    ctx.fillStyle = '#f7f2e4'; ctx.fillRect(Math.round(sx) - 2, by + h + 1, 4, 3);
    ctx.fillStyle = '#2a2420'; ctx.fillText(txt, sx, by + h - (fs === 16 ? 6 : 5));
  }
  window.IlhaTexto.push((ctx, scr, fs, info) => {
    if (!S.on) return;
    const agora = Date.now(), ocupados = [];
    // o meu nome primeiro; os outros sobem um degrau quando encostariam num nome já escrito
    [S.eu, ...[...S.outros.values()].sort((a, b) => b.y - a.y)].forEach(v => {
      let [sx, sy] = scr(v.x, v.y - 19);
      const label = (eApoiador(v.arroba) ? '★ ' : '') + nomeDe(v) + ' · NV ' + (v.lv || 1);
      ctx.font = `${fs}px Silkscreen, monospace`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,16,0.9)'; ctx.lineJoin = 'round';
      const w = ctx.measureText(label).width, h = fs + 4;
      for (let k = 0; k < 6 && ocupados.some(o => Math.abs(o.x - sx) < (o.w + w) / 2 + 4 && Math.abs(o.y - sy) < h); k++) sy -= h;
      ocupados.push({ x: sx, y: sy, w });
      ctx.strokeText(label, sx, sy); ctx.fillStyle = v === S.eu ? '#ffd046' : '#bea0ff'; ctx.fillText(label, sx, sy);
      if (v.emote && v.emote.ate > agora) bolha(ctx, sx, sy - fs - 6, v.emote.txt, fs);
    });
    S.falas.forEach(f => {
      const m = G.BY[f.quem], p = m && G.posAt(m, info.t);
      if (!p || p.hidden) return;
      const [sx, sy] = scr(p.x, p.y - 19);
      bolha(ctx, sx, sy - fs - 30, f.txt, fs);
    });
  });

  // ---------------------------------------------------------------- interface
  const barra = document.createElement('div');
  barra.className = 'jogo-barra px'; barra.hidden = true; barra.setAttribute('role', 'toolbar'); barra.setAttribute('aria-label', 'Controles do viajante');
  barra.innerHTML = `<button type="button" class="jb jb-m" id="jb-missoes"><i>⚑</i><span>0/3</span></button>
    <button type="button" class="jb" id="jb-falar" aria-haspopup="true" aria-expanded="false"><i>☺</i><span>FALAR</span></button>
    <button type="button" class="jb" id="jb-visual"><i>✎</i><span>VISUAL</span></button>
    <button type="button" class="jb" id="jb-centro" aria-label="Centralizar no meu personagem"><i>⌖</i></button>
    <span class="jb-online" id="jb-online"></span>
    <div class="jb-emotes px" id="jb-emotes" hidden>${EMOTES.map((e, i) => `<button type="button" data-i="${i}">${esc(e)}</button>`).join('')}</div>`;
  document.querySelector('.meio').prepend(barra);
  $('jb-missoes').onclick = () => abrirPainel(0);
  $('jb-visual').onclick = abrirVisual;
  $('jb-centro').onclick = () => { S.camLivre = false; G.pararSeguir(); if (G.cam.s < 4) G.cam.s = 4; };
  const emo = $('jb-emotes');
  $('jb-falar').onclick = () => { emo.hidden = !emo.hidden; $('jb-falar').setAttribute('aria-expanded', String(!emo.hidden)); };
  emo.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const i = +b.dataset.i; envia({ t: 'emote', i }); S.eu.emote = { txt: EMOTES[i], ate: Date.now() + 4000 }; emo.hidden = true; $('jb-falar').setAttribute('aria-expanded', 'false');
    if ([...S.outros.values()].some(o => dist(o, S.eu) < 40)) registra('cumprimento');
  });
  function atualizaBarra() {
    if (!S.on) return;
    const d = diaria(), ms = missoesDoDia(d.dia), n = ms.filter(m => d.feitas[m.k]).length;
    $('jb-missoes').querySelector('span').textContent = n + '/3';
    const on = S.outros.size;
    $('jb-online').textContent = on ? `${on} ${on === 1 ? 'VIAJANTE' : 'VIAJANTES'}` : '';
  }
  function atualizaUI() {
    barra.hidden = !S.on; emo.hidden = true;
    const b = $('btn-jogar');
    if (S.on) { b.innerHTML = ''; b.appendChild(SP.icon(visualDe(S.eu), 1)); b.insertAdjacentHTML('beforeend', `<span class="pj-nome">@${esc(S.eu.arroba)} · </span><span class="pj-nv">NV ${S.eu.lv}</span>`); b.setAttribute('aria-label', `Seu perfil: @${S.eu.arroba}, nível ${S.eu.lv}`); b.onclick = () => abrirPainel(2); }
    else { b.innerHTML = '<span>▶ JOGAR</span>'; b.onclick = abrirEntrar; }
    atualizaBarra();
  }
  setInterval(() => { if (S.on) { atualizaBarra(); const s = $('btn-jogar').querySelector('.pj-nv'); if (s) s.textContent = `NV ${S.eu.lv}`; } }, 1000);

  function abrirEntrar() {
    const salvo = store.get('jogador', null);
    const look = Object.assign({}, (salvo && salvo.look) || lookAleatorio());
    let arroba = salvo ? salvo.arroba : limpaArroba(store.get('arroba', ''));
    abrir('ENTRAR NA ILHA', `
      <p class="m-lead">Vire um viajante: monte seu personagem, ande pela ilha, converse com os moradores e cumpra missões. Quem estiver jogando vê você também.</p>
      <label class="m-campo"><span>Seu @ do Instagram</span><input id="jg-arroba" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="@seu_usuario" value="${esc(arroba ? '@' + arroba : '')}"></label>
      <label class="m-campo" id="jg-cod-box" hidden><span>Código de acesso ou de convite</span><input id="jg-codigo" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX"></label>
      <button type="button" class="jg-link" id="jg-tenho">Já joguei em outro aparelho (tenho um código)</button>
      <p class="m-nota">Seu @ aparece em cima do personagem para todos. Nomes ofensivos são bloqueados.</p>
      <div class="jg-ed-box"><h3>SEU VISUAL</h3><div id="jg-ed"></div></div>
      <p class="m-erro" id="jg-erro" role="alert" hidden></p>
      <div class="m-botoes"><button type="button" class="b-ouro" id="jg-entrar">ENTRAR NA ILHA</button><button type="button" class="b-linha" id="jg-assistir">SÓ ASSISTIR</button></div>`,
    el => {
      editorVisual(el.querySelector('#jg-ed'), look, () => { });
      const cod = el.querySelector('#jg-codigo'), box = el.querySelector('#jg-cod-box'), err = el.querySelector('#jg-erro'), btn = el.querySelector('#jg-entrar');
      const mostraCod = () => { box.hidden = false; el.querySelector('#jg-tenho').hidden = true; };
      el.querySelector('#jg-tenho').onclick = () => { mostraCod(); cod.focus(); };
      const dica = document.createElement('p'); dica.className = 'jg-dica'; dica.hidden = true; el.querySelector('#jg-cod-box').before(dica);
      const confere = () => {
        const m = moradorDe(limpaArroba(el.querySelector('#jg-arroba').value));
        dica.hidden = !m;
        if (m) { dica.innerHTML = `Esse @ é do morador <b>${esc(m.nome)}</b> (${esc(m.profissao.toLowerCase())})! Você vai jogar com ele.`; }
        el.querySelector('#jg-ed').closest('.jg-ed-box').hidden = !!m;
      };
      el.querySelector('#jg-arroba').addEventListener('input', confere);
      el.querySelector('#jg-assistir').onclick = fechar;
      const vai = () => {
        arroba = limpaArroba(el.querySelector('#jg-arroba').value);
        if (arroba.length < 2) { err.textContent = 'Digite o seu @ do Instagram.'; err.hidden = false; return; }
        const codigo = cod.value.trim() || store.get('codigo:' + arroba, '');
        err.hidden = true; btn.disabled = true; btn.textContent = 'ENTRANDO...';
        conectar(arroba, codigo, look, (motivo, precisaCodigo) => {
          btn.disabled = false; btn.textContent = 'ENTRAR NA ILHA';
          if (!motivo) { if (!$('modal-t').textContent.startsWith('GUARDE')) fechar(); return; }
          err.textContent = motivo; err.hidden = false;
          if (precisaCodigo) { mostraCod(); cod.focus(); }
        });
      };
      btn.onclick = vai; confere();
      el.querySelectorAll('#jg-arroba, #jg-codigo').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') vai(); }));
    });
  }
  function abrirVisual() {
    if (!S.on) return;
    if (S.eu.mor) {
      abrir('SEU VISUAL', `<p class="m-lead">Você está jogando com <b>${esc(S.eu.mor.nome)}</b>, então o visual é o do seu morador, igual ao da ilha.</p><p class="m-nota">Quer mudar alguma coisa nele? Peça no direct do @${esc(K.IG)}.</p><div class="m-botoes"><button type="button" class="b-ouro" id="jg-ok">ENTENDI</button></div>`, el => { el.querySelector('#jg-ok').onclick = fechar; });
      return;
    }
    const look = Object.assign({}, S.eu.look);
    abrir('SEU VISUAL', '<div id="jg-ed"></div><div class="m-botoes"><button type="button" class="b-ouro" id="jg-salvar">SALVAR VISUAL</button><button type="button" class="b-linha" id="jg-cancelar">CANCELAR</button></div>', el => {
      editorVisual(el.querySelector('#jg-ed'), look, () => { });
      el.querySelector('#jg-cancelar').onclick = fechar;
      el.querySelector('#jg-salvar').onclick = () => { S.eu.look = look; envia({ t: 'visual', look }); store.set('jogador', { arroba: S.eu.arroba, look }); atualizaUI(); fechar(); };
    });
  }
  function mostraCodigo(codigo, primeira) {
    abrir('GUARDE SEU CÓDIGO', `
      <p class="m-lead">${primeira ? 'Seu viajante foi criado! ' : ''}Para entrar com <b>@${esc(S.eu.arroba)}</b> em outro aparelho, você vai precisar deste código:</p>
      <p class="jg-codigo">${esc(codigo)}</p>
      <p class="m-nota">Ele protege o seu @: sem o código, ninguém entra no seu lugar. Neste aparelho você entra direto. Ele também fica em PERFIL.</p>
      <div class="m-botoes"><button type="button" class="b-linha" id="cd-copiar">COPIAR CÓDIGO</button><button type="button" class="b-ouro" id="cd-ok">ENTENDI</button></div>`,
    el => { el.querySelector('#cd-copiar').onclick = e => copiar(codigo, e.currentTarget); el.querySelector('#cd-ok').onclick = fechar; });
  }

  function abrirPainel(aba) {
    if (!S.on) return abrirEntrar();
    abrir(S.eu.mor ? S.eu.mor.nome.toUpperCase() + ' · @' + S.eu.arroba.toUpperCase() : 'VIAJANTE @' + S.eu.arroba.toUpperCase(), '<div class="abas" role="tablist"></div><div class="aba-corpo"></div>', el => {
      const feitas = conta(S.perfil.conquistas);
      abas(el, ['MISSÕES', `CONQUISTAS ${feitas}/${CONQ.length}`, 'PERFIL'], aba || 0, (i, corpo) => [abaMissoes, abaConquistas, abaPerfil][i](corpo));
    });
  }
  function abaMissoes(corpo) {
    const d = diaria(), ms = missoesDoDia(d.dia);
    corpo.innerHTML = `<p>Missões do <b>Dia ${d.dia}</b>, iguais para todos os viajantes. Novas missões todo dia às 21h (Brasília).</p>
      <ol class="jg-missoes">${ms.map(m => {
        const v = Math.min(m.meta, Math.floor(d.prog[m.k] || 0)), ok = !!d.feitas[m.k];
        return `<li class="${ok ? 'ok' : ''}"><i aria-hidden="true">${ok ? '✓' : '⚑'}</i><div><b>${esc(m.txt)}</b><div class="m-barra"><i style="width:${Math.round(v / m.meta * 100)}%"></i></div><small>${ok ? 'Cumprida' : `${v} / ${m.meta}`} · +${m.xp} XP</small></div></li>`;
      }).join('')}</ol>
      <p class="m-nota">${d.bonus ? 'Você completou o dia! +50 XP de bônus.' : 'Complete as 3 para ganhar +50 XP de bônus.'}</p>
      <p class="m-nota">Dica: toque num morador para ir até ele e puxar conversa. No computador, ande com as setas ou W A S D.</p>`;
  }
  function abaConquistas(corpo) {
    corpo.innerHTML = `<ul class="jg-conq">${CONQ.map(c => { const ok = S.perfil.conquistas[c.id]; return `<li class="${ok ? 'ok' : ''}"><i aria-hidden="true">${ok ? '★' : '?'}</i><div><b>${esc(c.nome)}</b><small>${esc(c.desc)}${c.xp ? ` · +${c.xp} XP` : ''}</small></div></li>`; }).join('')}</ul>`;
  }
  function abaPerfil(corpo) {
    const p = S.perfil, lv = nivel(p.xp), a = xpNivel(lv), b = xpNivel(lv + 1);
    corpo.innerHTML = `<div class="jg-perfil"><div class="jg-perfil-ic"></div><div><b class="jg-nome">@${esc(S.eu.arroba)}</b><span>Nível ${lv} · ${p.xp} XP</span>
      <div class="m-barra"><i style="width:${Math.round((p.xp - a) / (b - a) * 100)}%"></i></div><small>Faltam ${b - p.xp} XP para o nível ${lv + 1}</small></div></div>
      <ul class="jg-stats"><li><b>${conta(p.lugares)}/${LUGARES.length}</b><span>lugares</span></li><li><b>${conta(p.conversas)}</b><span>moradores conhecidos</span></li><li><b>${p.passos}</b><span>passos</span></li><li><b>${p.missoes}</b><span>missões</span></li></ul>
      <div class="m-chave"><span>Código de acesso (para entrar em outro aparelho)</span><code>${esc(S.codigo || 'neste aparelho você entra direto')}</code>${S.codigo ? '<button type="button" class="b-linha" id="pf-cod">COPIAR CÓDIGO</button>' : ''}</div>
      <div class="m-botoes"><button type="button" class="b-linha" id="pf-visual">MUDAR VISUAL</button><button type="button" class="b-linha" id="pf-sair">SAIR DA ILHA</button></div>`;
    corpo.querySelector('.jg-perfil-ic').appendChild(SP.icon(visualDe(S.eu), 4));
    if (S.codigo) corpo.querySelector('#pf-cod').onclick = e => copiar(S.codigo, e.currentTarget);
    corpo.querySelector('#pf-visual').onclick = abrirVisual;
    corpo.querySelector('#pf-sair').onclick = sair;
  }

  atualizaUI();
  // quem já jogava neste aparelho volta direto como viajante
  const salvo = store.get('jogador', null);
  if (store.get('jogando', 0) && salvo && salvo.arroba && store.get('codigo:' + salvo.arroba, '')) {
    setTimeout(() => conectar(salvo.arroba, store.get('codigo:' + salvo.arroba, ''), salvo.look, motivo => { if (motivo) store.set('jogando', 0); }), 800);
  }
  window.addEventListener('pagehide', () => { if (S.on && S.mudou) { salvaLocal(); envia({ t: 'perfil', perfil: S.perfil }); } });
})();
