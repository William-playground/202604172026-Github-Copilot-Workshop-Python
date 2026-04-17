import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { ChatInput } from "./components/ChatInput";
import { ChatMessage } from "./components/ChatMessage";
import { useChatSocket } from "./hooks/useChatSocket";
import type { ChatMessageData, ServerMessage } from "./types";

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleServerMessage = useCallback((msg: ServerMessage) => {
    if (msg.type === "delta") {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant") {
          const updated: ChatMessageData = {
            ...last,
            content: last.content + msg.content,
          };
          return [...prev.slice(0, -1), updated];
        }
        return [
          ...prev,
          { id: genId(), role: "assistant", content: msg.content },
        ];
      });
    } else if (msg.type === "done") {
      setIsStreaming(false);
    } else if (msg.type === "error") {
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          role: "assistant",
          content: `⚠️ Error: ${msg.message}`,
        },
      ]);
      setIsStreaming(false);
    }
  }, []);

  const { status, send } = useChatSocket({ onMessage: handleServerMessage });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    const ok = send(content);
    if (!ok) {
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          role: "assistant",
          content: "⚠️ Error: サーバーに接続されていません",
        },
      ]);
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "user", content },
      { id: genId(), role: "assistant", content: "" },
    ]);
    setIsStreaming(true);
  };

  const statusLabel =
    status === "connected"
      ? "接続中"
      : status === "connecting"
        ? "接続試行中..."
        : "切断";

  const inputDisabled = isStreaming || status !== "connected";

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Copilot Web Relay</h1>
        <div className={`app__status app__status--${status}`}>
          <span className="app__status-dot" />
          <span className="app__status-label">{statusLabel}</span>
        </div>
      </header>

      <main className="app__main" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="app__empty">
            <p>メッセージを送信して Copilot と会話を始めましょう。</p>
          </div>
        ) : (
          <div className="app__messages">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
          </div>
        )}
      </main>

      <footer className="app__footer">
        <ChatInput disabled={inputDisabled} onSend={handleSend} />
      </footer>
    </div>
  );
}
