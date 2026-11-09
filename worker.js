// A Grande Ilha — servidor do site no Cloudflare.
// Serve os arquivos normalmente e mantém o contador de quem está assistindo agora.
import { DurableObject } from "cloudflare:workers";

// Um único contador para a ilha inteira. Cada visitante abre uma conexão
// (WebSocket) ao entrar e ela fecha sozinha quando ele sai da página.
export class Plateia extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // Responde ao "ping" dos visitantes sem acordar o contador.
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request) {
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server); // modo hibernação: não cobra tempo parado
    this.avisar();
    return new Response(null, { status: 101, webSocket: client });
  }

  avisar(saindo) {
    const todos = this.ctx.getWebSockets().filter((ws) => ws !== saindo);
    const msg = JSON.stringify({ assistindo: todos.length });
    for (const ws of todos) {
      try { ws.send(msg); } catch (e) { /* conexão já fechada */ }
    }
  }

  async webSocketMessage(ws) {
    try { ws.send(JSON.stringify({ assistindo: this.ctx.getWebSockets().length })); } catch (e) { }
  }

  async webSocketClose(ws, code, reason) {
    try { ws.close(code, reason); } catch (e) { }
    this.avisar(ws);
  }

  async webSocketError(ws) {
    this.avisar(ws);
  }
}

// ---------------------------------------------------------------------------
// A Vila: viajantes (visitantes que controlam um personagem) andando juntos.
// Guarda o visual, o nível e o progresso de missões/conquistas de cada @.
// Cada @ tem um código de acesso secreto, criado na primeira entrada: sem ele,
// ninguém entra com o @ de outra pessoa.
const MAX_VIAJANTES = 80;
const IG_VERSAO = "v23.0";
const IG_CONTA = "17841467331405114"; // ID da conta @the_island.lab (aparece no painel da Meta)
const SITE = "the-island.theisland-app.workers.dev";
const EMOTES = 6;
const PROIBIDO = ['porra', 'caralh', 'buceta', 'xoxota', 'piroca', 'arrombad', 'viado', 'fdp', 'vsf', 'tnc', 'merda', 'putaria', 'puta_', '_puta', 'nazi', 'hitler', 'estupr', 'pedof', 'pedo_', 'racist', 'macaco_', 'bosta', 'cuzao', 'otario', 'vagabund', 'piranha'];
const CORES = /^#[0-9a-f]{6}$/i;
const CABELOS = ['curto', 'longo', 'rabo', 'espetado', 'coque', 'careca'];
const CHAPEUS = ['', 'palha', 'capuz', 'gorro', 'bandana', 'faixa', 'oculos', 'marinheiro'];
const nivel = xp => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 60));
const limpaArroba = s => String(s || '').trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);
const num = (v, a, b) => (typeof v === 'number' && isFinite(v) ? Math.max(a, Math.min(b, Math.round(v * 10) / 10)) : null);

function limpaLook(v) {
  if (!v || typeof v !== 'object') return null;
  const cor = (k, d) => (CORES.test(v[k] || '') ? v[k].toLowerCase() : d);
  const o = { tipo: 'humano', pele: cor('pele', '#e0a882'), cabelo: CABELOS.includes(v.cabelo) ? v.cabelo : 'curto', corCabelo: cor('corCabelo', '#4a3020'),
    roupa: cor('roupa', '#3a6a8a'), calca: cor('calca', '#3a3028') };
  if (CHAPEUS.includes(v.chapeu) && v.chapeu) { o.chapeu = v.chapeu; o.corChapeu = cor('corChapeu', '#6a4a2a'); }
  if (CORES.test(v.barba || '')) o.barba = v.barba.toLowerCase();
  if (v.manto === true) o.manto = true;
  return o;
}
// Loja da Ilha: preços conferidos no servidor (o site nunca decide o preço). Só itens visuais.
const LOJA = { tricornio: [3, "Tricórnio pirata"], capa: [5, "Capa de veludo"], asas: [8, "Asas de dragão"], aura: [6, "Aura de brasas"],
  brasinha: [10, "Mascote Brasinha"], nome: [3, "Nome dourado"], moldura: [4, "Moldura de ouro"], bandeira: [5, "Bandeira na casa"], teste: [1, "Item de teste"] };
// Barra da comunidade do episódio (Ofícios). Troque o id/título quando mudar o objetivo.
const COM = { id: "ep7", titulo: "Ep. 7 · Preparar a ilha contra o Reino do Sul", meta: 300 };
const ITENS_COM = new Set(["trigo", "madeira", "minerio", "erva", "pao", "lamina", "lamina_enc", "remedio"]);
const LIMITE_DIA = 30;
const TEMPORADA_MSG = new Set(["ganho", "votar", "patrulha", "casa", "oferta", "retirar", "comprar", "equip_compra", "equip_forja", "eco"]);

// ---------------------------------------------------------------------------
// TEMPORADA (atualizações de novembro/dezembro): reputação, TIC, ranking, votação,
// evento coletivo, casas, mercado dos membros e equipamentos. Tudo o que vale "de
// verdade" (moeda, reputação, votos) é contado aqui no servidor, com limites por dia.
const REP_NIVEIS = [[0, "Forasteiro"], [20, "Conhecido"], [80, "Respeitado"], [200, "Herói da Ilha"], [500, "Lenda"]];
const repNivel = r => { let i = 0; REP_NIVEIS.forEach(([min], k) => { if (r >= min) i = k; }); return i; };
// ganhos: tic e reputação por tipo de ação, com limite diário (dia) ou uma vez só (uma)
const GANHOS = {
  missao: { tic: 5, rep: 3, dia: 3 }, diaperfeito: { tic: 10, rep: 5, dia: 1 }, pedido: { tic: 8, rep: 4, dia: 3 },
  coleta: { tic: 0, rep: 1, dia: 12 }, fabrica: { tic: 2, rep: 2, dia: 6 }, conversa: { tic: 0, rep: 1, dia: 8 },
  "historia:espiao": { tic: 50, rep: 30, uma: true }, "evento:costa1": { tic: 30, rep: 20, uma: true }, presente: { tic: 15, rep: 3, dia: 1 }
};
const VOTACAO = { id: "v1", titulo: "O que a ilha constrói primeiro?", fim: Date.parse("2026-11-15T21:00:00-03:00"),
  ops: [{ id: "fortaleza", n: "Fortaleza do Dragão (projeto do Igor)" }, { id: "muralha", n: "Muralha da Costa Sul" }] };
