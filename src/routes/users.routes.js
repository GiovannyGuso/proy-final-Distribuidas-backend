// src/routes/users.routes.js
const router = require("express").Router();
const { User } = require("../models");
const { authRequired } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadBufferToBlob } = require("../services/blob");

// ✅ GET /users/me
router.get("/me", authRequired, async (req, res) => {
  try {
    const meId = Number(req.user.id);

    const user = await User.findByPk(meId, {
      attributes: [
        "id",
        "email",
        "full_name",
        "first_name",
        "last_name",
        "birth_day",
        "birth_month",
        "birth_year",
        "sex",
        "avatar_url",
        "description", // ✅ nuevo
      ],
    });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

// ✅ PUT /users/me
router.put("/me", authRequired, async (req, res) => {
  try {
    const meId = Number(req.user.id);

    const user = await User.findByPk(meId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const first_name = (req.body.first_name || "").trim();
    const last_name = (req.body.last_name || "").trim();

    const birth_day = Number(req.body.birth_day);
    const birth_month = Number(req.body.birth_month);
    const birth_year = Number(req.body.birth_year);

    const sex = String(req.body.sex || "").trim();
    const description = String(req.body.description ?? "").trim(); // ✅ nuevo

    if (!first_name) return res.status(400).json({ message: "first_name es requerido" });
    if (!last_name) return res.status(400).json({ message: "last_name es requerido" });

    if (!Number.isInteger(birth_day) || birth_day < 1 || birth_day > 31) {
      return res.status(400).json({ message: "birth_day inválido (1-31)" });
    }
    if (!Number.isInteger(birth_month) || birth_month < 1 || birth_month > 12) {
      return res.status(400).json({ message: "birth_month inválido (1-12)" });
    }

    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(birth_year) || birth_year < 1900 || birth_year > currentYear) {
      return res.status(400).json({ message: `birth_year inválido (1900-${currentYear})` });
    }

    const allowedSex = new Set(["female", "male", "na"]);
    if (!allowedSex.has(sex)) {
      return res.status(400).json({ message: "sex inválido (female|male|na)" });
    }

    if (description.length > 500) {
      return res.status(400).json({ message: "description demasiado larga (máx 500)" });
    }

    user.first_name = first_name;
    user.last_name = last_name;
    user.birth_day = birth_day;
    user.birth_month = birth_month;
    user.birth_year = birth_year;
    user.sex = sex;
    user.description = description || null; // ✅

    user.full_name = `${first_name} ${last_name}`.trim();

    await user.save();

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      first_name: user.first_name,
      last_name: user.last_name,
      birth_day: user.birth_day,
      birth_month: user.birth_month,
      birth_year: user.birth_year,
      sex: user.sex,
      avatar_url: user.avatar_url || null,
      description: user.description || null,
    });
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

// ✅ GET /users/:id/public  (para modal del chat)
router.get("/:id/public", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id inválido" });

    const u = await User.findByPk(id, {
      attributes: ["id", "full_name", "first_name", "last_name", "avatar_url", "description"],
    });

    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(u);
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

// ✅ POST /users/me/avatar
router.post("/me/avatar", authRequired, upload.single("file"), async (req, res) => {
  try {
    const meId = Number(req.user.id);

    const user = await User.findByPk(meId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const file = req.file;
    if (!file) return res.status(400).json({ message: "Debes enviar un archivo (file)" });

    const url = await uploadBufferToBlob({
      buffer: file.buffer,
      mimeType: file.mimetype,
      filename: (file.originalname || "avatar.jpg").replace(/\s+/g, "_"),
    });

    user.avatar_url = url;
    await user.save();

    res.json({ avatar_url: user.avatar_url });
  } catch (err) {
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
});

module.exports = router;