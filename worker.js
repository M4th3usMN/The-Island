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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ao-vivo") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Esta rota é usada pela página da ilha.", { status: 426 });
      }
      const contador = env.PLATEIA.get(env.PLATEIA.idFromName("grande-ilha"));
      return contador.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};
