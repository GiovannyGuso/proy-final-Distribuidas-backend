const router = require("express").Router();
const { Rating } = require("../models");
const { authRequired } = require("../middleware/auth");

// crear o actualizar mi rating
router.post("/listing/:listingId", authRequired, async (req, res) => {
  const rating = Number(req.body.rating);
  if (![1,2,3,4,5].includes(rating)) {
    return res.status(400).json({ message: "rating debe ser 1..5" });
  }

  const [row, created] = await Rating.findOrCreate({
    where: { listing_id: req.params.listingId, rater_user_id: req.user.id },
    defaults: { rating }
  });

  if (!created) {
    row.rating = rating;
    await row.save();
  }

  res.json({ message: "OK", rating: row.rating });
});

// resumen rating (promedio + count)
router.get("/listing/:listingId/summary", async (req, res) => {
  const listingId = req.params.listingId;

  const count = await Rating.count({ where: { listing_id: listingId } });
  const avg = await Rating.sum("rating", { where: { listing_id: listingId } });

  res.json({
    count,
    average: count ? Number((avg / count).toFixed(2)) : 0
  });
});

module.exports = router;
