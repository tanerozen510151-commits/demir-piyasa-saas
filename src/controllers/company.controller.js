const prisma = require('../config/prisma');

const createCompany = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' });
    }

    const existing = await prisma.company.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({ message: 'Company with this email already exists' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        email,
      },
    });

    return res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getCompanyOffers = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = Number(id);

    if (!Number.isInteger(companyId) || companyId <= 0) {
      return res.status(400).json({ message: 'Invalid company id' });
    }

    if (!req.user || !req.user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.companyId !== companyId) {
      return res.status(403).json({ message: 'Forbidden: cannot access another company offers' });
    }

    const offers = await prisma.offer.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(offers);
  } catch (error) {
    console.error('Error fetching company offers', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createCompany,
  getCompanyOffers,
};

