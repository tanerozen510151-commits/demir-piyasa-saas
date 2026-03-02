const express = require('express');
const {
  createDiscountRule,
  listDiscountRules,
} = require('../controllers/discount.controller');

const router = express.Router();

router.post('/', createDiscountRule);
router.get('/', listDiscountRules);

module.exports = router;

