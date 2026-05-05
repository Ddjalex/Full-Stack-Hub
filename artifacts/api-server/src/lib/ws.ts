import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { logger } from "./logger";

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (socket) => {
    logger.info("WebSocket client connected");

    socket.on("close", () => {
      logger.info("WebSocket client disconnected");
    });

    socket.on("error", (err) => {
      logger.warn({ err }, "WebSocket error");
    });
  });

  logger.info("WebSocket server initialised at /api/ws");
  return wss;
}

export function broadcastLeadEvent(payload: {
  type: "new_lead";
  lead: {
    id: number;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
    source: string | null;
    createdAt: string;
  };
}): void {
  if (!wss) return;

  const message = JSON.stringify(payload);
  let sent = 0;

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  }

  if (sent > 0) {
    logger.info({ sent, leadId: payload.lead.id }, "Broadcast new_lead to clients");
  }
}
