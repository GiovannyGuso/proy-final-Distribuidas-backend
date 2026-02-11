// src/routes/categories.routes.js
const router = require("express").Router();
const { Category } = require("../models");

// LISTAR
router.get("/", async (req, res, next) => {
  try {
    const items = await Category.findAll({
      order: [["name", "ASC"]],
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});


// CREAR
router.post("/", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "name es requerido" });

    const created = await Category.create({ name });
    res.status(201).json(created);
  } catch (err) {
    // unique violation
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Categoría ya existe" });
    }
    next(err);
  }
});


// ACTUALIZAR
// ACTUALIZAR (GLOBAL)
router.put("/:id", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "name es requerido" });

    const item = await Category.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Categoría no encontrada" });

    item.name = name;
    await item.save();
    res.json(item);
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Categoría ya existe" });
    }
    next(err);
  }
});

// ELIMINAR (GLOBAL)
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Category.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Categoría no encontrada" });
    res.json({ message: "Eliminado" });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
