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
const limpaArroba = s => String(s || '').trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 30);
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
function limpaPerfil(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const s = JSON.stringify(p);
  if (s.length > 6000) return null;
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
    if (rota === "/interno/instagram") { await this.verificaInstagram(); return new Response("ok"); }
    if (rota === "/instagram/status") return Response.json(await this.statusInstagram(), { headers: { "cache-control": "no-store" } });
    if (this.viajantes().length >= MAX_VIAJANTES) return new Response("A ilha está cheia agora.", { status: 503 });
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({});
    return new Response(null, { status: 101, webSocket: client });
  }

  viajantes() { return this.ctx.getWebSockets().map(ws => [ws, ws.deserializeAttachment() || {}]).filter(([, a]) => a.id); }
  envia(ws, m) { try { ws.send(JSON.stringify(m)); } catch (e) { } }
  todos(m, exceto) { const s = JSON.stringify(m); for (const [ws] of this.viajantes()) if (ws !== exceto) { try { ws.send(s); } catch (e) { } } }
  publico(a) { return { id: a.id, arroba: a.arroba, look: a.look, x: a.x, y: a.y, lv: a.lv || 1 }; }

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
    } else if (m.t === "perfil") {
      const p = limpaPerfil(m.perfil);
      if (p && agora - (a.st || 0) > 3000) {
        a.st = agora;
        const lv = nivel(p.xp);
        if (lv !== a.lv) { a.lv = lv; this.todos({ t: "lv", id: a.id, lv }, ws); }
        await this.salva(a.arroba, { perfil: p });
      }
    }
    ws.serializeAttachment(a);
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
    Object.assign(a, { id: crypto.randomUUID().slice(0, 8), arroba, look, x: 392, y: 512, lv: nivel((rec.perfil && rec.perfil.xp) || 0), falhas: 0 });
    ws.serializeAttachment(a);
    const outros = this.viajantes().filter(([w]) => w !== ws).map(([, b]) => this.publico(b));
    this.envia(ws, { t: "ok", eu: this.publico(a), codigo: codigoNovo, perfil: rec.perfil, outros });
    this.todos({ t: "entrou", ...this.publico(a) }, ws);
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
    return { ativo: !!st.ativo, conta: st.conta || null, etapa: st.etapa || null, tipoToken: st.tipoToken || null, codigosEnviados: st.enviados || 0, ultimaVerificacao: st.ultima ? new Date(st.ultima).toISOString() : null, ultimoEnvio: st.ultimoEnvio ? new Date(st.ultimoEnvio).toISOString() : null, erro: st.erro || null };
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
    if (url.pathname === "/instagram/status") {
      return env.VILA.get(env.VILA.idFromName("grande-ilha")).fetch(new Request("https://ilha/instagram/status"));
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
    const vila = env.VILA.get(env.VILA.idFromName("grande-ilha"));
    ctx.waitUntil(vila.fetch(new Request("https://ilha/interno/instagram")));
  },
};
