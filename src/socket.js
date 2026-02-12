// src/socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
  });

  // userId -> Set(socketId)
  const onlineUsers = new Map();

  function addOnline(userId, socketId) {
    const key = String(userId);
    if (!onlineUsers.has(key)) onlineUsers.set(key, new Set());
    onlineUsers.get(key).add(socketId);
  }

  function removeOnline(userId, socketId) {
    const key = String(userId);
    const set = onlineUsers.get(key);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) onlineUsers.delete(key);
  }

  function isUserOnline(userId) {
    const set = onlineUsers.get(String(userId));
    return !!set && set.size > 0;
  }

  // ✅ Autenticación de socket con JWT
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
        socket.handshake.query?.token;

      if (!token) return next(new Error("No token"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.id };
      return next();
    } catch (e) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user?.id);
    console.log("🔌 Socket conectado:", socket.id, "user:", userId);

    // ✅ Room por usuario (clave para WhatsApp)
    socket.join(`user_${userId}`);
    addOnline(userId, socket.id);

    socket.on("join_chat", (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket desconectado:", socket.id, "reason:", reason);
      removeOnline(userId, socket.id);
    });
  });

  // ✅ helper usable desde rutas
  io.isUserOnline = isUserOnline;

  return io;
}

module.exports = { setupSocket };
