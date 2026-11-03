import { io } from "socket.io-client";
import { getSocketBaseUrl, resolveApiBaseUrl } from "../config/apiUrl.js";

const apiBaseUrl = resolveApiBaseUrl(
  import.meta.env.VITE_API_URL || (import.meta.env.DEV && "http://localhost:5000/api"),
  {
    isProduction: import.meta.env.PROD,
  }
);
const socketURL = getSocketBaseUrl(
  apiBaseUrl,
  typeof window === "undefined" ? undefined : window.location.origin
);

let chatSocket;

export const connectChatSocket = () => {
  if (!chatSocket) {
    chatSocket = io(socketURL, { withCredentials: true, autoConnect: false });
    chatSocket.on("connect_error", (error) => {
      console.warn("Chat socket connection failed:", error.message);
    });
  }
  if (!chatSocket.connected) chatSocket.connect();
  return chatSocket;
};

export const getChatSocket = () => chatSocket;

export const disconnectChatSocket = () => {
  chatSocket?.disconnect();
  chatSocket = null;
};
