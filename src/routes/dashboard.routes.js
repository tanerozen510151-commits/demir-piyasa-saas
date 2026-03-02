const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/buyer', dashboardController.getBuyerDashboardHandler);
router.get('/supplier', dashboardController.getSupplierDashboardHandler);

module.exports = router;
