const prisma = require('../config/prisma');
const { convert } = require('./exchange.service');

const OFFER_STATUS = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  COUNTERED: 'COUNTERED',
});

class ComparisonError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ComparisonError';
    this.statusCode = statusCode;
  }
}

/**
 * Get ranked offer comparison for an RFQ. Buyer only. No ranking stored in DB.
 * Ranking: (1) lowest total in base currency, (2) earliest createdAt, (3) highest total discount.
 */
async function getComparison(rfqId, buyerCompanyId) {
  const id = Number(rfqId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ComparisonError('Invalid RFQ id');
  }

  const rfq = await prisma.rFQ.findFirst({
    where: { id, buyerId: buyerCompanyId },
  });

  if (!rfq) {
    throw new ComparisonError('RFQ not found', 404);
  }

  const offers = await prisma.offer.findMany({
    where: {
      rfqId: id,
      status: { in: [OFFER_STATUS.SUBMITTED, OFFER_STATUS.COUNTERED] },
    },
    include: {
      company: { select: { name: true } },
      items: { select: { discount: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (offers.length === 0) {
    return {
      recommendedOfferId: null,
      offers: [],
    };
  }

  const baseCurrency = offers[0].currency.trim().toUpperCase();

  const withConverted = await Promise.all(
    offers.map(async (offer) => {
      let totalInBase = Number(offer.total);
      if (offer.currency.trim().toUpperCase() !== baseCurrency) {
        totalInBase = await convert(
          offer.total,
          offer.currency,
          baseCurrency,
          buyerCompanyId
        );
      }
      const totalDiscount = offer.items.reduce(
        (sum, item) => sum + Number(item.discount || 0),
        0
      );
      return {
        id: offer.id,
        supplier: offer.company.name,
        total: offer.total,
        currency: offer.currency,
        createdAt: offer.createdAt,
        totalInBase,
        totalDiscount,
      };
    })
  );

  withConverted.sort((a, b) => {
    if (a.totalInBase !== b.totalInBase) return a.totalInBase - b.totalInBase;
    if (a.createdAt.getTime() !== b.createdAt.getTime()) {
      return a.createdAt.getTime() - b.createdAt.getTime();
    }
    return b.totalDiscount - a.totalDiscount;
  });

  const ranked = withConverted.map((o, index) => ({
    id: o.id,
    supplier: o.supplier,
    total: o.total,
    currency: o.currency,
    createdAt: o.createdAt,
    rank: index + 1,
    recommended: index === 0,
  }));

  return {
    recommendedOfferId: ranked[0].id,
    offers: ranked,
  };
}

module.exports = {
  getComparison,
  ComparisonError,
};
