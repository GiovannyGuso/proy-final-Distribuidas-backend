const router = require("express").Router();
const { Product, Category, Provider } = require("../models");

// LISTAR
router.get("/", async (req, res) => {
  const items = await Product.findAll({
    where: { user_id: req.user.id },
    include: [
      { model: Category, attributes: ["id", "name"] },
      { model: Provider, attributes: ["id", "name", "latitude", "longitude"] }
    ],
    order: [["id", "DESC"]]
  });
  res.json(items);
});

// CREAR
router.post("/", async (req, res) => {
  const { sku, name, description, price, stock, min_stock, category_id, provider_id, image_url, is_active } = req.body;
  if (!name) return res.status(400).json({ message: "name es requerido" });

  const created = await Product.create({
    user_id: req.user.id,
    sku: sku ?? null,
    name,
    description: description ?? null,
    price: price ?? 0,
    stock: stock ?? 0,
    min_stock: min_stock ?? 5,
    category_id: category_id ?? null,
    provider_id: provider_id ?? null,
    image_url: image_url ?? null,
    is_active: is_active ?? true
  });

  res.status(201).json(created);
});

// DETALLE
router.get("/:id", async (req, res) => {
  const item = await Product.findOne({
    where: { id: req.params.id, user_id: req.user.id },
    include: [
      { model: Category, attributes: ["id", "name"] },
      { model: Provider, attributes: ["id", "name", "latitude", "longitude"] }
    ]
  });
  if (!item) return res.status(404).json({ message: "Producto no encontrado" });
  res.json(item);
});

// ACTUALIZAR
router.put("/:id", async (req, res) => {
  const item = await Product.findOne({
    where: { id: req.params.id, user_id: req.user.id }
  });
  if (!item) return res.status(404).json({ message: "Producto no encontrado" });

  const fields = ["sku","name","description","price","stock","min_stock","category_id","provider_id","image_url","is_active"];
  for (const f of fields) if (req.body[f] !== undefined) item[f] = req.body[f];

  await item.save();
  res.json(item);
});

// ELIMINAR
router.delete("/:id", async (req, res) => {
  const deleted = await Product.destroy({
    where: { id: req.params.id, user_id: req.user.id }
  });
  if (!deleted) return res.status(404).json({ message: "Producto no encontrado" });
  res.json({ message: "Eliminado" });
});

module.exports = router;
