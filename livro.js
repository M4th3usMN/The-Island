/* A Grande Ilha — O LIVRO DA ILHA, escrito à mão por Natã, o escriba.
   Um capítulo por morador: retrato, ficha, os feitos nos episódios e a história nas palavras dele.
   Qualquer pessoa pode ler (jogando ou só assistindo) pelo botão LIVRO. */
(function () {
  'use strict';
  const G = window.GrandeIlha, SP = window.IlhaSprites, K = window.IlhaComunidade, ROT = window.IlhaRotinas, L = window.LIVRO || { textos: {}, marcos: {} };
  if (!G || !SP) return;
  const esc = K ? K.esc : s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const btn = document.getElementById('btn-livro');
  const caixa = document.createElement('div');
  caixa.className = 'livro-fundo'; caixa.hidden = true; caixa.setAttribute('role', 'dialog'); caixa.setAttribute('aria-modal', 'true'); caixa.setAttribute('aria-label', 'O Livro da Ilha');
  caixa.innerHTML = `<div class="livro-cx">
    <div class="livro-cab"><div><h2>O LIVRO DA ILHA</h2><small>escrito à mão por <b>Natã, o escriba</b> · <span id="lv-n"></span> moradores</small></div>
      <div class="livro-ferr"><input id="lv-busca" type="search" placeholder="procurar morador ou profissão" aria-label="Procurar morador ou profissão"><button type="button" id="lv-ind" class="lv-b">ÍNDICE</button><button type="button" id="lv-x" class="lv-b" aria-label="Fechar o livro">✕</button></div></div>
    <div class="livro-ordem" role="tablist" aria-label="Ordem dos capítulos"><button type="button" data-o="dia" aria-selected="true">POR CHEGADA</button><button type="button" data-o="az">A–Z</button><button type="button" data-o="oficio">POR OFÍCIO</button></div>
    <div class="livro-pags" id="lv-pags"></div>
    <div class="livro-nav"><button type="button" class="lv-b" id="lv-ant">◀</button><span id="lv-pos"></span><button type="button" class="lv-b" id="lv-prox">▶</button></div>
  </div>`;
  document.body.appendChild(caixa);
  const $ = id => caixa.querySelector('#' + id);
  let ordem = 'dia', lista = [], i = 0, indice = false;

  const chegados = () => G.MOR.filter(m => G.arrived(m, Date.now()));
  function ordena() {
    const ms = chegados().slice();
    if (ordem === 'az') ms.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    else if (ordem === 'oficio') ms.sort((a, b) => a.profissao.localeCompare(b.profissao, 'pt') || a.nome.localeCompare(b.nome, 'pt'));
    else ms.sort((a, b) => a._ch - b._ch || a._i - b._i);
    return ms;
  }
  const capitulo = m => chegados().sort((a, b) => a._ch - b._ch || a._i - b._i).indexOf(m) + 1;
  function dia(m) { return m._ch < G.DIA2 - 864e5 ? 'Desde a primeira noite' : 'Dia ' + G.diaDe(m._ch) + ', pelo cais'; }
  function mora(m) {
    const c = m.casa || 'auto';
    if (c.indexOf('com:') === 0) { const o = G.BY[c.slice(4)]; return o ? 'Com ' + o.nome : 'Casa dividida'; }
    if (G.LUG[c]) return G.LUG[c].nome;
    if (c === 'mercearia') return 'Na mercearia';
    return 'Casa própria';
  }
  function rotina(m) {
    const R = ROT[m.rotina]; if (!R) return '';
    const b = R.blocos.filter(x => x[2] !== 'casa').sort((a, b2) => ((b2[1] - b2[0] + 24) % 24) - ((a[1] - a[0] + 24) % 24)).slice(0, 2);
    return b.map(x => x[3]).join(' · ');
  }
  function carta(m) {
    const C = window.IlhaCartas; if (!C) return '';
    const d = C.dados({ m }), r = C.raridade(d.lv);
    return `${r.nome.charAt(0) + r.nome.slice(1).toLowerCase()} · nível ${d.lv}`;
  }
  function pagina(m) {
    const txt = L.textos[m.id] || [m.historia || ''];
    const marcos = L.marcos[m.id] || [];
    const pr = txt.map((p, j) => j === 0 ? `<p><span class="lv-cap">${esc(p.charAt(0))}</span>${esc(p.slice(1))}</p>` : `<p>${esc(p)}</p>`).join('');
    return `<div class="lv-pg lv-esq"><h3>CAPÍTULO ${capitulo(m)}</h3>
        <div class="lv-ret"><canvas width="24" height="30" aria-hidden="true"></canvas><div><b>${esc(m.nome.toUpperCase())}</b><i>${esc(m.profissao.toUpperCase())}${m.arroba ? ' · @' + esc(m.arroba.toUpperCase()) : ''}</i></div></div>
        <dl class="lv-ficha"><dt>CHEGOU</dt><dd>${esc(dia(m))}</dd><dt>MORA</dt><dd>${esc(mora(m))}</dd><dt>ROTINA</dt><dd>${esc(rotina(m))}</dd>${carta(m) ? `<dt>CARTA</dt><dd>${esc(carta(m))}</dd>` : ''}</dl>
        <h3>NA HISTÓRIA DA ILHA</h3>
        ${marcos.length ? `<ul class="lv-marcos">${marcos.map(x => `<li><b>${esc(x[0])}</b> · ${esc(x[1])}</li>`).join('')}</ul>` : `<p class="lv-vazio">Natã ainda está esperando o primeiro grande feito de ${esc(m.nome)}...</p>`}
      </div>
      <div class="lv-pg lv-dir"><h3>A HISTÓRIA, NAS PALAVRAS DE QUEM VIVEU</h3>${pr}<div class="lv-ass">— registrado por Natã, ${esc(m._ch < G.DIA2 - 864e5 ? 'na primeira noite' : 'Dia ' + G.diaDe(m._ch))}</div></div>`;
  }
  function mostra() {
    const P = $('lv-pags');
    if (indice) {
      P.className = 'livro-pags lv-indice';
      P.innerHTML = lista.length ? lista.map((m, j) => `<button type="button" class="lv-item" data-j="${j}"><canvas width="24" height="30" aria-hidden="true"></canvas><b>${esc(m.nome)}</b><small>${esc(m.profissao)}</small></button>`).join('') : '<p class="lv-vazio">Nenhum morador com esse nome ou ofício.</p>';
      P.querySelectorAll('.lv-item').forEach(b => { const m = lista[+b.dataset.j]; SP.drawCharacter(b.querySelector('canvas').getContext('2d'), 12, 27, m.visual, { t: 1, side: 1 }); b.onclick = () => { i = +b.dataset.j; indice = false; mostra(); }; });
      $('lv-pos').textContent = `${lista.length} capítulos`;
      $('lv-ant').disabled = $('lv-prox').disabled = true;
      return;
    }
    const m = lista[i]; if (!m) { indice = true; return mostra(); }
    P.className = 'livro-pags'; P.innerHTML = pagina(m); P.scrollTop = 0;
    SP.drawCharacter(P.querySelector('.lv-ret canvas').getContext('2d'), 12, 27, m.visual, { t: 1, side: 1 });
    const ant = lista[(i - 1 + lista.length) % lista.length], prox = lista[(i + 1) % lista.length];
    $('lv-ant').textContent = '◀ ' + ant.nome.toUpperCase(); $('lv-prox').textContent = prox.nome.toUpperCase() + ' ▶';
    $('lv-ant').disabled = $('lv-prox').disabled = lista.length < 2;
    $('lv-pos').textContent = `${i + 1} / ${lista.length}`;
  }
  function filtra() {
    const q = $('lv-busca').value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const todos = ordena();
    lista = q ? todos.filter(m => (m.nome + ' ' + m.profissao + ' ' + (m.arroba || '')).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)) : todos;
    if (q) indice = true;
    i = Math.min(i, Math.max(0, lista.length - 1)); mostra();
  }
  let volta = null;
  function abrir(id) {
    volta = document.activeElement; lista = ordena(); indice = false;
    i = id ? Math.max(0, lista.findIndex(m => m.id === id)) : 0;
    $('lv-n').textContent = lista.length; $('lv-busca').value = '';
    caixa.hidden = false; mostra(); setTimeout(() => $('lv-prox').focus({ preventScroll: true }), 30);
  }
  function fechar() { caixa.hidden = true; if (volta && volta.focus) volta.focus({ preventScroll: true }); }
  $('lv-x').onclick = fechar;
  caixa.addEventListener('click', e => { if (e.target === caixa) fechar(); });
  $('lv-ant').onclick = () => { i = (i - 1 + lista.length) % lista.length; mostra(); };
  $('lv-prox').onclick = () => { i = (i + 1) % lista.length; mostra(); };
  $('lv-ind').onclick = () => { indice = !indice; mostra(); };
  $('lv-busca').addEventListener('input', filtra);
  caixa.querySelector('.livro-ordem').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const atual = lista[i]; ordem = b.dataset.o;
    caixa.querySelectorAll('.livro-ordem button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    lista = ordena(); i = Math.max(0, lista.indexOf(atual)); mostra();
  });
  window.addEventListener('keydown', e => {
    if (caixa.hidden) return;
    if (e.key === 'Escape') { e.stopPropagation(); fechar(); }
    else if (document.activeElement !== $('lv-busca') && !indice) { if (e.key === 'ArrowRight') $('lv-prox').click(); if (e.key === 'ArrowLeft') $('lv-ant').click(); }
  }, true);
  if (btn) btn.addEventListener('click', () => abrir());
  window.IlhaLivro = { abrir };
})();
