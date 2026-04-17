import { approveAll } from "@github/copilot-sdk";
import { getCopilotClient } from "./copilot.js";

function safeSend(ws, payload) {
  if (ws.readyState !== ws.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch (err) {
    console.error("[ws] send failed:", err);
  }
}

export async function handleConnection(ws, req) {
  const remote = req?.socket?.remoteAddress ?? "unknown";
  console.log(`[ws] connection opened from ${remote}`);

  let session = null;

  try {
    const client = await getCopilotClient();
    session = await client.createSession({
      model: "gpt-5",
      onPermissionRequest: approveAll,
    });

    session.on("assistant.message_delta", (event) => {
      const content = event?.data?.deltaContent;
      if (content === undefined || content === null) return;
      safeSend(ws, { type: "delta", content });
    });

    session.on("session.idle", () => {
      safeSend(ws, { type: "done" });
    });
  } catch (err) {
    console.error("[ws] failed to create Copilot session:", err);
    safeSend(ws, { type: "error", message: "Failed to initialize Copilot session." });
    try { ws.close(); } catch {}
    return;
  }

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (err) {
      console.error("[ws] invalid JSON:", err);
      safeSend(ws, { type: "error", message: "Invalid JSON payload." });
      return;
    }

    if (!msg || msg.type !== "message" || typeof msg.content !== "string") {
      safeSend(ws, { type: "error", message: "Unsupported message format." });
      return;
    }

    console.log(`[ws] message received (${msg.content.length} chars)`);

    try {
      await session.send({ prompt: msg.content });
    } catch (err) {
      console.error("[ws] session.send failed:", err);
      safeSend(ws, { type: "error", message: String(err?.message ?? err) });
    }
  });

  ws.on("close", async () => {
    console.log(`[ws] connection closed (${remote})`);
    if (session) {
      try {
        await session.disconnect();
      } catch (err) {
        console.error("[ws] session.disconnect failed:", err);
      }
    }
  });

  ws.on("error", (err) => {
    console.error("[ws] socket error:", err);
  });
}
