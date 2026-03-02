const prisma = require('../config/prisma');

const RFQ_STATUS = Object.freeze({
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
});

class RFQError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'RFQError';
    this.statusCode = statusCode;
  }
}

/**
 * Create RFQ with items and supplier invitations. Buyer-only.
 */
async function createRfq(buyerId, { title, description, items, supplierIds }) {
  if (!title || !Array.isArray(items) || items.length === 0) {
    throw new RFQError('title and at least one item are required');
  }

  const validItems = items.map((row, i) => {
    const product = row.product;
    const quantity = Number(row.quantity);
    if (!product) throw new RFQError(`Item #${i + 1}: product is required`);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new RFQError(`Item #${i + 1}: quantity must be a positive number`);
    }
    return { product, quantity };
  });

  const supplierIdList = Array.isArray(supplierIds)
    ? supplierIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  const uniqueSupplierIds = [...new Set(supplierIdList)];

  const rfq = await prisma.rFQ.create({
    data: {
      title,
      description: description || null,
      buyerId,
      status: RFQ_STATUS.OPEN,
      items: {
        create: validItems,
      },
      invitations: {
        create: uniqueSupplierIds.map((supplierId) => ({
          supplierId,
        })),
      },
    },
    include: {
      items: true,
      invitations: true,
    },
  });

  return rfq;
}

/**
 * Incoming RFQs for a supplier: invited and OPEN only.
 */
async function getIncomingRfqs(supplierCompanyId) {
  const invitations = await prisma.rFQInvitation.findMany({
    where: { supplierId: supplierCompanyId },
    include: {
      rfq: {
        include: { items: true },
      },
    },
  });

  return invitations
    .map((inv) => inv.rfq)
    .filter((rfq) => rfq.status === RFQ_STATUS.OPEN);
}

/**
 * Ensure supplier is invited and RFQ is OPEN. Throws RFQError if not.
 * Returns the RFQ for use in offer creation.
 */
async function assertSupplierInvited(rfqId, supplierCompanyId) {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: Number(rfqId) },
    include: {
      invitations: { where: { supplierId: supplierCompanyId } },
    },
  });

  if (!rfq) {
    throw new RFQError('RFQ not found', 404);
  }
  if (rfq.status !== RFQ_STATUS.OPEN) {
    throw new RFQError('RFQ is not open for offers');
  }
  if (!rfq.invitations || rfq.invitations.length === 0) {
    throw new RFQError('Your company is not invited to this RFQ', 403);
  }

  return rfq;
}

/**
 * List offers for an RFQ. Buyer-only.
 */
async function getRfqOffersForBuyer(rfqId, buyerCompanyId) {
  const rfq = await prisma.rFQ.findFirst({
    where: { id: Number(rfqId), buyerId: buyerCompanyId },
    include: {
      offers: {
        include: { items: true },
      },
    },
  });

  if (!rfq) {
    throw new RFQError('RFQ not found', 404);
  }

  return rfq.offers;
}

module.exports = {
  createRfq,
  getIncomingRfqs,
  assertSupplierInvited,
  getRfqOffersForBuyer,
  RFQError,
  RFQ_STATUS,
};
