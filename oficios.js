/* A Grande Ilha — OFÍCIOS (fase 1 da economia de profissões).
   Coletar: cada recurso tem um minijogo no estilo da pesca (você joga para conseguir):
     trigo na fazenda (foice: acerte a faixa), madeira na floresta (machado: 3 golpes),
     minério na pedreira (picareta: bata quando a rocha rachar), ervas no lago (colha só a verde).
   Fabricar: leve os ingredientes ao morador do ofício e jogue o minijogo dele
     (Lucas assa o pão, Kasseki forja a lâmina, João encanta a lâmina, Daniel prepara o remédio).
   Quem joga com o próprio morador fabrica sozinho, no lugar de trabalho dele.
   Pedidos do dia: 3 entregas para moradores; cada entrega também enche a barra da comunidade do episódio.
   Tudo fica no perfil do jogador (perfil.inv, perfil.ped). */
(function () {
  'use strict';
  const G = window.GrandeIlha, SP = window.IlhaSprites, K = window.IlhaComunidade, J = window.IlhaJogo;
  if (!G || !SP || !K || !J) return;
  const S = J.S, esc = K.esc, L = G.LUG;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---------------------------------------------------------------- itens, coleta e receitas
  const ITENS = {
    trigo: { n: 'Trigo', i: '🌾' }, madeira: { n: 'Madeira', i: '🪵' }, minerio: { n: 'Minério', i: '🪨' }, erva: { n: 'Ervas', i: '🌿' },
    pao: { n: 'Pão', i: '🍞' }, lamina: { n: 'Lâmina', i: '🗡️' }, lamina_enc: { n: 'Lâmina encantada', i: '✨' }, remedio: { n: 'Remédio', i: '🧪' }
  };
  const PEDREIRA = { x: 566, y: 220 };
  const COLETA = [
    { item: 'trigo', nome: 'Fazenda', x: L.fazenda.sx, y: L.fazenda.sy, r: 30, verbo: 'COLHER', icone: '🌾', jogo: { tipo: 'faixa', golpes: 1, vel: 1.1, larg: 0.24, txt: 'Corte o trigo quando o marcador passar na faixa dourada' } },
    { item: 'madeira', nome: 'Floresta', x: 350, y: 228, r: 30, verbo: 'CORTAR', icone: '🪓', jogo: { tipo: 'faixa', golpes: 3, vel: 1.3, larg: 0.26, txt: '3 machadadas: acerte a faixa (ela diminui a cada golpe)' } },
    { item: 'minerio', nome: 'Pedreira', x: PEDREIRA.x, y: PEDREIRA.y + 8, r: 26, verbo: 'MINERAR', icone: '⛏️', jogo: { tipo: 'reacao', golpes: 2, janela: 850, txt: 'Bata quando a rocha rachar (cedo demais quebra a picareta)' } },
    { item: 'erva', nome: 'Beira do lago', x: 540, y: 182, r: 26, verbo: 'COLHER', icone: '🌿', jogo: { tipo: 'cores', golpes: 2, txt: 'Colha só quando a erva ficar VERDE (a roxa é venenosa)' } }
  ];
  const RECEITAS = [
    { item: 'pao', quem: 'lucas', onde: 'mercearia', verbo: 'ASSAR', pede: { trigo: 3 }, xp: 12, fala: 'Me traz 3 trigos que eu asso um pão quentinho.', jogo: { tipo: 'faixa', golpes: 1, vel: 1.4, larg: 0.2, txt: 'Tire o pão do forno na hora certa (faixa dourada)' } },
    { item: 'lamina', quem: 'kasseki', onde: 'forja', verbo: 'FORJAR', pede: { minerio: 2, madeira: 1, pao: 1 }, xp: 25, fala: 'Lâmina boa precisa de 2 minérios, 1 madeira para o carvão e 1 pão para quem bate o ferro.', jogo: { tipo: 'faixa', golpes: 3, vel: 1.6, larg: 0.22, txt: 'Bata no ferro 3 vezes quando o marcador passar na faixa' } },
    { item: 'lamina_enc', quem: 'joao', onde: 'forja', verbo: 'ENCANTAR', pede: { lamina: 1, erva: 1 }, xp: 30, fala: 'Traga uma lâmina do Kasseki e uma erva: a seiva fixa a runa.', jogo: { tipo: 'reacao', golpes: 3, janela: 700, txt: 'Grave cada runa quando ela brilhar' } },
    { item: 'remedio', quem: 'daniel', onde: 'laboratorio', verbo: 'PREPARAR', pede: { erva: 3 }, xp: 15, fala: 'Com 3 ervas eu preparo um remédio para os feridos do treino.', jogo: { tipo: 'cores', golpes: 3, txt: 'Misture só quando o caldeirão ficar VERDE' } }
  ];
  const PEDIDOS = [
    { para: 'andre', item: 'pao', q: 2, xp: 60, txt: 'O André quer 2 pães para a patrulha' },
    { para: 'benjain', item: 'remedio', q: 1, xp: 70, txt: 'O Benjain se machucou no treino: leve 1 remédio' },
    { para: 'benjain', item: 'lamina_enc', q: 1, xp: 130, txt: 'O Benjain quer uma lâmina encantada para virar herói' },
    { para: 'andre', item: 'lamina', q: 1, xp: 90, txt: 'O André precisa de 1 lâmina para os recrutas' },
    { para: 'werner', item: 'pao', q: 1, xp: 40, txt: 'O Werner passou o dia com o dragão: leve 1 pão' },
    { para: 'lucas', item: 'trigo', q: 3, xp: 40, txt: 'O Lucas ficou sem trigo: leve 3' },
    { para: 'kasseki', item: 'madeira', q: 2, xp: 45, txt: 'A forja do Kasseki precisa de 2 madeiras' },
    { para: 'daniel', item: 'erva', q: 3, xp: 45, txt: 'O Daniel precisa de 3 ervas do lago' },
    { para: 'joao', item: 'minerio', q: 2, xp: 50, txt: 'O João quer 2 minérios para estudar as runas' }
  ];

  // ---------------------------------------------------------------- estado do jogador
  const inv = () => { const p = S.perfil; if (!p.inv) p.inv = {}; return p.inv; };
  const tem = (k, n) => (inv()[k] || 0) >= n;
  const add = (k, n) => { const v = inv(); v[k] = Math.max(0, Math.min(99, (v[k] || 0) + n)); J.salvar(); };
  const podeFazer = r => Object.entries(r.pede).every(([k, n]) => tem(k, n));
  const pedeTxt = r => Object.entries(r.pede).map(([k, n]) => `${n} ${ITENS[k].i}`).join(' + ');
  function pedidosDoDia() {
    const dia = G.diaDe(Date.now());
    const ordem = PEDIDOS.map((p, i) => [G.rnd('pedido', dia, i), i]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    return { dia, lista: ordem.slice(0, 3).map(i => PEDIDOS[i]) };
  }
  function ped() {
    const p = S.perfil, d = pedidosDoDia();
    if (!p.ped || p.ped.dia !== d.dia) p.ped = { dia: d.dia, feitos: {} };
    return p.ped;
  }

  // ---------------------------------------------------------------- barra da comunidade
  const COM = { titulo: 'Ep. 7 · Preparar a ilha contra o Reino do Sul', meta: 300, total: 0, top: [] };
  function lerComunidade() {
    fetch('/comunidade', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { if (j && typeof j.total === 'number') Object.assign(COM, j); }).catch(() => { });
  }
  lerComunidade(); setInterval(lerComunidade, 90e3);
  J.aoMsg.push(m => { if (m.t === 'comunidade') { COM.total = m.total; COM.meta = m.meta || COM.meta; } });
  setTimeout(() => {
    const F = window.IlhaFeed; if (!F) return;
    F.push({ k: 'chegada', html: `<b>A ilha se prepara:</b> ${COM.total}/${COM.meta} entregas para o Ep. 7. Toque em JOGAR e ajude!`, dur: 14000 });
  }, 9000);

  // ---------------------------------------------------------------- minijogos (o mesmo motor para coletar e fabricar)
  let jogo = null;
  let audio = null;
  function bip(f, d) {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime; o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + d); } catch (e) { }
  }
  function inicia(cfg, fim) {
    const e = S.eu;
    jogo = Object.assign({}, cfg, { t0: Date.now(), hits: 0, falhas: 0, x: e.tx, y: e.ty, fim, z0: 0.2 + Math.random() * 0.5, larg0: (cfg.larg || 0.25) * (J.bonus ? J.bonus.faixa() : 1), fase: 'espera', prox: Date.now() + 900 + Math.random() * 1800, cor: 0, troca: Date.now() });
    J.anuncia({ titulo: cfg.titulo || 'MINIJOGO', texto: cfg.txt + ' · toque no botão (ou Espaço)', dur: 4500 });
    atualiza();
  }
  function cursor(j) { const u = ((Date.now() - j.t0) / 1000 * j.vel) % 2; return u < 1 ? u : 2 - u; }
  function acerta() {
    const j = jogo; j.hits++; bip(880, 0.08); S.eu.emote = { txt: j.hits >= j.golpes ? 'Conseguiu!' : `${j.hits}/${j.golpes}`, ate: Date.now() + 1100 };
    j.flash = Date.now();
    if (j.tipo === 'faixa') { j.larg0 = Math.max(0.1, j.larg0 * 0.78); j.z0 = 0.05 + Math.random() * (0.9 - j.larg0); }
    if (j.tipo === 'reacao') { j.fase = 'espera'; j.prox = Date.now() + 900 + Math.random() * 1800; }
    if (j.hits >= j.golpes) termina(true);
  }
  function erra(motivo) {
    const j = jogo; j.falhas++; bip(150, 0.18); S.eu.emote = { txt: motivo || 'Errou!', ate: Date.now() + 1100 };
    if (j.tipo === 'reacao') { j.fase = 'espera'; j.prox = Date.now() + 1000 + Math.random() * 1800; }
    if (j.falhas >= 3) termina(false);
  }
  function termina(ok) {
    const j = jogo; jogo = null;
    if (!ok) { S.eu.emote = { txt: 'Não foi dessa vez...', ate: Date.now() + 1800 }; }
    j.fim(ok); atualiza();
  }
  function aperta() {
    const j = jogo; if (!j) return;
    if (j.tipo === 'faixa') { const c = cursor(j); if (c >= j.z0 && c <= j.z0 + j.larg0) acerta(); else erra(); }
    else if (j.tipo === 'reacao') { if (j.fase === 'agora') acerta(); else erra('Cedo demais!'); }
    else if (j.tipo === 'cores') { if (j.cor === 0) acerta(); else erra('Essa não!'); }
  }
  function tick() {
    const j = jogo; if (!j) return;
    const e = S.eu, agora = Date.now();
    if (Math.hypot(e.tx - j.x, e.ty - j.y) > 2) { jogo = null; S.eu.emote = { txt: 'Parou.', ate: agora + 1000 }; atualiza(); return; }
    if (j.tipo === 'reacao') {
      if (j.fase === 'espera' && agora > j.prox) { j.fase = 'agora'; j.prox = agora + j.janela; bip(520, 0.05); }
      else if (j.fase === 'agora' && agora > j.prox) erra('Demorou!');
    }
    if (j.tipo === 'cores' && agora - j.troca > 650) { j.troca = agora; const r = Math.random(); j.cor = r < 0.36 ? 0 : r < 0.7 ? 1 : 2; }
  }

  // ---------------------------------------------------------------- ações: coletar e fabricar
  function coletaPerto() { const e = S.eu; return e ? COLETA.find(c => dist(e, c) < c.r) : null; }
  function estacaoPropria() {
    const mor = S.eu && S.eu.mor; if (!mor) return null;
    const rs = RECEITAS.filter(x => x.quem === mor.id); if (!rs.length) return null;
    const r = rs.find(podeFazer) || rs[0];
    const lug = L[r.onde]; return lug && dist(S.eu, { x: lug.sx, y: lug.sy }) < 34 ? r : null;
  }
  function coletar(c) {
    inicia(Object.assign({ titulo: c.verbo + ' · ' + ITENS[c.item].n.toUpperCase() }, c.jogo), ok => {
      if (!ok) return;
      const n = J.bonus && Math.random() < J.bonus.dobro() ? 2 : 1;
      add(c.item, n); J.ganhaXp(4); if (J.bonus) J.bonus.ganho('coleta');
      S.eu.emote = { txt: `+${n} ${ITENS[c.item].i} ${ITENS[c.item].n}${n > 1 ? ' (DOBRO!)' : ''} (${inv()[c.item]})`, ate: Date.now() + 2200 };
    });
  }
  function fabricar(r, quem) {
    if (!podeFazer(r)) return;
    inicia(Object.assign({ titulo: r.verbo + ' · ' + ITENS[r.item].n.toUpperCase() }, r.jogo), ok => {
      if (!ok) { if (quem) fala(quem, 'Quase! Tenta de novo, os ingredientes ainda estão com você.'); return; }
      Object.entries(r.pede).forEach(([k, n]) => add(k, -n));
      add(r.item, r.sai || 1); J.ganhaXp(r.xp); if (J.bonus) J.bonus.ganho('fabrica');
      S.eu.emote = { txt: `+${r.sai || 1} ${ITENS[r.item].i} ${ITENS[r.item].n}!`, ate: Date.now() + 2400 };
      if (quem) fala(quem, 'Ficou ótimo! Leve para quem precisa.');
    });
  }
  function fala(id, txt) { S.falas = S.falas.filter(f => f.quem !== id); S.falas.push({ quem: id, txt, ate: Date.now() + 4500 }); }
  function acao() {
    if (jogo) { aperta(); return; }
    const c = coletaPerto(); if (c) { coletar(c); return; }
    const r = estacaoPropria(); if (r) fabricar(r, null);
  }

  // conversar com moradores: entregar pedidos e fabricar
  J.aoConversar.push(m => {
    if (!S.on || jogo) return false;
    const pd = ped(), lista = pedidosDoDia().lista;
    const i = lista.findIndex((p, k) => p.para === m.id && !pd.feitos[k] && tem(p.item, p.q));
    if (i >= 0) {
      const p = lista[i]; add(p.item, -p.q); pd.feitos[i] = true; J.salvar(); J.ganhaXp(p.xp);
      J.envia({ t: 'entrega', item: p.item, q: p.q }); if (J.bonus) J.bonus.ganho('pedido');
      fala(m.id, 'Muito obrigado! A ilha agradece.');
      const todos = lista.every((x, k) => pd.feitos[k]);
      J.anuncia({ titulo: 'PEDIDO ENTREGUE!', texto: `${p.txt} · +${p.xp} XP${todos ? ' · Você fez todos os pedidos do dia!' : ''}`, acao: 'MOCHILA', fn: abrir, dur: 6000 });
      if (todos && !pd.bonus) { pd.bonus = true; J.ganhaXp(80); }
      return true;
    }
    const rs = RECEITAS.filter(x => x.quem === m.id);
    if (!rs.length || (S.eu.mor && S.eu.mor.id === m.id)) return false;
    const prontas = rs.filter(podeFazer);
    if (prontas.length) {
      K.abrir(m.nome.toUpperCase() + ' · ' + m.profissao.toUpperCase(), prontas.map((r, i) => `<p>“${esc(r.fala)}”</p><p>Você tem: <b>${pedeTxt(r)}</b> → <b>${r.sai || 1} ${ITENS[r.item].i} ${esc(ITENS[r.item].n)}</b> · <small>${esc(r.jogo.txt)}</small></p><div class="m-botoes"><button type="button" class="b-ouro of-sim" data-i="${i}">${r.verbo} JUNTOS</button></div>`).join('') + `<div class="m-botoes"><button type="button" class="b-linha" id="of-nao">AGORA NÃO</button></div>`, el => {
        el.querySelectorAll('.of-sim').forEach(b => b.onclick = () => { K.fechar(); fabricar(prontas[+b.dataset.i], m.id); });
        el.querySelector('#of-nao').onclick = K.fechar;
      });
      return true;
    }
    fala(m.id, rs[Math.floor(Date.now() / 6000) % rs.length].fala);
    return false;
  });

  // ---------------------------------------------------------------- botões e mochila
  let bM = null, bA = null;
  function montaBotoes() {
    const barra = document.querySelector('.jogo-barra'); if (!barra || bM) return;
    bM = document.createElement('button'); bM.type = 'button'; bM.className = 'jb'; bM.innerHTML = '<i>🎒</i><span>MOCHILA</span>'; bM.setAttribute('aria-label', 'Mochila, receitas e pedidos'); bM.onclick = abrir;
    bA = document.createElement('button'); bA.type = 'button'; bA.className = 'jb jb-acao'; bA.hidden = true; bA.onclick = acao;
    const ref = barra.querySelector('#jb-falar'); barra.insertBefore(bM, ref); barra.insertBefore(bA, ref);
  }
  function atualiza() {
    montaBotoes(); if (!bM) return;
    bM.hidden = !S.on; if (!S.on) { bA.hidden = true; return; }
    const pd = ped(), feitos = Object.keys(pd.feitos).length;
    bM.querySelector('span').textContent = `MOCHILA · ${feitos}/3`;
    if (jogo) {
      bA.hidden = false; bA.disabled = false;
      const pronto = (jogo.tipo === 'reacao' && jogo.fase === 'agora') || (jogo.tipo === 'cores' && jogo.cor === 0);
      bA.innerHTML = `<i>${pronto ? '❗' : '👆'}</i><span>${pronto ? 'AGORA!' : 'TOCAR'} · ${jogo.hits}/${jogo.golpes}</span>`; bA.classList.toggle('pulsa', pronto); return;
    }
    bA.classList.remove('pulsa');
    const c = coletaPerto(), r = !c && estacaoPropria();
    bA.hidden = !c && !r;
    if (c) bA.innerHTML = `<i>${c.icone}</i><span>${c.verbo} · ${inv()[c.item] || 0}</span>`;
    else if (r) { bA.innerHTML = `<i>${ITENS[r.item].i}</i><span>${r.verbo} (${pedeTxt(r)})</span>`; bA.disabled = !podeFazer(r); }
  }
  setInterval(() => { if (S.on) { tick(); atualiza(); } else { jogo = null; if (bM) bM.hidden = bA.hidden = true; } }, 90);
  window.addEventListener('keydown', e => {
    if (!S.on || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if ((e.code === 'Space' || e.code === 'KeyE') && bA && !bA.hidden && !bA.disabled) { e.preventDefault(); e.stopImmediatePropagation(); acao(); }
  }, true);

  function irPara(x, y) { K.fechar(); S.camLivre = true; G.pararSeguir(); G.cam.x = x; G.cam.y = y - 8; if (G.cam.s < 4) G.cam.s = 4; }
  function abrir() {
    if (!S.on) { J.anuncia({ titulo: 'OFÍCIOS DA ILHA', texto: 'Toque em JOGAR e entre com o seu @ para coletar, fabricar e entregar pedidos.', dur: 5000 }); return; }
    const v = inv(), pd = ped(), lista = pedidosDoDia().lista, pct = Math.min(100, Math.round(COM.total / COM.meta * 100));
    const itens = Object.keys(ITENS).map(k => `<li class="${v[k] ? '' : 'vazio'}"><i>${ITENS[k].i}</i><b>${v[k] || 0}</b><span>${esc(ITENS[k].n)}</span></li>`).join('');
    const peds = lista.map((p, k) => { const ok = !!pd.feitos[k], m = G.BY[p.para]; return `<li class="${ok ? 'ok' : ''}"><i aria-hidden="true">${ok ? '✓' : ITENS[p.item].i}</i><div><b>${esc(p.txt)}</b><small>${ok ? 'Entregue' : `Você tem ${Math.min(v[p.item] || 0, p.q)}/${p.q} · fale com ${esc(m ? m.nome : p.para)}`} · +${p.xp} XP</small></div>${ok ? '' : `<button type="button" class="b-linha of-ir" data-quem="${p.para}">ACHAR</button>`}</li>`; }).join('');
    const col = COLETA.map(c => `<li><i>${c.icone}</i><div><b>${esc(ITENS[c.item].n)} · ${esc(c.nome)}</b><small>${esc(c.jogo.txt)}</small></div><button type="button" class="b-linha of-ir" data-x="${c.x}" data-y="${c.y}">IR</button></li>`).join('');
    const rec = RECEITAS.map(r => { const m = G.BY[r.quem]; return `<li class="${podeFazer(r) ? 'pode' : ''}"><i>${ITENS[r.item].i}</i><div><b>${esc(ITENS[r.item].n)} · com ${esc(m ? m.nome : r.quem)}</b><small>${pedeTxt(r)} · ${esc(r.jogo.txt)}</small></div><button type="button" class="b-linha of-ir" data-quem="${r.quem}">ACHAR</button></li>`; }).join('');
    const top = (COM.top || []).map(t => `@${esc(t.arroba)} (${t.n})`).join(' · ');
    K.abrir('MOCHILA E OFÍCIOS', `
      <div class="of-com"><b>${esc(COM.titulo)}</b><div class="md-barra"><s style="width:${pct}%"></s></div><small>${COM.total}/${COM.meta} entregas da ilha inteira${top ? ' · quem mais ajudou: ' + top : ''}</small></div>
      <h3 class="of-h">PEDIDOS DO DIA ${Object.keys(pd.feitos).length}/3</h3><ol class="jg-missoes of-lista">${peds}</ol>
      <h3 class="of-h">MOCHILA</h3><ul class="of-inv">${itens}</ul>
      <h3 class="of-h">COLETAR (minijogo)</h3><ul class="of-lista">${col}</ul>
      <h3 class="of-h">FABRICAR (fale com o morador)</h3><ul class="of-lista">${rec}</ul>
      <p class="m-nota">Ninguém faz nada sozinho: o pão do Lucas vai para a forja do Kasseki, a lâmina do Kasseki vai para o João encantar. Jogando com o seu próprio morador, você fabrica no lugar de trabalho dele.</p>`, el => {
      el.querySelectorAll('.of-ir').forEach(b => b.onclick = () => {
        if (b.dataset.quem) { const p = G.posAt(G.BY[b.dataset.quem], Date.now()); if (p) irPara(p.x, p.y); }
        else irPara(+b.dataset.x, +b.dataset.y);
      });
    });
  }
  function bloco(corpo) {
    if (!S.on) return;
    const pd = ped(), d = document.createElement('div'); d.className = 'md-bloco';
    d.innerHTML = `<h3>OFÍCIOS · PEDIDOS DO DIA ${Object.keys(pd.feitos).length}/3</h3><p>Colete, fabrique com os moradores e entregue os pedidos. Cada entrega ajuda a ilha a se preparar para o Ep. 7 (${COM.total}/${COM.meta}).</p><button type="button" class="b-ouro">ABRIR A MOCHILA</button>`;
    d.querySelector('button').onclick = abrir; corpo.prepend(d);
  }

  // ---------------------------------------------------------------- desenho: pedreira, minijogo e marcadores
  const fx = (c, x, y, w, h, cor) => { c.fillStyle = cor; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const ROCHAS = [[-10, 2, 9, 6], [2, -1, 11, 8], [-3, 7, 8, 5], [9, 7, 6, 4]];
  G.hooks.push((objs, c, info) => {
    // pedreira (sempre visível)
    objs.push({ y: PEDREIRA.y + 10, f: () => {
      ROCHAS.forEach(([dx, dy, w, h], i) => {
        const x = PEDREIRA.x + dx, y = PEDREIRA.y + dy;
        fx(c, x, y + h - 1, w, 1, 'rgba(0,0,0,0.25)'); fx(c, x, y, w, h - 1, '#7d7a76'); fx(c, x, y, w, 1, '#a8a49e'); fx(c, x + w - 1, y + 1, 1, h - 2, '#5e5b57');
        fx(c, x + 2 + i, y + 2, 1, 1, i % 2 ? '#c98a4a' : '#9fd0e0');
      });
      fx(c, PEDREIRA.x + 14, PEDREIRA.y - 4, 1, 9, '#6b4a2b'); fx(c, PEDREIRA.x + 12, PEDREIRA.y - 5, 5, 1, '#9aa0aa'); // picareta encostada
    } });
    if (!S.on || !S.eu || !jogo) return;
    const e = S.eu, j = jogo, agora = Date.now(), golpe = j.flash && agora - j.flash < 220;
    objs.push({ y: e.y + 0.6, f: () => {
      if (golpe) for (let i = 0; i < 5; i++) { const u = (agora - j.flash) / 220; fx(c, e.x + 6 + Math.cos(i * 1.3) * u * 8, e.y - 8 - Math.sin(i * 1.3) * u * 8, 1, 1, '#ffd046'); }
      if (j.tipo === 'reacao' && j.fase === 'agora') for (let i = 0; i < 3; i++) fx(c, e.x + 8 + i * 2, e.y - 4 - (i % 2) * 2, 1, 1, '#fff6b0');
    } });
  });
  window.IlhaTexto.push((ctx, scr, fs, info) => {
    if (!S.on || !S.perfil) return;
    const t = info.t, sobe = Math.round(Math.sin(t / 260) * 2);
    // marcadores dos lugares de coleta
    ctx.font = `${fs + 2}px sans-serif`; ctx.textAlign = 'center';
    COLETA.forEach(c => { const [sx, sy] = scr(c.x, c.y - 32); ctx.globalAlpha = 0.9; ctx.fillText(c.icone, sx, sy + sobe); ctx.globalAlpha = 1; });
    if (!jogo || !S.eu) return;
    const j = jogo, [px, py] = scr(S.eu.x, S.eu.y - 34), W = 96, H = 12, x0 = px - W / 2, y0 = py - H;
    ctx.fillStyle = 'rgba(10,12,16,.88)'; ctx.fillRect(x0 - 4, y0 - 4, W + 8, H + 8);
    if (j.tipo === 'faixa') {
      ctx.fillStyle = '#3a3f4a'; ctx.fillRect(x0, y0, W, H);
      ctx.fillStyle = '#ffd046'; ctx.fillRect(x0 + j.z0 * W, y0, j.larg0 * W, H);
      const cx = x0 + cursor(j) * W; ctx.fillStyle = '#fff'; ctx.fillRect(cx - 1.5, y0 - 3, 3, H + 6);
    } else if (j.tipo === 'reacao') {
      const ok = j.fase === 'agora'; ctx.fillStyle = ok ? '#ffd046' : '#3a3f4a'; ctx.fillRect(x0, y0, W, H);
      ctx.fillStyle = ok ? '#1a1410' : '#cfd3da'; ctx.font = `bold ${Math.max(9, fs)}px Silkscreen, monospace`; ctx.fillText(ok ? 'AGORA!' : 'espere...', px, y0 + H - 2);
    } else {
      const cores = ['#4ac07a', '#a04ad0', '#c8433a'], nomes = ['VERDE', 'ROXA', 'VERMELHA'];
      ctx.fillStyle = cores[j.cor]; ctx.fillRect(x0, y0, W, H);
      ctx.fillStyle = '#0a0c10'; ctx.font = `bold ${Math.max(9, fs)}px Silkscreen, monospace`; ctx.fillText(nomes[j.cor], px, y0 + H - 2);
    }
    // golpes
    for (let i = 0; i < j.golpes; i++) { ctx.fillStyle = i < j.hits ? '#4ac07a' : 'rgba(255,255,255,.3)'; ctx.fillRect(px - j.golpes * 5 + i * 10, y0 + H + 6, 7, 4); }
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < j.falhas ? '#c8433a' : 'rgba(255,255,255,.12)'; ctx.fillRect(px + W / 2 - 22 + i * 8, y0 - 12, 5, 4); }
  });

  window.IlhaOficios = { abrir, bloco, ITENS, COLETA, RECEITAS, PEDIDOS, comunidade: COM };
})();
