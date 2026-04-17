import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer } from "ws";
import { getCopilotClient, stopCopilotClient } from "./copilot.js";
import { handleConnection } from "./wsHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3001);

const app = express();

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  console.log(`[http] serving static client from ${clientDist}`);
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/ws") || req.path.startsWith("/healthz")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  handleConnection(ws, req).catch((err) => {
    console.error("[ws] handler crashed:", err);
    try { ws.close(); } catch {}
  });
});

getCopilotClient().catch((err) => {
  console.error("[copilot] initial start() failed (will retry on first connection):", err?.message ?? err);
});

server.listen(PORT, () => {
  console.log(`[http] listening on http://localhost:${PORT}`);
  console.log(`[ws] endpoint: ws://localhost:${PORT}/ws`);
});

async function shutdown(signal) {
  console.log(`[server] received ${signal}, shutting down...`);
  try {
    wss.clients.forEach((ws) => { try { ws.close(); } catch {} });
    wss.close();
    server.close();
    await stopCopilotClient();
  } catch (err) {
    console.error("[server] shutdown error:", err);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
