import { useRef, useState, type KeyboardEvent } from "react";

interface Props {
  disabled: boolean;
  onSend: (content: string) => void;
}

export function ChatInput({ disabled, onSend }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="chat-input">
      <textarea
        ref={textareaRef}
        className="chat-input__textarea"
        placeholder={
          disabled ? "応答を待機中..." : "メッセージを入力 (Shift+Enter で改行)"
        }
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
      />
      <button
        type="button"
        className="chat-input__button"
        onClick={submit}
        disabled={disabled || value.trim().length === 0}
      >
        送信
      </button>
    </div>
  );
}
