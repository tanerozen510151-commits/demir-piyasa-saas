const {
  createRfq,
  getIncomingRqs,
  assertSupplierInvited,
  getRfqOffersForBuyer,
  RFQError,
} = require('../services/rfq.service');

const { getComparison, ComparisonError } = require('../services/rfqComparison.service');


// ===============================
// CREATE RFQ
// ===============================
async function createRfqHandler(req, res) {
  try {
    // TEST için sabit companyId
    const fakeCompanyId = 1;

    const rfq = await createRfq(fakeCompanyId, req.body);
    return res.status(201).json(rfq);

  } catch (err) {
    console.error('Create RFQ error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


// ===============================
// GET INCOMING RFQS
// ===============================
async function getIncomingHandler(req, res) {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const list = await getIncomingRqs(req.user.companyId);
    return res.status(200).json(list);

  } catch (err) {
    if (err instanceof RFQError) {
      return res.status(err.statusCode || 400).json({ message: err.message });
    }

    console.error('Error fetching incoming RFQs:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


// ===============================
// GET RFQ OFFERS
// ===============================
async function getRfqOffersHandler(req, res) {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const offers = await getRfqOffersForBuyer(
      req.params.rfqId,
      req.user.companyId
    );

    return res.status(200).json(offers);

  } catch (err) {
    if (err instanceof RFQError) {
      return res.status(err.statusCode || 400).json({ message: err.message });
    }

    console.error('Error fetching RFQ offers:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


// ===============================
// GET RFQ COMPARISON
// ===============================
async function getComparisonHandler(req, res) {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const comparison = await getComparison(
      req.params.rfqId,
      req.user.companyId
    );

    return res.status(200).json(comparison);

  } catch (err) {
    if (err instanceof ComparisonError) {
      return res.status(err.statusCode || 400).json({ message: err.message });
    }

    console.error('Error fetching comparison:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


// ===============================
// EXPORTS
// ===============================
module.exports = {
  createRfqHandler,
  getIncomingHandler,
  getRfqOffersHandler,
  getComparisonHandler,
};