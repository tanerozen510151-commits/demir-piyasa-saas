const prisma = require('../config/prisma');
const {
  buildOfferFromPayload,
  acceptOffer,
  rejectOffer,
  counterOffer,
  OfferCalculationError,
  OfferWorkflowError,
} = require('../services/offer.service');
const { ExchangeRateError } = require('../services/exchange.service');
const { DiscountRuleError } = require('../services/discount.service');

const createOffer = async (req, res) => {
  try {
    const { title, currency, items, status } = req.body;

    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const companyId = req.user.companyId;
    const rfqId = req.rfqId != null ? Number(req.rfqId) : undefined;

    const built = await buildOfferFromPayload(
      companyId,
      { title, currency, items },
      {
        status: rfqId != null ? 'SUBMITTED' : status,
        rfqId,
      }
    );

    const offer = await prisma.offer.create({
      data: {
        title: built.title,
        amount: built.amount,
        total: built.total,
        currency: built.currency,
        status: built.status,
        companyId,
        ...(rfqId != null && Number.isInteger(rfqId) && { rfqId }),
        items: {
          create: built.itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json(offer);
  } catch (error) {
    if (
      error instanceof OfferCalculationError ||
      error instanceof ExchangeRateError ||
      error instanceof DiscountRuleError
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error creating offer', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const offerId = Number(id);

    if (!Number.isInteger(offerId) || offerId <= 0) {
      return res.status(400).json({ message: 'Invalid offer id' });
    }

    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        companyId: req.user.companyId,
      },
      include: {
        items: true,
      },
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    return res.status(200).json(offer);
  } catch (error) {
    console.error('Error fetching offer', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const acceptOfferHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const offer = await acceptOffer(req.params.id, req.user.companyId);
    return res.status(200).json(offer);
  } catch (error) {
    if (error instanceof OfferWorkflowError) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
    console.error('Error accepting offer', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const rejectOfferHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const reason = req.body?.reason;
    const offer = await rejectOffer(req.params.id, req.user.companyId, reason);
    return res.status(200).json(offer);
  } catch (error) {
    if (error instanceof OfferWorkflowError) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
    console.error('Error rejecting offer', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const counterOfferHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const newOffer = await counterOffer(req.params.id, req.user.companyId, req.body);
    return res.status(201).json(newOffer);
  } catch (error) {
    if (error instanceof OfferWorkflowError) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
    if (error instanceof OfferCalculationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error countering offer', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createOffer,
  getOfferById,
  acceptOfferHandler,
  rejectOfferHandler,
  counterOfferHandler,
};