const EVENTO = { id: "costa1", titulo: "Vigília da Costa Sul", inicio: Date.parse("2026-11-09T12:00:00-03:00"), fim: Date.parse("2026-11-16T23:59:00-03:00"), meta: 400, porDia: 30 };
const NATAL = { inicio: Date.parse("2026-12-19T00:00:00-03:00"), fim: Date.parse("2026-12-26T23:59:00-03:00") };
const EQUIP = { luvas_ferreiro: 15, botas_andarilho: 15, lanterna_costa: 15, lamina_runica: 40, manto_aprendiz: 40, amuleto_dragao: 80 };
const EQUIP_FORJA = new Set(["luvas_ferreiro", "botas_andarilho", "lanterna_costa"]);
const TICPACK = { tic20: [2, 20, "20 TIC (Bronze)"], tic55: [5, 55, "55 TIC (Prata)"], tic120: [10, 120, "120 TIC (Ouro)"], tic260: [20, 260, "260 TIC (Diamante)"] };
const diaBR = t => new Date(t - 3 * 3600e3).toISOString().slice(0, 10);
function limpaPerfil(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const s = JSON.stringify(p);
  if (s.length > 14000) return null;
  const xp = num(p.xp, 0, 1e7);
  if (xp === null) return null;
  return JSON.parse(s);
}
async function hash(codigo) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('grande-ilha:' + codigo));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function novoCodigo() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(12));
  let s = ''; r.forEach((n, i) => { s += A[n % A.length]; if (i === 3 || i === 7) s += '-'; });
  return s;
}

