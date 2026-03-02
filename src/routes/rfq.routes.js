const express = require('express');

const {
  createRfqHandler,
  getIncomingHandler,
  getRfqOffersHandler,
  getComparisonHandler,
} = require('../controllers/rfq.controller');

const router = express.Router();

router.post('/', createRfqHandler);
router.get('/incoming', getIncomingHandler);
router.get('/:rfqId/offers', getRfqOffersHandler);
router.get('/:rfqId/comparison', getComparisonHandler);

module.exports = router;