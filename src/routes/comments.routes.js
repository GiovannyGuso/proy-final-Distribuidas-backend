const router = require("express").Router();
const { Comment, User } = require("../models");
const { authRequired } = require("../middleware/auth");

router.get("/listing/:listingId", async (req, res) => {
  const items = await Comment.findAll({
    where: { listing_id: req.params.listingId },
    include: [{ model: User, attributes: ["id", "full_name"] }],
    order: [["id","DESC"]]
  });
  res.json(items);
});

router.post("/listing/:listingId", authRequired, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "text requerido" });

  const created = await Comment.create({
    listing_id: req.params.listingId,
    user_id: req.user.id,
    text
  });
  res.status(201).json(created);
});

router.delete("/:id", authRequired, async (req, res) => {
  const deleted = await Comment.destroy({
    where: { id: req.params.id, user_id: req.user.id }
  });
  if (!deleted) return res.status(404).json({ message: "No encontrado" });
  res.json({ message: "Eliminado" });
});

module.exports = router;
