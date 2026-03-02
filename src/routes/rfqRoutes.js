const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// RFQ Oluşturma (POST /)
router.post('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Lütfen giriş yapın' });
        }

        const { title, description, quantity, productId } = req.body;
        const buyerCompanyId = req.session.user.companyId;

        if (!buyerCompanyId) {
            return res.status(403).json({ error: 'RFQ oluşturmak için bir şirkete bağlı olmalısınız' });
        }

        const company = await prisma.company.findUnique({
            where: { id: buyerCompanyId }
        });

        if (!company) {
            return res.status(404).json({ error: 'Bağlı olduğunuz şirket bulunamadı' });
        }

        if (company.membershipType === 'BASIC') {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const monthlyRfqCount = await prisma.rFQ.count({
                where: {
                    buyerCompanyId: buyerCompanyId,
                    createdAt: { gte: startOfMonth }
                }
            });

            if (monthlyRfqCount >= 10) {
                return res.status(403).json({ error: 'Basic üyelik aylık RFQ limitine ulaştı' });
            }
        }

        const newRFQ = await prisma.rFQ.create({
            data: {
                title,
                description,
                quantity: parseFloat(quantity),
                product: { connect: { id: parseInt(productId) } },
                buyer: { connect: { id: req.session.user.companyId } },
                status: 'open'
            }
        });

        res.status(201).json({ message: 'RFQ başarıyla oluşturuldu', rfq: newRFQ });
    } catch (error) {
        console.error('RFQ Create Error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Şirkete Ait RFQ'ları Listeleme (GET /)
router.get('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Lütfen giriş yapın' });
        }

        const companyId = req.session.user.companyId;

        if (!companyId) {
            return res.status(403).json({ error: 'Sadece şirkete bağlı kullanıcılar listeleyebilir' });
        }

        const rfqs = await prisma.rFQ.findMany({
            where: { buyerCompanyId: companyId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            count: rfqs.length,
            rfqs: rfqs
        });
    } catch (error) {
        console.error('RFQ Fetch Error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// RFQ Detay (GET /:id)
router.get('/:id', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Lütfen giriş yapın' });
        }

        const { id } = req.params;

        const rfq = await prisma.rFQ.findUnique({
            where: { id: parseInt(id) },
            include: {
                product: true,
                offers: {
                    include: {
                        sellerCompany: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!rfq) {
            return res.status(404).json({ error: 'RFQ bulunamadı' });
        }

        res.json({ rfq });
    } catch (error) {
        console.error('RFQ Detail Error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
