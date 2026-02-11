const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

// cuando conecta
socket.on("connect", () => {
  console.log("✅ Conectado al socket:", socket.id);

  // unirse al chat 1
  socket.emit("join_chat", 1);
  console.log("🟢 Unido al chat 1");
});

// escuchar mensajes nuevos
socket.on("new_message", (msg) => {
  console.log("📩 NUEVO MENSAJE:", msg);
});
