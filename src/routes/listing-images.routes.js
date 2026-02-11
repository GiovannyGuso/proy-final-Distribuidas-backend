//src/routes/listing-images.routes.js
 router = require("express").Router();
const { Listing, ListingImage } = require("../models");
const { authRequired } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadBufferToBlob } = require("../services/blob");

// POST /listings/:id/images
router.post("/:id/images", authRequired, upload.any(), async (req, res) => {
  const listingId = req.params.id;

  const listing = await Listing.findOne({
    where: { id: listingId, seller_user_id: req.user.id }
  });
  if (!listing) return res.status(404).json({ message: "Publicación no encontrada" });

  const file = req.files && req.files.length ? req.files[0] : null;
  if (!file) return res.status(400).json({ message: "Debes enviar un archivo (Files)" });

  const url = await uploadBufferToBlob({
    buffer: file.buffer,
    mimeType: file.mimetype,
    filename: (file.originalname || "image.jpg").replace(/\s+/g, "_")
  });

  const img = await ListingImage.create({
    listing_id: listing.id,
    url,
    sort_order: 0
  });

  res.status(201).json(img);
});


// GET /listings/:id/images
router.get("/:id/images", async (req, res) => {
  const listingId = req.params.id;

  const imgs = await ListingImage.findAll({
    where: { listing_id: listingId },
    order: [["sort_order", "ASC"], ["id", "ASC"]]
  });

  res.json(imgs);
});
// DELETE /listings/:id/images/:imageId
router.delete("/:id/images/:imageId", authRequired, async (req, res) => {
  const listingId = req.params.id;
  const imageId = req.params.imageId;

  // 1) Validar que el listing sea del usuario autenticado
  const listing = await Listing.findOne({
    where: { id: listingId, seller_user_id: req.user.id },
  });
  if (!listing) {
    return res.status(404).json({ message: "Publicación no encontrada" });
  }

  // 2) Buscar imagen asociada a ese listing
  const img = await ListingImage.findOne({
    where: { id: imageId, listing_id: listing.id },
  });
  if (!img) {
    return res.status(404).json({ message: "Imagen no encontrada" });
  }

  // 3) (Opcional) aquí podrías borrar del Blob si tienes servicio para eso
  // await deleteBlobByUrl(img.url);

  await img.destroy();
  return res.json({ ok: true, deletedId: img.id });
});


module.exports = router;
