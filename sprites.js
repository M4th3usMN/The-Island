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
    if (!o.semSombra) P(x - 4, y, 8, 2, 'rgba(0,0,0,0.32)');

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
      if (!o.dormindo) { const oc = v.olhos || '#2a1e1e'; P(x - 2, HY + 2, 1, 1, oc); P(x + 1, HY + 2, 1, 1, oc); }
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

    // ---- 15/11
    if (ch === 'mascara_olhos') { if (!back) { P(x - 3, HY + 1, 6, 2, cc); P(x - 2, HY + 2, 1, 1, v.olhos || '#e8e4dc'); P(x + 1, HY + 2, 1, 1, v.olhos || '#e8e4dc'); } else P(x - 3, HY + 1, 6, 1, cc); P(side > 0 ? x - 4 : x + 3, HY + 1, 1, 3, cc); }
    if (ch === 'kasa') { P(x - 6, HY, 12, 1, cc); P(x - 4, HY - 1, 8, 1, cc); P(x - 2, HY - 2, 4, 1, cc); P(x - 1, HY - 3, 2, 1, shade(cc, 1.15)); P(x - 6, HY, 1, 1, shade(cc, 0.7)); P(x + 5, HY, 1, 1, shade(cc, 0.7)); P(x - 4, HY - 1, 8, 1, 'rgba(0,0,0,0.12)'); if (!back) P(x - 3, HY + 1, 6, 1, 'rgba(0,0,0,0.3)'); }
    if (ch === 'panela') { P(x - 4, HY - 1, 8, 1, '#6a6e7a'); P(x - 3, HY - 4, 6, 3, '#8a8e9a'); P(x - 3, HY - 4, 6, 1, '#b8bcc8'); P(side > 0 ? x + 3 : x - 5, HY - 3, 2, 1, '#3a2a1a'); if (!back) P(x - 2, HY - 3, 1, 1, '#dfe3ea'); }
    if (ch === 'orelhas_fera') { P(x - 3, HY - 1, 6, 1, cc); P(x - 4, HY - 2, 2, 1, cc); P(x - 4, HY - 4, 1, 2, cc); P(x + 2, HY - 2, 2, 1, cc); P(x + 3, HY - 4, 1, 2, cc); if (!back) { P(x - 3, HY - 2, 1, 1, '#c08a8a'); P(x + 2, HY - 2, 1, 1, '#c08a8a'); } }
    if (ch === 'tiara_penas') { P(x - 3, HY, 6, 1, '#8a5a32'); P(x - 2, HY - 3, 1, 3, cc); P(x, HY - 4, 1, 4, '#e8b830'); P(x + 2, HY - 3, 1, 3, '#3a8a5a'); }
    // ---- 16/11
    if (ch === 'elmo_penacho') { P(x - 3, HY - 1, 6, 5, '#3a3e48'); P(x - 3, HY - 1, 6, 1, '#5a5e6a'); if (!back) { P(x - 2, HY + 1, 4, 1, '#0a0a0e'); P(x - 1, HY + 2, 2, 1, '#0a0a0e'); P(x - 3, HY + 3, 6, 1, '#c9a14a'); } P(x - 1, HY - 2, 2, 1, '#c9a14a'); P(side > 0 ? x - 2 : x, HY - 5, 3, 3, cc); P(side > 0 ? x - 3 : x + 2, HY - 4, 1, 3, cc); P(side > 0 ? x - 1 : x, HY - 5, 1, 1, shade(cc, 1.35)); }
    // ---- 18/11
    if (ch === 'tapa_mira') { P(x - 3, HY, 6, 1, cc); P(side > 0 ? x - 4 : x + 3, HY, 1, 2, cc); if (!back) { const ex = side > 0 ? x : x - 3; P(ex, HY + 1, 3, 3, '#2a2a32'); P(ex + 1, HY + 2, 1, 1, Math.floor(t * 2) % 3 ? '#ff3a3a' : '#ffd0d0'); } }
    if (ch === 'chapeu_pluma') { P(x - 5, HY, 10, 1, cc); P(side > 0 ? x + 4 : x - 6, HY + 1, 2, 1, cc); P(x - 3, HY - 3, 6, 3, cc); P(x - 3, HY - 1, 6, 1, '#8a1e22'); const fx = side > 0 ? x - 3 : x + 2; P(fx, HY - 5, 1, 3, '#f2ead8'); P(fx + (side > 0 ? -1 : 1), HY - 6, 1, 2, '#e8483a'); P(fx + (side > 0 ? -2 : 2), HY - 5, 1, 2, '#e8483a'); }
    // ---- 21/11
    if (ch === 'chapeu_ervas') { P(x - 5, HY, 10, 1, cc); P(x - 3, HY - 2, 6, 2, cc); P(x - 3, HY - 1, 6, 1, shade(cc, 0.7)); const fx = side > 0 ? x + 1 : x - 2; P(fx, HY - 4, 1, 2, '#4a9a3a'); P(fx + 1, HY - 5, 1, 2, '#7ad05a'); P(fx - 1, HY - 3, 1, 1, '#f2e05a'); }
    if (ch === 'capacete_couro') { P(x - 3, HY - 2, 6, 3, cc); P(x - 4, HY - 1, 1, 3, cc); P(x + 3, HY - 1, 1, 3, cc); P(x - 2, HY - 2, 1, 1, '#c9a14a'); P(x + 1, HY - 2, 1, 1, '#c9a14a'); if (!back) { P(x - 3, HY, 6, 1, '#2a2a2e'); P(x - 2, HY, 1, 1, '#8fd3ff'); P(x + 1, HY, 1, 1, '#8fd3ff'); } else P(x - 3, HY, 6, 3, shade(cc, 0.85)); }
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
      // ---- 16/11
      if (a === 'corneta_guerra') { M(3, 1, 4, 2, '#e8dcc0'); M(3, 1, 1, 2, '#c9a14a'); M(6, 0, 2, 4, '#e8dcc0'); M(6, 0, 1, 1, '#c9a14a'); M(4, 3, 1, 2, '#5a3a1e'); if (Math.floor(t * 2) % 4 === 0) M(9, -1, 1, 1, '#fff6c8'); }
      // ---- 18/11
      if (a === 'facao') { M(4, -4, 1, 7, '#c9ced8'); M(5, -4, 1, 6, '#9aa0aa'); M(5, -5, 1, 1, '#c9ced8'); M(3, 3, 3, 1, '#3a2a1a'); M(4, 4, 1, 2, '#5a3a1e'); }
      if (a === 'florete') { M(4, -9, 1, 11, '#e8ecf2'); M(3, 2, 3, 2, '#c9a14a'); M(4, 2, 1, 1, '#8a6a2a'); M(4, 4, 1, 2, '#7a1e1e'); if (Math.floor(t * 2) % 4 === 0) M(4, -7, 1, 1, '#ffffff'); }
      if (a === 'adagas') { M(4, -2, 1, 5, '#c9ced8'); M(3, 2, 3, 1, '#3a2a2a'); M(4, 3, 1, 1, '#7a1a2a'); M(-5, 0, 1, 4, '#c9ced8'); M(-6, 3, 3, 1, '#3a2a2a'); }
      // ---- 14/11
      if (a === 'garfo_tampa') { M(4, -3, 1, 8, '#c9ced8'); M(3, -4, 3, 1, '#c9ced8'); M(3, -6, 1, 2, '#c9ced8'); M(5, -6, 1, 2, '#c9ced8'); M(4, 4, 1, 1, '#8a6234'); if (!back) { M(-8, 0, 5, 4, '#9aa0aa'); M(-7, -1, 3, 1, '#b8bcc8'); M(-6, -2, 1, 1, '#5a3a1e'); M(-7, 0, 1, 1, '#dfe3ea'); } }
      if (a === 'chave_vapor') { const f = (t * 1.5) % 1; M(4, -2, 1, 6, '#8a8e9a'); M(3, -3, 3, 1, '#8a8e9a'); M(3, -4, 1, 1, '#8a8e9a'); M(5, -4, 1, 1, '#8a8e9a'); M(4, 4, 1, 1, '#5a3a1e'); M(6, -6 - Math.round(f * 3), 1, 1, `rgba(235,235,240,${(0.75 * (1 - f)).toFixed(2)})`); M(7, -8 - Math.round(f * 3), 1, 1, `rgba(235,235,240,${(0.45 * (1 - f)).toFixed(2)})`); }
      // ---- 15/11
      if (a === 'bolsa_moedas') { M(3, 1, 4, 4, '#7a5a3a'); M(4, 0, 2, 1, '#5a3a1e'); M(4, 2, 2, 1, '#ffd046'); if (Math.floor(t * 2) % 2) M(7, 0, 1, 1, '#ffd046'); }
      if (a === 'kusarigama') { M(4, -3, 1, 6, '#5a3a1e'); M(3, -4, 3, 1, '#c9ced8'); M(2, -3, 1, 1, '#c9ced8'); for (let i = 0; i < 4; i++) M(5 + i, 3 + (i % 2), 1, 1, '#8a8e9a'); M(9, 4, 2, 2, '#5a5e66'); }
      if (a === 'cata_vento') { M(4, -3, 1, 7, '#a0773f'); if (Math.floor(t * 6) % 2) { M(3, -5, 1, 1, '#e84a4a'); M(5, -5, 1, 1, '#4ab0ff'); M(3, -3, 1, 1, '#ffd046'); M(5, -3, 1, 1, '#4ac07a'); } else { M(4, -6, 1, 1, '#e84a4a'); M(6, -4, 1, 1, '#4ab0ff'); M(2, -4, 1, 1, '#ffd046'); M(4, -2, 1, 1, '#4ac07a'); } M(4, -4, 1, 1, '#ffffff'); }
      if (a === 'rosa') { M(4, 0, 1, 4, '#3a8a3a'); M(5, 1, 1, 1, '#3a8a3a'); M(3, -2, 3, 2, '#d8203a'); M(4, -2, 1, 1, '#ff5a6a'); }
      if (a === 'laco') { const k = '#c8a060'; M(3, 1, 3, 1, k); M(3, 3, 3, 1, k); M(3, 2, 1, 1, k); M(5, 2, 1, 1, k); M(6, -2, 1, 3, k); M(6, -6, 4, 1, k); M(6, -3, 4, 1, k); M(6, -5, 1, 2, k); M(9, -5, 1, 2, k); }
      if (a === 'escudo_energia') { const g = 0.45 + 0.25 * Math.sin(t * 3); M(4, 1, 2, 2, '#5a6070'); M(-9, -1, 5, 7, `rgba(90,220,255,${g.toFixed(2)})`); M(-8, 0, 3, 5, 'rgba(210,250,255,0.35)'); M(-9, -1, 5, 1, '#9aeaff'); M(-9, 5, 5, 1, '#9aeaff'); }
      // ---- 21/11
      if (a === 'pilao') { M(3, 2, 4, 3, '#8a8e9a'); M(3, 2, 4, 1, '#b8bcc8'); M(4, 2, 2, 1, '#5aa84a'); M(5, -2, 1, 4, '#c8a878'); M(5, -2, 1, 1, '#e8d0a0'); if (Math.floor(t * 2) % 3 === 0) M(4, 0, 1, 1, '#8ad86a'); }
      if (a === 'esquadro') { M(4, -4, 1, 8, '#c9a14a'); M(4, 3, 5, 1, '#c9a14a'); M(4, -2, 1, 1, '#7a5a2a'); M(4, 0, 1, 1, '#7a5a2a'); M(6, 3, 1, 1, '#7a5a2a'); M(8, 3, 1, 1, '#7a5a2a'); }
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

  // =====================================================================================
  // ESTILO 32x44 (aprovado em 22/11/2026). Corpo desenhado à mão em código com rampas de
  // 4-5 tons (luz da esquerda, sombra azulada), pontilhado Bayer e contorno #140c1c.
  // Chapéus e acessórios antigos entram ampliados 2x e sombreados por cima.
  // Só é usado quando o canvas está em escala >= 1.9 (mapa e mar desenham em 2x).
  // =====================================================================================
  const NW = 48, NH = 64, NX = 8, NY = 14;
  const mkc = (w, h) => { const k = document.createElement('canvas'); k.width = w; k.height = h; return k; };
  const P2 = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x) + NX, Math.round(y) + NY, w, h); };
  const BAY2 = [[0, 2], [3, 1]];
  function rgbDe(h) { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, f) { const A = rgbDe(a), B = rgbDe(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join(''); }
  function hex6(col) { if (!col) return '#888888'; if (col[0] === '#' && col.length === 4) return '#' + [...col.slice(1)].map(ch => ch + ch).join(''); return col.slice(0, 7); }
  function rampa(col) { col = hex6(col); return [mix(col, '#140c2c', 0.62), mix(col, '#1a1440', 0.36), col, mix(col, '#fff2d0', 0.24), mix(col, '#fff8ec', 0.5)]; }
  function rampaPele(col) { col = hex6(col); return [mix(col, '#3a1a2a', 0.45), mix(col, '#5a2a3a', 0.22), col, mix(col, '#fff0e0', 0.22)]; }
  function mancha2(c, cx, cy, rx, ry, ramp, ruido) {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2; if (d > 1) continue;
      let v = 0.55 - 0.45 * (x / rx) * 0.7 - 0.45 * (y / ry) - d * 0.35 + (ruido ? (Math.abs(Math.sin(x * 12.9 + y * 78.2) * 43758.5) % 1) * ruido : 0);
      v = Math.max(0, Math.min(0.999, v)) * ramp.length;
      let i = Math.floor(v); const fr = v - i; if (fr > 0.5 && i < ramp.length - 1) i++; // estilo estudo 6: sombra chapada, sem pontilhado
      P2(c, cx + x, cy + y, 1, 1, ramp[Math.min(i, ramp.length - 1)]);
    }
  }
  function contorno2(cv, cor) {
    cor = '#140e1a'; // estilo Flow: contorno único em tudo
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, d = c.getImageData(0, 0, W, H), o = new Uint8ClampedArray(d.data);
    const a = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d.data[(y * W + x) * 4 + 3] > 40;
    const [r, g, b] = rgbDe(cor);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) { const k = (y * W + x) * 4; o[k] = r; o[k + 1] = g; o[k + 2] = b; o[k + 3] = 255; }
    c.putImageData(new ImageData(o, W, H), 0, 0);
  }
  const OURO = ['#8a5a1a', '#b07a24', '#e0a836', '#ffd046', '#fff4b0'];
  const CABA = ['#5e6688', '#8e96b4', '#c8cede', '#eef1f8', '#ffffff'];
  const PELEA = ['#7a4a3a', '#a86a50', '#d09070', '#e8b48c'];
  // olhos 3x3 (estudo 6): pálpebra escura, branco, íris, pupila e brilho; pupilas viradas para o centro
  function olhos2(c, y, pup, x1 = 12, x2 = 18, fechado) {
    if (fechado) { P2(c, x1 - 1, y + 1, 3, 1, '#2a1830'); P2(c, x2, y + 1, 3, 1, '#2a1830'); return; }
    const iris = (pup && pup !== '#2a1830' && pup !== '#2a1e1e') ? pup : '#4a6ab0';
    [[x1 - 1, 1], [x2, 0]].forEach(([x, dentro]) => {
      P2(c, x, y - 1, 3, 1, '#2a1830'); P2(c, x, y, 3, 2, '#ffffff');
      const px = dentro ? x + 1 : x;
      P2(c, px, y, 2, 2, iris); P2(c, px, y + 1, 2, 1, '#1a1030'); P2(c, px, y, 1, 1, '#ffffff');
    });
  }
  // cores mais vivas (estudo 6): saturação x1.32 e contraste x1.06, aplicado uma vez em cada sprite do cache
  // ===================== ESTILO FLOW (23/11/2026) =====================
  // Cores chapadas em poucos tons, saturação contida, linha escura entre as partes
  // (no lado escuro de cada borda forte) e contorno #140e1a. Usado por tudo que
  // antes passava pelo vivo(): moradores, bichos, árvores, casas, prédios, objetos, dragão.
  const FLOW_OUT = [20, 14, 26];
  function estiloFlow(cv) {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, d = c.getImageData(0, 0, W, H), p = d.data, L = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const k = i * 4; if (p[k + 3] < 128) { L[i] = -1; continue; }
      let r = p[k] / 255, g = p[k + 1] / 255, b = p[k + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0, l = (mx + mn) / 2;
      if (mx !== mn) { const dd = mx - mn; s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6; }
      // visual "Flow convertido": cores apagadas, contraste suave, sombras puxadas para o roxo
      s = Math.min(1, s * (h > 0.02 && h < 0.15 ? 0.9 : 0.66)); l = 0.1 + l * 0.76; // pele, dourado e madeira ficam mais quentes
      if (l < 0.4) h = h + ((h > 0.25 ? 0.74 : -0.26) - h) * 0.18 * (0.4 - l) / 0.4;
      h = (h + 1) % 1; l = Math.round(l * 9) / 9; L[i] = l;                    // degraus de luz: cor chapada
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, pp = 2 * l - q, f = t => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
      p[k] = f(h + 1 / 3) * 255; p[k + 1] = f(h) * 255; p[k + 2] = f(h - 1 / 3) * 255; p[k + 3] = 255;
    }
    // linhas internas: o pixel mais escuro de uma borda forte vira linha (separa braço, roupa, chapéu...)
    const marca = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (L[i] < 0) continue;
      [[1, 0], [0, 1]].forEach(([dx, dy]) => {
        const xx = x + dx, yy = y + dy; if (xx >= W || yy >= H) return; const j = yy * W + xx; if (L[j] < 0) return;
        if (L[j] - L[i] > 0.27) marca[i] = 1; else if (L[i] - L[j] > 0.27) marca[j] = 1;
      });
    }
    for (let i = 0; i < W * H; i++) if (marca[i]) { const k = i * 4; p[k] = FLOW_OUT[0]; p[k + 1] = FLOW_OUT[1]; p[k + 2] = FLOW_OUT[2]; }
    c.putImageData(d, 0, 0); return cv;
  }
  function vivo(cv) { return estiloFlow(cv); }
  function vivoAntigo(cv) {
    const c = cv.getContext('2d'), d = c.getImageData(0, 0, cv.width, cv.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255, l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
      [r, g, b].forEach((v, k) => { p[i + k] = Math.min(255, Math.max(0, (((l + (v - l) * 1.32) - 0.5) * 1.06 + 0.515) * 255)); });
    }
    c.putImageData(d, 0, 0); return cv;
  }
  function espada2(c, gx, gy, ang, len = 22) {
    const t = ang * Math.PI / 180, dx = Math.cos(t), dy = Math.sin(t), px = -dy, py = dx;
    for (let i = 1; i <= len; i++) { const x = gx + dx * i, y = gy + dy * i; P2(c, x, y, 1, 1, i === len ? '#c8cede' : '#eef2fa'); P2(c, x + px, y + py, 1, 1, '#9aa2ba'); }
    for (let i = -3; i <= 3; i++) P2(c, gx + px * i, gy + py * i, 1, 1, i < 0 ? OURO[3] : OURO[2]);
    for (let i = 1; i <= 4; i++) { P2(c, gx - dx * i, gy - dy * i, 1, 1, '#7a4e2e'); P2(c, gx - dx * i + px, gy - dy * i + py, 1, 1, '#5a3418'); }
    P2(c, gx - dx * 5, gy - dy * 5, 2, 2, OURO[3]);
  }

  // ---------------- Aldric desenhado à mão (rei de Valdrak, sempre o mais forte)
  const ALD = {
    atras(c, p) {
      const M = ['#0e1430', '#16203a', '#22305a', '#2e4072', '#3c5290'], sw = p.capa || 0;
      for (let y = 17; y <= 40; y++) { const w = Math.min(14, Math.round(9 + (y - 17) * 0.4)), sx = Math.round(sw * (y - 17) / 23); for (let x = -w; x <= w; x++) { const lado = x / w; let i = lado < -0.55 ? 3 : lado < -0.1 ? 2 : lado < 0.5 ? 1 : 0; if ([-6, 2, 8].some(f => Math.abs(x - f - (y - 17) * 0.12) < 0.6) && y > 22) i = Math.max(0, i - 1); P2(c, 16 + x + sx, y, 1, 1, M[i]); } }
      for (let y = 21; y <= 40; y++) { const w = Math.min(14, Math.round(9 + (y - 17) * 0.4)), sx = Math.round(sw * (y - 17) / 23); P2(c, 16 - w + sx, y, 1, 1, OURO[2]); P2(c, 16 + w + sx, y, 1, 1, OURO[1]); }
      for (let x = 2; x <= 30; x++) P2(c, x + sw, 40, 1, 1, x % 2 ? OURO[3] : OURO[2]);
    },
    pernas(c, p) { pernas2(c, p, ['#2a3256', '#3a4472'], ['#3a2618', '#5a3c26'], 34, 3); },
    frente(c, p) {
      const M = ['#0e1430', '#16203a', '#22305a', '#2e4072', '#3c5290'];
      for (let y = 18; y <= 34; y++) for (let x = 11; x <= 21; x++) P2(c, x, y, 1, 1, M[x < 13 ? 4 : x < 17 ? 3 : x < 20 ? 2 : 1]);
      for (let y = 19; y <= 33; y++) P2(c, 16, y, 1, 1, OURO[(y % 3) ? 2 : 3]);
      P2(c, 11, 28, 11, 2, '#4a2e1a'); P2(c, 11, 28, 11, 1, '#6a4428'); P2(c, 15, 28, 3, 2, OURO[3]); P2(c, 16, 28, 1, 1, OURO[4]);
      const aL = p.aL || 0, aR = p.aR || 0;
      for (let y = 19; y <= 29 + aL; y++) P2(c, 8, y, 3, 1, M[y < 24 ? 3 : 2]);
      for (let y = 19; y <= 29 + aR; y++) P2(c, 22, y, 3, 1, M[1]);
      P2(c, 8, 29 + aL, 3, 1, OURO[3]); P2(c, 22, 29 + aR, 3, 1, OURO[2]);
      P2(c, 8, 30 + aL, 3, 3, PELEA[2]); P2(c, 8, 30 + aL, 1, 3, PELEA[3]);
      espada2(c, 26.5, 31 + aR, -90);
      P2(c, 22, 30 + aR, 3, 3, PELEA[1]);
      for (let y = 7; y <= 22; y++) { P2(c, 10, y, 2, 1, CABA[y < 14 ? 2 : 1]); P2(c, 21, y, 2, 1, CABA[y < 14 ? 1 : 0]); }
      mancha2(c, 16, 12, 5, 5, PELEA, 0);
      P2(c, 13, 11, 2, 1, CABA[1]); P2(c, 18, 11, 2, 1, CABA[1]);
      olhos2(c, 12, '#2a1830', 13, 18, p.dormindo); P2(c, 16, 13, 1, 2, PELEA[1]);
      for (let y = 14; y <= 21; y++) { const w = Math.round(5 - (y - 14) * 0.55); for (let x = -w; x <= w; x++) { const v = x < -1 ? 3 : x < 2 ? 2 : 1; P2(c, 16 + x, y, 1, 1, CABA[(x + y) % 3 === 0 ? Math.max(0, v - 1) : v]); } }
      P2(c, 13, 14, 7, 1, CABA[3]);
      for (let x = 11; x <= 21; x++) { P2(c, x, 6, 1, 1, CABA[x < 15 ? 3 : 2]); P2(c, x, 7, 1, 1, CABA[x < 13 ? 4 : x < 18 ? 3 : 1]); }
      for (let x = 11; x <= 21; x++) { P2(c, x, 4, 1, 2, OURO[x < 14 ? 4 : x < 18 ? 3 : 2]); P2(c, x, 6, 1, 1, OURO[1]); }
      for (const [sx, h] of [[11, 2], [16, 3], [21, 2]]) for (let k = 1; k <= h; k++) P2(c, sx, 4 - k, 1, 1, OURO[k === h ? 4 : 3]);
      P2(c, 13, 3, 1, 1, OURO[3]); P2(c, 19, 3, 1, 1, OURO[2]);
      P2(c, 16, 5, 1, 1, '#ff4a5a'); P2(c, 13, 5, 1, 1, '#4ac0ff'); P2(c, 19, 5, 1, 1, '#4ac0ff');
    },
  };
  function ehAldric(v) { return v.hd === 'aldric' || (v.chapeu === 'coroa' && v.manto && v.acessorio === 'espada' && /^#e8eaf0$/i.test(v.corCabelo || '')); }

  // pernas e botas (fixas no chão); lift levanta um pé
  function pernas2(c, p, calca, bota, topo, larg, pau) {
    [12, 18].forEach((bx, i) => {
      const l = (p.lift || [0, 0])[i], ww = larg || 3;
      if (pau && i === 1) { P2(c, bx, topo, 3, 2, calca[0]); P2(c, bx + 1, topo + 2, 1, 7 - l, '#9a6a3a'); P2(c, bx + 1, topo + 2, 1, 1, '#c08a4a'); return; }
      P2(c, bx, topo, ww, 39 - topo - l, calca[0]); P2(c, bx, topo, 1, 39 - topo - l, calca[1]);
      P2(c, bx - 1, 39 - l, ww + 2, 3, bota[0]); P2(c, bx - 1, 39 - l, ww + 2, 1, bota[1]);
    });
  }

  // ---------------- morador genérico
  function corpoGenerico(v) {
    const child = v.tipo === 'crianca', dt = child ? 4 : 0;
    const R = rampa(v.roupa || '#6a6a6a'), PE = rampaPele(v.pele || '#e0b090'), HC = rampa(v.corCabelo || '#4a3020');
    const CA = rampa(v.calca || '#3a3048');
    const tx0 = child ? 12 : 10, tx1 = child ? 19 : 21, ty0 = 22 + dt;
    return {
      atras(c, p) {
        if (p.back) return;
        const est = v.cabelo || 'curto';
        if (est === 'longo') for (let y = 12 + dt; y <= 25 + dt; y++) { P2(c, 9, y, 2, 1, HC[y % 3 ? 2 : 1]); P2(c, 21, y, 2, 1, HC[y % 3 ? 1 : 0]); }
      },
      pernas(c, p) {
        if (v.manto) { [12, 18].forEach((bx, i) => { const l = (p.lift || [0, 0])[i]; if (p.andando) { P2(c, bx - 1, 39 - l, 5, 3, '#3a2618'); P2(c, bx - 1, 39 - l, 5, 1, '#5a3c26'); } }); return; }
        pernas2(c, p, [CA[1], CA[3]], ['#2e2018', '#4e3626'], 34, child ? 2 : 3, v.pernaDePau);
      },
      frente(c, p) {
        const aL = p.aL || 0, aR = p.aR || 0, back = p.back;
        // tronco / manto
        const fim = v.manto ? 40 : 33;
        for (let y = ty0; y <= fim; y++) {
          const ex = v.manto && y > 33 ? Math.round((y - 33) * 0.35) : 0;
          for (let x = tx0 - ex; x <= tx1 + ex; x++) {
            const f = (x - tx0 + ex) / (tx1 - tx0 + 2 * ex);
            let i = back ? (f < 0.3 ? 2 : f < 0.75 ? 1 : 0) : (f < 0.18 ? 4 : f < 0.5 ? 3 : f < 0.82 ? 2 : 1);
            if (y === fim) i = Math.max(0, i - 2);
            if (!back && y > ty0 + 3 && Math.abs(x - (tx0 + tx1) / 2 - (y - ty0) * 0.08) < 0.6 && (x + y) % 2) i = Math.max(0, i - 1);
            P2(c, x, y, 1, 1, R[i]);
          }
        }
        if (v.kilt) for (let y = 30 + dt; y <= 35; y++) for (let x = tx0; x <= tx1; x++) P2(c, x, y, 1, 1, (x === tx0 + 2 || x === tx1 - 2) ? '#b03030' : (x < 14 ? '#3e8a4a' : '#2e6b3a'));
        if (v.listras && !back) { const L = rampa(v.listras); for (let y = ty0 + 2; y < 33; y += 3) for (let x = tx0; x <= tx1; x++) P2(c, x, y, 1, 1, L[x < 13 ? 3 : x < 18 ? 2 : 1]); }
        if (v.avental && !back) { const A = rampa(v.avental); for (let y = ty0 + 2; y <= (v.manto ? 37 : 33); y++) for (let x = tx0 + 2; x <= tx1 - 2; x++) P2(c, x, y, 1, 1, A[x < tx0 + 4 ? 4 : x < tx1 - 3 ? 3 : 2]); }
        if (!v.manto && !back) { P2(c, tx0, 30 + (child ? 2 : 0), tx1 - tx0 + 1, 1, R[0]); }
        if (v.detalhe) { const D = rampa(v.detalhe); for (let y = ty0; y < ty0 + (child ? 2 : 4); y++) for (let x = tx0; x <= tx1; x++) P2(c, x, y, 1, 1, D[y === ty0 + (child ? 1 : 3) ? 1 : x < 13 ? 4 : x < 18 ? 3 : 2]); }
        // braços e mãos
        const ay0 = ty0 + 1, ay1 = child ? 30 : 30;
        for (let y = ay0; y <= ay1 + aL; y++) P2(c, tx0 - 3, y, 3, 1, R[y < ay0 + 4 ? 3 : 2]);
        for (let y = ay0; y <= ay1 + aR; y++) P2(c, tx1 + 1, y, 3, 1, R[y < ay0 + 4 ? 1 : 0]);
        P2(c, tx0 - 3, ay1 + 1 + aL, 3, 3, PE[2]); P2(c, tx0 - 3, ay1 + 1 + aL, 1, 3, PE[3]);
        P2(c, tx1 + 1, ay1 + 1 + aR, 3, 3, PE[1]);
        // cabeça
        const hy = 10 + dt, est = v.cabelo || 'curto';
        P2(c, 14, hy + 11, 4, 2, PE[1]); // pescoço
        if (back) {
          if (est === 'careca') mancha2(c, 16, hy + 5, 6, 6, PE, 0); else mancha2(c, 16, hy + 4, 6, 6, HC.slice(0, 4), 0.1);
          if (est === 'longo') for (let y = hy + 8; y <= hy + 14; y++) P2(c, 10, y, 12, 1, HC[y % 2 ? 1 : 2]);
          if (est === 'rabo') for (let y = hy + 8; y <= hy + 15; y++) P2(c, 15, y, 2, 1, HC[y % 2 ? 1 : 2]);
          if (est === 'coque') mancha2(c, 16, hy - 2, 3, 3, HC, 0);
          return;
        }
        // rosto liso (sem pontilhado na pele): luz à esquerda, sombra à direita e no queixo
        [4, 5, 6, 6, 6, 6, 6, 6, 6, 5, 4].forEach((w, j) => {
          for (let x = -w; x < w; x++) P2(c, 16 + x, hy + j, 1, 1, j === 10 ? PE[1] : x < -w + 2 ? PE[3] : x >= w - 2 ? PE[1] : PE[2]);
        });
        if (est !== 'careca') {
          for (let y = hy - 1; y <= hy + 2; y++) for (let x = 10; x <= 21; x++) { if (y === hy - 1 && (x === 10 || x === 21)) continue; P2(c, x, y, 1, 1, HC[y === hy - 1 ? (x < 15 ? 4 : 3) : x < 13 ? 3 : x < 18 ? 2 : 1]); }
          for (let x = 11; x <= 20; x += 3) P2(c, x, hy + 3, 2, 1, HC[1]); // franja
          P2(c, 10, hy + 3, 1, 3, HC[2]); P2(c, 21, hy + 3, 1, 3, HC[1]);
          if (est === 'longo') { for (let y = hy + 3; y <= hy + 13; y++) { P2(c, 9, y, 2, 1, HC[y % 3 ? 3 : 2]); P2(c, 21, y, 2, 1, HC[y % 3 ? 1 : 0]); } }
          if (est === 'rabo') { const s = p.side > 0 ? -1 : 1; for (let y = hy + 2; y <= hy + 10; y++) P2(c, s > 0 ? 22 : 8, y, 2, 1, HC[y % 2 ? 2 : 1]); }
          if (est === 'espetado') for (const sx of [11, 14, 17, 20]) { P2(c, sx, hy - 3, 1, 2, HC[3]); P2(c, sx - 1, hy - 2, 1, 1, HC[2]); }
          if (est === 'coque') mancha2(c, 16, hy - 3, 3, 3, HC, 0);
        } else { P2(c, 13, hy + 1, 3, 1, PE[3]); }
        olhos2(c, hy + 4, v.olhos || '#2a1830', 12, 18, p.dormindo);
        P2(c, 16, hy + 6, 1, 1, PE[1]);
        if (v.barba) {
          const B = rampa(v.barba);
          for (let y = hy + 7; y <= hy + 11; y++) { const w = Math.round(6 - (y - hy - 7) * 0.7); for (let x = -w; x < w; x++) P2(c, 16 + x, y, 1, 1, B[(x + y) % 3 === 0 ? 1 : x < -2 ? 3 : x < 2 ? 2 : 1]); }
          P2(c, 13, hy + 7, 6, 1, B[3]); P2(c, 15, hy + 8, 2, 1, '#5a2a2a');
        } else {
          P2(c, 15, hy + 8, 2, 1, PE[0]);
          P2(c, 11, hy + 7, 2, 1, mix(hex6(v.pele || '#e0b090'), '#ff6a6a', 0.35)); P2(c, 19, hy + 7, 2, 1, mix(hex6(v.pele || '#e0b090'), '#ff6a6a', 0.3));
        }
        if (v.manchas) { P2(c, 18, hy + 3, 1, 1, v.manchas); P2(c, 11, hy + 8, 1, 1, v.manchas); P2(c, 20, hy + 6, 1, 1, v.manchas); }
      },
    };
  }

  // chapéus e acessórios antigos: diferença entre o desenho com e sem o item, ampliada 2x e sombreada
  const OLD = mkc(40, 44), OLDC = OLD.getContext('2d', { willReadFrequently: true });
  function velho(v, o) { OLDC.clearRect(0, 0, 40, 44); drawPerson(OLDC, 20, 34, v, Object.assign({}, o, { walking: false, semSombra: true })); return OLDC.getImageData(0, 0, 40, 44).data; }
  function itemMask(v, o, campo) {
    if (!v[campo]) return null;
    const a = velho(v, o), sem = Object.assign({}, v); sem[campo] = null; const b = velho(sem, o);
    const m = []; let algum = false;
    for (let i = 0; i < 40 * 44; i++) { const k = i * 4; if (a[k] !== b[k] || a[k + 1] !== b[k + 1] || a[k + 2] !== b[k + 2] || a[k + 3] !== b[k + 3]) { if (a[k + 3]) { m[i] = [a[k], a[k + 1], a[k + 2], a[k + 3]]; algum = true; } } }
    return algum ? m : null;
  }
  function pintaItem(c, m, ancOld, ancNew, sombraY) {
    if (!m) return;
    const has = (x, y) => x >= 0 && y >= 0 && x < 40 && y < 44 && m[y * 40 + x];
    for (let y = 0; y < 44; y++) for (let x = 0; x < 40; x++) {
      const px = m[y * 40 + x]; if (!px) continue;
      const nx = 16 + (x - 20) * 2, ny = ancNew + (y - ancOld) * 2;
      for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) {
        let f = 0;
        if (b === 0 && !has(x, y - 1)) f = 0.22; else if (a === 0 && !has(x - 1, y)) f = 0.12;
        if (b === 1 && !has(x, y + 1)) f = -0.28; else if (a === 1 && !has(x + 1, y)) f = Math.min(f, -0.14);
        const [r, g, bl] = px.map((v, i) => i < 3 ? (f > 0 ? v + (255 - v) * f : v * (1 + f)) : v);
        c.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(bl)},${(px[3] / 255).toFixed(3)})`;
        c.fillRect(nx + a + NX, ny + b + NY + sombraY, 1, 1);
      }
    }
  }

  // ---------------- corpo chibi (estilo Flow): 32x48, cabeça grande, cada parte com contorno próprio
  const CHB_OY = 10; // pés do chibi (y=45) caem na mesma linha dos sprites antigos (55 no canvas)
  function contornoParte(cv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, d = g.getImageData(0, 0, W, H).data;
    const a = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
    const o = mkc(W, H), og = o.getContext('2d'); og.fillStyle = '#140e1a';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) og.fillRect(x, y, 1, 1);
    og.drawImage(cv, 0, 0); return o;
  }
  function rampaFlow(c) { c = hex6(c); return [mix(c, '#0c0820', 0.55), mix(c, '#1a1448', 0.32), c, mix(c, '#fff2dc', 0.2)]; }
  function chibiCorpo(dest, v, p) {
    const child = v.tipo === 'crianca', dt = child ? 4 : 0, back = p.back, side = p.side || 1;
    const lift = p.lift || [0, 0], aL = p.aL || 0, aR = p.aR || 0;
    const R = rampaFlow(v.roupa || '#6a6a6a'), PE = rampaFlow(v.pele || '#e0b090'), C = rampaFlow(v.calca || '#3a3048');
    const HC = rampaFlow(v.corCabelo || '#4a3020'), BOT = rampaFlow('#4a4650'), OURO = rampaFlow('#e0a836');
    const manto = !!v.manto, hy = 14 + dt, by = 27 + dt, est = v.cabelo || 'curto';
    const partes = [];
    const parte = (fn, semContorno) => { const k = mkc(NW, NH), g = k.getContext('2d'); const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x + NX, y + CHB_OY, w, h); }; fn(r, g); partes.push([k, semContorno]); };
    // sombreia a parte: coluna da esquerda clara, lado direito escuro
    const sombreia = (r, g, ramp, x0, y0, x1, y1, sombra = 0.6) => {
      const d = g.getImageData(0, 0, NW, NH), q = d.data;
      for (let y = y0; y <= y1; y++) { let a = -1, b = -1; for (let x = x0; x <= x1; x++) if (q[((y + CHB_OY) * NW + x + NX) * 4 + 3]) { if (a < 0) a = x; b = x; } if (a < 0) continue;
        for (let x = a; x <= b; x++) { if (!q[((y + CHB_OY) * NW + x + NX) * 4 + 3]) continue; // só pinta o que já existe (não preenche o vão entre mechas/pernas)
          const f = b === a ? 0 : (x - a) / (b - a); r(x, y, 1, 1, ramp[x === a && b - a > 2 ? 3 : f > 0.88 && b - a > 3 ? 0 : f > sombra ? 1 : 2]); } }
    };
    // pernas e botas
    const pes = [[11, lift[0]], [17, lift[1]]];
    parte((r, g) => { pes.forEach(([x, l], i) => { if (!manto) r(x, 37 + dt / 2, 4, 6 - l - dt / 2, C[2]); if (v.pernaDePau && i === 1) { r(x + 1, 40, 2, 5 - l, '#9a6a3a'); } }); sombreia(r, g, C, 9, 30, 23, 44, 0.5); });
    parte(r => pes.forEach(([x, l], i) => { if (!(v.pernaDePau && i === 1)) { r(x, 42 - l, 4, 3, BOT[2]); r(x, 42 - l, 4, 1, BOT[3]); } }));
    // tronco / manto
    parte((r, g) => {
      if (manto) for (let y = by; y <= 43; y++) { const w = Math.round(6 + (y - by) * 0.17); r(16 - w, y, w * 2, 1, R[2]); }
      else r(10, by, 12, 10 - dt / 2, R[2]);
      sombreia(r, g, R, 6, by, 26, 44);
      if (manto) for (let y = by + 4; y <= 42; y++) { r(13, y, 1, 1, R[1]); r(19, y, 1, 1, R[1]); }
    });
    // detalhes da roupa (sem contorno próprio: ficam "pintados" no tronco)
    parte(r => {
      const fimR = manto ? 42 : by + 9 - dt / 2;
      if (v.kilt) for (let y = by + 6; y <= by + 11; y++) for (let x = 10; x <= 21; x++) r(x, y, 1, 1, (x === 12 || x === 19) ? '#b03030' : x < 14 ? '#3e8a4a' : '#2e6b3a');
      if (v.listras && !back) { const L = rampaFlow(v.listras); for (let y = by + 2; y < fimR; y += 2) r(10, y, 12, 1, L[2]); }
      if (v.avental && !back) { const A = rampaFlow(v.avental); r(12, by + 3, 8, fimR - by - 3, A[2]); r(12, by + 3, 1, fimR - by - 3, A[3]); r(19, by + 3, 1, fimR - by - 3, A[1]); }
      if (v.detalhe) { const D = rampaFlow(v.detalhe); r(11, by, 10, 2, D[2]); r(11, by, 3, 1, D[3]); }
      else r(12, by, 8, 2, R[0]);
      if (!back && manto) { r(15, by + 3, 2, 1, OURO[2]); r(15, by + 7, 2, 1, OURO[2]); r(15, by + 11, 2, 1, OURO[2]); }
      if (!manto && !v.avental && !v.kilt) r(10, by + 8 - dt / 2, 12, 1, '#4a2e1e');
    }, true);
    // braços (o de trás e o da frente) e mãos
    parte((r, g) => { r(7, by + 1 + aL, 3, 8, R[2]); sombreia(r, g, R, 7, by, 9, by + 12, 0.7); });
    parte(r => { r(7, by + 9 + aL, 3, 2, PE[2]); r(7, by + 9 + aL, 1, 2, PE[3]); });
    parte((r, g) => { r(22, by + 1 + aR, 3, 8, R[2]); sombreia(r, g, R, 22, by, 24, by + 12, 0.4); });
    parte(r => { r(22, by + 9 + aR, 3, 2, PE[1]); });
    if (manto) parte(r => { r(7, by + 7 + aL, 3, 2, OURO[2]); r(22, by + 7 + aR, 3, 2, OURO[1]); }, true);
    // cabeça
    parte(r => {
      r(11, hy, 10, 1, PE[2]); r(10, hy + 1, 12, 1, PE[2]); r(9, hy + 2, 14, 9, PE[2]); r(10, hy + 11, 12, 1, PE[2]); r(11, hy + 12, 10, 1, PE[2]);
      r(21, hy + 2, 2, 9, PE[1]); r(11, hy + 12, 10, 1, PE[1]); r(9, hy + 2, 1, 7, PE[3]);
    });
    // cabelo
    parte((r, g) => {
      if (back) { if (est !== 'careca') { r(9, hy, 14, 12, HC[2]); if (est === 'longo') r(9, hy + 11, 14, 6, HC[2]); if (est === 'rabo') r(15, hy + 11, 3, 6, HC[2]); if (est === 'coque') r(14, hy - 3, 4, 3, HC[2]); } }
      else if (est !== 'careca') {
        r(11, hy - 1, 10, 1, HC[2]); r(10, hy, 12, 1, HC[2]); r(9, hy + 1, 14, 1, HC[2]); r(9, hy + 2, 3, 2, HC[2]); r(13, hy + 2, 7, 1, HC[2]); r(20, hy + 2, 3, 2, HC[2]);
        r(8, hy + 2, 2, est === 'longo' ? 14 : 5, HC[2]); r(22, hy + 2, 2, est === 'longo' ? 14 : 5, HC[2]);
        if (est === 'espetado') [[10, -3], [13, -4], [16, -4], [19, -3]].forEach(([x, d]) => r(x, hy + d, 2, 3, HC[2]));
        if (est === 'coque') r(14, hy - 4, 4, 3, HC[2]);
        if (est === 'rabo') r(side > 0 ? 23 : 7, hy + 4, 2, 8, HC[2]);
      }
      sombreia(r, g, HC, 6, hy - 5, 26, hy + 17, 0.55);
    });
    // rosto (sem contorno próprio)
    if (!back) parte(r => {
      const oc = v.olhos && v.olhos !== '#2a1e1e' ? v.olhos : '#1a1420';
      if (p.dormindo) { r(12, hy + 8, 2, 1, '#1a1420'); r(18, hy + 8, 2, 1, '#1a1420'); }
      else { r(12, hy + 6, 2, 3, oc); r(18, hy + 6, 2, 3, oc); r(12, hy + 6, 1, 1, '#1a1420'); r(18, hy + 6, 1, 1, '#1a1420'); }
      if (est === 'careca') r(12, hy, 4, 1, mix(hex6(v.pele || '#e0b090'), '#ffffff', 0.3));
      if (!v.barba) { r(11, hy + 10, 2, 1, mix(hex6(v.pele || '#e0b090'), '#ff6a6a', 0.3)); r(19, hy + 10, 2, 1, mix(hex6(v.pele || '#e0b090'), '#ff6a6a', 0.3)); }
      if (v.manchas) { r(18, hy + 4, 1, 1, v.manchas); r(11, hy + 9, 1, 1, v.manchas); r(20, hy + 8, 1, 1, v.manchas); }
    }, true);
    if (!back && v.barba) parte((r, g) => {
      const B = rampaFlow(v.barba);
      r(10, hy + 9, 12, 2, B[2]); r(11, hy + 11, 10, 1, B[2]); r(12, hy + 12, 8, 1, B[2]); r(13, hy + 13, 6, 1, B[2]);
      sombreia(r, g, B, 9, hy + 8, 22, hy + 14, 0.6); r(14, hy + 10, 4, 1, mix(hex6(v.pele || '#e0b090'), '#3a1a1a', 0.35));
    });
    // chapéus grandes desenhados no próprio estilo (os outros vêm do desenho antigo, por cima)
    const ch = v.chapeu, cc = hex6(v.corChapeu || mix(hex6(v.roupa || '#6a6a6a'), '#000000', 0.2)), CH = rampaFlow(cc);
    if (CHIBI_CHAPEU[ch]) parte((r, g) => {
      if (ch === 'mago') {
        for (let y = 2; y <= 12; y++) { const w = Math.round(2 + (y - 2) * 0.55), cx = Math.round(16 - (12 - y) * 0.45); r(cx - w, hy - 14 + y, w * 2, 1, CH[2]); }
        r(9, hy - 13, 3, 2, CH[2]); r(7, hy - 12, 3, 2, CH[2]); r(6, hy - 11, 2, 2, CH[2]);
        r(3, hy - 1, 26, 3, CH[2]); sombreia(r, g, CH, 2, hy - 15, 29, hy + 2, 0.62);
        r(10, hy - 4, 13, 2, OURO[1]); r(15, hy - 4, 3, 2, OURO[3]); r(3, hy + 1, 26, 1, CH[0]);
      }
      if (ch === 'palha') { const PA = rampaFlow('#d8b060'); r(4, hy - 1, 24, 3, PA[2]); r(11, hy - 5, 10, 1, PA[2]); r(10, hy - 4, 12, 3, PA[2]); sombreia(r, g, PA, 3, hy - 6, 28, hy + 2, 0.65); r(10, hy - 2, 12, 1, '#a8402a'); }
      if (ch === 'capuz') { if (back) r(8, hy - 1, 16, 15, CH[2]); else { r(11, hy - 2, 10, 1, CH[2]); r(9, hy - 1, 14, 1, CH[2]); r(7, hy, 18, 3, CH[2]); r(7, hy + 3, 3, 11, CH[2]); r(22, hy + 3, 3, 11, CH[2]); } sombreia(r, g, CH, 6, hy - 3, 26, hy + 15, 0.6); }
    });
    partes.forEach(([k, sem]) => dest.drawImage(sem ? k : contornoParte(k), 0, 0));
  }
  const CHIBI_CHAPEU = { mago: 1, palha: 1, capuz: 1 };

  const ANIM_ITEM =/flauta|cranio|guitarra|runic|orbe|cajado_folhas|cachecol_bracos|moeda|astrolabio|chicote|corneta|chave_vapor|bolsa_moedas|cata_vento|escudo_energia|espirito|visor_tech/;
  const CACHE = new Map();
  function spriteNovo(v, o) {
    const back = o.dir === 'up', side = o.side || 1, t = o.t || 0;
    const fr = o.walking ? Math.floor(t * 7) % 4 : (Math.floor(t * 1.1) % 4 < 2 ? 4 : 5);
    const anim = ANIM_ITEM.test((v.acessorio || '') + (v.chapeu || '')) ? Math.floor(t * 4) % 12 : 0;
    const key = JSON.stringify(v) + side + back + (o.dormindo ? 1 : 0) + fr + ':' + anim;
    let cv = CACHE.get(key); if (cv) return cv;
    if (CACHE.size > 2500) CACHE.clear();
    const st = [
      { lift: [0, 2], aL: 1, aR: -1, capa: -1 }, { by: -1 }, { lift: [2, 0], aL: -1, aR: 1, capa: 1 }, { by: -1 },
      {}, { by: o.dormindo ? 0 : 1 },
    ][fr];
    const p = Object.assign({ back, side, dormindo: o.dormindo, andando: !!o.walking }, st);
    cv = mkc(NW, NH); const c = cv.getContext('2d');
    const by = p.by || 0;
    const camada = fn => { const k = mkc(NW, NH); fn(k.getContext('2d'), p); c.drawImage(k, 0, by); };
    if (false && ehAldric(v) && !back) { // estilo Flow: o Aldric também vira chibi (coroa, manto e espada vêm do visual)
      camada(ALD.atras); ALD.pernas(c, p); camada(ALD.frente);
    } else {
      const ch = corpoGenerico(v), child = v.tipo === 'crianca', dt = child ? 4 : 0;
      void ch; camada((k, pp) => chibiCorpo(k, v, pp));
      // itens antigos ampliados: chapéu preso na cabeça, acessório preso no tronco
      const ov = { t: anim / 4, side, dir: o.dir, dormindo: o.dormindo };
      const lh = child ? 2 : 3, bh = child ? 4 : 5, Yold = 34 - lh - bh, HYold = Yold - 5;
      if (!CHIBI_CHAPEU[v.chapeu]) pintaItem(c, itemMask(v, ov, 'chapeu'), HYold, 10 + dt, by);
      pintaItem(c, itemMask(v, ov, 'acessorio'), Yold, 22 + dt, by);
    }
    vivo(cv);
    contorno2(cv, '#0a0608');
    CACHE.set(key, cv);
    return cv;
  }
  function escalaDe(c) { try { const m = c.getTransform(); return Math.hypot(m.a, m.b); } catch (e) { return 1; } }
  function drawPersonNovo(c, x, y, v, o) {
    x = Math.round(x); y = Math.round(y);
    c.fillStyle = 'rgba(0,0,0,0.32)';
    c.fillRect(x - 5, y - 0.5, 10, 1.5); c.fillRect(x - 4, y + 1, 8, 0.5);
    const cv = spriteNovo(v, o), sm = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(cv, x - (NX + 16) / 2, y - (NY + 42) / 2, NW / 2, NH / 2);
    c.imageSmoothingEnabled = sm;
  }

  // ---------------- gatos e cães no estilo estudo 6 (canvas 2x, sombra chapada, contorno escuro)
  function bichoNovo(v, o) {
    const gato = v.tipo === 'gato', t = o.t || 0, dorm = !!o.dormindo;
    const fr = dorm ? 9 : o.walking ? Math.floor(t * 9) % 2 : 2, wag = Math.round(Math.sin(t * (gato ? 4 : 10)));
    const key = 'b' + JSON.stringify(v) + fr + ':' + wag;
    let cv = CACHE.get(key); if (cv) return cv;
    const W = gato ? 30 : 34, H = 24; cv = mkc(W, H); const c = cv.getContext('2d');
    const R = rampa(v.roupa || '#a07040'), Bx = rampa(v.detalhe || '#f2efe6');
    const px = (x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
    const elipse = (cx, cy, rx, ry, ramp) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d > 1) continue; const vv = 0.62 - 0.32 * (x / rx) - 0.42 * (y / ry) - d * 0.3; px(cx + x, cy + y, ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(vv * ramp.length)))]); } };
    if (dorm) {
      elipse(13, 17, 9, 4, R); elipse(gato ? 21 : 23, 15, 4, 3, R);
      px(gato ? 21 : 23, 15, '#2a1830'); px(gato ? 22 : 24, 15, '#2a1830');
      if (gato) { px(19, 11, R[2]); px(19, 12, R[2]); px(23, 11, R[1]); px(23, 12, R[1]); } else { for (let y = 13; y < 17; y++) px(25, y, R[0]); }
    } else if (gato) {
      for (let i = 0; i < 9; i++) { const x = 5 - Math.round(Math.sin(i / 8 * 1.6) * 2) + (i > 5 ? wag : 0), y = 14 - i; px(x, y, R[2]); px(x + 1, y, R[1]); }
      const lf = [fr === 0 ? 1 : 0, fr === 1 ? 1 : 0];
      [[8, lf[0]], [11, lf[1]], [16, lf[1]], [19, lf[0]]].forEach(([lx, l]) => { for (let y = 17; y < 21 - l; y++) { px(lx, y, R[1]); px(lx + 1, y, R[0]); } });
      elipse(13, 14, 8, 4, R);
      elipse(22, 9, 5, 4, R);
      [[18, 4], [18, 5], [19, 5], [24, 4], [24, 5], [23, 5]].forEach(([x, y]) => px(x, y, R[3]));
      px(20, 9, '#ffe14d'); px(20, 10, '#2a1830'); px(24, 9, '#ffe14d'); px(24, 10, '#2a1830'); px(26, 10, '#ff8aa0');
    } else {
      for (let i = 0; i < 6; i++) { const x = 5 - Math.floor(i / 2) + wag * (i > 2 ? 1 : 0), y = 12 - i; px(x, y, R[2]); px(x + 1, y, R[1]); }
      const lf = [fr === 0 ? 1 : 0, fr === 1 ? 1 : 0];
      [[7, lf[0]], [11, lf[1]], [18, lf[1]], [22, lf[0]]].forEach(([lx, l]) => { for (let y = 17; y < 21 - l; y++) { px(lx, y, R[2]); px(lx + 1, y, R[1]); } });
      elipse(15, 13, 10, 5, R); elipse(15, 15, 5, 2, Bx);
      elipse(25, 8, 5, 5, R); elipse(29, 10, 3, 2, Bx);
      px(32, 9, '#1a1018'); px(32, 10, '#1a1018');
      for (let y = 4; y < 11; y++) { px(22, y, R[0]); px(23, y, R[1]); }
      px(26, 7, '#ffffff'); px(26, 8, '#2a1830'); px(27, 8, '#2a1830');
    }
    vivo(cv); contorno2(cv, '#0a0608');
    if (CACHE.size > 2500) CACHE.clear(); CACHE.set(key, cv);
    return cv;
  }
  function drawBichoNovo(c, x, y, v, o) {
    x = Math.round(x); y = Math.round(y);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x - 6, y - 0.5, 12, 1.5);
    const cv = bichoNovo(v, o), s = o.side || 1, sm = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false; c.save(); c.translate(x, 0); c.scale(s, 1);
    c.drawImage(cv, -cv.width / 4 - 1, y - 10.5, cv.width / 2, cv.height / 2);
    c.restore(); c.imageSmoothingEnabled = sm;
  }

  // ---------------- sprites vindos do Google Flow (convertidos): flow/<id>.png com 4 quadros
  // [frente parado, passo A, passo B, costas]. Quem não tem imagem continua no desenho em código.
  const FLOW_IMG = {}, ID_DE = new WeakMap();
  function idDe(v) {
    if (!ID_DE.has(v)) (window.MORADORES || []).forEach(m => ID_DE.set(m.visual, m.id));
    return ID_DE.get(v);
  }
  function flowSprite(v) {
    const lista = window.FLOW_SPRITES || {}, id = idDe(v), info = id && lista[id];
    if (!info) return null;
    let e = FLOW_IMG[id];
    if (!e) { e = FLOW_IMG[id] = { img: new Image(), ok: false, info }; e.img.onload = () => { e.ok = true; }; e.img.src = 'flow/' + id + '.png?v=' + (info.v || 1); }
    return e.ok ? e : null;
  }
  function drawFlow(c, x, y, e, o) {
    // k = pixels do sprite por unidade do mundo (2 = ~48 px, 4 = ~96 px); window.ESCALA_PERS < 1 encolhe o morador no mundo
    // (o mapa usa 0.5: casas, árvores e ruas ficam do tamanho certo perto dos moradores)
    const es = o.escala || window.ESCALA_PERS || 1;
    const { w, h } = e.info, t = o.t || 0, k = (e.info.k || 2) / es;
    const q = o.dir === 'up' ? 3 : o.walking ? [1, 0, 2, 0][Math.floor(t * 7) % 4] : 0;
    x = Math.round(x * 4) / 4; y = Math.round(y * 4) / 4;
    c.fillStyle = 'rgba(0,0,0,0.32)'; c.fillRect(x - 5 * es, y - 0.5 * es, 10 * es, 1.5 * es); c.fillRect(x - 4 * es, y + es, 8 * es, 0.5 * es);
    const sm = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false; c.save(); c.translate(x, 0);
    if ((o.side || 1) < 0 && o.dir !== 'up') c.scale(-1, 1);
    c.drawImage(e.img, q * w, 0, w, h, -w / (2 * k), y - h / k + 1, w / k, h / k);
    c.restore(); c.imageSmoothingEnabled = sm;
  }
  function drawCharacter(c, x, y, v, o) {
    const fe = flowSprite(v);
    if (fe) return drawFlow(c, x, y, fe, o);
    if ((v.tipo === 'gato' || v.tipo === 'cao') && escalaDe(c) >= 1.9) return drawBichoNovo(c, x, y, v, o);
    if (v.tipo === 'gato') return drawCat(c, x, y, v, o);
    if (v.tipo === 'cao') return drawDog(c, x, y, v, o);
    if (escalaDe(c) >= 1.9) return drawPersonNovo(c, x, y, v, o);
    return drawPerson(c, x, y, v, o);
  }

  function hitBox(v) {
    const fe = flowSprite(v), es = window.ESCALA_PERS || 1;
    if (fe) { const k = (fe.info.k || 2) / es; return { l: -fe.info.w / (2.6 * k), r: fe.info.w / (2.6 * k), t: -fe.info.h / k, b: 1 }; }
    if (v.tipo === 'gato') return { l: -6, r: 6, t: -10, b: 2 };
    if (v.tipo === 'cao') return { l: -7, r: 7, t: -10, b: 2 };
    if (v.tipo === 'crianca') return { l: -5, r: 5, t: -15, b: 2 };
    return { l: -5, r: 5, t: -17, b: 2 };
  }

  function icon(v, scale) {
    scale = scale || 3;
    const w = 16, h = 20, K = scale >= 2 ? 2 : 1; // ícone no estilo 32x44 quando cabe
    const s = document.createElement('canvas');
    s.width = w * K; s.height = h * K;
    const c = s.getContext('2d');
    c.setTransform(K, 0, 0, K, 0, 0);
    drawCharacter(c, 8, h - 3, v, { t: 0, dir: 'down', side: 1, escala: 1 });
    const out = document.createElement('canvas');
    out.width = w * scale; out.height = h * scale;
    const oc = out.getContext('2d');
    oc.imageSmoothingEnabled = false;
    oc.drawImage(s, 0, 0, w * scale, h * scale);
    return out;
  }

  window.IlhaSprites = { estiloFlow, chibiCorpo, vivo,drawCharacter, drawPerson, drawPersonNovo, spriteNovo, drawCat, drawDog, hitBox, icon, shade, rampa };
})();
