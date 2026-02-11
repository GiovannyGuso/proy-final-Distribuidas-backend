const { Server } = require("socket.io");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // 🔥 para demo. Luego puedes poner tu dominio exacto
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"], // 🔥 importante en producción
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket conectado:", socket.id);

    socket.on("join_chat", (chatId) => {
      console.log("JOIN room chat_", chatId, "socket:", socket.id);
      socket.join(`chat_${chatId}`);
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket desconectado:", socket.id, "reason:", reason);
    });
  });

  return io;
}

module.exports = { setupSocket };
