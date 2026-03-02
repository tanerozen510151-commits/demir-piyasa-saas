const prisma = require('../config/prisma');
const { DiscountRuleError, DISCOUNT_TYPES } = require('../services/discount.service');

const createDiscountRule = async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: admin access required' });
    }

    const { productId, minQuantity, discountType, value } = req.body;
    const companyId = req.user.companyId;

    const normalizedType = (discountType || '').toUpperCase();
    if (normalizedType !== DISCOUNT_TYPES.PERCENTAGE && normalizedType !== DISCOUNT_TYPES.FIXED) {
      return res
        .status(400)
        .json({ message: 'discountType must be PERCENTAGE or FIXED' });
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return res.status(400).json({ message: 'value must be a positive number' });
    }

    let parsedMinQuantity = null;
    if (minQuantity !== undefined && minQuantity !== null) {
      parsedMinQuantity = Number(minQuantity);
      if (!Number.isFinite(parsedMinQuantity) || parsedMinQuantity <= 0) {
        return res
          .status(400)
          .json({ message: 'minQuantity must be a positive number when provided' });
      }
    }

    let parsedProductId = null;
    if (productId !== undefined && productId !== null) {
      parsedProductId = Number(productId);
      if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
        return res
          .status(400)
          .json({ message: 'productId must be a positive integer when provided' });
      }

      const product = await prisma.product.findFirst({
        where: { id: parsedProductId, companyId },
      });
      if (!product) {
        return res.status(400).json({ message: 'Product not found for this company' });
      }
    }

    const rule = await prisma.discountRule.create({
      data: {
        companyId,
        productId: parsedProductId,
        minQuantity: parsedMinQuantity,
        discountType: normalizedType,
        value: parsedValue,
      },
    });

    return res.status(201).json(rule);
  } catch (error) {
    if (error instanceof DiscountRuleError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error creating discount rule', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const listDiscountRules = async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rules = await prisma.discountRule.findMany({
      where: { companyId: req.user.companyId },
      orderBy: [
        { productId: 'asc' },
        { minQuantity: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return res.status(200).json(rules);
  } catch (error) {
    console.error('Error fetching discount rules', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createDiscountRule,
  listDiscountRules,
};
