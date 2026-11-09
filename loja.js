/* A Grande Ilha — LOJA DA ILHA (itens só visuais, Pix confirmado pelo Mercado Pago).
   O preço é decidido no servidor; a compra vai pela conexão do JOGAR (o item fica no @ logado).
   No mapa: tricórnio, capa, asas (batem ao andar), aura (faíscas), Brasinha (bebê dragão que segue),
   nome dourado, moldura de ouro na sua carta e bandeira na casa do morador. */
(function () {
  'use strict';
  // LOJA FORA DO AR (artes em revisão): só abre com ?lojateste=1 para testes internos
  if (!/lojateste/.test(location.search)) return;
  const G = window.GrandeIlha, SP = window.IlhaSprites, K = window.IlhaComunidade, J = window.IlhaJogo;
  if (!G || !SP || !K || !J) return;
  const S = J.S, esc = K.esc;
  const TESTE = /lojateste/.test(location.search);
  const ITENS = [
    { id: 'tricornio', n: 'Chapéu de mago', d: 'Chapéu pontudo com faixa vermelha', v: 3, r: 'comum', tipo: 'CHAPÉU' },
    { id: 'capa', n: 'Capa encapuzada', d: 'Capa azul com capuz e broche de ouro', v: 5, r: 'raro', tipo: 'COSTAS' },
    { id: 'asas', n: 'Asas de dragão', d: 'Batem quando você anda', v: 8, r: 'epico', tipo: 'COSTAS · ANIMADA' },
    { id: 'aura', n: 'Aura de brasas', d: 'Faíscas de fogo sobem quando você anda', v: 6, r: 'raro', tipo: 'EFEITO ANIMADO' },
    { id: 'brasinha', n: 'Mascote Brasinha', d: 'Um bebê dragão que te segue pela ilha', v: 10, r: 'lendario', tipo: 'MASCOTE' },
    { id: 'nome', n: 'Nome dourado', d: 'Seu @ brilha em ouro no mapa', v: 3, r: 'comum', tipo: 'NOME NO MAPA' },
    { id: 'moldura', n: 'Moldura de ouro', d: 'Sua carta com moldura ornamentada', v: 4, r: 'comum', tipo: 'SUA CARTA' },
    { id: 'bandeira', n: 'Estandarte na casa', d: 'Só para moradores: o estandarte do leão na sua casa', v: 5, r: 'raro', tipo: 'CASA DO MORADOR', morador: true }
  ];
  if (TESTE) ITENS.push({ id: 'teste', n: 'Item de teste', d: 'Só para testar o Pix (não faz nada)', v: 1, r: 'comum', tipo: 'TESTE' });
  const RAR = { comum: ['#b8bcc8', '#6a6e78', 'COMUM'], raro: ['#4aa0ff', '#1e4a8a', 'RARO'], epico: ['#b070ff', '#4a2a7a', 'ÉPICO'], lendario: ['#ffd046', '#b8862e', 'LENDÁRIO'] };
  const tem = (v, id) => !!(v && v.loja && v.loja.includes(id));
  const P = (c, x, y, w, h, cor) => { c.fillStyle = cor; c.fillRect(x, y, w, h); };

  // ---------------------------------------------------------------- desenhos (origem = pés do personagem, virado para a direita)
  const IM = () => (window.IlhaLojaPixel && window.IlhaLojaPixel.IMG) || {};
  const ok = i => i && i.complete && i.naturalWidth;
  // chapéu de mago (arte do criador), aba em cima da cabeça
  function tricornio(c) { const i = IM().chapeu; if (ok(i)) c.drawImage(i, -6.5, -22, 13, 10); }
  // capa encapuzada: atrás do corpo (de frente) ou por cima (de costas, com o capuz cobrindo a cabeça)
  const capaCostas = new Image(); capaCostas.src = 'itens-loja/capa_costas.png';
  function capaAtras(c, sec, anda, costas) {
    const i = costas ? capaCostas : IM().capa; if (!ok(i)) return;
    const o = anda ? Math.sin(sec * 9) * 0.06 : 0;
    c.save(); c.translate(0, 1); c.transform(1, 0, o, 1, 0, 0); c.drawImage(i, -7, -18, 14, 18); c.restore();
  }
  function capaFrente() { }
  // asas de dragão (arte do criador): cada asa sobe e desce a partir do ombro
  function asas(c, sec, anda) {
    const i = IM().asas; if (!ok(i)) return;
    const meio = Math.floor(i.width / 2), k = 0.6, h = i.height * k;
    const f = anda ? (Math.floor(sec * 7) % 2 ? 0.6 : 1) : 0.9 + Math.sin(sec * 2) * 0.08;
    [[0, meio, -1], [meio, i.width - meio, 1]].forEach(([sx, sw, lado]) => {
      c.save(); c.translate(0, -10); c.scale(1, f);
      c.drawImage(i, sx, 0, sw, i.height, lado < 0 ? -sw * k + 1 : -1, -h, sw * k, h); c.restore();
    });
  }
  function auraChao(c, sec) {
    const q = Math.floor(sec * 7) % 3;
    P(c, -8, 0, 16, 2, '#a8261a'); P(c, -6, -1, 12, 1, '#c8301e'); P(c, -6, 2, 12, 1, '#c8301e'); P(c, -3, 0, 6, 2, '#8a1c12');
    P(c, -9, 0, 1, 2, '#ff7a1a'); P(c, 8, 0, 1, 2, '#ff7a1a'); P(c, -7, -2, 14, 1, '#ff9a1a'); P(c, -7, 3, 14, 1, '#ff9a1a');
    [-7, -4, -1, 2, 5].forEach((x, i) => { const h = 1 + ((i + q) % 3 === 0 ? 2 : 1); P(c, x, -2 - h, 1, h, '#ffb83a'); P(c, x, -3 - h, 1, 1, '#ffe04a'); });
  }
  function auraFaiscas(c, sec, anda) {
    const n = anda ? 10 : 6;
    for (let i = 0; i < n; i++) {
      const u = (sec * (anda ? 0.9 : 0.5) + i / n) % 1, x = Math.round(Math.sin(i * 2.3 + sec) * 7), y = Math.round(-2 - u * 24);
      P(c, x, y, 1, u < 0.5 ? 2 : 1, i % 3 === 0 ? '#ffe27a' : i % 3 === 1 ? '#ffb347' : '#ff7a2a');
    }
  }
  // Brasinha (arte do criador): pula quando anda; origem nos pés
  function dragaoBebe(c, sec, anda) {
    const i = IM().dragao; if (!ok(i)) return;
    const pulo = anda ? Math.abs(Math.round(Math.sin(sec * 10) * 1.5)) : 0;
    P(c, -9, -1, 18, 2, 'rgba(0,0,0,.25)');
    c.drawImage(i, -13, -21 - pulo, 27, 21);
  }
  // estandarte do leão (arte do criador) ao lado da casa, com flores
  function bandeira(c, sec) {
    const i = IM().bandeira;
    if (ok(i)) { const o = Math.sin(sec * 2.5) * 0.03; c.save(); c.transform(1, 0, o, 1, 0, 0); c.drawImage(i, -7.5, -32, 15.6, 33.6); c.restore(); }
    [[-14, 2, '#e84a8a'], [-11, 2, '#ffd046'], [-7, 2, '#e84a8a'], [3, 2, '#ffd046']].forEach(([x, y, f]) => { P(c, x, y, 2, 1, f); P(c, x, y + 1, 2, 1, '#4a8a3a'); });
  }
  // personagem completo com os itens (para a prévia grande e para o mapa)
  function comItens(c, look, itens, sec, anda, costas) {
    const t = id => itens.includes(id);
    if (t('aura')) auraChao(c, sec);
    const atras = () => { if (t('asas')) asas(c, sec, anda); if (t('capa')) capaAtras(c, sec, anda, costas); };
    if (!costas) atras();
    SP.drawCharacter(c, 0, 0, t('tricornio') && look.chapeu ? Object.assign({}, look, { chapeu: undefined }) : look, { t: sec, walking: anda, side: 1, dir: costas ? 'up' : 'down' });
    if (costas) atras();
    if (t('capa') && !costas) capaFrente(c);
    if (t('tricornio')) tricornio(c);
    if (t('aura')) auraFaiscas(c, sec, anda);
  }

  // ---------------------------------------------------------------- no mapa: itens dos jogadores e Brasinha
  const segue = new Map();
  G.hooks.push((objs, c, info) => {
    if (!S.on || !S.eu) return;
    const sec = info.sec;
    [S.eu, ...S.outros.values()].forEach(v => {
      if (!v.loja || !v.loja.length) return;
      const lado = v.s || 1, costas = v.dir === 'up', anda = !!v.anda;
      const desenha = (fn, dy) => objs.push({ y: v.y + dy, f: () => { c.save(); c.translate(Math.round(v.x), Math.round(v.y)); c.scale(lado, 1); fn(); c.restore(); } });
      if (tem(v, 'aura')) desenha(() => auraChao(c, sec), -0.02);
      if (tem(v, 'asas')) desenha(() => asas(c, sec, anda), costas ? 0.02 : -0.01);
      if (tem(v, 'capa')) desenha(() => { capaAtras(c, sec, anda, costas); }, costas ? 0.02 : -0.01);
      if (tem(v, 'capa') && !costas) desenha(() => capaFrente(c), 0.01);
      if (tem(v, 'tricornio')) desenha(() => tricornio(c), 0.015);
      if (tem(v, 'aura')) desenha(() => auraFaiscas(c, sec, anda), 0.02);
      if (tem(v, 'brasinha')) {
        let b = segue.get(v.id); const alvo = { x: v.x - lado * 11, y: v.y + 2 };
        if (!b) { b = { x: alvo.x, y: alvo.y, s: lado }; segue.set(v.id, b); }
        const dx = alvo.x - b.x, dy = alvo.y - b.y, d = Math.hypot(dx, dy);
        if (d > 0.6) { b.x += dx * 0.08; b.y += dy * 0.08; if (Math.abs(dx) > 0.5) b.s = dx > 0 ? -1 : 1; }
        const andando = d > 1.5;
        objs.push({ y: b.y, f: () => { c.save(); c.translate(Math.round(b.x), Math.round(b.y)); c.scale(b.s * 0.62, 0.62); dragaoBebe(c, sec, andando); c.restore(); } });
      }
    });
  });
  // bandeiras nas casas dos moradores que compraram (todo mundo vê, jogando ou não)
  let bandeiras = [];
  const lerBandeiras = () => fetch('/loja/bandeiras', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).then(a => { bandeiras = Array.isArray(a) ? a : []; }).catch(() => { });
  lerBandeiras(); setInterval(lerBandeiras, 120e3);
  G.hooks.push((objs, c, info) => {
    bandeiras.forEach(arroba => {
      const m = G.MOR.find(x => x.arroba && x.arroba.toLowerCase() === arroba), h = m && m._casaObj;
      if (!h || !G.arrived(m, info.t)) return;
      objs.push({ y: h.y + 1, f: () => { c.save(); c.translate(h.x + 12, h.y); bandeira(c, info.sec); c.restore(); } });
    });
  });

  // ---------------------------------------------------------------- loja (janela) e prévia animada
  let anima = [];
  function loopPrevias() {
    if (!anima.length) return;
    const sec = performance.now() / 1000;
    anima = anima.filter(a => a.cv.isConnected);
    anima.forEach(a => a.draw(sec));
    if (anima.length) requestAnimationFrame(loopPrevias);
  }
  // fundo limpo por item: degradê + brilho na cor da raridade + chão, para o item "saltar" da carta
  const FUNDO = [['#f8a85a', '#c8503a', '#6a3a24'], ['#3a2a5a', '#1a1230', '#2a2040'], ['#4a1a4a', '#1a0a20', '#2a1424'], ['#1a2a4a', '#0a1020', '#1a2418'],
    ['#2a3a6a', '#141c34', '#c8a870'], ['#1a4a4a', '#0a1a20', '#24343a'], ['#5a3a24', '#24160c', '#3a2618'], ['#8ac8f0', '#5a9ad0', '#5aa84a']];
  const GLOW = ['#ffd046', '#ffd046', '#ff6a3a', '#ff9a3a', '#ff7a4a', '#ffd046', '#ffd046', '#ffffff'];
  function fundo(g, idx, sec) {
    const [a, b, chao] = FUNDO[idx] || FUNDO[0];
    const lg = g.createLinearGradient(0, 0, 0, 45); lg.addColorStop(0, a); lg.addColorStop(1, b); g.fillStyle = lg; g.fillRect(0, 0, 72, 45);
    const rg = g.createRadialGradient(36, 24, 1, 36, 24, 26); rg.addColorStop(0, GLOW[idx] + '66'); rg.addColorStop(1, GLOW[idx] + '00'); g.fillStyle = rg; g.fillRect(0, 0, 72, 45);
    // raios girando devagar atrás do item
    g.save(); g.translate(36, 24); g.rotate(sec * 0.15); g.fillStyle = GLOW[idx] + '14';
    for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, 0); g.lineTo(-4, -40); g.lineTo(4, -40); g.fill(); }
    g.restore();
    g.fillStyle = chao; g.fillRect(0, 38, 72, 7); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 38, 72, 1);
    for (let i = 0; i < 10; i++) { const u = (sec * 0.12 + i / 10) % 1; g.fillStyle = `rgba(255,255,255,${(0.35 * (1 - u)).toFixed(2)})`; g.fillRect((i * 23) % 72, Math.round(36 - u * 34), 1, 1); }
  }
  let tela = null;
  function previa(cv, idx, itens, look) {
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    if (!tela) { tela = document.createElement('canvas'); tela.width = 72; tela.height = 45; }
    const sil = document.createElement('canvas'); sil.width = 72; sil.height = 45;
    anima.push({ cv, draw: sec => {
      // 1) o item/personagem numa tela separada
      const t = tela.getContext('2d'); t.imageSmoothingEnabled = false; t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, 72, 45);
      t.translate(36, 40); t.scale(1.42, 1.42);
      const anda = Math.floor(sec / 3) % 2 === 1;
      if (itens.includes('brasinha')) { t.save(); t.translate(-8, 0); comItens(t, look, itens.filter(i => i !== 'brasinha'), sec, anda, false); t.restore(); t.save(); t.translate(16, 0); t.scale(0.5, 0.5); dragaoBebe(t, sec, anda); t.restore(); }
      else if (itens.includes('bandeira')) { t.translate(-2, 0); t.scale(0.78, 0.78); casinha(t); t.save(); t.translate(10, 4); bandeira(t, sec); t.restore(); }
      else comItens(t, look, itens, sec, anda, false);
      // 2) contorno escuro (silhueta deslocada) para destacar do fundo
      const sg = sil.getContext('2d'); sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, 72, 45); sg.drawImage(tela, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#0a0608'; sg.fillRect(0, 0, 72, 45);
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 72, 45); fundo(g, idx, sec);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(36, 39.5, 12, 2, 0, 0, 7); g.fill();
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => g.drawImage(sil, dx, dy));
      g.drawImage(tela, 0, 0);
    } });
    if (anima.length === 1) requestAnimationFrame(loopPrevias);
  }
  // ilustração em alta resolução (loja-arte.js) para os cards da loja
  // ilustração (loja-arte.js) desenhada em alta e reduzida para pixel art: 96x60 pixels, paleta reduzida
  const PX = { w: 120, h: 75 };
  let hdTela = null;
  function quantiza(d) {
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, Math.round(d[i + k] / 22) * 22);
      d[i + 3] = 255;
    }
  }
  function arteHD(cv, id) {
    const A = window.IlhaLojaPixel; if (!A) return;
    cv.width = A.W; cv.height = A.H; cv.classList.remove('lj-hd'); cv.classList.add('lj-px');
    const g = cv.getContext('2d');
    anima.push({ cv, draw: sec => A.desenha(g, id, sec, S.eu && S.eu.arroba) });
    if (anima.length === 1) requestAnimationFrame(loopPrevias);
  }
  function casinha(g) {
    P(g, -14, -12, 20, 13, '#9a7a54'); for (let y = -10; y < 1; y += 3) P(g, -14, y, 20, 1, '#86663e');
    P(g, -16, -18, 24, 6, '#b8402a'); P(g, -15, -19, 22, 1, '#d85a3a'); P(g, -16, -13, 24, 1, '#8a2a1a');
    P(g, -6, -6, 5, 7, '#4a2c18'); P(g, -12, -8, 4, 4, '#ffd87a'); P(g, 1, -8, 4, 4, '#ffd87a');
  }
  const VITRINE = { tipo: 'humano', pele: '#e0b08a', cabelo: 'curto', corCabelo: '#4a2a14', roupa: '#e8e4dc', calca: '#3a4a6a' };
  const BASE = { tipo: 'humano', pele: '#d8a878', cabelo: 'curto', corCabelo: '#3a2414', roupa: '#4a6a8a', calca: '#3a3a46' };
  const meuLook = () => (S.eu && (S.eu.mor ? S.eu.mor.visual : S.eu.look)) || BASE;
  const meus = () => (S.eu && S.eu.loja) || [];
  function cartaItem(it, i) {
    const r = RAR[it.r], ja = meus().includes(it.id);
    return `<div class="lj-carta" style="--r:${r[0]};--r2:${r[1]}"><div class="lj-miolo">
      <div class="lj-topo"><b>${esc(it.n.toUpperCase())}</b><span>R$<i>${it.v}</i></span></div>
      <div class="lj-arte"><canvas class="lj-hd" width="288" height="180" data-i="${i}"></canvas><em>${r[2]}</em><small>SÓ VISUAL</small></div>
      <div class="lj-tipo">${it.tipo}</div><p>${esc(it.d)}.</p>
      <button type="button" class="${ja ? 'b-linha' : 'b-ouro'} lj-comprar" data-id="${it.id}" ${ja ? 'disabled' : ''}>${ja ? '✓ JÁ É SEU' : 'COMPRAR · R$ ' + it.v + ',00'}</button></div></div>`;
  }
  function abrir() {
    anima = [];
    const quem = S.on ? `Você está comprando para <b>@${esc(S.eu.arroba)}</b>.` : 'Para comprar, toque em <b>JOGAR</b> e entre com o seu @: o item fica no seu personagem.';
    K.abrir('LOJA DA ILHA', `<p class="lj-lead">Só visual: nada aqui dá XP, carta ou vantagem nas missões. Pagamento por <b>Pix</b>, confirmado na hora pelo Mercado Pago. Toda compra coloca o seu @ nos <b>créditos do próximo episódio</b>.</p>
      <p class="m-nota">${quem}</p>
      ${S.on ? `<div class="lj-eu"><canvas width="72" height="45"></canvas><div><b>SEU PERSONAGEM</b>${tem(S.eu, 'nome') ? `<small style="color:#ffd046">✦ @${esc(S.eu.arroba)}</small>` : ''}<small>${meus().length ? meus().length + ' item(ns) da loja' : 'Nenhum item ainda'}</small></div></div>` : ''}
      <div class="lj-grade">${ITENS.map(cartaItem).join('')}</div>`, el => {
      el.querySelectorAll('.lj-arte canvas').forEach(cv => { const it = ITENS[+cv.dataset.i]; arteHD(cv, it.id); });
      const eu = el.querySelector('.lj-eu canvas'); if (eu) previa(eu, 4, meus(), meuLook());
      el.querySelectorAll('.lj-comprar').forEach(b => b.onclick = () => comprar(ITENS.find(x => x.id === b.dataset.id)));
    });
  }
  // ---------------------------------------------------------------- compra
  let espera = null;
  function comprar(it) {
    if (!S.on) { K.fechar(); J.anuncia({ titulo: 'LOJA DA ILHA', texto: 'Toque em JOGAR e entre com o seu @ para comprar.', dur: 5000 }); return; }
    if (it.morador && !S.eu.mor && !G.MOR.some(m => m.arroba && m.arroba.toLowerCase() === S.eu.arroba)) { J.anuncia({ titulo: 'SÓ PARA MORADORES', texto: 'A bandeira vai na casa do seu morador. Comente nome, profissão e história para virar morador!', dur: 6000 }); return; }
    K.abrir('PIX · ' + it.n.toUpperCase(), '<p>Gerando o Pix no Mercado Pago...</p>', () => { });
    espera = { it, id: null };
    J.envia({ t: 'pix', item: it.id });
  }
  J.aoMsg.push(m => {
    if (m.t === 'pix' && espera) {
      if (m.erro) { K.abrir('LOJA DA ILHA', `<p>${esc(m.erro)}</p><div class="m-botoes"><button type="button" class="b-ouro" id="lj-v">VOLTAR</button></div>`, el => { el.querySelector('#lj-v').onclick = abrir; }); espera = null; return; }
      espera.id = m.id;
      K.abrir('PIX · ' + espera.it.n.toUpperCase(), `<div class="lj-pix">
        <p>Pague <b>R$ ${m.valor},00</b> com o Pix abaixo. Assim que o Mercado Pago confirmar, o item aparece no seu personagem.</p>
        <img alt="QR Code do Pix" src="data:image/png;base64,${m.img}">
        <label class="m-campo"><span>Pix copia e cola</span><textarea readonly rows="3">${esc(m.qr)}</textarea></label>
        <div class="m-botoes"><button type="button" class="b-ouro" id="lj-copiar">COPIAR CÓDIGO</button></div>
        <p class="lj-status" id="lj-st">⏳ Aguardando o pagamento... (o código vale 30 minutos)</p></div>`, el => {
        el.querySelector('#lj-copiar').onclick = e => { const t = el.querySelector('textarea'); t.select(); try { navigator.clipboard.writeText(t.value); } catch (er) { document.execCommand('copy'); } e.currentTarget.textContent = 'COPIADO!'; };
      });
      const id = m.id, ate = Date.now() + 31 * 60e3;
      const tique = setInterval(() => {
        if (!espera || espera.id !== id || Date.now() > ate || !S.on) { clearInterval(tique); return; }
        J.envia({ t: 'pixstatus', id });
      }, 5000);
    }
    if (m.t === 'pixstatus' && espera && m.id === espera.id) {
      if (m.status === 'approved') {
        const it = espera.it; espera = null;
        if (S.eu) { S.eu.loja = S.eu.loja || []; if (!S.eu.loja.includes(it.id)) S.eu.loja.push(it.id); }
        K.fechar();
        J.anuncia({ titulo: 'COMPRA CONFIRMADA!', texto: `${it.n} já está no seu personagem. Obrigado por apoiar a ilha! Seu @ entra nos créditos do próximo episódio.`, acao: 'VER', fn: abrir, dur: 9000 });
      } else if (m.status === 'rejected' || m.status === 'cancelled' || m.status === 'expired') {
        const st = document.getElementById('lj-st'); if (st) st.textContent = 'O Pix não foi concluído. Feche e gere um novo.';
      }
    }
    if (m.t === 'loja') {
      const v = S.eu && m.id === S.eu.id ? S.eu : S.outros.get(m.id);
      if (v) v.loja = m.itens || [];
    }
  });

  // ---------------------------------------------------------------- botão LOJA e toque no próprio personagem
  function botao() {
    if (document.getElementById('btn-loja')) return;
    const ap = [...document.querySelectorAll('button')].find(b => /APOIAR/.test(b.textContent) && b.offsetParent);
    if (!ap) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'btn-loja'; b.className = ap.className; b.innerHTML = '🛒 LOJA'; b.onclick = abrir;
    ap.after(b);
  }
  setTimeout(botao, 1500); setInterval(botao, 5000);
  const palco = document.querySelector('canvas');
  window.addEventListener('pointerup', e => {
    if (!S.on || !S.eu || !G.toWorld || !(e.target && e.target.tagName === 'CANVAS')) return;
    const w = G.toWorld(e.clientX, e.clientY);
    if (Math.hypot(w.x - S.eu.x, w.y - (S.eu.y - 7)) < 8) setTimeout(() => {
      anima = [];
      K.abrir((S.eu.mor ? S.eu.mor.nome.toUpperCase() : '@' + S.eu.arroba.toUpperCase()) + ' · SEU VISUAL', `<div class="lj-eu lj-grande"><canvas width="72" height="45"></canvas></div><p class="m-nota">${meus().length ? 'Itens da loja: ' + meus().map(id => (ITENS.find(x => x.id === id) || {}).n).filter(Boolean).join(', ') : 'Você ainda não tem itens da loja.'}</p><div class="m-botoes"><button type="button" class="b-ouro" id="lj-abrir">🛒 ABRIR A LOJA</button></div>`, el => {
        previa(el.querySelector('canvas'), 4, meus(), meuLook()); el.querySelector('#lj-abrir').onclick = abrir;
      });
    }, 60);
  });

  // ---------------------------------------------------------------- cenários das cartas
  function cena(g,i){const Q=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 if(i===0){Q(0,0,72,30,'#f08a4a');Q(0,10,72,8,'#f8a85a');Q(0,18,72,6,'#e8704a');Q(0,24,72,6,'#2a5a8a');for(let k=0;k<12;k++)Q((k*13)%72,25+(k%3),4,1,'#4a8ac8');Q(0,30,72,15,'#7a5230');for(let x=0;x<72;x+=6)Q(x,30,1,15,'#5a3a20');Q(0,30,72,1,'#9a6a40');Q(58,0,2,30,'#4a3020');Q(50,4,16,10,'#f4ecd8');Q(50,4,16,1,'#d8ccb0');Q(56,14,6,1,'#c8b088')}
 else if(i===1){Q(0,0,72,45,'#3a1a2a');for(let x=0;x<72;x+=9)for(let y=0;y<30;y+=6)Q(x+(y/6%2)*4,y,8,5,'#4a2234');Q(28,8,16,34,'#8a1a2a');Q(30,8,12,34,'#a82a3a');Q(6,4,8,16,'#c9962a');Q(7,5,6,12,'#2a4a8a');Q(58,4,8,16,'#c9962a');Q(59,5,6,12,'#8a1a2a');Q(0,36,72,9,'#2a1420');Q(27,36,18,9,'#a82a3a');const gl=g.createRadialGradient(36,22,2,36,22,36);gl.addColorStop(0,'rgba(255,200,90,.35)');gl.addColorStop(1,'rgba(255,200,90,0)');g.fillStyle=gl;g.fillRect(0,0,72,45)}
 else if(i===2){Q(0,0,72,45,'#2a1030');Q(0,14,72,10,'#4a1a3a');Q(0,22,72,8,'#7a2a3a');g.fillStyle='#1a0a14';g.beginPath();g.moveTo(0,34);g.lineTo(14,18);g.lineTo(24,30);g.lineTo(40,12);g.lineTo(52,28);g.lineTo(62,20);g.lineTo(72,30);g.lineTo(72,45);g.lineTo(0,45);g.fill();Q(39,12,3,3,'#ff6a2a');Q(40,9,1,3,'#ffb347');Q(0,40,72,5,'#120810');for(let k=0;k<10;k++)Q((k*23)%72,(k*7)%14,1,1,'#ff9a6a')}
 else if(i===3){Q(0,0,72,45,'#0e1424');for(let k=0;k<22;k++)Q((k*31)%72,(k*17)%26,1,1,'#cfd8ff');Q(0,32,72,13,'#1a2418');const gl=g.createRadialGradient(36,40,2,36,40,34);gl.addColorStop(0,'rgba(255,140,40,.55)');gl.addColorStop(1,'rgba(255,140,40,0)');g.fillStyle=gl;g.fillRect(0,0,72,45)}
 else if(i===4){Q(0,0,72,28,'#1a2a4a');Q(0,18,72,10,'#2a3a5a');for(let k=0;k<18;k++)Q((k*29)%72,(k*11)%18,1,1,'#f4f4ff');Q(58,4,5,5,'#f4ecc8');Q(59,4,4,1,'#fffbe8');Q(0,28,72,5,'#2a5a8a');Q(0,30,72,1,'#4a8ac8');Q(0,33,72,12,'#d8c08a');for(let k=0;k<26;k++)Q((k*37)%72,34+(k*13)%10,2,1,'#c0a470')}
 else if(i===5){Q(0,0,72,45,'#141c2c');for(let x=0;x<72;x+=18){Q(x+2,10,12,22,'#3a2c24');Q(x,7,16,4,'#7a2a1a');Q(x+6,20,4,5,'#ffd87a')}Q(0,32,72,13,'#4a4238');for(let x=0;x<72;x+=6)Q(x,32,5,1,'#5a5248');[[10,14],[62,14]].forEach(([x,y])=>{Q(x,y,1,18,'#2a2018');Q(x-1,y-2,3,3,'#ffd046');const gl=g.createRadialGradient(x,y,1,x,y,14);gl.addColorStop(0,'rgba(255,210,90,.4)');gl.addColorStop(1,'rgba(255,210,90,0)');g.fillStyle=gl;g.fillRect(0,0,72,45)})}
 else if(i===6){Q(0,0,72,45,'#3a2618');for(let x=0;x<72;x+=12)Q(x,0,1,45,'#2a1a10');Q(0,34,72,11,'#2a1a10');Q(0,33,72,1,'#5a3a24');Q(4,8,10,12,'#c9962a');Q(5,9,8,10,'#4a6a3a');Q(58,8,10,12,'#c9962a');Q(59,9,8,10,'#2a3a6a');const gl=g.createRadialGradient(36,18,2,36,18,30);gl.addColorStop(0,'rgba(255,220,140,.3)');gl.addColorStop(1,'rgba(255,220,140,0)');g.fillStyle=gl;g.fillRect(0,0,72,45)}
 else {Q(0,0,72,45,'#8ac8f0');Q(0,20,72,6,'#a8d8f8');Q(8,6,10,3,'#ffffff');Q(10,5,6,1,'#ffffff');Q(48,9,12,3,'#ffffff');Q(0,30,72,15,'#5aa84a');for(let k=0;k<30;k++)Q((k*37)%72,31+(k*13)%13,1,1,'#7ac85a');Q(0,26,72,4,'#4a8a3a')}
}

  const semChapeu = vis => { const o = Object.assign({}, vis); delete o.chapeu; delete o.corChapeu; return o; };
  window.IlhaLoja = { abrir, tem, ITENS, visual: (v, vis) => tem(v, 'tricornio') && vis && vis.chapeu ? semChapeu(vis) : vis, temNome: v => tem(v, 'nome'), temMoldura: () => tem(S.eu, 'moldura') };
})();
