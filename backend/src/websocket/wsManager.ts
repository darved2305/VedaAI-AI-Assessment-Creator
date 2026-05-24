import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";

interface WSMessage {
  type: "job_update";
  assignmentId: string;
  status: "queued" | "processing" | "done" | "failed";
  paperId?: string;
  error?: string;
}

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("close", () => console.log("WebSocket client disconnected"));
    ws.on("error", (err) => console.error("WebSocket error:", err));

    ws.send(JSON.stringify({ type: "connected" }));
  });

  console.log("WebSocket server initialised at /ws");
}

export function broadcastJobUpdate(payload: WSMessage): void {
  if (!wss) return;

  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
