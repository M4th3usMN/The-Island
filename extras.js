/* A Grande Ilha — comunidade.
   Apoio por PIX (QR + copia e cola), selo digital com mascote, mascotes dos apoiadores
   vivendo na ilha, mural, festa de "novo apoiador", Diário do Escriba, metas da ilha,
   boas-vindas e aviso do criador. Os dados vêm de comunidade.js.
   Tudo segue o relógio real, como o resto da ilha: todo visitante vê o mesmo mascote
   no mesmo lugar, e a festa de um apoiador novo aparece para todos ao mesmo tempo. */
(function () {
  'use strict';
  const G = window.GrandeIlha;
  if (!G) return;
  const C = window.COMUNIDADE || {};
  const $ = id => document.getElementById(id);
  const IG = String(C.instagram || 'the_island.lab').replace(/^@/, '');
  const AP = Object.assign({ chavePix: '', recebedor: '', cidade: '', valores: [5, 10, 20] }, C.apoio || {});
  const TZ = -3 * 3600e3;
  const MARCOS = [10, 20, 30, 50, 75, 100, 150, 200, 300, 500, 1000];

  // ---------------------------------------------------------------- utilidades
  const store = {
    get(k, d) { try { const v = localStorage.getItem('grande-ilha-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('grande-ilha-' + k, JSON.stringify(v)); } catch (e) { } }
  };
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const limpaArroba = s => String(s || '').trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);
  const br = t => new Date(t + TZ);
  const dd = n => String(n).padStart(2, '0');
  const hora = t => { const d = br(t); return dd(d.getUTCHours()) + ':' + dd(d.getUTCMinutes()); };
  const data = t => { const d = br(t); return dd(d.getUTCDate()) + '/' + dd(d.getUTCMonth() + 1); };
  const dataLonga = t => data(t) + '/' + br(t).getUTCFullYear();
  function quando(t, agora) {
    const a = br(agora), b = br(t);
    const mesmo = a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
    return (mesmo ? 'hoje' : 'em ' + data(t)) + ' às ' + hora(t);
  }
  async function copiar(txt, btn) {
    let ok = false;
    try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) {
      try { const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch (e2) { }
    }
    if (btn) { const o = btn.dataset.rotulo || btn.textContent; btn.dataset.rotulo = o; btn.textContent = ok ? 'COPIADO!' : 'NÃO DEU, COPIE À MÃO'; setTimeout(() => { btn.textContent = o; }, 1800); }
    return ok;
  }

  // ---------------------------------------------------------------- cores (variações para mascotes repetidos)
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => dd(Math.round(v).toString(16))).join(''); }
  function giraCor(hex, graus) {
    let [r, g, b] = hexRgb(hex).map(v => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) {
      const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6;
    }
    h = ((h + graus / 360) % 1 + 1) % 1;
    const f = (p, q, x) => { x = (x % 1 + 1) % 1; return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p; };
    if (!s) return rgbHex(l * 255, l * 255, l * 255);
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return rgbHex(f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255);
  }
  function escurece(hex, k) { const [r, g, b] = hexRgb(hex); return rgbHex(r * k, g * k, b * k); }

  // ---------------------------------------------------------------- mascotes (pixel art, mesmo traço da ilha)
  const px = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const OLHO = '#140c08';
  const MASCOTES = {
    caranguejo: {
      nome: 'Caranguejo', art: 'um', desc: 'Anda de lado e cuida da praia.', cor: '#e0553a', extra: '#f2e6c8',
      draw(c, x, y, f, s, k) {
        px(c, x - 4, y, 9, 1, 'rgba(0,0,0,.22)');
        px(c, x - 4, y - 1, 1, 1, k.sombra); px(c, x + 4, y - 1, 1, 1, k.sombra);
        px(c, x - 2 + f, y - 1, 1, 1, k.sombra); px(c, x + 2 - f, y - 1, 1, 1, k.sombra);
        px(c, x - 3, y - 4, 7, 3, k.cor); px(c, x - 2, y - 5, 5, 1, k.cor); px(c, x - 3, y - 2, 7, 1, k.sombra);
        px(c, x - 1, y - 4, 1, 1, k.extra);
        px(c, x - 2, y - 6, 1, 1, k.sombra); px(c, x + 2, y - 6, 1, 1, k.sombra);
        px(c, x - 2, y - 7, 1, 1, OLHO); px(c, x + 2, y - 7, 1, 1, OLHO);
        const cy = f ? y - 7 : y - 6;
        px(c, x - 6, cy, 2, 2, k.cor); px(c, x + 5, cy, 2, 2, k.cor);
        px(c, x - 5, cy + 2, 1, 2 - f, k.sombra); px(c, x + 5, cy + 2, 1, 2 - f, k.sombra);
        return 8;
      }
    },
    tartaruga: {
      nome: 'Tartaruga', art: 'uma', desc: 'Sem pressa nenhuma, sempre perto do fogo.', cor: '#5f9a4a', extra: '#b2cf7a',
      draw(c, x, y, f, s, k) {
        px(c, x - 5, y, 10, 1, 'rgba(0,0,0,.22)');
        px(c, x - 3, y - 1, 2, 1, k.extra); px(c, x + 2, y - 1, 2, 1, k.extra);
        if (f) { px(c, x - 4, y - 1, 1, 1, k.extra); } else { px(c, x + 4, y - 1, 1, 1, k.extra); }
        px(c, x - 4, y - 4, 8, 2, k.cor); px(c, x - 3, y - 5, 6, 1, k.cor); px(c, x - 2, y - 6, 4, 1, k.sombra);
        px(c, x - 2, y - 4, 1, 1, k.sombra); px(c, x + 1, y - 5, 1, 1, k.sombra); px(c, x + 2, y - 3, 1, 1, k.sombra);
        px(c, x - 4, y - 2, 8, 1, '#d8c07a');
        const hx = s > 0 ? x + 4 : x - 6;
        px(c, hx, y - 4, 2, 2, k.extra); px(c, s > 0 ? hx + 1 : hx, y - 4, 1, 1, OLHO);
        return 7;
      }
    },
    papagaio: {
      nome: 'Papagaio', art: 'um', desc: 'Voa por cima da vila repetindo tudo.', cor: '#e2443a', extra: '#3a6ad0', voa: true,
      draw(c, x, y, f, s, k, t) {
        const oy = y - 9 - Math.round(Math.sin(t * 3) * 1.5);
        px(c, x - 2, y, 5, 1, 'rgba(0,0,0,.18)');
        px(c, x - s * 2, oy - 1, 1, 3, k.extra);
        px(c, x - 1, oy - 5, 3, 4, k.cor); px(c, x - 1, oy - 7, 3, 2, k.cor);
        px(c, s > 0 ? x + 2 : x - 2, oy - 6, 1, 1, '#f0c040');
        px(c, s > 0 ? x + 1 : x - 1, oy - 7, 1, 1, OLHO);
        px(c, x, oy - 3, 1, 1, '#f0c040');
        if (f) px(c, x - s * 2 - (s > 0 ? 1 : 0), oy - 6, 2, 2, k.extra); else px(c, x - s * 2 - (s > 0 ? 1 : 0), oy - 3, 2, 2, k.extra);
        return 17;
      }
    },
    sapinho: {
      nome: 'Sapinho', art: 'um', desc: 'Pula pelas poças depois da chuva.', cor: '#6fbf4a', extra: '#d9f0a6',
      draw(c, x, y, f, s, k) {
        const oy = y - (f ? 2 : 0);
        px(c, x - 3, y, 7, 1, 'rgba(0,0,0,.22)');
        px(c, x - 4, oy - 1, 2, 1, k.sombra); px(c, x + 3, oy - 1, 2, 1, k.sombra);
        px(c, x - 3, oy - 4, 7, 3, k.cor); px(c, x - 2, oy - 2, 5, 1, k.extra);
        px(c, x - 3, oy - 6, 2, 2, k.cor); px(c, x + 2, oy - 6, 2, 2, k.cor);
        px(c, x - 2, oy - 6, 1, 1, OLHO); px(c, x + 2, oy - 6, 1, 1, OLHO);
        px(c, x - 1, oy - 3, 3, 1, k.sombra);
        return 8;
      }
    },
    ourico: {
      nome: 'Ouriço', art: 'um', desc: 'Pequeno, espinhudo e muito curioso.', cor: '#8a6040', extra: '#e0b890',
      draw(c, x, y, f, s, k) {
        px(c, x - 4, y, 9, 1, 'rgba(0,0,0,.22)');
        px(c, x - 2 + f, y - 1, 1, 1, k.sombra); px(c, x + 2 - f, y - 1, 1, 1, k.sombra);
        px(c, x - 3, y - 5, 6, 4, k.cor); px(c, x - 4, y - 4, 1, 3, k.cor);
        px(c, x - 3, y - 6, 1, 1, k.sombra); px(c, x - 1, y - 7, 1, 1, k.sombra); px(c, x + 1, y - 6, 1, 1, k.sombra);
        px(c, x - 5, y - 5, 1, 1, k.sombra); px(c, x - 2, y - 4, 1, 1, k.sombra); px(c, x, y - 3, 1, 1, k.sombra);
        const fx = s > 0 ? x + 3 : x - 5;
        px(c, fx, y - 4, 2, 3, k.extra); px(c, s > 0 ? fx + 2 : fx - 1, y - 2, 1, 1, OLHO); px(c, s > 0 ? fx : fx + 1, y - 4, 1, 1, OLHO);
        return 8;
      }
    }
  };
  const TIPOS = Object.keys(MASCOTES);

  // ---------------------------------------------------------------- apoiadores
  const APO = (C.apoiadores || []).map(a => {
    const arroba = limpaArroba(a.arroba), tipo = MASCOTES[a.mascote] ? a.mascote : 'caranguejo';
    return { arroba, tipo, _t: Date.parse(a.desde) || 0, corManual: a.cor };
  }).filter(a => a.arroba).sort((a, b) => a._t - b._t);
  const contaTipo = {};
  APO.forEach((a, i) => {
    const M = MASCOTES[a.tipo], n = contaTipo[a.tipo] = (contaTipo[a.tipo] || 0) + 1;
    a.n = i + 1;
    const cor = a.corManual || (n === 1 ? M.cor : giraCor(M.cor, (n - 1) * 47));
    a.pal = { cor, sombra: escurece(cor, 0.62), extra: n === 1 || a.tipo === 'tartaruga' || a.tipo === 'ourico' || a.tipo === 'sapinho' ? M.extra : giraCor(M.extra, (n - 1) * 47) };
    const ang = G.rnd(a.arroba, 'ang') * Math.PI * 2, r = 20 + G.rnd(a.arroba, 'r') * 12;
    a.casa = { x: G.FIRE.x + Math.cos(ang) * r, y: G.FIRE.y + 6 + Math.sin(ang) * r * 0.7 };
  });
  const porArroba = a => APO.find(x => x.arroba === limpaArroba(a));
  const ativos = t => APO.filter(a => t >= a._t);

  const ARR = 90e3, JANELA = 8;
  function posMascote(a, t) {
    if (t < a._t) return null;
    const cais = { x: G.LUG.cais.sx, y: G.LUG.cais.sy - 6 };
    if (t - a._t < ARR) {
      const k = (t - a._t) / ARR;
      return { x: cais.x + (a.casa.x - cais.x) * k, y: cais.y + (a.casa.y - cais.y) * k, anda: true, s: a.casa.x >= cais.x ? 1 : -1, chegando: true };
    }
    const fase = G.rnd(a.arroba, 'fase'), sec = t / 1000 / JANELA + fase, W = Math.floor(sec);
    const alvo = w => ({ x: a.casa.x + (G.rnd(a.arroba, w) - 0.5) * 22, y: a.casa.y + (G.rnd(a.arroba, 'y', w) - 0.5) * 10 });
    const A = alvo(W - 1), B = alvo(W), k = Math.min(1, (sec - W) / 0.4);
    return { x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k, anda: k < 1, s: B.x >= A.x ? 1 : -1 };
  }

  let quadro = [], seguirMasc = null, ultimoT = 0;
  // apoiador jogando no modo viajante: o mascote vai atrás do personagem dele
  const atras = {};
  function donoJogando(arroba) {
    const J = window.IlhaJogo; if (!J || !J.on) return null;
    const S = J.S; if (S.eu && S.eu.arroba === arroba) return S.eu;
    for (const o of S.outros.values()) if (o.arroba === arroba) return o;
    return null;
  }
  function desenha(c, a, x, y, t, anda, s) {
    const M = MASCOTES[a.tipo || a];
    const f = anda || M.voa ? Math.floor(t * (M.voa ? 8 : 6)) % 2 : 0;
    return M.draw(c, Math.round(x), Math.round(y), f, s, a.pal || { cor: M.cor, sombra: escurece(M.cor, 0.62), extra: M.extra }, t);
  }
  G.hooks.push((objs, c, info) => {
    quadro = [];
    const dt = Math.min(0.6, Math.max(0, (info.t - ultimoT) / 1000)); ultimoT = info.t;
    ativos(info.t).forEach(a => {
      let p = posMascote(a, info.t);
      if (!p) return;
      const dono = donoJogando(a.arroba);
      if (dono) {
        const s = dono.s || 1, alvo = { x: dono.x - s * 9, y: dono.y + 2 }, f = atras[a.arroba] || (atras[a.arroba] = { x: p.x, y: p.y });
        const d = Math.hypot(alvo.x - f.x, alvo.y - f.y);
        if (d > 120) { f.x = alvo.x; f.y = alvo.y; } else { const k = 1 - Math.pow(0.02, dt); f.x += (alvo.x - f.x) * k; f.y += (alvo.y - f.y) * k; }
        p = { x: f.x, y: f.y, anda: d > 1.5, s: alvo.x >= f.x ? 1 : -1 };
      } else delete atras[a.arroba];
      quadro.push({ a, p });
      objs.push({
        y: p.y, f: () => {
          const alt = desenha(c, a, p.x, p.y, info.sec + a.n, p.anda, p.s);
          if (Math.sin(info.sec * 2 + a.n) > -0.6) { const sx = Math.round(p.x), sy = Math.round(p.y) - alt - 4; px(c, sx, sy - 1, 1, 3, '#ffd046'); px(c, sx - 1, sy, 3, 1, '#ffd046'); }
          if (p.chegando) for (let i = 0; i < 5; i++) { const g = info.sec * 3 + i * 1.25; px(c, p.x + Math.cos(g) * 6, p.y - 4 + Math.sin(g) * 4, 1, 1, i % 2 ? '#ffe27a' : '#fffbe0'); }
        }
      });
    });
    if (seguirMasc && !G.cam.follow) {
      const q = quadro.find(z => z.a === seguirMasc);
      if (q) { G.cam.x += (q.p.x - G.cam.x) * 0.18; G.cam.y += (q.p.y - 8 - G.cam.y) * 0.18; }
    }
  });
  function verNaIlha(a) {
    fechar();
    G.pararSeguir();
    seguirMasc = a;
    if (G.cam.s < 4) G.cam.s = 4;
    const p = posMascote(a, Date.now()); if (p) { G.cam.x = p.x; G.cam.y = p.y - 8; }
  }

  function iconeMascote(a, escala) {
    const cv = document.createElement('canvas'); cv.width = 22; cv.height = 20;
    const c = cv.getContext('2d');
    const M = MASCOTES[a.tipo || a];
    desenha(c, a, 11, M.voa ? 19 : 15, 0.3, false, 1);
    cv.className = 'masc-ic'; cv.style.width = 22 * escala + 'px'; cv.style.height = 20 * escala + 'px';
    return cv;
  }

  // tooltip e clique nos mascotes (sem atrapalhar o arrasto da ilha)
  const stage = $('ilha'), tip = document.createElement('div');
  tip.className = 'masc-tip px'; tip.hidden = true; document.body.appendChild(tip);
  function mascoteEm(cx, cy) {
    const w = G.toWorld(cx, cy); let best = null;
    quadro.forEach(q => {
      const voa = MASCOTES[q.a.tipo].voa, top = voa ? 18 : 9;
      if (w.x >= q.p.x - 6 && w.x <= q.p.x + 6 && w.y >= q.p.y - top && w.y <= q.p.y + 2) best = q;
    });
    return best;
  }
  let toque = null;
  stage.addEventListener('pointerdown', e => { toque = { x: e.clientX, y: e.clientY }; });
  stage.addEventListener('pointermove', e => {
    if (toque && Math.abs(e.clientX - toque.x) + Math.abs(e.clientY - toque.y) > 5) seguirMasc = null;
    if (e.pointerType !== 'mouse') return;
    const q = mascoteEm(e.clientX, e.clientY);
    if (q && $('card').hidden) {
      tip.textContent = '★ @' + q.a.arroba + ' · ' + MASCOTES[q.a.tipo].nome;
      tip.hidden = false; tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 14 + 'px'; stage.style.cursor = 'pointer';
    } else tip.hidden = true;
  });
  stage.addEventListener('pointerleave', () => { tip.hidden = true; });
  stage.addEventListener('pointerup', e => {
    const moveu = toque && Math.abs(e.clientX - toque.x) + Math.abs(e.clientY - toque.y) > 5; toque = null;
    if (moveu || (window.IlhaJogo && window.IlhaJogo.on)) return; // jogando: tocar no chão é andar
    const q = mascoteEm(e.clientX, e.clientY);
    if (q && $('card').hidden) abrirSelo(q.a);
  });

  // ---------------------------------------------------------------- PIX (BR Code estático, padrão do Banco Central)
  const tlv = (id, v) => id + dd(v.length) + v;
  function crc16(s) {
    let c = 0xFFFF;
    for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; }
    return c.toString(16).toUpperCase().padStart(4, '0');
  }
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  function normChave(k) {
    k = String(k || '').trim();
    if (k.includes('@')) return k.toLowerCase();
    if (/^\+/.test(k)) return '+' + k.replace(/\D/g, '');
    if (/^[\d.\-/ ]+$/.test(k)) return k.replace(/\D/g, '');
    return k;
  }
  function brcode(valor) {
    let p = tlv('00', '01') + tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', normChave(AP.chavePix)));
    p += tlv('52', '0000') + tlv('53', '986');
    if (valor > 0) p += tlv('54', valor.toFixed(2));
    p += tlv('58', 'BR') + tlv('59', (semAcento(AP.recebedor) || 'A GRANDE ILHA').toUpperCase().slice(0, 25)) + tlv('60', (semAcento(AP.cidade) || 'MANAUS').toUpperCase().slice(0, 15));
    p += tlv('62', tlv('05', '***')) + '6304';
    return p + crc16(p);
  }
  function desenhaQR(cv, txt) {
    if (typeof window.qrcode !== 'function') { cv.hidden = true; return; }
    const q = window.qrcode(0, 'M'); q.addData(txt); q.make();
    const n = q.getModuleCount(), m = 2, k = 6;
    cv.width = (n + m * 2) * k; cv.height = cv.width;
    const c = cv.getContext('2d');
    c.fillStyle = '#f1ead8'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#111a22';
    for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (q.isDark(r, col)) c.fillRect((col + m) * k, (r + m) * k, k, k);
  }

  // ---------------------------------------------------------------- selo digital
  async function selo(a) {
    const W = 720, H = 960, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    try { await Promise.all([document.fonts.load('700 40px Silkscreen'), document.fonts.load('600 30px "Pixelify Sans"')]); } catch (e) { }
    c.fillStyle = '#2a1808'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#8a5a22'; c.fillRect(8, 8, W - 16, H - 16);
    c.fillStyle = '#d3a55a'; c.fillRect(24, 24, W - 48, H - 48);
    c.strokeStyle = 'rgba(90,54,18,.5)'; c.lineWidth = 3; c.setLineDash([12, 8]); c.strokeRect(44, 44, W - 88, H - 88); c.setLineDash([]);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = '#3a2410'; c.font = '700 46px Silkscreen, monospace'; c.fillText('SELO DE APOIADOR', W / 2, 128);
    c.fillStyle = '#6a2e10'; c.font = '400 26px Silkscreen, monospace'; c.fillText('A GRANDE ILHA', W / 2, 172);
    // medalha
    const cx = W / 2, cy = 430, R = 196;
    c.fillStyle = '#2a1808'; c.beginPath(); c.arc(cx, cy + 8, R + 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd046'; c.beginPath(); c.arc(cx, cy, R + 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#0b1626'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    const g = c.createRadialGradient(cx, cy + 60, 10, cx, cy + 60, R); g.addColorStop(0, 'rgba(255,208,70,.35)'); g.addColorStop(1, 'rgba(255,208,70,0)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f1ead8';
    [[-120, -110], [110, -130], [-150, 10], [140, 40], [-60, -160], [60, 150]].forEach(([dx, dy], i) => { const s = i % 2 ? 6 : 9; c.fillRect(cx + dx, cy + dy - s, s / 3, s * 2); c.fillRect(cx + dx - s + s / 6, cy + dy - s / 6, s * 2, s / 3); });
    c.fillStyle = '#3a6a3a'; c.fillRect(cx - 120, cy + 96, 240, 18); c.fillStyle = '#2a4e2c'; c.fillRect(cx - 120, cy + 114, 240, 8);
    const ic = document.createElement('canvas'); ic.width = 22; ic.height = 20;
    desenha(ic.getContext('2d'), a, 11, MASCOTES[a.tipo].voa ? 19 : 15, 0.3, false, 1);
    c.imageSmoothingEnabled = false; c.drawImage(ic, cx - 22 * 7, cy + 112 - 20 * 14 + (MASCOTES[a.tipo].voa ? 60 : 0), 22 * 14, 20 * 14);
    // textos
    let fs = 50; const nome = '★ @' + a.arroba;
    c.fillStyle = '#3a2410';
    do { c.font = `700 ${fs}px Silkscreen, monospace`; fs -= 2; } while (c.measureText(nome).width > W - 120 && fs > 20);
    c.fillText(nome, W / 2, 730);
    c.fillStyle = '#6a2e10'; c.font = '600 34px "Pixelify Sans", sans-serif';
    c.fillText(`Apoiador nº ${a.n} da Grande Ilha`, W / 2, 790);
    c.font = '400 28px "Pixelify Sans", sans-serif';
    c.fillText(`${MASCOTES[a.tipo].nome} · desde o Dia ${G.diaDe(a._t)} (${dataLonga(a._t)})`, W / 2, 836);
    c.fillStyle = '#6a4a2a'; c.font = '400 18px Silkscreen, monospace';
    c.fillText(location.host || 'the-island.theisland-app.workers.dev', W / 2, 898);
    return cv;
  }

  // ---------------------------------------------------------------- modal
  const modal = document.createElement('div');
  modal.className = 'modal'; modal.hidden = true;
  modal.innerHTML = '<div class="modal-caixa px" role="dialog" aria-modal="true" aria-labelledby="modal-t"><header><h2 id="modal-t"></h2><button class="ib" id="modal-x" type="button" aria-label="Fechar">×</button></header><div class="modal-corpo" id="modal-corpo"></div></div>';
  document.body.appendChild(modal);
  let voltaFoco = null, aoFechar = null;
  function abrir(titulo, html, montar, fechou) {
    voltaFoco = document.activeElement; aoFechar = fechou || null;
    $('modal-t').textContent = titulo; $('modal-corpo').innerHTML = html; $('modal-corpo').scrollTop = 0;
    modal.hidden = false; tip.hidden = true;
    if (montar) montar($('modal-corpo'));
    setTimeout(() => { const f = modal.querySelector('.modal-corpo button, .modal-corpo input, #modal-x'); if (f) f.focus({ preventScroll: true }); }, 30);
  }
  function fechar() {
    if (modal.hidden) return;
    modal.hidden = true;
    const f = aoFechar; aoFechar = null; if (f) f();
    if (voltaFoco && voltaFoco.focus) voltaFoco.focus({ preventScroll: true });
  }
  $('modal-x').addEventListener('click', fechar);
  modal.addEventListener('click', e => { if (e.target === modal) fechar(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) { e.stopPropagation(); fechar(); } }, true);
  function abas(el, nomes, ini, render) {
    const bar = el.querySelector('.abas'), corpo = el.querySelector('.aba-corpo');
    bar.innerHTML = nomes.map((n, i) => `<button type="button" role="tab" data-i="${i}">${n}</button>`).join('');
    const ir = i => { bar.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-selected', String(i === j))); render(i, corpo); };
    bar.addEventListener('click', e => { const b = e.target.closest('button'); if (b) ir(+b.dataset.i); });
    ir(ini);
  }

  // ---------------------------------------------------------------- painel APOIAR
  const estadoApoio = { tipo: store.get('mascote', 'caranguejo'), valor: store.get('valor', AP.valores[1] || AP.valores[0] || 0), arroba: store.get('arroba', '') };
  if (!MASCOTES[estadoApoio.tipo]) estadoApoio.tipo = 'caranguejo';
  function abrirApoio(aba) {
    abrir('APOIAR A ILHA', '<div class="abas" role="tablist"></div><div class="aba-corpo"></div>', el => {
      abas(el, ['APOIAR', 'MEU SELO', `MURAL ${ativos(Date.now()).length}`], aba || 0, (i, corpo) => [abaApoiar, abaSelo, abaMural][i](corpo));
    });
  }
  function msgDirect() {
    const v = estadoApoio.valor > 0 ? ` de R$ ${estadoApoio.valor.toFixed(2).replace('.', ',')}` : '';
    return `Oi! Fiz um PIX${v} para apoiar A Grande Ilha. Meu @ é @${estadoApoio.arroba || '(seu @)'} e o mascote que eu quero é: ${MASCOTES[estadoApoio.tipo].nome}. O comprovante vai em seguida.`;
  }
  function abaApoiar(corpo) {
    const temPix = !!String(AP.chavePix).trim();
    corpo.innerHTML = `
      <p class="m-lead">A Grande Ilha fica no ar de graça, 24 horas, e cresce com os comentários. Se você curte, pode apoiar com qualquer valor. <b>É totalmente opcional.</b></p>
      <div class="m-ganha"><h3>QUEM APOIA GANHA</h3><ul>
        <li><i>★</i>Um selo digital com número, seu @ e seu mascote</li>
        <li><i>♥</i>O mascote passa a viver na ilha, perto da fogueira, com uma estrela em cima</li>
        <li><i>✎</i>Seu nome no mural e no Diário do Escriba</li></ul>
        <p class="m-nota">É só um enfeite: não muda nada na história dos moradores.</p></div>
      <h3 class="m-passo"><span>1</span>ESCOLHA SEU MASCOTE</h3>
      <div class="m-mascotes" id="ap-masc"></div>
      <h3 class="m-passo"><span>2</span>FAÇA O PIX</h3>
      ${temPix ? `
        <div class="m-valores" id="ap-val"></div>
        <div class="m-pix">
          <canvas id="ap-qr" width="10" height="10" aria-label="QR code do PIX"></canvas>
          <div class="m-pix-tx">
            <p>Aponte a câmera do app do banco para o código, ou use o <b>copia e cola</b>.</p>
            <button type="button" class="b-ouro" id="ap-cc">COPIAR PIX COPIA E COLA</button>
            <div class="m-chave"><span>Chave PIX</span><code id="ap-chave">${esc(AP.chavePix)}</code><button type="button" class="b-linha" id="ap-ck">COPIAR CHAVE</button></div>
            ${AP.recebedor ? `<p class="m-nota">O banco vai mostrar o nome <b>${esc(AP.recebedor)}</b>.</p>` : ''}
          </div>
        </div>` : '<p class="m-vazio">A chave PIX ainda vai ser colocada aqui. Volte em breve!</p>'}
      <h3 class="m-passo"><span>3</span>AVISE NO DIRECT</h3>
      <p>Mande o comprovante no direct do <b>@${esc(IG)}</b> com o seu @. Quando o PIX for conferido, o mascote desembarca no cais e o selo fica pronto na aba <b>MEU SELO</b>.</p>
      <label class="m-campo"><span>Seu @ do Instagram</span><input id="ap-arroba" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="@seu_usuario" value="${esc(estadoApoio.arroba ? '@' + estadoApoio.arroba : '')}"></label>
      <div class="m-msg" id="ap-msg"></div>
      <div class="m-botoes"><button type="button" class="b-linha" id="ap-copiamsg">COPIAR MENSAGEM</button><a class="b-ouro" id="ap-dm" href="https://ig.me/m/${encodeURIComponent(IG)}" target="_blank" rel="noopener">ABRIR DIRECT</a></div>
      <p class="m-nota">Menor de idade? Peça para um responsável fazer o PIX.</p>`;
    const mascEl = corpo.querySelector('#ap-masc');
    TIPOS.forEach(k => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'm-masc'; b.setAttribute('aria-pressed', String(k === estadoApoio.tipo));
      b.appendChild(iconeMascote(k, 2));
      b.insertAdjacentHTML('beforeend', `<b>${MASCOTES[k].nome}</b><small>${MASCOTES[k].desc}</small>`);
      b.onclick = () => { estadoApoio.tipo = k; store.set('mascote', k); mascEl.querySelectorAll('.m-masc').forEach(x => x.setAttribute('aria-pressed', String(x === b))); atualizaMsg(); };
      mascEl.appendChild(b);
    });
    const atualizaMsg = () => { corpo.querySelector('#ap-msg').textContent = msgDirect(); };
    const atualizaPix = () => { if (temPix) desenhaQR(corpo.querySelector('#ap-qr'), brcode(estadoApoio.valor)); atualizaMsg(); };
    if (temPix) {
      const valEl = corpo.querySelector('#ap-val');
      const opcoes = AP.valores.filter(v => v > 0);
      valEl.innerHTML = opcoes.map(v => `<button type="button" data-v="${v}">R$ ${v}</button>`).join('') +
        `<label class="m-outro"><span>Outro</span><input id="ap-outro" type="number" min="1" step="1" inputmode="numeric" placeholder="R$"></label><button type="button" data-v="0">Sem valor</button>`;
      const marca = () => valEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === estadoApoio.valor && !(estadoApoio.outro && +b.dataset.v))));
      valEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; estadoApoio.valor = +b.dataset.v; estadoApoio.outro = false; corpo.querySelector('#ap-outro').value = ''; store.set('valor', estadoApoio.valor); marca(); atualizaPix(); });
      corpo.querySelector('#ap-outro').addEventListener('input', e => { const v = Math.max(0, Math.round(+e.target.value || 0)); estadoApoio.valor = v; estadoApoio.outro = v > 0; marca(); atualizaPix(); });
      corpo.querySelector('#ap-cc').onclick = e => copiar(brcode(estadoApoio.valor), e.currentTarget);
      corpo.querySelector('#ap-ck').onclick = e => copiar(normChave(AP.chavePix), e.currentTarget);
      marca();
    }
    corpo.querySelector('#ap-arroba').addEventListener('input', e => { estadoApoio.arroba = limpaArroba(e.target.value); store.set('arroba', estadoApoio.arroba); atualizaMsg(); });
    corpo.querySelector('#ap-copiamsg').onclick = e => copiar(msgDirect(), e.currentTarget);
    corpo.querySelector('#ap-dm').addEventListener('click', () => copiar(msgDirect()));
    atualizaPix();
  }
  function abaSelo(corpo) {
    corpo.innerHTML = `<p>Digite o seu @ para ver e baixar o seu selo.</p>
      <form class="m-busca" id="sl-form"><input id="sl-arroba" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="@seu_usuario" value="${esc(estadoApoio.arroba ? '@' + estadoApoio.arroba : '')}" aria-label="Seu @ do Instagram"><button type="submit" class="b-ouro">VER MEU SELO</button></form>
      <div id="sl-res" aria-live="polite"></div>`;
    const form = corpo.querySelector('#sl-form'), res = corpo.querySelector('#sl-res');
    const busca = () => {
      const ar = limpaArroba(corpo.querySelector('#sl-arroba').value);
      if (!ar) { res.innerHTML = ''; return; }
      estadoApoio.arroba = ar; store.set('arroba', ar);
      const a = porArroba(ar), t = Date.now();
      if (a && t >= a._t) { store.set('selo', ar); marcaPilula(); mostraSelo(res, a); }
      else if (a) res.innerHTML = `<p class="m-vazio">Seu apoio já foi conferido! O selo e o mascote chegam ${quando(a._t, t)}.</p>`;
      else res.innerHTML = `<p class="m-vazio">Ainda não encontramos <b>@${esc(ar)}</b> no mural. Depois que o PIX for conferido, o selo aparece aqui. Já mandou o comprovante no direct do @${esc(IG)}?</p>`;
    };
    form.addEventListener('submit', e => { e.preventDefault(); busca(); });
    if (estadoApoio.arroba) busca();
  }
  async function mostraSelo(res, a) {
    res.innerHTML = '<div class="m-selo"><div class="m-selo-img"></div><div class="m-botoes"><button type="button" class="b-ouro" id="sl-baixar">BAIXAR SELO</button><button type="button" class="b-linha" id="sl-share" hidden>COMPARTILHAR</button><button type="button" class="b-linha" id="sl-ver">VER NA ILHA</button></div></div>';
    const cv = await selo(a); cv.className = 'selo-cv'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', `Selo de apoiador nº ${a.n} de @${a.arroba} com ${MASCOTES[a.tipo].nome}`);
    res.querySelector('.m-selo-img').appendChild(cv);
    const nomeArq = `selo-grande-ilha-${a.arroba}.png`;
    res.querySelector('#sl-baixar').onclick = () => cv.toBlob(b => { const u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = nomeArq; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); });
    const sh = res.querySelector('#sl-share');
    cv.toBlob(b => {
      const file = new File([b], nomeArq, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        sh.hidden = false;
        sh.onclick = () => navigator.share({ files: [file], title: 'Meu selo da Grande Ilha', text: `Sou o apoiador nº ${a.n} da Grande Ilha! @${IG}` }).catch(() => { });
      }
    });
    res.querySelector('#sl-ver').onclick = () => verNaIlha(a);
  }
  function abrirSelo(a) {
    abrir('SELO DE APOIADOR', '<div id="sl-res"></div>', el => mostraSelo(el.querySelector('#sl-res'), a));
  }
  function abaMural(corpo) {
    const lista = ativos(Date.now()).slice().reverse();
    if (!lista.length) { corpo.innerHTML = '<p class="m-vazio">Ainda ninguém por aqui. O primeiro mascote da ilha pode ser o seu!</p>'; return; }
    corpo.innerHTML = '<p>Cada apoiador trouxe um mascote que vive na ilha. Toque para ver o selo.</p><ul class="m-mural"></ul>';
    const ul = corpo.querySelector('.m-mural');
    lista.forEach(a => {
      const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
      b.appendChild(iconeMascote(a, 2));
      b.insertAdjacentHTML('beforeend', `<span><b>★ @${esc(a.arroba)}</b><small>Nº ${a.n} · ${MASCOTES[a.tipo].nome} · Dia ${G.diaDe(a._t)}</small></span>`);
      b.onclick = () => abrirSelo(a);
      li.appendChild(b); ul.appendChild(li);
    });
  }

  // ---------------------------------------------------------------- DIÁRIO DO ESCRIBA
  function lista(nomes) { return nomes.length < 2 ? nomes.join('') : nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1]; }
  function entradas(t) {
    const E = [], mor = G.MOR.slice().sort((a, b) => a._ch - b._ch), chegaram = mor.filter(m => t >= m._ch);
    const fundacao = G.DIA2 - 864e5;
    let g = null;
    chegaram.forEach(m => {
      if (g && m._ch - g.fim < 3 * 3600e3 && G.diaDe(m._ch) === g.dia) { g.mor.push(m); g.fim = m._ch; }
      else { g = { tipo: 'chegada', quando: m._ch, fim: m._ch, dia: G.diaDe(m._ch), mor: [m] }; E.push(g); }
    });
    E.forEach(e => {
      if (e.tipo !== 'chegada') return;
      if (e.quando <= fundacao) e.texto = `${lista(e.mor.map(m => m.nome))} fundaram a ilha.`;
      else if (e.mor.length === 1) e.texto = `${e.mor[0].nome}, ${e.mor[0].profissao.toLowerCase()}, desembarcou no cais.`;
      else e.texto = `${e.mor.length} novos moradores desembarcaram no cais: ${lista(e.mor.map(m => `${m.nome} (${m.profissao.toLowerCase()})`))}.`;
    });
    MARCOS.forEach(n => { if (chegaram.length >= n) E.push({ tipo: 'meta', quando: chegaram[n - 1]._ch + 1, texto: `A ilha chegou a ${n} moradores!` }); });
    ativos(t).forEach(a => E.push({ tipo: 'apoio', quando: a._t, texto: `@${a.arroba} apoiou a ilha e trouxe ${MASCOTES[a.tipo].art} ${MASCOTES[a.tipo].nome.toLowerCase()} para morar perto da fogueira.` }));
    (C.diario || []).forEach(d => { const q = Date.parse(d.quando); if (q && q <= t && d.texto) E.push({ tipo: 'nota', quando: q, texto: d.texto }); });
    const pend = mor.filter(m => t < m._ch);
    let f = null;
    pend.forEach(m => { if (f && m._ch - f.ini < 3 * 3600e3) f.n++; else { f = { tipo: 'futuro', quando: m._ch, ini: m._ch, n: 1 }; E.push(f); } });
    E.forEach(e => { if (e.tipo === 'futuro') e.texto = `Barcos à vista: ${e.n === 1 ? 'um novo morador chega' : e.n + ' novos moradores chegam'} ${quando(e.quando, t)}.`; });
    return E.sort((a, b) => b.quando - a.quando);
  }
  function abrirDiario() {
    const t = Date.now(), n = G.MOR.filter(m => t >= m._ch).length;
    const prox = MARCOS.find(x => x > n) || n + 100;
    const pct = Math.round(n / prox * 100), falta = prox - n;
    const E = entradas(t);
    let html = `<div class="m-meta"><div class="m-meta-t"><b>META DA ILHA</b><span>${n} / ${prox} moradores</span></div>
      <div class="m-barra" role="progressbar" aria-valuemin="0" aria-valuemax="${prox}" aria-valuenow="${n}"><i style="width:${pct}%"></i></div>
      <p>Faltam <b>${falta}</b> ${falta === 1 ? 'morador' : 'moradores'} para a ilha chegar a ${prox}. Comente nome, profissão e história no <a href="https://www.instagram.com/${encodeURIComponent(IG)}/" target="_blank" rel="noopener">@${esc(IG)}</a>.</p></div>
      <p class="m-escriba">Registros de Natã, o Escriba</p><div class="m-diario">`;
    let dia = null;
    E.forEach(e => {
      const d = e.tipo === 'futuro' ? 'A CAMINHO' : 'DIA ' + G.diaDe(e.quando);
      if (d !== dia) { if (dia) html += '</ol>'; html += `<h3>${d}</h3><ol>`; dia = d; }
      const ic = { chegada: '⚓', meta: '⚑', apoio: '★', nota: '✎', futuro: '⛵' }[e.tipo];
      html += `<li class="d-${e.tipo}"><i aria-hidden="true">${ic}</i><div><time>${data(e.quando)} · ${hora(e.quando)}</time><p>${esc(e.texto)}</p></div></li>`;
    });
    if (dia) html += '</ol>';
    html += '</div>';
    abrir('DIÁRIO DA ILHA', html);
  }

  // ---------------------------------------------------------------- boas-vindas e aviso
  function abrirBoasVindas(primeira) {
    abrir('BEM-VINDO À GRANDE ILHA', `
      <p class="m-lead">Uma ilha medieval ao vivo, no horário de Brasília. Cada morador nasceu de um comentário e segue a própria rotina, dia e noite.</p>
      <ol class="m-dicas">
        <li><i>☞</i><div><b>Toque num morador</b><span>Você vê a história dele e passa a segui-lo pela ilha.</span></div></li>
        <li><i>⚓</i><div><b>Fique de olho no cais</b><span>Os moradores novos chegam de barco, um por um, ao vivo.</span></div></li>
        <li><i>✎</i><div><b>Vire morador</b><span>Comente <b>nome + profissão + história</b> nos vídeos do @${esc(IG)} no Instagram ou no YouTube.</span></div></li>
      </ol>
      <div class="m-botoes"><button type="button" class="b-ouro" id="bv-ok">EXPLORAR A ILHA</button><a class="b-linha" href="https://www.instagram.com/${encodeURIComponent(IG)}/" target="_blank" rel="noopener">QUERO SER MORADOR</a></div>`,
    el => { el.querySelector('#bv-ok').onclick = fechar; },
    () => { if (primeira) { store.set('boas-vindas', 1); setTimeout(talvezAviso, 600); } });
  }
  function avisoAtivo(t) {
    const a = C.aviso; if (!a || !a.id || !a.titulo) return null;
    const ini = Date.parse(a.desde) || 0, fim = Date.parse(a.ate) || Infinity;
    return t >= ini && t <= fim ? a : null;
  }
  function talvezAviso() {
    const a = avisoAtivo(Date.now());
    if (!a || store.get('aviso', '') === a.id || !modal.hidden) return;
    abrir(a.titulo.toUpperCase(), `<p class="m-lead">${esc(a.texto || '')}</p><div class="m-botoes"><button type="button" class="b-ouro" id="av-ok">ENTENDI</button>${a.link ? `<a class="b-linha" href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.botao || 'SAIBA MAIS')}</a>` : ''}</div>`,
      el => { el.querySelector('#av-ok').onclick = fechar; }, () => store.set('aviso', a.id));
  }

  // ---------------------------------------------------------------- festa de novo apoiador e lembrete
  const festa = document.createElement('div');
  festa.className = 'festa px'; festa.hidden = true; festa.setAttribute('role', 'status');
  document.body.appendChild(festa);
  const fila = []; let festaOn = false;
  function anuncia(item) { fila.push(item); if (!festaOn) proxima(); }
  function proxima() {
    const it = fila.shift(); if (!it) { festaOn = false; return; }
    festaOn = true;
    festa.className = 'festa px' + (it.leve ? ' leve' : '');
    festa.innerHTML = `<div class="festa-ic"></div><div class="festa-tx"><b>${esc(it.titulo)}</b><span>${esc(it.texto)}</span></div>${it.acao ? `<button type="button" class="b-ouro">${esc(it.acao)}</button>` : ''}`;
    if (it.a) festa.querySelector('.festa-ic').appendChild(iconeMascote(it.a, 2)); else festa.querySelector('.festa-ic').remove();
    if (it.acao) festa.querySelector('button').onclick = () => { festa.hidden = true; it.fn(); };
    festa.hidden = false; festa.classList.remove('in'); void festa.offsetWidth; festa.classList.add('in');
    setTimeout(() => { festa.hidden = true; setTimeout(proxima, 400); }, it.dur || 8000);
  }
  const vistos = new Set();
  function checaFesta(t) {
    APO.forEach(a => {
      if (vistos.has(a.arroba) || t < a._t || t - a._t > 10 * 60e3) return;
      vistos.add(a.arroba);
      anuncia({ a, titulo: 'NOVO APOIADOR!', texto: `★ @${a.arroba} chegou pelo cais com ${MASCOTES[a.tipo].art} ${MASCOTES[a.tipo].nome.toLowerCase()}`, acao: 'VER NA ILHA', fn: () => verNaIlha(a), dur: 9000 });
    });
  }
  let ultimoLembrete = Date.now();
  function lembrete(t) {
    const at = ativos(t);
    if (!at.length || !String(AP.chavePix).trim() || t - ultimoLembrete < 15 * 60e3 || !modal.hidden) return;
    ultimoLembrete = t;
    const ult = at.slice(-3).reverse().map(a => '@' + a.arroba);
    anuncia({ leve: true, titulo: 'A ILHA É DA COMUNIDADE ♥', texto: `${lista(ult)} ${at.length > 1 ? 'já apoiaram' : 'já apoiou'}. Que tal trazer o seu mascote?`, acao: 'APOIAR', fn: () => abrirApoio(0), dur: 7000 });
  }

  // ---------------------------------------------------------------- botões do HUD
  function marcaPilula() {
    const b = $('btn-apoiar'); if (!b) return;
    const meu = porArroba(store.get('selo', '')), t = Date.now();
    b.innerHTML = '';
    if (meu && t >= meu._t) { b.appendChild(iconeMascote(meu, 1)); b.insertAdjacentHTML('beforeend', '<span>MEU SELO</span>'); b.onclick = () => abrirApoio(1); }
    else { b.innerHTML = '<span>♥ APOIAR</span>'; b.onclick = () => abrirApoio(0); }
  }
  marcaPilula();
  $('btn-diario').addEventListener('click', abrirDiario);
  $('btn-ajuda').addEventListener('click', () => abrirBoasVindas(false));
  setInterval(() => { const t = Date.now(); checaFesta(t); lembrete(t); }, 1000);
  checaFesta(Date.now());
  setTimeout(() => { if (!store.get('boas-vindas', 0)) abrirBoasVindas(true); else talvezAviso(); }, 1200);

  window.IlhaComunidade = { brcode, crc16, MASCOTES, APO, entradas, abrirApoio, abrirDiario, abrirBoasVindas, abrirSelo, selo,
    abrir, fechar, abas, anuncia, ativos, posMascote, copiar, esc, limpaArroba, store, IG, quadro: () => quadro };
})();
