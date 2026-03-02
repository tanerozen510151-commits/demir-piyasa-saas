const prisma = require('../config/prisma');

const DISCOUNT_TYPES = Object.freeze({
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
});

class DiscountRuleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DiscountRuleError';
  }
}

/**
 * Compute discount amount for a single rule.
 * @param {string} discountType - PERCENTAGE | FIXED
 * @param {number} value - rule value
 * @param {number} baseAmount - line amount before discount
 * @returns {number} discount amount (non-negative)
 */
function computeDiscountAmount(discountType, value, baseAmount) {
  if (discountType === DISCOUNT_TYPES.PERCENTAGE) {
    return (baseAmount * value) / 100;
  }
  if (discountType === DISCOUNT_TYPES.FIXED) {
    return Math.min(value, baseAmount);
  }
  return 0;
}

/**
 * Apply best matching discount rule for a line.
 * - productId match OR rule.productId null → company-wide rule
 * - minQuantity <= quantity OR rule.minQuantity null
 * - Best rule: PERCENTAGE → highest percentage wins; FIXED → highest monetary impact wins
 * @returns {{ discountApplied: number, finalAmount: number }}
 */
async function applyDiscount({
  companyId,
  productId,
  quantity,
  baseAmount,
}) {
  const qty = Number(quantity);
  const amount = Number(baseAmount);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new DiscountRuleError('quantity must be a positive number');
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new DiscountRuleError('baseAmount must be a non-negative number');
  }

  if (!companyId) {
    throw new DiscountRuleError('companyId is required for discount evaluation');
  }

  if (amount === 0) {
    return { discountApplied: 0, finalAmount: 0 };
  }

  const rules = await prisma.discountRule.findMany({
    where: { companyId },
  });

  const applicable = rules.filter((rule) => {
    const productMatch =
      rule.productId == null || (productId != null && rule.productId === Number(productId));
    const quantityMatch =
      rule.minQuantity == null || qty >= Number(rule.minQuantity);
    if (!productMatch || !quantityMatch) return false;

    const dt = (rule.discountType || '').toUpperCase();
    const val = Number(rule.value);
    if (dt !== DISCOUNT_TYPES.PERCENTAGE && dt !== DISCOUNT_TYPES.FIXED) return false;
    if (!Number.isFinite(val) || val <= 0) return false;

    return true;
  });

  if (!applicable.length) {
    return { discountApplied: 0, finalAmount: amount };
  }

  let bestDiscount = 0;

  for (const rule of applicable) {
    const discountType = (rule.discountType || '').toUpperCase();
    const value = Number(rule.value);
    const discountAmount = computeDiscountAmount(discountType, value, amount);
    if (discountAmount > bestDiscount) {
      bestDiscount = discountAmount;
    }
  }

  const finalAmount = Math.max(0, amount - bestDiscount);

  return {
    discountApplied: bestDiscount,
    finalAmount,
  };
}

module.exports = {
  applyDiscount,
  DiscountRuleError,
  DISCOUNT_TYPES,
  computeDiscountAmount,
};
