const xlsx = require('xlsx');

class ProductImportError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProductImportError';
  }
}

const parseProductWorkbook = (buffer) => {
  let workbook;

  try {
    workbook = xlsx.read(buffer, { type: 'buffer' });
  } catch (error) {
    throw new ProductImportError('Invalid Excel file');
  }

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ProductImportError('Excel file does not contain any sheets');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

  if (!rows.length) {
    throw new ProductImportError('Excel file does not contain any data rows');
  }

  const products = rows.map((row, index) => {
    const normalizedRow = Object.keys(row).reduce((acc, key) => {
      acc[key.toLowerCase()] = row[key];
      return acc;
    }, {});

    const name = normalizedRow.name;
    const sku = normalizedRow.sku || null;
    const price = normalizedRow.price;
    const currency = normalizedRow.currency;

    if (!name) {
      throw new ProductImportError(`Row #${index + 2}: name is required`);
    }

    if (price === null || price === undefined) {
      throw new ProductImportError(`Row #${index + 2}: price is required`);
    }

    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      throw new ProductImportError(
        `Row #${index + 2}: price must be a positive number`
      );
    }

    if (!currency || typeof currency !== 'string') {
      throw new ProductImportError(`Row #${index + 2}: currency is required`);
    }

    return {
      name: String(name),
      sku: sku ? String(sku) : null,
      price: parsedPrice,
      currency: String(currency).toUpperCase(),
    };
  });

  return products;
};

module.exports = {
  parseProductWorkbook,
  ProductImportError,
};

