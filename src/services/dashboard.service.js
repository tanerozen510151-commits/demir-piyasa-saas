const prisma = require('../config/prisma');
const { convert } = require('./exchange.service');

const RFQ_STATUS = Object.freeze({ OPEN: 'OPEN', CLOSED: 'CLOSED', CANCELLED: 'CANCELLED' });
const OFFER_STATUS = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  COUNTERED: 'COUNTERED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
});

/**
 * Buyer dashboard: RFQ counts, offers received, average per RFQ, recommended savings.
 * Strict company isolation: only buyer's RFQs and their offers.
 */
async function getBuyerDashboard(companyId) {
  const [totalRfqs, openRfqs, closedRfqs, rfqList, offersCount] = await Promise.all([
    prisma.rFQ.count({ where: { buyerId: companyId } }),
    prisma.rFQ.count({ where: { buyerId: companyId, status: RFQ_STATUS.OPEN } }),
    prisma.rFQ.count({ where: { buyerId: companyId, status: RFQ_STATUS.CLOSED } }),
    prisma.rFQ.findMany({
      where: { buyerId: companyId },
      select: { id: true },
    }),
    prisma.offer.count({
      where: {
        rfqId: { not: null },
        rfq: { buyerId: companyId },
      },
    }),
  ]);

  const averageOffersPerRfq =
    totalRfqs > 0 ? Math.round((offersCount / totalRfqs) * 10) / 10 : 0;

  let recommendedSavings = 0;
  for (const rfq of rfqList) {
    const offers = await prisma.offer.findMany({
      where: { rfqId: rfq.id },
      select: { id: true, total: true, currency: true, status: true },
    });
    const accepted = offers.find((o) => o.status === OFFER_STATUS.ACCEPTED);
    if (!accepted) continue;

    const toCurrency = accepted.currency.trim().toUpperCase();
    let maxTotal = accepted.total;

    for (const o of offers) {
      const curr = o.currency.trim().toUpperCase();
      let value = o.total;
      if (curr !== toCurrency) {
        try {
          value = await convert(o.total, o.currency, toCurrency, companyId);
        } catch {
          continue;
        }
      }
      if (value > maxTotal) maxTotal = value;
    }

    recommendedSavings += maxTotal - accepted.total;
  }

  return {
    totalRfqs,
    openRfqs,
    closedRfqs,
    totalOffersReceived: offersCount,
    averageOffersPerRfq,
    recommendedSavings: Math.round(recommendedSavings * 100) / 100,
  };
}

/**
 * Supplier dashboard: invitations, offers by status, win rate.
 * Strict company isolation: only supplier's invitations and own offers.
 */
async function getSupplierDashboard(companyId) {
  const [totalInvitations, submittedOffers, acceptedOffers, rejectedOffers] =
    await Promise.all([
      prisma.rFQInvitation.count({ where: { supplierId: companyId } }),
      prisma.offer.count({
        where: {
          companyId,
          rfqId: { not: null },
          status: { in: [OFFER_STATUS.SUBMITTED, OFFER_STATUS.COUNTERED, OFFER_STATUS.ACCEPTED, OFFER_STATUS.REJECTED] },
        },
      }),
      prisma.offer.count({
        where: { companyId, status: OFFER_STATUS.ACCEPTED },
      }),
      prisma.offer.count({
        where: { companyId, status: OFFER_STATUS.REJECTED },
      }),
    ]);

  const winRate =
    submittedOffers > 0
      ? Math.round((acceptedOffers / submittedOffers) * 1000) / 10
      : 0;

  return {
    totalInvitations,
    submittedOffers,
    acceptedOffers,
    rejectedOffers,
    winRate,
  };
}

module.exports = {
  getBuyerDashboard,
  getSupplierDashboard,
};
