const express = require('express');
const {
  createCompany,
  getCompanyOffers,
} = require('../controllers/company.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', createCompany);
router.get('/:id/offers', authenticate, getCompanyOffers);

module.exports = router;

