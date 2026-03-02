const prisma = require('../config/prisma');

class ExchangeRateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExchangeRateError';
  }
}

const normalizeCurrency = (value) => {
  if (!value || typeof value !== 'string') {
    throw new ExchangeRateError('Currency code is required');
  }
  return value.trim().toUpperCase();
};

const convert = async (amount, fromCurrency, toCurrency, companyId) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    throw new ExchangeRateError('Amount must be a valid number');
  }

  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (!companyId) {
    throw new ExchangeRateError('Company context is required for conversion');
  }

  if (from === to) {
    return numericAmount;
  }

  const rateRecord = await prisma.exchangeRate.findFirst({
    where: {
      companyId,
      base: from,
      target: to,
    },
  });

  if (!rateRecord) {
    throw new ExchangeRateError(
      `No exchange rate configured for ${from} -> ${to}`
    );
  }

  return numericAmount * rateRecord.rate;
};

module.exports = {
  convert,
  ExchangeRateError,
};

