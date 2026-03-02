const express = require("express");
const router = express.Router();

const {
  createOffer,
  getOfferById,
  acceptOfferHandler,
  rejectOfferHandler,
  counterOfferHandler,
} = require("../controllers/offer.controller");

const { calculateOffer } = require("../services/offerCalculation.service");

// ===============================
// OFFER ROUTES
// ===============================

router.post("/", createOffer);
router.post("/:id/accept", acceptOfferHandler);
router.post("/:id/reject", rejectOfferHandler);
router.post("/:id/counter", counterOfferHandler);
router.get("/:id", getOfferById);

// ===============================
// TEST HESAPLAMA ENDPOINT
// ===============================

router.post("/calculate", async (req, res) => {
  try {
    const { items, overrideRate, vatRate } = req.body;

    const result = await calculateOffer(items, overrideRate, vatRate);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;