const express = require('express');
const {
  importProductsMiddleware,
  importProducts,
  getProducts,
} = require('../controllers/product.controller');

const router = express.Router();

router.post('/import', importProductsMiddleware, importProducts);
router.get('/', getProducts);

module.exports = router;

