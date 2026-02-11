const router = require("express").Router();
const { Favorite, Listing, ListingImage } = require("../models");
const { authRequired } = require("../middleware/auth");

router.get("/", authRequired, async (req, res) => {
  const favs = await Favorite.findAll({ where: { user_id: req.user.id } });
  const ids = favs.map(f => f.listing_id);
  const items = await Listing.findAll({
    where: { id: ids },
    include: [{ model: ListingImage, attributes: ["id","url","sort_order"] }],
    order: [["id","DESC"]]
  });
  res.json(items);
});

router.post("/:listingId", authRequired, async (req, res) => {
  await Favorite.findOrCreate({
    where: { user_id: req.user.id, listing_id: req.params.listingId }
  });
  res.status(201).json({ message: "Favorito agregado" });
});

router.delete("/:listingId", authRequired, async (req, res) => {
  const deleted = await Favorite.destroy({
    where: { user_id: req.user.id, listing_id: req.params.listingId }
  });
  if (!deleted) return res.status(404).json({ message: "No era favorito" });
  res.json({ message: "Favorito eliminado" });
});

module.exports = router;
