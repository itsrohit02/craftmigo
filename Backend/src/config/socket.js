import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { isAllowedOrigin } from "./allowedOrigins.js";

let io;
const onlineSockets = new Map();
const conversationRoom = (conversationId) => `conversation:${String(conversationId)}`;

const getCookie = (cookieHeader, name) => {
  const value = cookieHeader?.split(";").find((part) => part.trim().startsWith(`${name}=`));
  return value ? decodeURIComponent(value.trim().slice(name.length + 1)) : null;
};

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getCookie(socket.handshake.headers.cookie, "accessToken");
      if (!token) return next(new Error("Unauthorized socket connection"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded._id).select("_id isBlocked isActive");
      if (!user || user.isBlocked || !user.isActive) return next(new Error("Unauthorized socket connection"));

      socket.userId = String(user._id);
      next();
    } catch {
      next(new Error("Unauthorized socket connection"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    const sockets = onlineSockets.get(socket.userId) || new Set();
    const isFirstConnection = sockets.size === 0;
    sockets.add(socket.id);
    onlineSockets.set(socket.userId, sockets);

    if (isFirstConnection) {
      for (const connectedSocket of io.sockets.sockets.values()) {
        if (connectedSocket.id === socket.id || connectedSocket.userId !== socket.userId) continue;
        for (const room of connectedSocket.rooms) {
          if (room.startsWith("conversation:")) {
            io.to(room).emit("presence:update", { userId: socket.userId, isOnline: true });
          }
        }
      }
    }

    socket.on("conversation:join", async (conversationId, acknowledge = () => {}) => {
      try {
        if (typeof conversationId !== "string" || !/^[a-f\d]{24}$/i.test(conversationId)) {
          return acknowledge({ success: false });
        }
        const conversation = await Conversation.findById(conversationId).select("participants status requestedBy");
        const isParticipant = conversation?.participants.some((participant) => String(participant) === socket.userId);
        if (
          !conversation ||
          !isParticipant ||
          (conversation.status !== "accepted" && String(conversation.requestedBy) !== socket.userId)
        ) {
          return acknowledge({ success: false });
        }

        const otherParticipantId = conversation.participants.find(
          (participant) => String(participant) !== socket.userId
        );
        const room = conversationRoom(conversationId);
        await socket.join(room);
        socket.emit("presence:update", {
          userId: String(otherParticipantId),
          isOnline: (onlineSockets.get(String(otherParticipantId))?.size || 0) > 0,
        });
        socket.to(room).emit("presence:update", { userId: socket.userId, isOnline: true });
        acknowledge({ success: true });
      } catch (error) {
        console.error("Socket conversation authorization failed:", error.message);
        acknowledge({ success: false });
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      if (typeof conversationId !== "string") return;
      const room = conversationRoom(conversationId);
      socket.to(room).emit("typing:update", {
        conversationId,
        userId: socket.userId,
        isTyping: false,
      });
      socket.leave(room);
    });

    socket.on("typing:update", ({ conversationId, isTyping } = {}) => {
      if (typeof conversationId !== "string" || typeof isTyping !== "boolean") return;
      const room = conversationRoom(conversationId);
      if (!socket.rooms.has(room)) return;
      socket.to(room).emit("typing:update", { conversationId, userId: socket.userId, isTyping });
    });

    socket.on("disconnecting", () => {
      const userSockets = onlineSockets.get(socket.userId);
      if (!userSockets) return;
      userSockets.delete(socket.id);
      if (userSockets.size > 0) return;
      onlineSockets.delete(socket.userId);

      for (const room of socket.rooms) {
        if (room.startsWith("conversation:")) {
          io.to(room).emit("presence:update", { userId: socket.userId, isOnline: false });
          io.to(room).emit("typing:update", {
            conversationId: room.slice("conversation:".length),
            userId: socket.userId,
            isTyping: false,
          });
        }
      }
    });
  });

  return io;
};

export const emitToUser = (userId, event, payload = {}) => {
  if (io) io.to(`user:${String(userId)}`).emit(event, payload);
};
