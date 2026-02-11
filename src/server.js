//src/server.js
require("dotenv").config();
const http = require("http");
const app = require("./app");
const { setupSocket } = require("./socket");
const sequelize = require("./config/db");

// carga modelos + asociaciones
require("./models");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("BD conectada");

    await sequelize.sync();
    console.log("Modelos sincronizados");

    const server = http.createServer(app);
    const io = setupSocket(server);

    app.set("io", io);

    server.listen(PORT, () => {
      console.log(`API + Socket corriendo en http://192.168.100.100:${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar:", error);
    process.exit(1);
  }
}

start();
