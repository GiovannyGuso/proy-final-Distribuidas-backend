const { Server } = require("socket.io");

function setupSocket(server) {
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("Socket conectado:", socket.id);

    socket.on("join_chat", (chatId) => {
      console.log("JOIN room chat_", chatId, "socket:", socket.id);
      socket.join(`chat_${chatId}`);
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket desconectado:", socket.id);
    });
  });

  return io;
}

module.exports = { setupSocket };
