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

    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync();
      console.log("Modelos sincronizados (dev)");
    } else {
      console.log("Producción: sync deshabilitado");
    }

    const server = http.createServer(app);
    const io = setupSocket(server);

    app.set("io", io);

    server.listen(PORT, () => {
      console.log(`API + Socket corriendo en ${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar:", error);
    process.exit(1);
  }
}

start();
