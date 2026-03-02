const prisma = require('../config/prisma');
const { ExchangeRateError } = require('../services/exchange.service');

const createOrUpdateExchangeRate = async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: admin access required' });
    }

    const { base, target, rate } = req.body;

    if (!base || !target) {
      return res
        .status(400)
        .json({ message: 'base and target currencies are required' });
    }

    const parsedRate = Number(rate);

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      return res
        .status(400)
        .json({ message: 'rate must be a positive number' });
    }

    const baseCode = base.trim().toUpperCase();
    const targetCode = target.trim().toUpperCase();
    const companyId = req.user.companyId;

    if (baseCode === targetCode) {
      throw new ExchangeRateError('base and target currencies must differ');
    }

    const exchangeRate = await prisma.exchangeRate.upsert({
      where: {
        companyId_base_target: {
          companyId,
          base: baseCode,
          target: targetCode,
        },
      },
      update: {
        rate: parsedRate,
      },
      create: {
        companyId,
        base: baseCode,
        target: targetCode,
        rate: parsedRate,
      },
    });

    return res.status(201).json(exchangeRate);
  } catch (error) {
    if (error instanceof ExchangeRateError) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error creating exchange rate', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createOrUpdateExchangeRate,
};

