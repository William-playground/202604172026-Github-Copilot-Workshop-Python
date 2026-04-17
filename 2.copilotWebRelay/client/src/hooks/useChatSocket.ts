import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ConnectionStatus, ServerMessage } from "../types";

const WS_URL = "ws://localhost:3001/ws";
const RECONNECT_DELAY_MS = 2000;

interface UseChatSocketOptions {
  onMessage: (msg: ServerMessage) => void;
}

interface UseChatSocketResult {
  status: ConnectionStatus;
  send: (content: string) => boolean;
}

export function useChatSocket({
  onMessage,
}: UseChatSocketOptions): UseChatSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const closedByUnmountRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    closedByUnmountRef.current = false;

    const connect = () => {
      setStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        setStatus("connected");
      });

      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data as string) as ServerMessage;
          onMessageRef.current(data);
        } catch (err) {
          console.error("Failed to parse server message", err);
        }
      });

      ws.addEventListener("close", () => {
        setStatus("disconnected");
        wsRef.current = null;
        if (!closedByUnmountRef.current) {
          reconnectTimerRef.current = window.setTimeout(
            connect,
            RECONNECT_DELAY_MS,
          );
        }
      });

      ws.addEventListener("error", () => {
        // close ハンドラで再接続されるので、ここでは閉じるだけ
        try {
          ws.close();
        } catch {
          /* noop */
        }
      });
    };

    connect();

    return () => {
      closedByUnmountRef.current = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          /* noop */
        }
        wsRef.current = null;
      }
    };
  }, []);

  const send = useCallback((content: string): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    const msg: ClientMessage = { type: "message", content };
    ws.send(JSON.stringify(msg));
    return true;
  }, []);

  return { status, send };
}
