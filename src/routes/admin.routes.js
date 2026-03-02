const express = require('express');
const router = express.Router();
const {
    getAdminDashboard,
    getAdminCompanies,
    updateCompanyMembership,
    updateCompanyStatus
} = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize');

router.get('/dashboard', authenticate, authorize('ADMIN_PANEL_VIEW'), getAdminDashboard);
router.get('/companies', authenticate, authorize('COMPANY_MANAGE'), getAdminCompanies);
router.patch('/companies/:id/membership', authenticate, authorize('COMPANY_MANAGE'), updateCompanyMembership);
router.patch('/companies/:id/status', authenticate, authorize('COMPANY_MANAGE'), updateCompanyStatus);

module.exports = router;
