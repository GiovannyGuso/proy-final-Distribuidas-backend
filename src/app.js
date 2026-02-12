//src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/auth.routes");
const categoriesRoutes = require("./routes/categories.routes");
const listingsRoutes = require("./routes/listings.routes");
const favoritesRoutes = require("./routes/favorites.routes");
const commentsRoutes = require("./routes/comments.routes");
const ratingsRoutes = require("./routes/ratings.routes");
const listingImagesRoutes = require("./routes/listing-images.routes");
const chatsRoutes = require("./routes/chats.routes");
const messagesRoutes = require("./routes/messages.routes");
const usersRoutes = require("./routes/users.routes");


// ✅ luego agregaremos chats.routes y messages.routes
// const chatsRoutes = require("./routes/chats.routes");
// const messagesRoutes = require("./routes/messages.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.get("/", (req, res) => res.json({ status: "OK", name: "API" }));
app.get("/health", (req, res) => res.json({ status: "OK" }));

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/categories", categoriesRoutes);
app.use("/listings", listingsRoutes);
app.use("/listings", listingImagesRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/comments", commentsRoutes);
app.use("/ratings", ratingsRoutes);
app.use("/chats", chatsRoutes);
app.use("/chats", messagesRoutes); // así quedan /chats/:chatId/messages
app.use("/chats", require("./routes/chats.routes"));


app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({
    message: "Internal error",
    detail: err.message,
    sql: err.sql || null,
  });
});

module.exports = app;
