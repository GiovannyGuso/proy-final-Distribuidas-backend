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

// ---- helper: obtener el otro participante ----
function getOtherUserId(chat, me) {
  const buyerId = Number(chat.buyer_user_id);
  const sellerId = Number(chat.seller_user_id);
  return me === buyerId ? sellerId : buyerId;
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

    // ✅ WhatsApp-like: emitir al room del chat + al room del usuario receptor
    const io = req.app.get("io");
    const me = Number(req.user.id);
    const receiverId = getOtherUserId(check.chat, me);

    console.log("IO EXISTE?", !!io);
    if (io) {
      // si el chat está abierto en pantalla (join_chat), llega por aquí:
      io.to(`chat_${chatId}`).emit("message:new", msg);

      // si el receptor NO está en el chat abierto, igual debe llegarle:
      io.to(`user_${receiverId}`).emit("message:new", msg);
      io.to(`chat_${chatId}`).emit("message:deleted", { chatId, messageId });


      // (opcional recomendado) si el emisor está en otra pantalla, también:
      io.to(`user_${me}`).emit("message:new", msg);

      // ✅ (opcional) marcar delivered automáticamente si el receptor está "online"
      // requiere que en socket.js hayas definido io.isUserOnline(userId)
      if (typeof io.isUserOnline === "function" && io.isUserOnline(receiverId)) {
        if (!msg.delivered_at) {
          msg.delivered_at = new Date();
          await msg.save();

          // notificar delivered al chat y al emisor (para ✅✅ gris aunque no esté en el chat)
          io.to(`chat_${chatId}`).emit("message:delivered", {
            chatId,
            messageId: msg.id,
            delivered_at: msg.delivered_at,
          });
          io.to(`user_${me}`).emit("message:delivered", {
            chatId,
            messageId: msg.id,
            delivered_at: msg.delivered_at,
          });
        }
      }
    }

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

    const me = Number(req.user.id);

    await Message.update(
      { read_at: new Date() },
      {
        where: {
          chat_id: chatId,
          sender_user_id: { [Op.ne]: me },
          read_at: null,
        },
      }
    );

    // ✅ notificar "read" al room del chat y al usuario emisor (para ✅✅ azul aunque no esté en el chat)
    const io = req.app.get("io");
    const otherId = getOtherUserId(check.chat, me);

    if (io) {
      io.to(`chat_${chatId}`).emit("messages:read", { chatId, readerId: req.user.id });

      // el que debe ver el azul es el OTRO (quien envió mensajes), así que avisamos a su user room:
      io.to(`user_${otherId}`).emit("messages:read", { chatId, readerId: req.user.id });
    }

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
        // chat room (si alguien está dentro del chat)
        io.to(`chat_${chatId}`).emit("message:delivered", {
          chatId,
          messageId,
          delivered_at: msg.delivered_at,
        });

        // ✅ avisar también al emisor aunque NO esté en el chat
        io.to(`user_${msg.sender_user_id}`).emit("message:delivered", {
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
// ✅ DELETE /chats/:chatId/messages/:messageId  -> borrar 1 mensaje (solo el dueño)
router.delete("/:chatId/messages/:messageId", authRequired, async (req, res, next) => {
  try {
    const chatId = Number(req.params.chatId);
    const messageId = Number(req.params.messageId);

    const check = await requireChatMember(chatId, req.user.id);
    if (check.error) return res.status(check.error.status).json(check.error.json);

    const msg = await Message.findOne({ where: { id: messageId, chat_id: chatId } });
    if (!msg) return res.status(404).json({ message: "Mensaje no encontrado" });

    // ✅ Solo el que lo envió puede borrar (WhatsApp-style simple)
    if (Number(msg.sender_user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "No puedes eliminar mensajes de otro usuario" });
    }

    await msg.destroy();

    // ✅ Socket: avisar a ambos para removerlo de la UI
    // ✅ Socket: avisar a ambos para removerlo de la UI (chat room + user rooms)
    const io = req.app.get("io");
    if (io) {
      const me = Number(req.user.id);
      const otherId = getOtherUserId(check.chat, me);

      io.to(`chat_${chatId}`).emit("message:deleted", { chatId, messageId });

      // ✅ si no están dentro del chat abierto, igual se enteran
      io.to(`user_${me}`).emit("message:deleted", { chatId, messageId });
      io.to(`user_${otherId}`).emit("message:deleted", { chatId, messageId });
    }


    return res.json({ ok: true, chatId, messageId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;