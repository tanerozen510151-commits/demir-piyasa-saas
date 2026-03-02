const express = require('express');
const {
  createOrUpdateExchangeRate,
} = require('../controllers/exchange.controller');

const router = express.Router();

router.post('/', createOrUpdateExchangeRate);

module.exports = router;

