export type ClientMessage = {
  type: "message";
  content: string;
};

export type ServerDelta = {
  type: "delta";
  content: string;
};

export type ServerDone = {
  type: "done";
};

export type ServerError = {
  type: "error";
  message: string;
};

export type ServerMessage = ServerDelta | ServerDone | ServerError;

export type ChatRole = "user" | "assistant";

export interface ChatMessageData {
  id: string;
  role: ChatRole;
  content: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
