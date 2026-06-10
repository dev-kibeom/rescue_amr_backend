export const SignalType = Object.freeze({
  REGISTER: "register",
  SESSION_CREATE: "session_create",
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice_candidate",
  CALL_START: "call_start",
  CALL_END: "call_end",
  HEARTBEAT: "heartbeat",
  RECONNECT: "reconnect",
  STATUS: "status",
  ERROR: "error",
});

export function defaultVoiceWsBase() {
  if (import.meta.env.VITE_VOICE_WS_URL) {
    return import.meta.env.VITE_VOICE_WS_URL.replace(/\/$/, "");
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname || "127.0.0.1";
  return `${protocol}//${hostname}:8000`;
}

export class SignalingClient {
  constructor({ url, onOpen, onClose, onMessage, onError }) {
    this.url = url;
    this.socket = null;
    this.heartbeatTimer = null;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onMessage = onMessage;
    this.onError = onError;
  }

  connect() {
    this.disconnect();
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener("open", () => {
      this.send({ type: SignalType.REGISTER });
      this.heartbeatTimer = window.setInterval(() => {
        this.send({ type: SignalType.HEARTBEAT });
      }, 5000);
      this.onOpen?.();
    });

    this.socket.addEventListener("message", (event) => {
      try {
        this.onMessage?.(JSON.parse(event.data));
      } catch (error) {
        this.onError?.(`Invalid JSON message: ${error.message}`);
      }
    });

    this.socket.addEventListener("close", () => {
      this.clearHeartbeat();
      this.onClose?.();
    });

    this.socket.addEventListener("error", () => {
      this.onError?.("Voice signaling WebSocket error");
    });
  }

  disconnect() {
    this.clearHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.onError?.("Voice signaling is not connected");
      return false;
    }
    this.socket.send(JSON.stringify(message));
    return true;
  }

  clearHeartbeat() {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
