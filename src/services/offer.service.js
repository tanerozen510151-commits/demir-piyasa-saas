const prisma = require('../config/prisma');
const { convert } = require('./exchange.service');
const { applyDiscount } = require('./discount.service');

class OfferCalculationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OfferCalculationError';
  }
}

class OfferWorkflowError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'OfferWorkflowError';
    this.statusCode = statusCode;
  }
}

const OFFER_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  COUNTERED: 'COUNTERED',
});

const VALID_STATUSES = [
  OFFER_STATUS.DRAFT,
  OFFER_STATUS.SUBMITTED,
  'SENT',
  OFFER_STATUS.ACCEPTED,
  OFFER_STATUS.REJECTED,
  OFFER_STATUS.COUNTERED,
];

const RFQ_STATUS = Object.freeze({
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
});

function calculateOfferTotals(items, requestedStatus) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OfferCalculationError('At least one offer item is required');
  }

  let total = 0;

  const normalizedItems = items.map((item, index) => {
    const { product, quantity, unitPrice } = item;
    const discount = item.discount !== undefined ? Number(item.discount) : 0;

    if (!product) {
      throw new OfferCalculationError(`Item #${index + 1}: product is required`);
    }

    const q = Number(quantity);
    const p = Number(unitPrice);
    const d = Number(discount);

    if (!Number.isFinite(q) || q <= 0) {
      throw new OfferCalculationError(`Item #${index + 1}: quantity must be a positive number`);
    }

    if (!Number.isFinite(p) || p <= 0) {
      throw new OfferCalculationError(`Item #${index + 1}: unitPrice must be a positive number`);
    }

    if (!Number.isFinite(d) || d < 0) {
      throw new OfferCalculationError(`Item #${index + 1}: discount must be a non-negative number`);
    }

    const lineTotal = q * p - d;

    if (lineTotal < 0) {
      throw new OfferCalculationError(`Item #${index + 1}: lineTotal cannot be negative`);
    }

    total += lineTotal;

    return {
      product,
      quantity: q,
      unitPrice: p,
      discount: d,
      lineTotal,
    };
  });

  const status =
    requestedStatus && VALID_STATUSES.includes(requestedStatus)
      ? requestedStatus
      : OFFER_STATUS.DRAFT;

  return {
    items: normalizedItems,
    total,
    status,
  };
}

/**
 * Build offer data from payload using pricing engine (currency conversion, discount rules).
 * Returns { title, currency, total, amount, status, itemsData } for prisma.offer.create.
 */
async function buildOfferFromPayload(companyId, payload, options = {}) {
  const { title, currency, items } = payload;
  const { status: statusOverride, rfqId } = options;

  if (!title || !currency || !Array.isArray(items) || items.length === 0) {
    throw new OfferCalculationError('title, currency and at least one item are required');
  }

  const offerCurrency = String(currency).toUpperCase();
  const productIdSet = new Set();
  items.forEach((item) => {
    if (item.productId !== undefined && item.productId !== null) {
      const parsedId = Number(item.productId);
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        throw new OfferCalculationError('productId must be a positive integer when provided');
      }
      productIdSet.add(parsedId);
    }
  });

  let productsById = {};
  if (productIdSet.size > 0) {
    const productIds = Array.from(productIdSet);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, companyId },
    });
    productsById = products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
    items.forEach((item, index) => {
      if (item.productId != null) {
        const pid = Number(item.productId);
        if (!productsById[pid]) {
          throw new OfferCalculationError(`Item #${index + 1}: product not found for this company`);
        }
      }
    });
  }

  const calculationItems = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    let baseCurrency;
    let baseUnitPrice;

    if (item.productId !== undefined && item.productId !== null) {
      const pid = Number(item.productId);
      const product = productsById[pid];
      baseCurrency = String(product.currency).toUpperCase();
      baseUnitPrice = product.price;
    } else {
      baseCurrency = item.currency ? String(item.currency).toUpperCase() : offerCurrency;
      baseUnitPrice = item.unitPrice;
    }

    let unitPriceInOfferCurrency;
    if (baseCurrency === offerCurrency) {
      unitPriceInOfferCurrency = Number(baseUnitPrice);
    } else {
      unitPriceInOfferCurrency = await convert(
        baseUnitPrice,
        baseCurrency,
        offerCurrency,
        companyId
      );
    }

    const quantity = Number(item.quantity);
    const rawLineTotal = unitPriceInOfferCurrency * quantity;
    const { discountApplied } = await applyDiscount({
      companyId,
      productId: item.productId !== undefined ? item.productId : null,
      quantity,
      baseAmount: rawLineTotal,
    });

    calculationItems.push({
      product:
        item.productId != null ? productsById[Number(item.productId)].name : item.product,
      quantity,
      unitPrice: unitPriceInOfferCurrency,
      discount: discountApplied,
    });
  }

  const { items: calculatedItems, total, status: normalizedStatus } = calculateOfferTotals(
    calculationItems,
    statusOverride
  );

  const itemsData = calculatedItems.map((calculated, index) => {
    const source = items[index];
    return {
      product: calculated.product,
      quantity: calculated.quantity,
      unitPrice: calculated.unitPrice,
      discount: calculated.discount,
      lineTotal: calculated.lineTotal,
      productId: source.productId != null ? Number(source.productId) : null,
    };
  });

  return {
    title,
    currency,
    total,
    amount: total,
    status: normalizedStatus,
    itemsData,
  };
}

