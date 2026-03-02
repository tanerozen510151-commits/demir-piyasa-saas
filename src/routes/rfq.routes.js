const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorize.middleware');

const {
  createRfqHandler,
  getIncomingHandler,
  getRfqOffersHandler,
  getComparisonHandler,
} = require('../controllers/rfq.controller');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('BUYER'),
  createRfqHandler
);
router.get('/incoming', getIncomingHandler);
router.get('/:rfqId/offers', getRfqOffersHandler);
router.get('/:rfqId/comparison', getComparisonHandler);

module.exports = router;