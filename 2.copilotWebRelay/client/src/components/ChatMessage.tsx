import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessageData } from "../types";

interface Props {
  message: ChatMessageData;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className="chat-message__bubble">
        {isUser ? (
          <div className="chat-message__text">{message.content}</div>
        ) : (
          <div className="chat-message__markdown">
            {message.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            ) : (
              <span className="chat-message__typing">
                <span />
                <span />
                <span />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