/**
 * Buyer accepts an offer: set ACCEPTED, close RFQ, reject other offers.
 */
async function acceptOffer(offerId, buyerCompanyId) {
  const id = Number(offerId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new OfferWorkflowError('Invalid offer id');
  }

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { rfq: true, items: true },
  });

  if (!offer) {
    throw new OfferWorkflowError('Offer not found', 404);
  }
  if (!offer.rfqId || !offer.rfq) {
    throw new OfferWorkflowError('Offer must belong to an RFQ');
  }
  if (offer.rfq.buyerId !== buyerCompanyId) {
    throw new OfferWorkflowError('Only the RFQ buyer can accept this offer', 403);
  }
  if (offer.rfq.status === RFQ_STATUS.CLOSED) {
    throw new OfferWorkflowError('RFQ is already closed', 400);
  }
  const allowed = [OFFER_STATUS.SUBMITTED, OFFER_STATUS.COUNTERED];
  if (!allowed.includes(offer.status)) {
    throw new OfferWorkflowError('Offer must be SUBMITTED or COUNTERED to accept');
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.offer.update({
      where: { id },
      data: { status: OFFER_STATUS.ACCEPTED, decidedAt: now },
    }),
    prisma.rFQ.update({
      where: { id: offer.rfqId },
      data: { status: RFQ_STATUS.CLOSED },
    }),
    prisma.offer.updateMany({
      where: {
        rfqId: offer.rfqId,
        id: { not: id },
      },
      data: { status: OFFER_STATUS.REJECTED, decidedAt: now },
    }),
  ]);

  return prisma.offer.findUnique({
    where: { id },
    include: { items: true, rfq: true },
  });
}

/**
 * Buyer rejects an offer: set REJECTED and decisionNote.
 */
async function rejectOffer(offerId, buyerCompanyId, reason) {
  const id = Number(offerId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new OfferWorkflowError('Invalid offer id');
  }

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { rfq: true },
  });

  if (!offer) {
    throw new OfferWorkflowError('Offer not found', 404);
  }
  if (!offer.rfqId || !offer.rfq) {
    throw new OfferWorkflowError('Offer must belong to an RFQ');
  }
  if (offer.rfq.buyerId !== buyerCompanyId) {
    throw new OfferWorkflowError('Only the RFQ buyer can reject this offer', 403);
  }
  if (offer.rfq.status === RFQ_STATUS.CLOSED) {
    throw new OfferWorkflowError('RFQ is already closed', 400);
  }

  const updated = await prisma.offer.update({
    where: { id },
    data: {
      status: OFFER_STATUS.REJECTED,
      decidedAt: new Date(),
      decisionNote: reason != null ? String(reason) : null,
    },
    include: { items: true },
  });

  return updated;
}

/**
 * Buyer counters an offer: create new Offer with same rfqId, supplier companyId, status COUNTERED.
 */
async function counterOffer(offerId, buyerCompanyId, body) {
  const id = Number(offerId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new OfferWorkflowError('Invalid offer id');
  }

  const originalOffer = await prisma.offer.findUnique({
    where: { id },
    include: { rfq: true, items: true },
  });

  if (!originalOffer) {
    throw new OfferWorkflowError('Offer not found', 404);
  }
  if (!originalOffer.rfqId || !originalOffer.rfq) {
    throw new OfferWorkflowError('Offer must belong to an RFQ');
  }
  if (originalOffer.rfq.buyerId !== buyerCompanyId) {
    throw new OfferWorkflowError('Only the RFQ buyer can counter this offer', 403);
  }
  if (originalOffer.rfq.status === RFQ_STATUS.CLOSED) {
    throw new OfferWorkflowError('RFQ is already closed', 400);
  }

  const { items, note } = body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new OfferWorkflowError('items array is required for counter offer');
  }

  const supplierId = originalOffer.companyId;
  const payload = {
    title: originalOffer.title,
    currency: originalOffer.currency,
    items,
  };

  const built = await buildOfferFromPayload(supplierId, payload, {
    status: OFFER_STATUS.COUNTERED,
  });

  const newOffer = await prisma.offer.create({
    data: {
      title: built.title,
      amount: built.amount,
      total: built.total,
      currency: built.currency,
      status: OFFER_STATUS.COUNTERED,
      companyId: supplierId,
      rfqId: originalOffer.rfqId,
      originalOfferId: id,
      decisionNote: note != null ? String(note) : null,
      items: {
        create: built.itemsData,
      },
    },
    include: { items: true },
  });

  return newOffer;
}

module.exports = {
  calculateOfferTotals,
  buildOfferFromPayload,
  acceptOffer,
  rejectOffer,
  counterOffer,
  OfferCalculationError,
  OfferWorkflowError,
  VALID_STATUSES,
  OFFER_STATUS,
};
