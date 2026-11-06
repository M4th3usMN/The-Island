/* A Grande Ilha — painel "ao vivo": avisos curtos no canto da tela.
   Mostra quem acabou de entrar, conquistas, cartas e níveis dos viajantes online
   (enviados pelo servidor a todos que estão jogando) e cada desembarque no cais
   (calculado pelo relógio, então até quem só está assistindo vê). */
(function () {
  'use strict';
  const G = window.GrandeIlha, K = window.IlhaComunidade;
  if (!G || !K) return;
  const esc = K.esc, MAX = 4, DUR = 14000;
  const caixa = document.createElement('div');
  caixa.className = 'feed px'; caixa.hidden = true; caixa.setAttribute('aria-live', 'polite'); caixa.setAttribute('aria-label', 'Acontecendo agora na ilha');
  caixa.innerHTML = '<b class="feed-t"><i></i>AO VIVO NA ILHA</b><ul></ul>';
  document.body.appendChild(caixa);
  const ul = caixa.querySelector('ul');
  const ICONE = { entrou: '➜', conquista: '★', carta: '✦', nivel: '▲', chegada: '⛵', saiu: '·' };
  function quando(t) { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'agora' : s < 3600 ? `há ${Math.round(s / 60)} min` : `há ${Math.round(s / 3600)} h`; }
  function push(it) {
    const li = document.createElement('li');
    li.className = 'feed-' + it.k;
    li.innerHTML = `<i aria-hidden="true">${ICONE[it.k] || '•'}</i><span>${it.html}</span>${it.t && Date.now() - it.t > 60e3 ? `<small>${quando(it.t)}</small>` : ''}`;
    ul.prepend(li);
    while (ul.children.length > MAX) ul.lastChild.remove();
    caixa.hidden = false;
    setTimeout(() => { li.classList.add('sai'); setTimeout(() => { li.remove(); if (!ul.children.length) caixa.hidden = true; }, 600); }, it.dur || DUR);
  }
  const quem = arroba => {
    const m = G.MOR.find(x => x.arroba && x.arroba.toLowerCase() === arroba);
    return m && G.arrived(m, Date.now()) ? `<b>${esc(m.nome)}</b> <em>@${esc(arroba)}</em>` : `<b>@${esc(arroba)}</b>`;
  };
  // desembarques no cais: vale para todo mundo, jogando ou só assistindo
  let ultimo = Date.now();
  setInterval(() => {
    const t = Date.now();
    G.MOR.forEach(m => { if (m._ch > ultimo && m._ch <= t) push({ k: 'chegada', html: `<b>${esc(m.nome)}</b> desembarcou no cais (${esc(m.profissao.toLowerCase())})`, dur: 20000 }); });
    // blocos de rotina com aviso (ex.: ronda do Morato pela orla às 9h e 21h)
    const h0 = G.localHours(ultimo), h1 = G.localHours(t);
    G.MOR.forEach(m => (m._blocos || []).forEach(b => {
      if (!b[4] || !b[4].aviso || !G.arrived(m, t)) return;
      const s = (b[0] + (m._jit || 0) + 24) % 24, passou = h0 <= h1 ? (h0 < s && s <= h1) : (h0 < s || s <= h1);
      if (passou) push({ k: 'chegada', html: `<b>${esc(m.nome)}</b> ${esc(b[4].aviso)}`, dur: 30000 });
    }));
    ultimo = t;
  }, 2000);
  window.IlhaFeed = { push, quem };
})();
