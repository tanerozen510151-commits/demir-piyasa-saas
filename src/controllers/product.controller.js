const multer = require('multer');
const prisma = require('../config/prisma');
const {
  parseProductWorkbook,
  ProductImportError,
} = require('../services/product-import.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const importProductsMiddleware = upload.single('file');

const importProducts = async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const products = parseProductWorkbook(req.file.buffer);

    const companyId = req.user.companyId;

    await prisma.$transaction([
      prisma.product.deleteMany({
        where: { companyId },
      }),
      prisma.product.createMany({
        data: products.map((p) => ({
          ...p,
          companyId,
        })),
      }),
    ]);

    return res.status(201).json({
      message: 'Products imported successfully',
      imported: products.length,
    });
  } catch (error) {
    if (error instanceof ProductImportError) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error importing products', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getProducts = async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const products = await prisma.product.findMany({
      where: {
        companyId: req.user.companyId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  importProductsMiddleware,
  importProducts,
  getProducts,
};

