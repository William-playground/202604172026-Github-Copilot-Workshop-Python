import { CopilotClient } from "@github/copilot-sdk";

let clientPromise = null;
let client = null;

export async function getCopilotClient() {
  if (client) return client;
  if (!clientPromise) {
    const c = new CopilotClient();
    clientPromise = c.start().then(() => {
      client = c;
      return c;
    }).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export async function stopCopilotClient() {
  if (client) {
    try {
      await client.stop();
    } catch (err) {
      console.error("[copilot] client.stop() failed:", err);
    }
    client = null;
    clientPromise = null;
  }
}
