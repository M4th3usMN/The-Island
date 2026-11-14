/* A Grande Ilha — sprites em pixel art (desenhados por código, 1 unidade = 1 pixel). */
(function () {
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    const b = Math.min(255, Math.round((n & 255) * f));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function drawPerson(c, x, y, v, o) {
    x = Math.round(x); y = Math.round(y);
    const P = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a, b, w, h); };
    const child = v.tipo === 'crianca';
    const side = o.side || 1;
    const back = o.dir === 'up';
    const t = o.t || 0;
    const step = o.walking ? Math.floor(t * 7) % 2 : 0;
    const bob = o.walking && step ? -1 : 0;
    const bw = child ? 4 : 6, bh = child ? 4 : 5, lh = child ? 2 : 3;
    const bx = x - bw / 2;
    const roupa = v.roupa, sh = shade(v.roupa, 0.78);
    const pele = v.pele, hc = v.corCabelo || '#4a3020';

    // sombra
    P(x - 4, y, 8, 2, 'rgba(0,0,0,0.32)');

    // pernas
    const Y = y - lh - bh + bob;
    if (!v.manto) {
      const l1 = o.walking && step === 1 ? 1 : 0, l2 = o.walking && step === 0 ? 1 : 0;
      P(bx, y - lh - l1, 2, lh, v.calca);
      P(bx, y - 1 - l1, 2, 1, '#2b2220');
      if (v.pernaDePau) { P(bx + bw - 2, y - lh - l2, 2, 1, v.calca); P(bx + bw - 2, y - lh + 1 - l2, 1, lh - 1, '#9a6a3a'); } // perna de pau
      else { P(bx + bw - 2, y - lh - l2, 2, lh, v.calca); P(bx + bw - 2, y - 1 - l2, 2, 1, '#2b2220'); }
    }

    // escudo nas costas (vista de tras)
    if (back && v.acessorio === 'escudo_lanca') { P(x - 3, Y, 6, 5, '#b8862e'); }

    // tronco
    if (v.manto) {
      P(bx, Y, bw, bh + lh - 1, roupa);
      P(bx, Y + bh + lh - 2, bw, 1, sh);
      if (o.walking) P(bx + (step ? 0 : bw - 2), y - 1, 2, 1, '#2b2220');
    } else {
      P(bx, Y, bw, bh, roupa);
      P(bx, Y + bh - 1, bw, 1, sh);
    }
    if (v.kilt) {
      P(bx, Y + bh - 2, bw, 3, '#2e6b3a');
      P(bx + 1, Y + bh - 2, 1, 3, '#b03030');
      P(bx + bw - 2, Y + bh - 2, 1, 3, '#b03030');
    }
    if (v.avental && !back) P(bx + 1, Y + 1, bw - 2, bh + (v.manto ? 2 : 0), v.avental);
    if (v.listras && !back) { for (let i = 1; i < bh; i += 2) P(bx, Y + i, bw, 1, v.listras); }
    if (v.detalhe) P(bx, Y, bw, child ? 1 : 2, v.detalhe); // cachecol / gola
    // bracos
    P(bx - 1, Y + 1, 1, bh - 2, sh); P(bx + bw, Y + 1, 1, bh - 2, sh);
    P(bx - 1, Y + bh - 1, 1, 1, pele); P(bx + bw, Y + bh - 1, 1, 1, pele);

    // cabeca
    const HY = Y - 5;
    P(x - 3, HY, 6, 5, pele);
    const est = v.cabelo || 'curto';
    if (back) {
      if (est !== 'careca') P(x - 3, HY - 1, 6, 5, hc);
      if (est === 'longo') P(x - 3, HY + 4, 6, 2, hc);
      if (est === 'rabo') P(x - 1, HY + 4, 2, 3, hc);
    } else {
      if (est === 'curto') { P(x - 3, HY - 1, 6, 2, hc); P(x - 3, HY + 1, 1, 1, hc); P(x + 2, HY + 1, 1, 1, hc); }
      if (est === 'longo') { P(x - 3, HY - 1, 6, 2, hc); P(x - 4, HY, 1, 6, hc); P(x + 3, HY, 1, 6, hc); }
      if (est === 'rabo') { P(x - 3, HY - 1, 6, 2, hc); P(x + 3, HY + 1, 1, 3, hc); }
      if (est === 'espetado') { P(x - 3, HY - 1, 6, 2, hc); P(x - 3, HY - 2, 1, 1, hc); P(x - 1, HY - 2, 1, 1, hc); P(x + 1, HY - 2, 1, 1, hc); }
      if (est === 'coque') { P(x - 3, HY - 1, 6, 2, hc); P(x - 1, HY - 3, 2, 2, hc); }
      if (est === 'careca') P(x - 3, HY, 6, 1, shade(pele, 0.88));
      if (!o.dormindo) { P(x - 2, HY + 2, 1, 1, '#2a1e1e'); P(x + 1, HY + 2, 1, 1, '#2a1e1e'); }
      if (v.barba) P(x - 3, HY + 3, 6, 2, v.barba);
      if (v.manchas) { P(x + 1, HY + 1, 1, 1, v.manchas); P(x - 3, HY + 4, 1, 1, v.manchas); P(x + 2, HY + 3, 1, 1, v.manchas); }
    }

    // chapeus
    const ch = v.chapeu, cc = v.corChapeu || shade(roupa, 0.7);
    if (ch === 'palha') { P(x - 5, HY, 10, 1, '#d8b45a'); P(x - 3, HY - 2, 6, 2, '#e6c46c'); P(x - 3, HY - 1, 6, 1, '#a0522d'); }
    if (ch === 'capuz') { P(x - 4, HY - 1, 8, 2, cc); P(x - 4, HY, 1, 5, cc); P(x + 3, HY, 1, 5, cc); if (back) P(x - 3, HY, 6, 4, cc); }
    if (ch === 'mago') { P(x - 5, HY, 10, 1, cc); P(x - 3, HY - 2, 6, 2, cc); P(x - 2, HY - 4, 4, 2, cc); P(x - 1, HY - 6, 2, 2, cc); P(x + (side > 0 ? 1 : -2), HY - 7, 2, 1, cc); P(x - 1, HY - 3, 1, 1, '#ffe27a'); }
    if (ch === 'marinheiro') { P(x - 3, HY - 2, 6, 2, '#f2f2f2'); P(x - 3, HY - 1, 6, 1, '#2f4f8a'); }
    if (ch === 'elmo') { P(x - 3, HY - 1, 6, 2, '#b8862e'); P(x - 3, HY + 1, 1, 3, '#b8862e'); P(x + 2, HY + 1, 1, 3, '#b8862e'); P(x - 1, HY - 4, 2, 3, '#c0392b'); P(x - 2, HY - 3, 4, 1, '#c0392b'); if (back) P(x - 3, HY, 6, 4, '#a07428'); }
    if (ch === 'oculos' && !back) { P(x - 3, HY + 2, 6, 1, '#5a4a3a'); P(x - 2, HY + 2, 1, 1, '#8fd3ff'); P(x + 1, HY + 2, 1, 1, '#8fd3ff'); }
    if (ch === 'bandana') { P(x - 3, HY - 1, 6, 2, cc); P(side > 0 ? x - 4 : x + 3, HY, 1, 2, cc); }
    if (ch === 'faixa') P(x - 3, HY, 6, 1, cc);
    if (ch === 'gorro') { P(x - 3, HY - 2, 6, 2, cc); P(x - 3, HY - 1, 6, 1, shade(cc, 0.8)); }
    if (ch === 'tricornio') { P(x - 4, HY - 3, 8, 2, cc); P(x - 5, HY - 1, 10, 1, cc); P(x - 5, HY - 2, 1, 1, cc); P(x + 4, HY - 2, 1, 1, cc); P(x - 4, HY - 1, 8, 1, '#c9a14a'); P(x - 1, HY - 3, 2, 1, '#e8e2c8'); }
    if (ch === 'boina') { P(x - 3, HY - 2, 7, 2, cc); P(x - 3, HY - 1, 6, 1, shade(cc, 0.8)); P(side > 0 ? x + 3 : x - 4, HY - 1, 1, 1, cc); if (!back) P(x - 2, HY - 2, 1, 1, '#c9a14a'); }
    if (ch === 'elmo_aco') { P(x - 3, HY - 1, 6, 2, '#9aa0aa'); P(x - 3, HY + 1, 1, 3, '#9aa0aa'); P(x + 2, HY + 1, 1, 3, '#9aa0aa'); P(x - 1, HY - 2, 2, 1, '#c9ced8'); if (!back) P(x - 1, HY + 1, 1, 2, '#7d828e'); else P(x - 3, HY, 6, 4, '#868c96'); }
    if (ch === 'monoculo' && !back) { P(x, HY + 1, 3, 3, '#c9a14a'); P(x + 1, HY + 2, 1, 1, '#8fd3ff'); P(x + 2, HY + 4, 1, 2, '#c9a14a'); }
    if (ch === 'feltro') { P(x - 4, HY, 8, 1, cc); P(x - 3, HY - 2, 6, 2, cc); P(x - 3, HY - 1, 6, 1, shade(cc, 0.7)); }
    if (ch === 'mascara' && !back) { P(x - 3, HY + 3, 6, 2, cc); P(x - 3, HY + 3, 6, 1, shade(cc, 1.25)); }
    if (ch === 'mascara') P(side > 0 ? x - 4 : x + 3, HY + 3, 1, 2, cc);
    if (ch === 'eboshi') { P(x - 3, HY - 1, 6, 1, cc); P(x - 2, HY - 4, 4, 3, cc); P(x - 1, HY - 5, 3, 1, cc); P(x - 2, HY - 2, 4, 1, shade(cc, 1.6)); }
    if (ch === 'tapaolho') { if (!back) { P(x - 3, HY + 2, 6, 1, '#141010'); P(side > 0 ? x : x - 2, HY + 2, 2, 2, '#141010'); } else P(x - 3, HY + 2, 6, 1, '#141010'); }
    if (ch === 'turbante') { P(x - 3, HY - 2, 6, 3, cc); P(x - 2, HY - 3, 4, 1, cc); P(x - 3, HY - 1, 6, 1, 'rgba(0,0,0,0.22)'); if (!back) P(x - 1, HY - 2, 2, 1, '#e8b830'); P(side > 0 ? x - 4 : x + 3, HY, 1, 3, cc); }
    if (ch === 'coroa') { P(x - 3, HY - 2, 6, 2, '#e8b830'); P(x - 3, HY - 3, 1, 1, '#e8b830'); P(x - 1, HY - 4, 2, 2, '#e8b830'); P(x + 2, HY - 3, 1, 1, '#e8b830'); P(x - 3, HY - 1, 6, 1, '#b8862e'); if (!back) P(x - 1, HY - 2, 2, 1, cc); }
    if (ch === 'elmo_negro') { P(x - 3, HY - 1, 6, 5, '#26262e'); P(x - 3, HY - 1, 6, 1, '#3a3a46'); if (!back) P(x - 2, HY + 2, 4, 1, '#0a0a0e'); P(x - 1, HY - 4, 2, 3, cc); P(side > 0 ? x - 2 : x + 1, HY - 3, 1, 2, cc); }
    if (ch === 'bobo') { P(x - 3, HY - 1, 6, 2, cc); P(x - 4, HY - 4, 2, 3, cc); P(x + 2, HY - 4, 2, 3, '#2a8a5a'); P(x - 5, HY - 5, 1, 1, '#ffd046'); P(x + 4, HY - 5, 1, 1, '#ffd046'); }
    if (ch === 'bardo') { P(x - 3, HY - 2, 6, 2, cc); P(x - 4, HY - 1, 1, 1, cc); P(side > 0 ? x + 2 : x - 3, HY - 5, 1, 3, '#e8483a'); P(side > 0 ? x + 3 : x - 4, HY - 6, 1, 1, '#f2c040'); }

    // ---- Dia 7
    if (ch === 'sombreiro') { P(x - 6, HY, 12, 1, cc); P(x - 3, HY - 3, 6, 3, cc); P(x - 3, HY - 1, 6, 1, '#3a2414'); P(x - 6, HY, 1, 1, shade(cc, 0.7)); P(x + 5, HY, 1, 1, shade(cc, 0.7)); }
    if (ch === 'lupa_testa') { P(x - 3, HY, 6, 1, '#3a3a46'); if (!back) { P(x - 1, HY - 3, 3, 3, '#c9a14a'); P(x, HY - 2, 1, 1, '#bfe8ff'); } }
    if (ch === 'coroa_folhas') { P(x - 3, HY - 1, 6, 1, '#4a8a3a'); P(x - 4, HY, 1, 1, '#4a8a3a'); P(x + 3, HY, 1, 1, '#4a8a3a'); P(x - 2, HY - 2, 1, 1, '#6abf4a'); P(x + 1, HY - 2, 1, 1, '#6abf4a'); }
    if (ch === 'toque') { P(x - 3, HY - 1, 6, 1, '#e8e4dc'); P(x - 3, HY - 5, 6, 4, '#fbfaf6'); P(x - 4, HY - 5, 8, 2, '#fbfaf6'); P(x - 3, HY - 1, 6, 1, '#d4d0c8'); }
    if (ch === 'elmo_alado') { P(x - 3, HY - 1, 6, 2, '#c9ced8'); P(x - 1, HY - 2, 2, 1, '#dfe3ea'); P(x - 5, HY - 3, 2, 3, '#f4f4f4'); P(x + 3, HY - 3, 2, 3, '#f4f4f4'); P(x - 5, HY - 3, 1, 1, '#c9ced8'); P(x + 4, HY - 3, 1, 1, '#c9ced8'); if (back) P(x - 3, HY, 6, 3, '#aab0ba'); }
    if (ch === 'aviador') { P(x - 3, HY - 1, 6, 2, cc); if (!back) { P(x - 3, HY - 1, 6, 1, '#3a2a1a'); P(x - 2, HY - 1, 2, 1, '#ffb347'); P(x + 1, HY - 1, 2, 1, '#ffb347'); } P(side > 0 ? x - 4 : x + 3, HY + 1, 1, 3, cc); }
    if (ch === 'chapeu_ferro') { P(x - 5, HY, 10, 1, '#7d828e'); P(x - 3, HY - 2, 6, 2, '#9aa0aa'); P(x - 2, HY - 3, 4, 1, '#9aa0aa'); P(x - 5, HY, 10, 1, '#6a6e7a'); P(x - 1, HY - 2, 1, 1, '#dfe3ea'); }
    if (ch === 'chapeu_pintor') { P(x - 4, HY - 2, 8, 2, cc); P(side > 0 ? x + 3 : x - 5, HY - 1, 2, 2, cc); P(x - 2, HY - 2, 1, 1, '#e84a4a'); P(x, HY - 2, 1, 1, '#4ab0ff'); P(x + 2, HY - 2, 1, 1, '#ffd046'); }
    // ---- Dia 8
    if (ch === 'kabuto') { P(x - 3, HY - 2, 6, 2, cc); P(x - 4, HY, 1, 3, cc); P(x + 3, HY, 1, 3, cc); P(x - 4, HY - 1, 8, 1, shade(cc, 0.75)); if (!back) { P(x - 3, HY - 4, 1, 2, '#e8b830'); P(x + 2, HY - 4, 1, 2, '#e8b830'); P(x - 1, HY - 3, 2, 1, '#e8b830'); } else P(x - 3, HY, 6, 3, cc); }
    if (ch === 'bicorne') { P(x - 5, HY - 2, 10, 2, cc); P(x - 5, HY - 3, 1, 1, cc); P(x + 4, HY - 3, 1, 1, cc); P(x - 2, HY - 3, 4, 1, cc); P(x - 5, HY - 1, 10, 1, '#c9a14a'); if (!back) P(x, HY - 2, 1, 1, '#c0392b'); }
    if (ch === 'flor_cabelo') { const fx = side > 0 ? x + 2 : x - 4; P(fx, HY - 2, 2, 2, cc); P(fx + (side > 0 ? 1 : 0), HY - 1, 1, 1, '#ffe27a'); P(fx + (side > 0 ? -1 : 2), HY - 1, 1, 1, '#4a9a4a'); }
    if (ch === 'cartola') { P(x - 4, HY - 1, 8, 1, cc); P(x - 2, HY - 5, 4, 4, cc); P(x - 2, HY - 2, 4, 1, '#c0392b'); }
    if (ch === 'solideu') { P(x - 2, HY - 1, 4, 1, cc); if (!back) P(x - 1, HY + 5, 2, 1, '#f4f4f4'); }
    // ---- Dia 9
    if (ch === 'diadema_lua') { P(x - 3, HY, 6, 1, cc); P(x - 2, HY - 3, 3, 1, '#ffe9a0'); P(x - 2, HY - 2, 1, 1, '#ffe9a0'); P(x - 2, HY - 1, 3, 1, '#ffe9a0'); if (!back) P(x + 2, HY - 3, 1, 1, '#ffffff'); }
    if (ch === 'pele_lobo') { P(x - 4, HY - 2, 8, 3, cc); P(x - 4, HY - 4, 2, 2, cc); P(x + 2, HY - 4, 2, 2, cc); P(x - 3, HY - 3, 1, 1, '#c08a8a'); P(x + 2, HY - 3, 1, 1, '#c08a8a'); P(x - 4, HY + 1, 1, 4, cc); P(x + 3, HY + 1, 1, 4, cc); if (!back) { P(x - 1, HY - 1, 2, 1, shade(cc, 0.6)); P(x - 2, HY - 2, 1, 1, '#f2e6a0'); P(x + 1, HY - 2, 1, 1, '#f2e6a0'); } else P(x - 3, HY, 6, 6, cc); }
    if (ch === 'capuz_sombra') { P(x - 4, HY - 1, 8, 2, cc); P(x - 2, HY - 3, 4, 2, cc); P(x - 1, HY - 4, 2, 1, cc); P(x - 4, HY + 1, 1, 5, cc); P(x + 3, HY + 1, 1, 5, cc); if (!back) P(x - 3, HY + 1, 6, 1, 'rgba(0,0,0,0.45)'); else P(x - 3, HY, 6, 5, cc); }
    // ---- 14/11
    if (ch === 'coroa_torta') { P(x - 3, HY - 1, 6, 1, '#b8862e'); P(x - 3, HY - 2, 3, 1, '#e8b830'); P(x, HY - 3, 3, 2, '#e8b830'); P(x - 3, HY - 3, 1, 1, '#e8b830'); P(x + 2, HY - 4, 1, 1, '#e8b830'); P(x - 1, HY - 2, 1, 1, '#7a5a20'); if (!back) P(x + 1, HY - 2, 1, 1, cc); }
    if (ch === 'visor_tech') { P(x - 3, HY - 1, 6, 2, '#5a6070'); P(x - 3, HY - 1, 6, 1, '#7a808e'); P(side > 0 ? x + 3 : x - 4, HY - 3, 1, 4, '#9aa0aa'); P(side > 0 ? x + 3 : x - 4, HY - 4, 1, 1, Math.floor(t * 2) % 2 ? '#ff4a4a' : '#8a2a2a'); if (!back) P(x - 3, HY + 2, 6, 1, cc); else P(x - 3, HY + 1, 6, 1, '#5a6070'); }
    if (ch === 'cartola_oculos') { P(x - 4, HY - 1, 8, 1, cc); P(x - 3, HY - 4, 6, 3, cc); P(x - 3, HY - 2, 6, 1, '#7a5a3a'); if (!back) { P(x - 2, HY - 2, 2, 1, '#c9a14a'); P(x + 1, HY - 2, 2, 1, '#c9a14a'); P(x - 2, HY - 2, 1, 1, '#ffb347'); P(x + 1, HY - 2, 1, 1, '#ffb347'); } P(side > 0 ? x + 3 : x - 4, HY - 3, 1, 1, '#c9a14a'); }

    // acessorio (mao do lado "side")
    const M = (dx, dy, w, h, col) => P(side > 0 ? x + dx : x - dx - w, Y + dy, w, h, col);
    const a = v.acessorio;
    if (!back || a === 'bau' || a === 'bigorna' || a === 'corrente' || a === 'machado' || a === 'montante' || a === 'machado_runico' || a === 'cajado' || a === 'cajado_magico' || a === 'vara' || a === 'escudo_lanca' || a === 'forcado' || a === 'martelo_grande' || a === 'alabarda' || a === 'guitarra' || a === 'cachecol_bracos' || a === 'katana' || a === 'garfo_tampa') {
      if (a === 'machado') { M(4, -3, 1, 8, '#7a5230'); M(5, -3, 2, 3, '#b8bcc8'); M(5, -3, 1, 3, '#dfe3ea'); }
      if (a === 'cajado') { M(4, -6, 1, 11, '#8a6234'); M(4, -7, 3, 1, '#8a6234'); M(6, -6, 1, 2, '#8a6234'); }
      if (a === 'cajado_magico') { M(4, -5, 1, 10, '#4a3a5a'); M(3, -8, 3, 3, v.magia || '#9b6bff'); M(4, -7, 1, 1, '#ffffff'); }
      if (a === 'caneca') { M(4, 2, 2, 2, '#c89a5a'); M(4, 1, 2, 1, '#fff6d8'); }
      if (a === 'pena') { if (!back) P(bx, Y + 2, bw, 2, '#efe2bf'); M(4, -1, 1, 4, '#f4f4f4'); }
      if (a === 'martelo') { M(4, -1, 1, 5, '#6b4a2b'); M(3, -2, 3, 2, '#7d828e'); }
      if (a === 'enxada') { M(4, -4, 1, 9, '#8a6234'); M(5, -4, 2, 1, '#9aa0aa'); }
      if (a === 'espada') { M(4, -4, 1, 7, '#c9ced8'); M(3, 2, 3, 1, '#8a6a2a'); M(4, 3, 1, 1, '#5a3e26'); }
      if (a === 'vara') { M(4, -8, 1, 12, '#9b7b4b'); M(5, -8, 1, 1, '#9b7b4b'); M(6, -7, 1, 7, 'rgba(230,230,230,0.6)'); }
      if (a === 'chave') { M(4, 0, 1, 4, '#9aa0aa'); M(3, -1, 3, 2, '#9aa0aa'); M(4, -1, 1, 1, '#2b2b2b'); }
      if (a === 'escudo_lanca') { M(4, -8, 1, 13, '#7a5a3a'); M(4, -10, 1, 2, '#cfd3da'); if (!back) { M(-8, 0, 4, 5, '#b8862e'); M(-7, 1, 2, 3, '#d4a646'); } }
      if (a === 'arco') { M(4, -3, 1, 8, '#7a5230'); M(3, -4, 1, 1, '#7a5230'); M(3, 5, 1, 1, '#7a5230'); M(3, -3, 1, 8, 'rgba(235,235,235,0.55)'); }
      if (a === 'frasco') { M(4, 1, 2, 3, '#7dff9a'); M(4, 0, 1, 1, '#dddddd'); M(5, 2, 1, 1, '#d6ffe0'); }
      if (a === 'planta') { M(4, -1, 1, 5, '#e8e2c8'); M(4, -1, 1, 1, '#9fc4ff'); }
      if (a === 'luneta') { M(4, 0, 3, 1, '#c9a14a'); M(6, 0, 1, 1, '#8fd3ff'); }
      if (a === 'flauta') { M(2, -1, 5, 1, '#c8a060'); M(3, -1, 1, 1, '#3a2410'); M(5, -1, 1, 1, '#3a2410'); if (Math.floor(t * 2) % 2) M(8, -4, 1, 2, '#ffd046'); }
      if (a === 'cranio') { M(4, -6, 1, 13, '#3a3a2a'); M(3, -8, 3, 3, '#e8e4d0'); M(3, -7, 1, 1, '#141010'); M(5, -7, 1, 1, '#141010'); M(2, -9, 5, 1, `rgba(120,255,160,${(0.4 + 0.3 * Math.sin(t * 3)).toFixed(2)})`); }
      if (a === 'alaude') { M(3, 1, 3, 3, '#a0602a'); M(4, 2, 1, 1, '#3a2010'); M(5, -3, 1, 4, '#7a4a20'); M(5, -4, 2, 1, '#5a3418'); }
      if (a === 'besta') { M(4, -2, 1, 6, '#6a4a2a'); M(2, -1, 5, 1, '#7a5230'); M(2, 0, 1, 1, 'rgba(235,235,235,0.6)'); M(6, 0, 1, 1, 'rgba(235,235,235,0.6)'); M(4, -3, 1, 1, '#cfd3da'); }
      if (a === 'engrenagem') { M(4, 0, 3, 3, '#b8bcc8'); M(5, 1, 1, 1, '#5a5e68'); M(5, -1, 1, 1, '#b8bcc8'); M(7, 1, 1, 1, '#b8bcc8'); M(5, 3, 1, 1, '#b8bcc8'); M(3, 1, 1, 1, '#b8bcc8'); }
      if (a === 'bandeira') { M(4, -9, 1, 14, '#7a5a3a'); M(5, -9, 4, 3, v.corBandeira || '#c0392b'); M(5, -7, 4, 1, shade(v.corBandeira || '#c0392b', 0.75)); M(6, -8, 1, 1, '#f2e6c8'); }
      if (a === 'saco') { M(3, 1, 3, 4, '#d8c08a'); M(3, 1, 3, 1, '#b8a06a'); M(4, 0, 1, 1, '#8a6a3a'); }
      if (a === 'tabua') { M(0, -1, 8, 2, '#b08050'); M(0, -1, 8, 1, '#c89a64'); M(3, 0, 1, 1, '#7a5230'); }
      if (a === 'mapa') { M(4, 1, 3, 3, '#e8d8a8'); M(4, 1, 1, 3, '#b8a06a'); M(6, 2, 1, 1, '#c0392b'); }
      if (a === 'barril') { M(3, 1, 4, 4, '#8a5a2e'); M(3, 2, 4, 1, '#5a5e68'); M(3, 4, 4, 1, '#5a5e68'); }
      if (a === 'tenaz') { M(4, -2, 1, 6, '#5a5e68'); M(5, -2, 1, 1, '#5a5e68'); M(5, -3, 1, 1, '#ff8a3a'); }
      if (a === 'machadinha') { M(4, -1, 1, 5, '#6b4a2b'); M(5, -1, 2, 2, '#b8bcc8'); M(6, -1, 1, 2, '#dfe3ea'); }
      if (a === 'ampulheta') { M(3, 0, 4, 1, '#8a6234'); M(3, 4, 4, 1, '#8a6234'); M(4, 1, 2, 1, '#e8c06a'); M(4, 2, 2, 1, 'rgba(220,235,245,0.7)'); M(4, 3, 2, 1, '#e8c06a'); }
      if (a === 'balde') { M(3, 1, 4, 4, '#8a8e9a'); M(3, 1, 4, 1, '#b8bcc8'); M(4, 0, 2, 1, '#5aa0c0'); M(5, -1, 1, 1, '#c0c8d0'); }
      if (a === 'bigorna') { M(2, 2, 6, 2, '#4a4e58'); M(3, 4, 4, 1, '#3a3e48'); M(1, 2, 1, 1, '#4a4e58'); M(2, 2, 6, 1, '#6a6e7a'); }
      if (a === 'corrente') { for (let i = 0; i < 5; i++) M(3 + (i % 2), -2 + i * 2, 1, 1, '#9a9eaa'); M(2, 7, 3, 2, '#6a6e7a'); }
      if (a === 'bau') { M(2, 1, 6, 4, '#6a4428'); M(2, 1, 6, 1, '#8a5a32'); M(2, 3, 6, 1, '#3a2410'); M(4, 2, 2, 2, '#e8b830'); }
      if (a === 'montante') { M(4, -7, 1, 10, '#3a3a46'); M(4, -7, 1, 1, '#6a6a7a'); M(2, 3, 5, 1, '#8a1c22'); M(4, 4, 1, 2, '#2a1a14'); }
      if (a === 'machado_runico') { const g = 0.6 + 0.4 * Math.sin(t * 3); M(4, -5, 1, 10, '#5a3a1e'); M(5, -5, 3, 4, '#8a8e9a'); M(2, -5, 2, 4, '#8a8e9a'); M(6, -4, 1, 2, `rgba(255,170,60,${g.toFixed(2)})`); M(2, -4, 1, 2, `rgba(255,170,60,${g.toFixed(2)})`); }
      if (a === 'orbe_mental') { const fy = Math.round(Math.sin(t * 1.8)); M(4, -2 + fy, 3, 3, v.magia || '#ff7ad9'); M(5, -2 + fy, 1, 1, '#ffffff'); M(3, -1 + fy, 1, 1, 'rgba(255,122,217,0.45)'); M(7, -1 + fy, 1, 1, 'rgba(255,122,217,0.45)'); }
      // ---- Dia 7
      if (a === 'forcado') { M(4, -6, 1, 11, '#8a6234'); M(3, -8, 3, 1, '#9aa0aa'); M(3, -10, 1, 2, '#9aa0aa'); M(5, -10, 1, 2, '#9aa0aa'); M(4, -9, 1, 1, '#9aa0aa'); }
      if (a === 'martelo_grande') { M(4, -5, 1, 10, '#5a3e26'); M(2, -8, 5, 3, '#5a5e68'); M(2, -8, 5, 1, '#8a8e9a'); M(6, -7, 1, 1, '#ff8a3a'); }
      if (a === 'espada_runica') { const g = 0.55 + 0.45 * Math.sin(t * 4); M(4, -5, 1, 8, '#bfe8ff'); M(4, -5, 1, 8, `rgba(90,208,255,${g.toFixed(2)})`); M(3, 2, 3, 1, '#c9a14a'); M(4, 3, 1, 1, '#3a2410'); M(5, -3, 1, 1, `rgba(255,255,255,${g.toFixed(2)})`); }
      if (a === 'guitarra') { if (back) { P(x - 2, Y, 4, 5, '#c0262e'); } else { M(2, 1, 4, 3, '#c0262e'); M(3, 2, 1, 1, '#f4f4f4'); M(6, -3, 1, 5, '#2a2a2a'); M(6, -4, 2, 1, '#9aa0aa'); } if (!back && Math.floor(t * 3) % 2) M(9, -2, 1, 1, '#ffd046'); }
      if (a === 'cajado_folhas') { M(4, -6, 1, 11, '#7a5a30'); M(3, -8, 3, 2, '#5aa84a'); M(5, -9, 1, 1, '#8ad86a'); M(2, -7, 1, 1, '#8ad86a'); M(4, -10 + Math.round(Math.sin(t * 2)), 1, 1, 'rgba(160,255,160,0.7)'); }
      if (a === 'pao') { M(2, 1, 6, 1, '#8a6234'); M(2, 0, 2, 1, '#d89a4a'); M(4, -1, 2, 2, '#c8843a'); M(6, 0, 2, 1, '#e0a85a'); }
      if (a === 'escudo_redondo') { M(4, -4, 1, 7, '#dfe3ea'); M(3, 2, 3, 1, '#8a6a2a'); if (!back) { M(-8, 0, 4, 5, '#2a5aa8'); M(-7, -1, 2, 1, '#2a5aa8'); M(-7, 5, 2, 1, '#2a5aa8'); M(-7, 2, 2, 1, '#e8b830'); } }
      if (a === 'livro_sagrado') { M(3, 1, 3, 4, '#1e1a2a'); M(3, 1, 3, 1, '#c9a14a'); M(4, 2, 1, 2, '#c9a14a'); }
      if (a === 'cachecol_bracos') { const w = Math.round(Math.sin(t * 3)), w2 = Math.round(Math.cos(t * 2.4)); const cs = v.detalhe || '#e84a4a';
        P(bx - 3, Y - 2 + w, 2, 1, cs); P(bx - 4, Y - 4 + w, 1, 2, cs); P(bx + bw + 1, Y - 2 - w, 2, 1, cs); P(bx + bw + 3, Y - 4 - w, 1, 2, cs);
        P(bx - 2, Y + 3 + w2, 1, 3, cs); P(bx - 3, Y + 6 + w2, 1, 1, cs); P(bx + bw + 1, Y + 3 - w2, 1, 3, cs); P(bx + bw + 2, Y + 6 - w2, 1, 1, cs); }
      if (a === 'alabarda') { M(4, -10, 1, 15, '#6b4a2b'); M(5, -9, 2, 3, '#b8bcc8'); M(5, -9, 1, 3, '#dfe3ea'); M(4, -12, 1, 2, '#cfd3da'); M(3, -8, 1, 1, '#b8bcc8'); }
      if (a === 'espada_madeira') { M(4, -2, 1, 5, '#c89a5a'); M(3, 2, 3, 1, '#7a5230'); }
      if (a === 'pincel_paleta') { M(4, -3, 1, 5, '#8a6234'); M(4, -4, 1, 1, '#4ab0ff'); if (!back) { M(-6, 1, 4, 3, '#d8b878'); M(-5, 1, 1, 1, '#e84a4a'); M(-4, 2, 1, 1, '#4ab0ff'); M(-6, 2, 1, 1, '#ffd046'); M(-5, 3, 1, 1, '#4ac07a'); } }
      // ---- Dia 8
      if (a === 'katana') { M(4, -6, 1, 9, '#e8ecf2'); M(5, -7, 1, 2, '#e8ecf2'); M(3, 3, 3, 1, '#c9a14a'); M(4, 4, 1, 2, '#1a1418'); M(4, 5, 1, 1, '#c0392b'); }
      if (a === 'bussola') { M(3, 1, 4, 4, '#b8862e'); M(4, 2, 2, 2, '#f2ead8'); M(4, 2, 1, 1, '#c0392b'); M(5, 3, 1, 1, '#2a3a5a'); }
      if (a === 'caderno') { M(3, 1, 3, 4, '#a8402a'); M(4, 1, 2, 4, '#f4ecd8'); M(4, 2, 2, 1, '#8a8a9a'); M(6, -1, 1, 4, '#e8b830'); }
      if (a === 'moeda') { const fy = Math.floor(t * 3) % 3 === 0 ? -1 : 0; M(4, 1 + fy, 2, 2, '#ffd046'); M(4, 1 + fy, 1, 1, '#fff2a8'); M(3, 3, 3, 2, '#7a5a3a'); }
      if (a === 'cesta') { M(3, 2, 3, 2, '#a0773f'); M(3, 1, 1, 1, '#a0773f'); M(5, 1, 1, 1, '#a0773f'); }
      // ---- Dia 9
      if (a === 'astrolabio') { M(5, -1, 1, 1, '#c9a14a'); M(3, 0, 4, 4, '#c9a14a'); M(4, 1, 2, 2, '#1e2a4a'); M(4 + (Math.floor(t) % 2), 1 + (Math.floor(t) % 2), 1, 1, '#ffe27a'); }
      if (a === 'chicote') { M(4, 0, 1, 3, '#5a3a1e'); M(5, -2, 1, 2, '#8a5a32'); M(6, -4, 2, 1, '#8a5a32'); M(8, -3, 1, 2, '#8a5a32'); M(9, -1, 1, 1, '#8a5a32'); if (Math.floor(t * 2) % 3 === 0) M(10, -2, 1, 1, '#fff6c8'); }
      if (a === 'adagas') { M(4, -2, 1, 5, '#c9ced8'); M(3, 2, 3, 1, '#3a2a2a'); M(4, 3, 1, 1, '#7a1a2a'); M(-5, 0, 1, 4, '#c9ced8'); M(-6, 3, 3, 1, '#3a2a2a'); }
      // ---- 14/11
      if (a === 'garfo_tampa') { M(4, -3, 1, 8, '#c9ced8'); M(3, -4, 3, 1, '#c9ced8'); M(3, -6, 1, 2, '#c9ced8'); M(5, -6, 1, 2, '#c9ced8'); M(4, 4, 1, 1, '#8a6234'); if (!back) { M(-8, 0, 5, 4, '#9aa0aa'); M(-7, -1, 3, 1, '#b8bcc8'); M(-6, -2, 1, 1, '#5a3a1e'); M(-7, 0, 1, 1, '#dfe3ea'); } }
      if (a === 'chave_vapor') { const f = (t * 1.5) % 1; M(4, -2, 1, 6, '#8a8e9a'); M(3, -3, 3, 1, '#8a8e9a'); M(3, -4, 1, 1, '#8a8e9a'); M(5, -4, 1, 1, '#8a8e9a'); M(4, 4, 1, 1, '#5a3a1e'); M(6, -6 - Math.round(f * 3), 1, 1, `rgba(235,235,240,${(0.75 * (1 - f)).toFixed(2)})`); M(7, -8 - Math.round(f * 3), 1, 1, `rgba(235,235,240,${(0.45 * (1 - f)).toFixed(2)})`); }
      if (a === 'escudo_energia') { const g = 0.45 + 0.25 * Math.sin(t * 3); M(4, 1, 2, 2, '#5a6070'); M(-9, -1, 5, 7, `rgba(90,220,255,${g.toFixed(2)})`); M(-8, 0, 3, 5, 'rgba(210,250,255,0.35)'); M(-9, -1, 5, 1, '#9aeaff'); M(-9, 5, 5, 1, '#9aeaff'); }
    }
    if (a === 'espirito') {
      const fy = Math.round(Math.sin(t * 2.2) * 2);
      M(5, -7 + fy, 2, 2, '#bfe8ff'); M(6, -8 + fy, 1, 1, '#ffffff'); M(4, -5 + fy, 1, 1, 'rgba(191,232,255,0.6)');
    }
  }

  function drawCat(c, x, y, v, o) {
    x = Math.round(x); y = Math.round(y);
    const P = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a, b, w, h); };
    const col = v.roupa, sh = shade(col, 0.75), s = o.side || 1;
    P(x - 4, y, 8, 2, 'rgba(0,0,0,0.3)');
    if (o.dormindo) {
      P(x - 3, y - 3, 7, 3, col); P(x - 3, y - 1, 7, 1, sh); P(s > 0 ? x + 2 : x - 4, y - 4, 3, 2, col);
      P(s > 0 ? x + 2 : x - 4, y - 5, 1, 1, col); return;
    }
    const step = o.walking ? Math.floor((o.t || 0) * 9) % 2 : 0;
    P(x - 3, y - 2, 1, 2, sh); P(x + 2, y - 2 + (step ? -1 : 0), 1, 2, sh);
    P(x - 3, y - 5, 7, 3, col); P(x - 3, y - 3, 7, 1, sh);
    const hx = s > 0 ? x + 2 : x - 5;
    P(hx, y - 8, 4, 4, col); P(hx, y - 9, 1, 1, col); P(hx + 3, y - 9, 1, 1, col);
    P(hx + 1, y - 7, 1, 1, '#ffe14d'); P(hx + 2, y - 7, 1, 1, '#ffe14d');
    const tx = s > 0 ? x - 4 : x + 4;
    const wag = Math.round(Math.sin((o.t || 0) * 4));
    P(tx, y - 8 + wag, 1, 4, col);
  }

  function drawDog(c, x, y, v, o) {
    x = Math.round(x); y = Math.round(y);
    const P = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a, b, w, h); };
    const col = v.roupa, wh = v.detalhe || '#f2efe6', s = o.side || 1;
    P(x - 5, y, 10, 2, 'rgba(0,0,0,0.3)');
    if (o.dormindo) {
      P(x - 4, y - 3, 9, 3, col); P(x - 2, y - 2, 4, 2, wh); P(s > 0 ? x + 3 : x - 6, y - 4, 4, 3, col); return;
    }
    const step = o.walking ? Math.floor((o.t || 0) * 9) % 2 : 0;
    P(x - 4, y - 2 + (step ? -1 : 0), 1, 2, col); P(x - 2, y - 2, 1, 2, col);
    P(x + 1, y - 2 + (step ? 0 : -1), 1, 2, col); P(x + 3, y - 2, 1, 2, col);
    P(x - 4, y - 6, 9, 4, col); P(x - 2, y - 4, 4, 2, wh);
    const hx = s > 0 ? x + 3 : x - 7;
    P(hx, y - 9, 4, 4, col); P(s > 0 ? hx + 3 : hx - 1, y - 7, 2, 2, wh);
    P(s > 0 ? hx : hx + 3, y - 9, 1, 3, shade(col, 0.7));
    P(s > 0 ? hx + 2 : hx + 1, y - 8, 1, 1, '#1d1612');
    const tx = s > 0 ? x - 5 : x + 5;
    P(tx, y - 8 + Math.round(Math.sin((o.t || 0) * 10)), 1, 3, col);
  }

  function drawCharacter(c, x, y, v, o) {
    if (v.tipo === 'gato') return drawCat(c, x, y, v, o);
    if (v.tipo === 'cao') return drawDog(c, x, y, v, o);
    return drawPerson(c, x, y, v, o);
  }

  function hitBox(v) {
    if (v.tipo === 'gato') return { l: -6, r: 6, t: -10, b: 2 };
    if (v.tipo === 'cao') return { l: -7, r: 7, t: -10, b: 2 };
    if (v.tipo === 'crianca') return { l: -5, r: 5, t: -15, b: 2 };
    return { l: -5, r: 5, t: -17, b: 2 };
  }

  function icon(v, scale) {
    scale = scale || 3;
    const w = 16, h = 20;
    const s = document.createElement('canvas');
    s.width = w; s.height = h;
    const c = s.getContext('2d');
    drawCharacter(c, 8, h - 3, v, { t: 0, dir: 'down', side: 1 });
    const out = document.createElement('canvas');
    out.width = w * scale; out.height = h * scale;
    const oc = out.getContext('2d');
    oc.imageSmoothingEnabled = false;
    oc.drawImage(s, 0, 0, w * scale, h * scale);
    return out;
  }

  window.IlhaSprites = { drawCharacter, drawPerson, drawCat, drawDog, hitBox, icon, shade };
})();
