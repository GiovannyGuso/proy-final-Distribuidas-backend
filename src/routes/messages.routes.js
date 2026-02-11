// src/routes/messages.routes.js
const router = require("express").Router();
const { Op } = require("sequelize");
const { Chat, Message } = require("../models");
const { authRequired } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadBufferToBlob } = require("../services/blob");

// ---- helper: validar miembro del chat ----
async function requireChatMember(chatId, userId) {
  const chat = await Chat.findByPk(chatId);
  if (!chat) return { error: { status: 404, json: { message: "Chat no encontrado" } } };

  const me = Number(userId);
  if (Number(chat.buyer_user_id) !== me && Number(chat.seller_user_id) !== me) {
    return { error: { status: 403, json: { message: "No autorizado para este chat" } } };
  }
  return { chat };
}

// GET /chats/:chatId/messages
router.get("/:chatId/messages", authRequired, async (req, res, next) => {
  try {
    const chatId = Number(req.params.chatId);
    const check = await requireChatMember(chatId, req.user.id);
    if (check.error) return res.status(check.error.status).json(check.error.json);

    const msgs = await Message.findAll({
      where: { chat_id: chatId },
      order: [["created_at", "ASC"]],
    });

    res.json(msgs);
  } catch (err) {
    next(err);
  }
});


// POST /chats/:chatId/messages  (multipart)
// keys: text (opcional) + files (opcional)
router.post("/:chatId/messages", authRequired, upload.any(), async (req, res, next) => {
  try {
    const chatId = Number(req.params.chatId);
    const check = await requireChatMember(chatId, req.user.id);
    if (check.error) return res.status(check.error.status).json(check.error.json);

    if (check.chat.is_blocked) {
      return res.status(410).json({ message: "Chat bloqueado: publicación eliminada" });
    }

    const text = (req.body.text || "").trim();
    const file = req.files && req.files.length ? req.files[0] : null;

    if (!text && !file) {
      return res.status(400).json({ message: "Debes enviar text o un archivo (files)" });
    }

    let imageUrl = null;
    if (file) {
      imageUrl = await uploadBufferToBlob({
        buffer: file.buffer,
        mimeType: file.mimetype,
        filename: (file.originalname || "chat-image.jpg").replace(/\s+/g, "_"),
      });
    }

    const type = text && imageUrl ? "mixed" : imageUrl ? "image" : "text";

    const msg = await Message.create({
      chat_id: chatId,
      sender_user_id: req.user.id,
      type,
      text: text || null,
      image_url: imageUrl,
      delivered_at: null,
      read_at: null,
    });

    check.chat.last_message_at = new Date();
    await check.chat.save();

    // 🔥 Socket: nuevo mensaje
    const io = req.app.get("io");
    console.log("IO EXISTE?", !!io);
    if (io) io.to(`chat_${chatId}`).emit("message:new", msg);

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

// PUT /chats/:chatId/read  -> marca como leídos los mensajes del OTRO
router.put("/:chatId/read", authRequired, async (req, res, next) => {
  try {
    const chatId = Number(req.params.chatId);
    const check = await requireChatMember(chatId, req.user.id);
    if (check.error) return res.status(check.error.status).json(check.error.json);

    await Message.update(
      { read_at: new Date() },
      {
        where: {
          chat_id: chatId,
          sender_user_id: { [Op.ne]: req.user.id },
          read_at: null,
        },
      }
    );

    // Socket: leído (para checks azules)
    const io = req.app.get("io");
    if (io) io.to(`chat_${chatId}`).emit("messages:read", { chatId, readerId: req.user.id });

    res.json({ message: "Mensajes marcados como leídos" });
  } catch (err) {
    next(err);
  }
});

// PUT /chats/:chatId/messages/:messageId/delivered
router.put("/:chatId/messages/:messageId/delivered", authRequired, async (req, res, next) => {
  try {
    const chatId = Number(req.params.chatId);
    const messageId = Number(req.params.messageId);

    const check = await requireChatMember(chatId, req.user.id);
    if (check.error) return res.status(check.error.status).json(check.error.json);

    const msg = await Message.findOne({ where: { id: messageId, chat_id: chatId } });
    if (!msg) return res.status(404).json({ message: "Mensaje no encontrado" });

    // No te marques delivered a ti mismo
    if (Number(msg.sender_user_id) === Number(req.user.id)) return res.json({ ok: true });

    if (!msg.delivered_at) {
      msg.delivered_at = new Date();
      await msg.save();

      const io = req.app.get("io");
      if (io) {
        io.to(`chat_${chatId}`).emit("message:delivered", {
          chatId,
          messageId,
          delivered_at: msg.delivered_at,
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;