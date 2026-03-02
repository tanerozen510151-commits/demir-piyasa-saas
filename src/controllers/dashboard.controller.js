const {
  getBuyerDashboard,
  getSupplierDashboard,
} = require('../services/dashboard.service');

async function getBuyerDashboardHandler(req, res) {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = await getBuyerDashboard(req.user.companyId);
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching buyer dashboard', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getSupplierDashboardHandler(req, res) {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = await getSupplierDashboard(req.user.companyId);
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching supplier dashboard', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getBuyerDashboardHandler,
  getSupplierDashboardHandler,
};
