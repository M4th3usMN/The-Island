/* A Grande Ilha — cartas dos personagens.
   Cada jogador vê a própria carta e ganha a carta de quem ele conhece:
   conversar com um morador, cumprimentar um viajante de perto ou cumprir uma missão
   com alguém do lado. O nível da carta é o nível de quem joga com aquele personagem. */
(function () {
  'use strict';
  const G = window.GrandeIlha, SP = window.IlhaSprites, ROT = window.IlhaRotinas, K = window.IlhaComunidade;
  if (!G || !SP || !K) return;
  const esc = K.esc;

  const RAR = [
    { min: 20, id: 'lendario', nome: 'LENDÁRIO', cor: '#ffd046', fundo: '#b8862e' },
    { min: 10, id: 'epico', nome: 'ÉPICO', cor: '#b070ff', fundo: '#4a2a7a' },
    { min: 5, id: 'raro', nome: 'RARO', cor: '#4aa0ff', fundo: '#1e4a8a' },
    { min: 0, id: 'comum', nome: 'COMUM', cor: '#b8bcc8', fundo: '#5a5e68' }
  ];
  const raridade = lv => RAR.find(r => lv >= r.min);
  const ATR = ['FOR', 'AGI', 'VIT', 'INT', 'ESP'];
  // profissão -> atributo principal
  const PERFIS = [
    [/guerr|gladiad|cavaleir|lenhad|ferreir|constru|tavern|batedor|forç/, 0],
    [/caçad|cacad|atirad|ladin|marinh|pescad|capit|recompens|aventur/, 1],
    [/fazend|pastor|merce|cervej|cão|cao|agricul|encarreg/, 2],
    [/mago|escrib|invent|engenh|quím|quim|relojo|estrateg|mentes|líder|lider|revoluc|herdeir/, 3],
    [/sacerd|aprendiz|espírit|espirit|bardo|tempo|gato/, 4]
  ];
  const HAB = [
    ['Golpe Firme', 'trabalho pesado rende +10%'],
    ['Passo Leve', 'anda 10% mais rápido na ilha'],
    ['Fôlego de Ferro', 'cansa menos nas missões longas'],
    ['Mente Afiada', 'aprende ofícios mais rápido'],
    ['Bênção da Ilha', 'mais sorte nos eventos']
  ];
  const HAB_ESP = [
    [/ferreir/, 'Forja Rúnica', 'armas que ele faz saem +10% fortes'],
    [/estrateg/, 'Plano de Guerra', 'aliados na luta ganham +1 de defesa'],
    [/mago/, 'Chama Sombria', 'feitiços custam menos energia'],
    [/tavern|cervej/, 'Rodada da Casa', 'quem bebe na taverna recupera energia'],
    [/escrib/, 'Pena da Memória', 'registra cada acontecimento no diário'],
    [/pescad/, 'Mar Calmo', 'pesca em dobro ao amanhecer'],
    [/sacerd/, 'Ampulheta Sagrada', 'missões com prazo ganham +1 dia'],
    [/mentes/, 'Controle Mental', 'convence aliados sem lutar'],
    [/cavaleir/, 'Escudo do Povo', 'protege quem está ao lado']
  ];

  function principal(m) {
    const p = (m.profissao + ' ' + (m.rotina || '')).toLowerCase();
    const hit = PERFIS.find(([re]) => re.test(p));
    return hit ? hit[1] : Math.floor(G.rnd(m.id, 'atr') * 5);
  }
  function atributos(m, lv) {
    const pr = principal(m), sec = (pr + 1 + Math.floor(G.rnd(m.id, 'sec') * 4)) % 5;
    return ATR.map((a, i) => {
      const base = 4 + Math.floor(G.rnd(m.id, 'a' + i) * 3) + (i === pr ? 4 : i === sec ? 2 : 0);
      return base + Math.floor((lv - 1) * (i === pr ? 1 : i === sec ? 0.6 : 0.35));
    });
  }
  const poderDe = (at, lv) => at.reduce((s, v) => s + v, 0) * 8 + lv * 20;
  function habilidade(m) {
    const p = m.profissao.toLowerCase(), e = HAB_ESP.find(([re]) => re.test(p));
    return e ? [e[1], e[2]] : HAB[principal(m)];
  }
  // lugar onde o morador passa mais tempo trabalhando: é o fundo da carta
  function cenaDe(m) {
    const R = ROT[m.rotina] || {}, soma = {};
    (R.blocos || []).forEach(b => {
      if (['casa', 'passeio', 'gato', 'fogueira'].includes(b[2])) return;
      const d = ((b[1] - b[0]) + 24) % 24 || 24; soma[b[2]] = (soma[b[2]] || 0) + d;
    });
    const k = Object.keys(soma).sort((a, b) => soma[b] - soma[a])[0];
    return k || 'fogueira';
  }
  function ordem() { return G.MOR.slice().sort((a, b) => a._ch - b._ch || a._i - b._i); }

  // ---------------------------------------------------------------- fundos (pixel art 48x30)
  const CENAS = {
    forja: g => { muro(g, '#2a1a14', '#3a2618'); chao(g, '#4a3426'); P(g, 32, 8, 12, 12, '#5a5e68'); P(g, 34, 11, 8, 6, '#ff8a3a'); P(g, 35, 12, 6, 3, '#ffd046'); brilho(g, 38, 14, 22, 'rgba(255,150,60,0.5)'); P(g, 4, 19, 9, 2, '#5a5e68'); P(g, 6, 21, 5, 3, '#3a3e48'); },
    taverna: g => { muro(g, '#4a2e1a', '#5a3820'); chao(g, '#6a4628'); P(g, 0, 17, 48, 3, '#7a4a26'); for (let x = 4; x < 46; x += 9) { P(g, x, 13, 3, 4, '#c89a5a'); P(g, x, 12, 3, 1, '#fff6d8'); } brilho(g, 40, 6, 16, 'rgba(255,200,110,0.35)'); P(g, 39, 4, 2, 3, '#ffd046'); },
    fogueira: g => { ceu(g, '#14203a', '#24345a'); P(g, 0, 18, 48, 12, '#3a5a2a'); P(g, 21, 21, 7, 2, '#5a3a24'); P(g, 22, 18, 5, 3, '#ff8a3a'); P(g, 23, 16, 3, 3, '#ffd046'); brilho(g, 24, 19, 20, 'rgba(255,150,60,0.45)'); estrelas(g); },
    floresta: g => { ceu(g, '#4a7ab8', '#8ab0d8'); P(g, 0, 20, 48, 10, '#3a6a2a'); [2, 10, 34, 42].forEach(x => pinho(g, x, 20)); },
    cais: g => { ceu(g, '#5a8ac8', '#a8c8e8'); P(g, 0, 16, 48, 14, '#2a5a9a'); for (let i = 0; i < 12; i++) P(g, (i * 17) % 48, 18 + (i * 5) % 11, 3, 1, 'rgba(200,230,255,0.4)'); P(g, 8, 19, 32, 3, '#8a5a2e'); P(g, 8, 19, 32, 1, '#a8703a'); P(g, 10, 22, 1, 6, '#5a3418'); P(g, 37, 22, 1, 6, '#5a3418'); },
    arena: g => { ceu(g, '#6a8ac8', '#8aa8d8'); P(g, 0, 15, 48, 15, '#b89a64'); for (let i = 0; i < 18; i++) P(g, (i * 37) % 48, 17 + (i * 13) % 12, 2, 1, '#a08654'); P(g, 3, 4, 1, 12, '#6a4a2a'); P(g, 4, 4, 5, 4, '#c0392b'); P(g, 44, 4, 1, 12, '#6a4a2a'); P(g, 39, 4, 5, 4, '#2a4a8a'); P(g, 5, 13, 38, 2, '#7a5a3a'); },
    santuario: g => { ceu(g, '#2a2040', '#5a3a6a'); P(g, 0, 19, 48, 11, '#4a5a3a'); P(g, 10, 6, 28, 2, '#b0242a'); P(g, 12, 8, 24, 1, '#b0242a'); P(g, 14, 8, 2, 12, '#8a1c22'); P(g, 32, 8, 2, 12, '#8a1c22'); brilho(g, 24, 12, 18, 'rgba(255,220,160,0.25)'); estrelas(g); },
    torre: g => { ceu(g, '#1a1430', '#3a2a5a'); P(g, 0, 21, 48, 9, '#2a3a2a'); P(g, 34, 2, 10, 20, '#5a5a6a'); P(g, 33, 1, 12, 2, '#6a4a8a'); P(g, 38, 8, 2, 3, '#c8a0ff'); brilho(g, 39, 9, 12, 'rgba(176,112,255,0.4)'); estrelas(g); },
    biblioteca: g => { muro(g, '#3a2a1e', '#3a2a1e'); chao(g, '#4a3624'); for (let y = 2; y < 17; y += 5) { P(g, 2, y + 4, 44, 1, '#6a4a2a'); for (let x = 3; x < 45; x += 3) P(g, x, y, 2, 4, ['#8a2e2e', '#2e5a8a', '#3a7a3a', '#c8a24a'][(x + y) % 4]); } },
    fazenda: g => { ceu(g, '#6aa0d8', '#a8d0f0'); P(g, 0, 16, 48, 14, '#7a5a30'); for (let y = 17; y < 30; y += 3) for (let x = 1; x < 48; x += 4) P(g, x, y, 2, 2, '#5aa03a'); P(g, 38, 3, 4, 4, '#ffe27a'); },
    pasto: g => { ceu(g, '#6aa0d8', '#a8d0f0'); P(g, 0, 16, 48, 14, '#5a9a3a'); P(g, 0, 15, 48, 1, '#8a6a3a'); [[6, 20], [38, 22]].forEach(([x, y]) => { P(g, x, y, 6, 4, '#f2f2ea'); P(g, x + 5, y, 2, 2, '#3a3028'); }); },
    oficina: g => { muro(g, '#3a3a40', '#46464e'); chao(g, '#5a4a3a'); P(g, 4, 16, 40, 2, '#8a5a2e'); [[8, 12], [20, 11], [33, 12]].forEach(([x, y]) => { P(g, x, y, 4, 4, '#b8bcc8'); P(g, x + 1, y + 1, 2, 2, '#5a5e68'); }); },
    laboratorio: g => { muro(g, '#1e3a3a', '#24464a'); chao(g, '#3a4a46'); P(g, 4, 16, 40, 2, '#6a5a4a'); [[8, '#7dff9a'], [18, '#ff7ad9'], [30, '#8fd3ff'], [38, '#ffd046']].forEach(([x, c]) => { P(g, x, 12, 3, 4, c); P(g, x + 1, 11, 1, 1, '#dddddd'); }); brilho(g, 20, 13, 16, 'rgba(125,255,154,0.25)'); },
    ponte: g => { ceu(g, '#5a8ac8', '#a8c8e8'); P(g, 0, 18, 48, 12, '#2a6a3a'); P(g, 0, 21, 48, 4, '#3a7ac8'); P(g, 12, 18, 24, 3, '#8a5a2e'); },
    mercearia: g => { muro(g, '#5a3a22', '#6a4428'); chao(g, '#7a5232'); P(g, 0, 15, 48, 3, '#8a5a2e'); [[4, '#c0392b'], [12, '#e8c06a'], [20, '#5aa03a'], [28, '#d68a3a'], [36, '#8a2e5a']].forEach(([x, c]) => { P(g, x, 11, 6, 4, '#a0773f'); P(g, x + 1, 10, 4, 2, c); }); }
  };
  function P(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function muro(g, a, b) { P(g, 0, 0, 48, 30, a); for (let y = 0; y < 18; y += 3) for (let x = (y / 3 % 2) * 2; x < 48; x += 4) P(g, x, y, 3, 2, b); }
  function chao(g, c) { P(g, 0, 18, 48, 12, c); }
  function ceu(g, a, b) { P(g, 0, 0, 48, 30, a); P(g, 0, 9, 48, 9, b); }
  function estrelas(g) { for (let i = 0; i < 10; i++) P(g, (i * 29 + 3) % 48, (i * 7 + 1) % 12, 1, 1, '#e8eefa'); }
  function pinho(g, x, y) { P(g, x + 2, y - 3, 1, 3, '#4a3020'); P(g, x + 1, y - 7, 3, 4, '#1e4a26'); P(g, x, y - 5, 5, 2, '#1e4a26'); P(g, x + 2, y - 9, 1, 2, '#1e4a26'); }
  function brilho(g, x, y, r, c) { const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 48, 30); }

  // ---------------------------------------------------------------- dados da carta
  // fonte: { m: morador } ou { arroba, look, lv } para viajante
  function dados(f) {
    const NIV = window.IlhaJogo && window.IlhaJogo.niveis ? window.IlhaJogo.niveis : {};
    if (f.m) {
      const m = f.m, lv = f.lv || (m.arroba ? NIV[m.arroba.toLowerCase()] : 0) || (m.arroba ? 1 : 10);
      const at = atributos(m, lv), h = habilidade(m), ord = ordem();
      return {
        id: m.id, nome: m.nome, prof: m.profissao, visual: m.visual, lv, at, poder: poderDe(at, lv), hab: h,
        hist: (m.historia || '').split(/(?<=\.)\s/)[0], cena: cenaDe(m), num: ord.indexOf(m) + 1, total: ord.length,
        chegou: m._ch <= G.DIA2 - 864e5 ? 'Fundador' : 'Dia ' + G.diaDe(m._ch), arroba: m.arroba || '',
        apoio: m.arroba && (K.APO || []).find(a => a.arroba === m.arroba.toLowerCase())
      };
    }
    const fake = { id: 'v:' + f.arroba, profissao: 'Viajante', rotina: '' };
    const lv = f.lv || 1, at = atributos(fake, lv);
    return {
      id: 'v:' + f.arroba, nome: '@' + f.arroba, prof: 'Viajante', visual: f.look || {}, lv, at, poder: poderDe(at, lv), hab: HAB[principal(fake)],
      hist: 'Visitante que desembarcou na Grande Ilha para conhecer os moradores.', cena: 'cais', num: 0, total: 0, chegou: 'Viajante', arroba: f.arroba,
      apoio: (K.APO || []).find(a => a.arroba === String(f.arroba).toLowerCase())
    };
  }

  function dataCurta(t) { const d = new Date(t - 3 * 3600e3); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0'); }

  // ---------------------------------------------------------------- desenho
  function carta(f, extra) {
    const d = dados(f), r = raridade(d.lv), el = document.createElement('div');
    el.className = 'carta'; el.style.setProperty('--r', r.cor); el.style.setProperty('--r2', r.fundo);
    const masc = d.apoio && K.MASCOTES[d.apoio.tipo];
    el.innerHTML = `<div class="ct-miolo">
      <div class="ct-topo"><b class="ct-nome">${esc(d.nome.toUpperCase())}</b><span class="ct-nv">NV<b>${d.lv}</b></span></div>
      <div class="ct-arte"><canvas width="48" height="30"></canvas><span class="ct-rar">${r.nome}</span>${masc ? `<span class="ct-selo">${esc(masc.nome.toUpperCase())} · APOIADOR</span>` : ''}</div>
      <div class="ct-prof">${esc(d.prof.toUpperCase())}</div>
      <div class="ct-poder"><span>⚔ PODER</span><b>${d.poder}</b><i><s style="width:${Math.min(100, d.poder / 10)}%"></s></i></div>
      <div class="ct-atr">${ATR.map((a, i) => `<span>${a}<b>${d.at[i]}</b></span>`).join('')}</div>
      <p class="ct-hist">${esc(d.hist)}</p>
      <p class="ct-hab"><b>${esc(d.hab[0])}</b> · ${esc(d.hab[1])}</p>
      <div class="ct-pe"><span>${d.num ? `Nº <b>${String(d.num).padStart(3, '0')}</b>/${String(d.total).padStart(3, '0')} · ` : ''}${esc(d.chegou)}</span><span>${d.arroba ? '@' + esc(d.arroba) : ''}</span></div>
    </div>${extra && extra.carimbo ? `<div class="ct-carimbo">✦ ${esc(extra.carimbo)}</div>` : ''}`;
    const g = el.querySelector('canvas').getContext('2d');
    (CENAS[d.cena] || CENAS.fogueira)(g);
    if (masc) masc.draw(g, 38, 27, 0, 1, d.apoio.pal);
    SP.drawCharacter(g, 22, 27, d.visual, { t: 1, side: 1 });
    return el;
  }
  function mini(f, tem) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ct-mini' + (tem ? '' : ' falta');
    if (!tem) { b.innerHTML = '<span class="ct-q">?</span><small>???</small>'; b.disabled = true; return b; }
    const d = dados(f), r = raridade(d.lv); b.style.setProperty('--r', r.cor);
    const c = document.createElement('canvas'); c.width = 20; c.height = 24;
    SP.drawCharacter(c.getContext('2d'), 10, 21, d.visual, { t: 1, side: 1 });
    b.appendChild(c); b.insertAdjacentHTML('beforeend', `<small>${esc(d.nome)}</small><i>NV ${d.lv}</i>`);
    b.setAttribute('aria-label', `Carta de ${d.nome}, nível ${d.lv}`);
    return b;
  }

  window.IlhaCartas = { carta, mini, dados, raridade, dataCurta, ordem };
})();