export class Vila extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.ban = { lista: new Set(), t: 0 };
    this.res = { mapa: {}, t: 0 };
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request) {
    const rota = new URL(request.url).pathname;
    if (rota === "/loja/webhook") {
      const u = new URL(request.url); let id = u.searchParams.get("data.id") || u.searchParams.get("id") || "";
      try { if (!id && request.method === "POST") { const j = await request.json(); id = String((j.data && j.data.id) || j.resource || "").split("/").pop(); } } catch (e) { }
      id = String(id).replace(/\D/g, "");
      if (id) await this.confere(id);
      return new Response("ok");
    }
    if (rota === "/loja/status") return Response.json({ pix: !!this.env.MP_TOKEN }, { headers: { "cache-control": "no-store" } });
    if (rota === "/loja/bandeiras") return Response.json((await this.ctx.storage.get("loja:bandeiras")) || [], { headers: { "cache-control": "no-store" } });
    if (rota.startsWith("/temporada/")) return Response.json(await this.rotaTemporada(rota, new URL(request.url).searchParams), { headers: { "cache-control": "no-store" } });
    if (rota === "/comunidade") return Response.json(await this.resumoComunidade(), { headers: { "cache-control": "no-store" } });
    if (rota === "/interno/instagram") { await this.verificaInstagram(); return new Response("ok"); }
    if (rota === "/instagram/status") return Response.json(await this.statusInstagram(), { headers: { "cache-control": "no-store" } });
    if (rota === "/instagram/verificar") { // verificação manual, no máximo uma por minuto
      const ult = (await this.ctx.storage.get("ig:manual")) || 0;
      if (Date.now() - ult > 60e3) { await this.ctx.storage.put("ig:manual", Date.now()); await this.verificaInstagram(); }
      return Response.json(await this.statusInstagram(), { headers: { "cache-control": "no-store" } });
    }
    if (this.viajantes().length >= MAX_VIAJANTES) return new Response("A ilha está cheia agora.", { status: 503 });
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({});
    return new Response(null, { status: 101, webSocket: client });
  }

  // ---------------------------------------------------------------- Loja (Mercado Pago, Pix)
  async criaPix(arroba, item) {
    if (!this.env.MP_TOKEN) return { erro: "A loja ainda não está configurada." };
    const [valor, nome] = TICPACK[item] ? [TICPACK[item][0], TICPACK[item][2]] : LOJA[item], ref = arroba + "|" + item + "|" + crypto.randomUUID().slice(0, 8);
    const expira = new Date(Date.now() + 30 * 60e3 - 4 * 3600e3).toISOString().replace("Z", "-04:00");
    try {
      const r = await fetch("https://api.mercadopago.com/v1/payments", { method: "POST", headers: { "Authorization": "Bearer " + this.env.MP_TOKEN, "Content-Type": "application/json", "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ transaction_amount: valor, description: "A Grande Ilha: " + nome, payment_method_id: "pix", external_reference: ref,
          notification_url: "https://" + SITE + "/loja/webhook", date_of_expiration: expira,
          payer: { email: arroba.replace(/[^a-z0-9]/g, "") + "@ilha.theisland-app.workers.dev", first_name: "Viajante" } }) });
      const j = await r.json();
      const td = j && j.point_of_interaction && j.point_of_interaction.transaction_data;
      if (!r.ok || !td) return { erro: "O Mercado Pago não gerou o Pix agora. Tente de novo em instantes.", detalhe: (j && (j.message || j.error)) || r.status };
      await this.ctx.storage.put("pix:" + j.id, { arroba, item, valor, criado: Date.now(), pago: false });
      return { id: String(j.id), valor, qr: td.qr_code, img: td.qr_code_base64, expira: Date.now() + 30 * 60e3 };
    } catch (e) { return { erro: "Não deu para falar com o Mercado Pago agora." }; }
  }
  async confere(id) {
    const rec = await this.ctx.storage.get("pix:" + id);
    if (!rec) return { status: "desconhecido" };
    if (rec.pago) return { status: "approved", item: rec.item };
    try {
      const r = await fetch("https://api.mercadopago.com/v1/payments/" + id, { headers: { "Authorization": "Bearer " + this.env.MP_TOKEN } });
      const j = await r.json();
      if (j && j.status === "approved" && Number(j.transaction_amount) >= rec.valor) { await this.entrega(id, rec); return { status: "approved", item: rec.item }; }
      return { status: (j && j.status) || "pending" };
    } catch (e) { return { status: "pending" }; }
  }
  async entrega(id, rec) {
    rec.pago = true; rec.pagoEm = Date.now(); await this.ctx.storage.put("pix:" + id, rec);
    if (TICPACK[rec.item]) {
      const e = await this.eco(rec.arroba); e.tic += TICPACK[rec.item][1]; e.compras = (e.compras || 0) + 1; await this.salvaEco(rec.arroba, e);
      const cr = (await this.ctx.storage.get("loja:creditos")) || []; cr.push({ arroba: rec.arroba, item: rec.item, valor: rec.valor, em: rec.pagoEm }); await this.ctx.storage.put("loja:creditos", cr.slice(-500));
      this.paraArroba(rec.arroba, { t: "eco", ...this.ecoPub(e), aviso: "Pix confirmado: +" + TICPACK[rec.item][1] + " TIC!" });
      return;
    }
    const k = "loja:" + rec.arroba, itens = (await this.ctx.storage.get(k)) || [];
    if (!itens.includes(rec.item)) itens.push(rec.item);
    await this.ctx.storage.put(k, itens);
    if (rec.item === "bandeira") { const b = (await this.ctx.storage.get("loja:bandeiras")) || []; if (!b.includes(rec.arroba)) { b.push(rec.arroba); await this.ctx.storage.put("loja:bandeiras", b); } }
    const cr = (await this.ctx.storage.get("loja:creditos")) || []; cr.push({ arroba: rec.arroba, item: rec.item, valor: rec.valor, em: rec.pagoEm }); await this.ctx.storage.put("loja:creditos", cr.slice(-500));
    for (const [ws, b] of this.viajantes()) if (b.arroba === rec.arroba) { b.loja = itens; ws.serializeAttachment(b); this.todos({ t: "loja", id: b.id, itens }); }
  }
  async comunidade() {
    if (!this.com) this.com = (await this.ctx.storage.get("com:" + COM.id)) || { total: 0, por: {}, hoje: { dia: "", por: {} } };
    return this.com;
  }
  async resumoComunidade() {
    const c = await this.comunidade();
    const top = Object.entries(c.por).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([arroba, n]) => ({ arroba, n }));
    return { id: COM.id, titulo: COM.titulo, meta: COM.meta, total: c.total, top };
  }
  viajantes() { return this.ctx.getWebSockets().map(ws => [ws, ws.deserializeAttachment() || {}]).filter(([, a]) => a.id); }
  envia(ws, m) { try { ws.send(JSON.stringify(m)); } catch (e) { } }
  todos(m, exceto) { const s = JSON.stringify(m); for (const [ws] of this.viajantes()) if (ws !== exceto) { try { ws.send(s); } catch (e) { } } }
  aviso(m, exceto) { this.hist = (this.hist || []).concat(m).slice(-10); this.todos(m, exceto); }
  publico(a) { return { id: a.id, arroba: a.arroba, look: a.look, x: a.x, y: a.y, lv: a.lv || 1, loja: a.loja || [] }; }

  // lista de @ bloqueados: arquivo banidos.json do próprio site (atualiza a cada 60 s)
  async banidos() {
    if (Date.now() - this.ban.t > 60e3) {
      this.ban.t = Date.now();
      try {
        const r = await this.env.ASSETS.fetch(new Request("https://ilha/banidos.json"));
        if (r.ok) { const j = await r.json(); this.ban.lista = new Set((Array.isArray(j) ? j : j.banidos || []).map(limpaArroba)); }
      } catch (e) { }
    }
    return this.ban.lista;
  }

  // @ dos moradores: só entra quem tem o código de convite (o site guarda só o hash do código)
  async reservados() {
    if (Date.now() - this.res.t > 60e3) {
      this.res.t = Date.now();
      try {
        const r = await this.env.ASSETS.fetch(new Request("https://ilha/reservados.json"));
        if (r.ok) { const j = await r.json(); this.res.mapa = j.reservados || {}; }
      } catch (e) { }
    }
    return this.res.mapa;
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 8000) return;
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    const a = ws.deserializeAttachment() || {}, agora = Date.now();
    // limite de mensagens por conexão (balde: 10 por segundo, rajada de 20)
    a.b = Math.min(20, (a.b ?? 20) + (agora - (a.bt || agora)) / 1000 * 10); a.bt = agora;
    if (a.b < 1) { ws.serializeAttachment(a); return; }
    a.b -= 1;
    if (m.t === "entrar") return this.entrar(ws, a, m);
    if (!a.id) { ws.serializeAttachment(a); return; }
    if (m.t === "alvo") {
      const x = num(m.x, 0, 760), y = num(m.y, 0, 600);
      if (x !== null && y !== null) { a.x = x; a.y = y; this.todos({ t: "alvo", id: a.id, x, y }, ws); }
    } else if (m.t === "emote") {
      const i = m.i | 0;
      if (i >= 0 && i < EMOTES && agora - (a.et || 0) > 2000) { a.et = agora; this.todos({ t: "emote", id: a.id, i }); }
    } else if (m.t === "visual") {
      const look = limpaLook(m.look);
      if (look) { a.look = look; this.todos({ t: "visual", id: a.id, look }, ws); await this.salva(a.arroba, { look }); }
    } else if (m.t === "feito") {
      // conquista ou carta nova: vai para o painel ao vivo de todo mundo
      const k = m.k, v = String(m.v || "");
      if ((k === "conquista" || k === "carta") && /^[a-z0-9_.:]{1,48}$/.test(v) && agora - (a.ft || 0) > 1500) {
        a.ft = agora; this.aviso({ t: "aviso", k, v, arroba: a.arroba, em: agora }, ws);
      }
    } else if (m.t && TEMPORADA_MSG.has(m.t)) {
      ws.serializeAttachment(a);
      return this.msgTemporada(ws, a, m, agora);
    } else if (m.t === "pix") {
      // cria a cobrança Pix no Mercado Pago para o @ desta sessão (já autenticado pelo código)
      const item = String(m.item || "");
      if (item !== "teste" && !TICPACK[item]) return this.envia(ws, { t: "pix", erro: "A loja está fechada por enquanto. Volte em breve!" }); // LOJA DE VISUAIS FORA DO AR (pacotes de TIC valem)
      if ((!LOJA[item] && !TICPACK[item]) || agora - (a.px || 0) < 15e3) { ws.serializeAttachment(a); return this.envia(ws, { t: "pix", erro: "Espere alguns segundos e tente de novo." }); }
      a.px = agora; ws.serializeAttachment(a);
      const r = await this.criaPix(a.arroba, item);
      return this.envia(ws, Object.assign({ t: "pix", item }, r));
    } else if (m.t === "pixstatus") {
      const id = String(m.id || "").replace(/\D/g, "").slice(0, 20);
      if (id) this.envia(ws, Object.assign({ t: "pixstatus", id }, await this.confere(id)));
    } else if (m.t === "entrega") {
      // Ofícios: cada entrega de pedido enche a barra da comunidade do episódio (limite por pessoa por dia)
      const item = String(m.item || ""), q = Math.max(1, Math.min(5, m.q | 0));
      if (ITENS_COM.has(item) && agora - (a.en || 0) > 1200) {
        a.en = agora;
        const c = await this.comunidade(), dia = new Date(agora - 3 * 3600e3).toISOString().slice(0, 10);
        if (c.hoje.dia !== dia) c.hoje = { dia, por: {} };
        const ja = c.hoje.por[a.arroba] || 0, vale = Math.max(0, Math.min(q, LIMITE_DIA - ja));
        if (vale > 0) {
          const antes = c.total;
          c.total += vale; c.hoje.por[a.arroba] = ja + vale; c.por[a.arroba] = (c.por[a.arroba] || 0) + vale;
          await this.ctx.storage.put("com:" + COM.id, c);
          this.todos({ t: "comunidade", total: c.total, meta: COM.meta });
          const marco = [0.25, 0.5, 0.75, 1].find(f => antes < COM.meta * f && c.total >= COM.meta * f);
          if (marco) this.aviso({ t: "aviso", k: "comunidade", v: String(Math.round(marco * 100)), arroba: a.arroba, em: agora });
        }
      }
    } else if (m.t === "perfil") {
      const p = limpaPerfil(m.perfil);
      if (p && agora - (a.st || 0) > 3000) {
        a.st = agora;
        const lv = nivel(p.xp);
        if (lv !== a.lv) { a.lv = lv; this.todos({ t: "lv", id: a.id, lv }, ws); }
        const niv = (await this.ctx.storage.get("niveis")) || {};
        if (niv[a.arroba] !== lv) { niv[a.arroba] = lv; await this.ctx.storage.put("niveis", niv); }
        await this.rankXp(a.arroba, p.xp);
        await this.salva(a.arroba, { perfil: p });
      }
    }
    ws.serializeAttachment(a);
  }

  // ---------------------------------------------------------------- TEMPORADA
  async eco(arroba) {
    const e = (await this.ctx.storage.get("eco:" + arroba)) || {};
    return Object.assign({ tic: 0, rep: 0, dia: "", hoje: {}, uma: {}, equip: [], vendas: [] }, e);
  }
  async salvaEco(arroba, e) { await this.ctx.storage.put("eco:" + arroba, e); await this.rankRep(arroba, e.rep); }
  ecoPub(e) { return { tic: e.tic, rep: e.rep, repNv: repNivel(e.rep), repNome: REP_NIVEIS[repNivel(e.rep)][1], equip: e.equip || [], vendas: (e.vendas || []).slice(-5) }; }
  paraArroba(arroba, m) { for (const [ws, b] of this.viajantes()) if (b.arroba === arroba) this.envia(ws, m); }
  async rank() { if (!this.rk) this.rk = (await this.ctx.storage.get("rank")) || {}; return this.rk; }
  async rankXp(arroba, xp) { const r = await this.rank(); const v = r[arroba] || [0, 0]; if (v[0] !== xp) { v[0] = xp; r[arroba] = v; await this.ctx.storage.put("rank", r); } }
  async rankRep(arroba, rep) { const r = await this.rank(); const v = r[arroba] || [0, 0]; if (v[1] !== rep) { v[1] = rep; r[arroba] = v; await this.ctx.storage.put("rank", r); } }
  async multRep(arroba, e) {
    const rec = await this.ctx.storage.get("j:" + arroba), at = (rec && rec.perfil && rec.perfil.attr) || {};
    const eq = (rec && rec.perfil && rec.perfil.eqp) || [];
    return 1 + Math.max(0, Math.min(10, at.car | 0)) * 0.05 + (eq.includes("amuleto_dragao") && (e.equip || []).includes("amuleto_dragao") ? 0.2 : 0);
  }
  async ganha(arroba, k, agora) {
    const g = GANHOS[k]; if (!g) return null;
    const e = await this.eco(arroba), dia = diaBR(agora);
    if (e.dia !== dia) { e.dia = dia; e.hoje = {}; }
    if (g.uma) { if (e.uma[k]) return null; e.uma[k] = agora; }
    else { if ((e.hoje[k] || 0) >= g.dia) return null; e.hoje[k] = (e.hoje[k] || 0) + 1; }
    const rep = Math.round(g.rep * (await this.multRep(arroba, e)));
    e.tic += g.tic; e.rep += rep;
    await this.salvaEco(arroba, e);
    return { e, tic: g.tic, rep };
  }
  async votacao() { if (!this.vt) this.vt = (await this.ctx.storage.get("voto:" + VOTACAO.id)) || { por: {}, peso: {} }; return this.vt; }
  async resumoVotacao(eu) {
    const v = await this.votacao(), soma = {};
    VOTACAO.ops.forEach(o => { soma[o.id] = 0; });
    Object.entries(v.por).forEach(([ar, op]) => { soma[op] = (soma[op] || 0) + (v.peso[ar] || 1); });
    const encerrada = Date.now() >= VOTACAO.fim, ord = VOTACAO.ops.map(o => o.id).sort((x, y) => soma[y] - soma[x]);
    return { id: VOTACAO.id, titulo: VOTACAO.titulo, fim: VOTACAO.fim, encerrada, ops: VOTACAO.ops.map(o => ({ id: o.id, n: o.n, v: soma[o.id] })),
      votantes: Object.keys(v.por).length, vencedor: encerrada ? ord[0] : null, lider: ord[0], meu: eu ? v.por[eu] || null : null };
  }
  async evento() { if (!this.ev) this.ev = (await this.ctx.storage.get("evento:" + EVENTO.id)) || { total: 0, por: {}, hoje: { dia: "", por: {} } }; return this.ev; }
  async resumoEvento(eu) {
    const v = await this.evento(), agora = Date.now();
    const top = Object.entries(v.por).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([arroba, n]) => ({ arroba, n }));
    return { id: EVENTO.id, titulo: EVENTO.titulo, inicio: EVENTO.inicio, fim: EVENTO.fim, meta: EVENTO.meta, total: v.total, ativo: agora >= EVENTO.inicio && agora <= EVENTO.fim,
      participantes: Object.keys(v.por).length, top, meu: eu ? v.por[eu] || 0 : 0 };
  }
  async mercado() { if (!this.mc) this.mc = (await this.ctx.storage.get("mercado")) || { seq: 1, ofertas: [] }; return this.mc; }
  async rotaTemporada(rota, q) {
    const eu = limpaArroba(q.get("eu") || "");
    if (rota === "/temporada/ranking") {
      const r = await this.rank(), lista = Object.entries(r).filter(([, v]) => v[0] > 0);
      lista.sort((x, y) => y[1][0] - x[1][0]);
      const pos = eu ? lista.findIndex(([ar]) => ar === eu) + 1 : 0;
      const repTop = Object.entries(r).sort((x, y) => y[1][1] - x[1][1]).slice(0, 5).map(([arroba, v]) => ({ arroba, rep: v[1], nome: REP_NIVEIS[repNivel(v[1])][1] }));
      return { top: lista.slice(0, 10).map(([arroba, v]) => ({ arroba, xp: v[0], lv: nivel(v[0]), rep: v[1], repNome: REP_NIVEIS[repNivel(v[1])][1] })), total: lista.length, pos, repTop };
    }
    if (rota === "/temporada/votacao") return this.resumoVotacao(eu);
    if (rota === "/temporada/evento") return this.resumoEvento(eu);
    if (rota === "/temporada/casas") return (await this.ctx.storage.get("casas")) || {};
    if (rota === "/temporada/mercado") { const m = await this.mercado(); return { ofertas: m.ofertas.slice(-60) }; }
    if (rota === "/temporada/resumo") {
      const [vt, ev, mc, c] = [await this.resumoVotacao(eu), await this.resumoEvento(eu), await this.mercado(), (await this.ctx.storage.get("casas")) || {}];
      return { votacao: vt, evento: ev, ofertas: mc.ofertas.length, lojas: [...new Set(mc.ofertas.map(o => o.a))], casas: c, natal: NATAL, agora: Date.now() };
    }
    return { erro: "rota desconhecida" };
  }
  async msgTemporada(ws, a, m, agora) {
    const ar = a.arroba, responde = (x) => this.envia(ws, x);
    const ecoMsg = (e, extra) => responde(Object.assign({ t: "eco" }, this.ecoPub(e), extra || {}));
    if (m.t === "eco") return ecoMsg(await this.eco(ar));
    if (m.t === "ganho") {
      const k = String(m.k || "");
      if (k === "evento:costa1") { const ev = await this.evento(); if (ev.total < EVENTO.meta || (ev.por[ar] || 0) < 3) return; }
      if (k === "presente" && (agora < NATAL.inicio || agora > NATAL.fim)) return;
      const r = await this.ganha(ar, k, agora);
      if (r) ecoMsg(r.e, { ganho: { k, tic: r.tic, rep: r.rep } });
      return;
    }
    if (m.t === "votar") {
      const op = String(m.op || "");
      if (agora >= VOTACAO.fim || !VOTACAO.ops.some(o => o.id === op)) return responde({ t: "voto", erro: "A votação já terminou." });
      const v = await this.votacao(); const novo = !v.por[ar];
      if (!novo) return responde({ t: "voto", erro: "Você já votou.", res: await this.resumoVotacao(ar) });
      const e = await this.eco(ar); v.por[ar] = op; v.peso[ar] = 1 + Math.max(0, repNivel(e.rep) - 1);
      await this.ctx.storage.put("voto:" + VOTACAO.id, v);
      e.rep += 5; e.tic += 5; e.uma["voto:" + VOTACAO.id] = agora; await this.salvaEco(ar, e);
      const res = await this.resumoVotacao(ar);
      responde({ t: "voto", ok: true, res, peso: v.peso[ar] }); ecoMsg(e);
      this.todos({ t: "votacao", res: Object.assign({}, res, { meu: null }) });
      this.aviso({ t: "aviso", k: "voto", v: op, arroba: ar, em: agora }, ws);
      return;
    }
    if (m.t === "patrulha") {
      if (agora < EVENTO.inicio || agora > EVENTO.fim || agora - (a.pt || 0) < 4000) return;
      a.pt = agora; ws.serializeAttachment(a);
      const v = await this.evento(), dia = diaBR(agora);
      if (v.hoje.dia !== dia) v.hoje = { dia, por: {} };
      const ja = v.hoje.por[ar] || 0, n = Math.max(0, Math.min(m.n === 2 ? 2 : 1, EVENTO.porDia - ja));
      if (!n) return responde({ t: "patrulha", erro: "Você já fez todas as patrulhas de hoje. Volte amanhã!" });
      const antes = v.total; v.total += n; v.hoje.por[ar] = ja + n; v.por[ar] = (v.por[ar] || 0) + n;
      await this.ctx.storage.put("evento:" + EVENTO.id, v);
      const g = await this.ganha(ar, "coleta", agora);
      responde({ t: "patrulha", ok: true, n, meu: v.por[ar] }); if (g) ecoMsg(g.e);
      this.todos({ t: "evento", total: v.total, meta: EVENTO.meta, participantes: Object.keys(v.por).length });
      const marco = [0.25, 0.5, 0.75, 1].find(f => antes < EVENTO.meta * f && v.total >= EVENTO.meta * f);
      if (marco) this.aviso({ t: "aviso", k: "evento", v: String(Math.round(marco * 100)), arroba: ar, em: agora });
      return;
    }
    if (m.t === "casa") {
      if (!(await this.moradoresPorArroba())[ar]) return responde({ t: "casa", erro: "Só os moradores têm casa para melhorar." });
      const c = (await this.ctx.storage.get("casas")) || {}, atual = c[ar] || 0, n = m.n | 0;
      if (n !== atual + 1 || n > 3) return responde({ t: "casa", erro: "Melhoria inválida.", nivel: atual });
      c[ar] = n; await this.ctx.storage.put("casas", c);
      const e = await this.eco(ar); e.rep += 15; await this.salvaEco(ar, e);
      responde({ t: "casa", ok: true, nivel: n }); ecoMsg(e);
      this.todos({ t: "casas", casas: c });
      this.aviso({ t: "aviso", k: "casa", v: String(n), arroba: ar, em: agora }, ws);
      return;
    }
    if (m.t === "oferta") {
      const item = String(m.item || ""), q = Math.max(1, Math.min(10, m.q | 0)), preco = Math.max(1, Math.min(500, m.preco | 0));
      if (!/^[a-z_]{2,24}$/.test(item)) return;
      const e = await this.eco(ar);
      if (repNivel(e.rep) < 2) return responde({ t: "oferta", erro: "Para abrir a sua loja você precisa ser Respeitado (80 de reputação)." });
      const mc = await this.mercado();
      if (mc.ofertas.filter(o => o.a === ar).length >= 4) return responde({ t: "oferta", erro: "Sua loja já tem 4 ofertas. Retire uma para colocar outra." });
      if (mc.ofertas.length >= 200) return responde({ t: "oferta", erro: "A feira está cheia agora. Tente mais tarde." });
      const o = { id: mc.seq++, a: ar, item, q, preco, em: agora }; mc.ofertas.push(o);
      await this.ctx.storage.put("mercado", mc);
      responde({ t: "oferta", ok: true, o }); this.todos({ t: "mercado", n: mc.ofertas.length });
      return;
    }
    if (m.t === "retirar" || m.t === "comprar") {
      const mc = await this.mercado(), i = mc.ofertas.findIndex(o => o.id === (m.id | 0)); if (i < 0) return responde({ t: m.t, erro: "Essa oferta não existe mais." });
      const o = mc.ofertas[i];
      if (m.t === "retirar") {
        if (o.a !== ar) return;
        mc.ofertas.splice(i, 1); await this.ctx.storage.put("mercado", mc);
        return responde({ t: "retirar", ok: true, item: o.item, q: o.q });
      }
      if (o.a === ar) return responde({ t: "comprar", erro: "Essa oferta é sua." });
      const e = await this.eco(ar); if (e.tic < o.preco) return responde({ t: "comprar", erro: "Você não tem TIC suficiente." });
      mc.ofertas.splice(i, 1); await this.ctx.storage.put("mercado", mc);
      e.tic -= o.preco; await this.salvaEco(ar, e);
      const v = await this.eco(o.a); v.tic += o.preco; v.rep += 2; v.vendas = (v.vendas || []).concat({ item: o.item, q: o.q, preco: o.preco, para: ar, em: agora }).slice(-20); await this.salvaEco(o.a, v);
      responde({ t: "comprar", ok: true, item: o.item, q: o.q, de: o.a }); ecoMsg(e);
      this.paraArroba(o.a, Object.assign({ t: "eco" }, this.ecoPub(v), { aviso: `@${ar} comprou ${o.q}x ${o.item} na sua loja: +${o.preco} TIC` }));
      this.todos({ t: "mercado", n: mc.ofertas.length });
      return;
    }
    if (m.t === "equip_compra" || m.t === "equip_forja") {
      const id = String(m.id || ""); if (!EQUIP[id]) return;
      const e = await this.eco(ar); if (e.equip.includes(id)) return responde({ t: "equip", erro: "Você já tem esse equipamento." });
      if (m.t === "equip_compra") { if (e.tic < EQUIP[id]) return responde({ t: "equip", erro: "Você não tem TIC suficiente." }); e.tic -= EQUIP[id]; }
      else if (!EQUIP_FORJA.has(id)) return;
      e.equip.push(id); await this.salvaEco(ar, e);
      responde({ t: "equip", ok: true, id }); ecoMsg(e);
      return;
    }
  }

  async salva(arroba, parte) {
    const k = "j:" + arroba, rec = await this.ctx.storage.get(k);
    if (rec) await this.ctx.storage.put(k, Object.assign(rec, parte));
  }

  async entrar(ws, a, m) {
    if (a.id) return;
    const arroba = limpaArroba(m.arroba);
    const erro = (motivo, extra) => { ws.serializeAttachment(a); this.envia(ws, Object.assign({ t: "erro", motivo }, extra || {})); };
    if (arroba.length < 2) return erro("Digite um @ válido.");
    if (PROIBIDO.some(p => arroba.includes(p)) || (await this.banidos()).has(arroba)) return erro("Esse @ não pode entrar na ilha.");
    const k = "j:" + arroba;
    let rec = await this.ctx.storage.get(k), codigoNovo = null;
    const codigo = String(m.codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^(.{4})(.{4})(.{4})$/, "$1-$2-$3");
    const convite = (await this.reservados())[arroba];
    if (rec && convite) {
      // @ de morador: só o código de convite vale, mesmo que alguém tenha criado um viajante antes
      if (!codigo || (await hash(codigo)) !== convite) {
        a.falhas = (a.falhas || 0) + 1;
        if (a.falhas > 6) { ws.serializeAttachment(a); try { ws.close(4003, "tentativas demais"); } catch (e) { } return; }
        return erro(codigo ? "Código de convite errado." : "Esse @ é de um morador da ilha. Digite o código de convite que o @the_island.lab mandou no seu direct.", { precisaCodigo: true });
      }
      rec.h = convite; rec.morador = true;
    } else if (rec) {
      if (!codigo || (await hash(codigo)) !== rec.h) {
        a.falhas = (a.falhas || 0) + 1;
        if (a.falhas > 6) { ws.serializeAttachment(a); try { ws.close(4003, "tentativas demais"); } catch (e) { } return; }
        return erro(codigo ? "Código de acesso errado." : rec.verificado
          ? "Esse @ já tem dono. O código chegou no direct dele, enviado pelo @the_island.lab."
          : "Esse @ já tem um viajante na ilha. Digite o código de acesso dele.", { precisaCodigo: true });
      }
    } else {
      if (convite) {
        if (!codigo || (await hash(codigo)) !== convite) {
          a.falhas = (a.falhas || 0) + 1;
          if (a.falhas > 6) { ws.serializeAttachment(a); try { ws.close(4003, "tentativas demais"); } catch (e) { } return; }
          return erro(codigo ? "Código de convite errado." : "Esse @ é de um morador da ilha. Digite o código de convite que o @the_island.lab mandou no seu direct.", { precisaCodigo: true });
        }
        rec = { h: convite, look: null, perfil: null, criado: Date.now(), morador: true };
      } else {
        codigoNovo = novoCodigo();
        rec = { h: await hash(codigoNovo), look: null, perfil: null, criado: Date.now() };
      }
    }
    const look = limpaLook(m.look) || rec.look || limpaLook({});
    rec.look = look; rec.visto = Date.now();
    await this.ctx.storage.put(k, rec);
    // o mesmo @ aberto em outro aparelho sai
    for (const [w, b] of this.viajantes()) if (b.arroba === arroba && w !== ws) {
      this.envia(w, { t: "fim", motivo: "Você entrou na ilha por outro aparelho." });
      const velho = b.id; b.id = null; w.serializeAttachment(b); this.todos({ t: "saiu", id: velho }, w);
      try { w.close(4001, "outra sessão"); } catch (e) { }
    }
    a.loja = (await this.ctx.storage.get("loja:" + arroba)) || [];
    // perfil oficial da ilha usa todos os itens da loja
    if (arroba === "the_island.lab") a.loja = ["tricornio", "capa", "asas", "aura", "brasinha", "nome", "moldura", "bandeira"];
    Object.assign(a, { id: crypto.randomUUID().slice(0, 8), arroba, look, x: 392, y: 512, lv: nivel((rec.perfil && rec.perfil.xp) || 0), falhas: 0 });
    ws.serializeAttachment(a);
    const outros = this.viajantes().filter(([w]) => w !== ws).map(([, b]) => this.publico(b));
    const niveis = (await this.ctx.storage.get("niveis")) || {};
    this.envia(ws, { t: "ok", eu: this.publico(a), codigo: codigoNovo, perfil: rec.perfil, outros, niveis, hist: this.hist || [], eco: this.ecoPub(await this.eco(arroba)) });
    this.todos({ t: "entrou", ...this.publico(a) }, ws);
    this.hist = (this.hist || []).concat({ t: "aviso", k: "entrou", arroba, em: Date.now() }).slice(-10);
  }

  async webSocketClose(ws, code, reason) {
    const a = ws.deserializeAttachment() || {};
    if (a.id) this.todos({ t: "saiu", id: a.id }, ws);
    try { ws.close(code, reason); } catch (e) { }
  }

  async webSocketError(ws) {
    const a = ws.deserializeAttachment() || {};
    if (a.id) this.todos({ t: "saiu", id: a.id }, ws);
  }

  // -------------------------------------------------------------------------
  // Código automático pelo Instagram. A cada 5 minutos (cron), lê os comentários
  // dos vídeos recentes do @the_island.lab e responde no direct de cada pessoa
  // (uma vez só) com o código dela. O comentário prova que o @ é dela: o código
  // enviado passa a ser o único que vale para esse @, mesmo que alguém tenha
  // entrado antes com ele. Precisa do segredo IG_TOKEN no Cloudflare.
  // dois tipos de token: "IGAA..." (login do Instagram, graph.instagram.com) e
  // "EAA..." (login unificado / usuário do sistema, graph.facebook.com)
  async ig(caminho, opts) {
    const host = this.igHost || "graph.instagram.com";
    const r = await fetch("https://" + host + "/" + IG_VERSAO + caminho, opts);
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error((j.error && j.error.message) || "HTTP " + r.status);
    return j;
  }
  async tokenInstagram() {
    let t = await this.ctx.storage.get("ig:token");
    if (!t && this.env.IG_TOKEN) t = { valor: this.env.IG_TOKEN, renovado: Date.now() };
    if (!t) return null;
    if (this.env.IG_TOKEN && t.origem !== this.env.IG_TOKEN) t = { valor: this.env.IG_TOKEN, renovado: Date.now(), origem: this.env.IG_TOKEN }; // token novo colado no painel
    if (/^IG/.test(t.valor) && Date.now() - t.renovado > 20 * 864e5) { // token do Instagram dura 60 dias: renova a cada 20
      try {
        const r = await fetch("https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=" + encodeURIComponent(t.valor));
        const j = await r.json();
        if (j.access_token) t = { valor: j.access_token, renovado: Date.now(), origem: t.origem };
      } catch (e) { }
    }
    await this.ctx.storage.put("ig:token", t);
    return t.valor;
  }
  async moradoresPorArroba() {
    const mapa = {};
    try {
      const r = await this.env.ASSETS.fetch(new Request("https://ilha/moradores.js"));
      const txt = await r.text();
      for (const m of txt.matchAll(/arroba: '([^']+)', nome: '([^']+)'/g)) mapa[m[1].toLowerCase()] = m[2];
    } catch (e) { }
    return mapa;
  }
  async verificaInstagram() {
    const st = (await this.ctx.storage.get("ig:status")) || { enviados: 0 };
    st.ultima = Date.now();
    try {
      const token = await this.tokenInstagram();
      if (!token) { st.ativo = false; st.erro = "Falta o segredo IG_TOKEN no Cloudflare."; await this.ctx.storage.put("ig:status", st); return; }
      const auth = { headers: { Authorization: "Bearer " + token } };
      const fb = !/^IG/.test(token);
      this.igHost = fb ? "graph.facebook.com" : "graph.instagram.com";
      st.etapa = "conta";
      const eu = fb ? Object.assign({ user_id: IG_CONTA }, await this.ig("/" + IG_CONTA + "?fields=id,username", auth)) : await this.ig("/me?fields=user_id,username", auth);
      const meuArroba = String(eu.username || "").toLowerCase();
      const moradores = await this.moradoresPorArroba();
      st.etapa = "vídeos";
      const midias = await this.ig((fb ? "/" + IG_CONTA : "/me") + "/media?fields=id,timestamp&limit=8", auth);
      let envios = 0, parou = false;
      for (const md of midias.data || []) {
        if (parou) break;
        if (Date.now() - Date.parse(md.timestamp) > 9 * 864e5) continue;
        st.etapa = "comentários";
        const cs = await this.ig("/" + md.id + "/comments?fields=id,text,timestamp,username,from&limit=50", auth);
        for (const c of cs.data || []) {
          const arroba = limpaArroba((c.from && c.from.username) || c.username);
          if (!arroba || arroba === meuArroba || envios >= 25) continue;
          if (Date.now() - Date.parse(c.timestamp) > 6.5 * 864e5) continue; // a Meta só deixa responder em até 7 dias
          if (await this.ctx.storage.get("dm:" + arroba)) continue;
          const codigo = novoCodigo(), nome = moradores[arroba];
          const texto = `Olá, @${arroba}! 🏝️ Aqui está o seu código para jogar na Grande Ilha: ${codigo}\n\n` +
            (nome ? `Com ele você joga com o seu morador, ${nome}! ` : "Com ele você entra como viajante, anda pela ilha e cumpre missões. ") +
            `Entre em ${SITE}, toque em JOGAR e digite o seu @ e este código. Guarde esta mensagem!`;
          try {
            await this.ig("/" + eu.user_id + "/messages", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ recipient: { comment_id: c.id }, message: { text: texto } }) });
          } catch (e) {
            // a Meta recusou (falta de permissão, limite etc.): para esta rodada e tenta de novo daqui a 5 min,
            // sem marcar a pessoa como atendida
            st.erro = "Mensagem para @" + arroba + ": " + String(e.message).slice(0, 200);
            st.etapa = "mensagens";
            parou = true; break;
          }
          envios++; st.enviados++;
          await this.ctx.storage.put("dm:" + arroba, { t: Date.now(), comentario: c.id });
          // o código enviado no direct passa a valer para esse @ (quem entrou antes com ele sai)
          const k = "j:" + arroba, rec = (await this.ctx.storage.get(k)) || { look: null, perfil: null, criado: Date.now() };
          rec.h = await hash(codigo); rec.verificado = true;
          await this.ctx.storage.put(k, rec);
          for (const [w, b] of this.viajantes()) if (b.arroba === arroba) {
            this.envia(w, { t: "fim", motivo: "O dono deste @ recebeu o código no direct. Entre de novo com o código." });
            const velho = b.id; b.id = null; w.serializeAttachment(b); this.todos({ t: "saiu", id: velho }, w);
            try { w.close(4001, "verificado"); } catch (e) { }
          }
        }
      }
      st.ativo = !parou; st.conta = meuArroba; if (!parou) st.etapa = "ok"; st.tipoToken = fb ? "facebook (usuário do sistema)" : "instagram"; if (envios) st.ultimoEnvio = Date.now();
      if (!parou) delete st.erro;
    } catch (e) {
      st.ativo = false; st.erro = String(e.message).slice(0, 300);
    }
    await this.ctx.storage.put("ig:status", st);
  }
  async statusInstagram() {
    const st = (await this.ctx.storage.get("ig:status")) || {};
    return { ativo: !!st.ativo, tokenNoServidor: !!this.env.IG_TOKEN, conta: st.conta || null, etapa: st.etapa || null, tipoToken: st.tipoToken || null, codigosEnviados: st.enviados || 0, ultimaVerificacao: st.ultima ? new Date(st.ultima).toISOString() : null, ultimoEnvio: st.ultimoEnvio ? new Date(st.ultimoEnvio).toISOString() : null, erro: st.erro || null };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/jogo") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Esta rota é usada pela página da ilha.", { status: 426 });
      }
      const vila = env.VILA.get(env.VILA.idFromName("grande-ilha"));
      return vila.fetch(request);
    }
    if (url.pathname === "/loja/webhook") {
      return env.VILA.get(env.VILA.idFromName("grande-ilha")).fetch(new Request("https://ilha/loja/webhook" + url.search, { method: request.method, headers: request.headers, body: request.method === "POST" ? await request.text() : undefined }));
    }
    if (url.pathname === "/loja/status") return env.VILA.get(env.VILA.idFromName("grande-ilha")).fetch(new Request("https://ilha/loja/status"));
    if (url.pathname === "/loja/bandeiras") return env.VILA.get(env.VILA.idFromName("grande-ilha")).fetch(new Request("https://ilha/loja/bandeiras"));
    if (url.pathname.startsWith("/temporada/")) return env.VILA.get(env.VILA.idFromName("grande-ilha")).fetch(new Request("https://ilha" + url.pathname + url.search));
    if (url.pathname === "/instagram/status" || url.pathname === "/instagram/verificar" || url.pathname === "/comunidade") {
      return env.VILA.get(env.VILA.idFromName("grande-ilha")).fetch(new Request("https://ilha" + url.pathname));
    }
    if (url.pathname === "/ao-vivo") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Esta rota é usada pela página da ilha.", { status: 426 });
      }
      const contador = env.PLATEIA.get(env.PLATEIA.idFromName("grande-ilha"));
      return contador.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
  // a cada 5 minutos: confere os comentários novos no Instagram e manda os códigos
  async scheduled(event, env, ctx) {
    // PAUSADO em 07/11/2026: a Meta restringiu o portfólio empresarial do @the_island.lab.
    // As mensagens automáticas no direct só voltam se a variável IG_AUTOMACAO for "ligado" no Cloudflare.
    if (env.IG_AUTOMACAO !== "ligado") return;
    const vila = env.VILA.get(env.VILA.idFromName("grande-ilha"));
    ctx.waitUntil(vila.fetch(new Request("https://ilha/interno/instagram")));
  },
};
