const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize');

// Teklif Oluşturma (POST /)
router.post('/', async (req, res) => {
    try {
        // 1. Login kontrolü
        if (!req.session.user) {
            return res.status(401).json({ error: 'Lütfen giriş yapın' });
        }

        // 2. CompanyId kontrolü (Seller bir şirkete bağlı mı?)
        const sellerCompanyId = req.session.user.companyId;
        if (!sellerCompanyId) {
            return res.status(403).json({ error: 'Teklif vermek için bir şirkete bağlı olmalısınız' });
        }

        // 3. Body'den alanları al ve doğrula
        const { rfqId, price, note } = req.body;

        if (!rfqId || price === undefined || price === null) {
            return res.status(400).json({ error: 'rfqId ve price alanları zorunludur' });
        }

        // Hardening: Fiyat 0'dan büyük olmalı
        if (typeof price !== 'number' || price <= 0) {
            return res.status(400).json({ error: 'Geçerli bir fiyat giriniz' });
        }

        // 4. RFQ var mı kontrol et
        const rfq = await prisma.rFQ.findUnique({
            where: { id: Number(rfqId) }
        });

        if (!rfq) {
            return res.status(404).json({ error: 'Teklif verilmek istenen RFQ bulunamadı' });
        }

        // 5. RFQ OPEN mı kontrol et (Kritik İş Kuramı)
        if (rfq.status !== 'open') {
            return res.status(400).json({
                error: "Bu RFQ kapalı, teklif verilemez"
            });
        }

        // 6. Kendi RFQ'suna teklif veremesin
        if (rfq.buyerCompanyId === sellerCompanyId) {
            return res.status(400).json({ error: 'Kendi şirketinizin teklif isteğine teklif veremezsiniz' });
        }

        // 7. Offer Oluştur
        const newOffer = await prisma.offer.create({
            data: {
                price: parseFloat(price),
                note,
                status: 'pending',
                rfq: { connect: { id: Number(rfqId) } },
                sellerCompany: { connect: { id: sellerCompanyId } }
            }
        });

        // 8. Response
        res.status(201).json({
            message: "Teklif başarıyla oluşturuldu",
            offer: newOffer
        });

    } catch (error) {
        console.error('Offer Create Error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});


// Teklif Kabul Etme (PATCH /:id/accept)
router.patch('/:id/accept', authenticate, authorize("OFFER_ACCEPT"), async (req, res) => {
    try {
        // 1. Login kontrolü
        if (!req.session.user) {
            return res.status(401).json({ error: 'Lütfen giriş yapın' });
        }

        const { id } = req.params;

        // 2. Offer'ı ve RFQ'yu bul
        const offer = await prisma.offer.findUnique({
            where: { id: Number(id) },
            include: {
                rfq: {
                    include: {
                        offers: {
                            select: { status: true }
                        }
                    }
                }
            }
        });

        if (!offer) {
            return res.status(404).json({ error: 'Teklif bulunamadı' });
        }

        if (!offer.rfq) {
            return res.status(404).json({ error: 'İlişkili RFQ bulunamadı' });
        }

        // 3. Sadece RFQ sahibi company kabul edebilsin
        if (offer.rfq.buyerCompanyId !== req.session.user.companyId) {
            return res.status(403).json({ error: 'Bu teklifi kabul etme yetkiniz yok' });
        }

        // 4. RFQ OPEN mı kontrol et
        if (offer.rfq.status !== 'open') {
            return res.status(400).json({ error: 'Bu RFQ kapalı veya zaten sonuçlanmış' });
        }

        // 5. Başka bir teklif zaten kabul edilmiş mi kontrol et (Race-condition safety)
        const alreadyAccepted = offer.rfq.offers.some(o => o.status === 'accepted');
        if (alreadyAccepted) {
            return res.status(400).json({ error: 'Bu RFQ için başka bir teklif zaten kabul edilmiş' });
        }

        // 6. Enterprise Atomic Transaction
        const result = await prisma.$transaction(async (tx) => {
            // A) Seçilen teklif -> accepted
            const updatedOffer = await tx.offer.update({
                where: { id: Number(id) },
                data: { status: 'accepted' }
            });

            // B) Diğer teklifler -> rejected
            await tx.offer.updateMany({
                where: {
                    rfqId: offer.rfqId,
                    id: { not: Number(id) }
                },
                data: { status: 'rejected' }
            });

            // C) RFQ -> closed
            await tx.rFQ.update({
                where: { id: offer.rfqId },
                data: { status: 'closed' }
            });

            // D) Sipariş (Order) Oluştur
            const createdOrder = await tx.order.create({
                data: {
                    rfqId: offer.rfqId,
                    offerId: Number(id),
                    buyerCompanyId: offer.rfq.buyerCompanyId,
                    sellerCompanyId: offer.sellerCompanyId,
                    price: offer.price,
                    quantity: Math.round(offer.rfq.quantity), // Order model expects Int for quantity based on request, but RFQ has Float. Rounding for safety.
                    status: 'pending'
                }
            });

            return createdOrder;
        });

        // 7. Response
        res.json({
            message: "Teklif kabul edildi ve sipariş oluşturuldu",
            order: result
        });

    } catch (error) {
        console.error('Offer Accept Error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});



// Teklif Reddetme (PATCH /:id/reject)
router.patch('/:id/reject', async (req, res) => {
    try {
        // 1. Login kontrolü
        if (!req.session.user) {
            return res.status(401).json({ error: 'Lütfen giriş yapın' });
        }

        const { id } = req.params;

        // 2. Offer'ı bul
        const offer = await prisma.offer.findUnique({
            where: { id: parseInt(id) },
            include: { rfq: true }
        });

        if (!offer) {
            return res.status(404).json({ error: 'Teklif bulunamadı' });
        }

        // 3. Sadece RFQ sahibi company reddedebilsin
        if (offer.rfq.buyerCompanyId !== req.session.user.companyId) {
            return res.status(403).json({ error: 'Bu teklifi reddetme yetkiniz yok' });
        }

        // 4. Güncelle
        await prisma.offer.update({
            where: { id: parseInt(id) },
            data: { status: 'rejected' }
        });

        // 5. Response
        res.json({
            message: "Teklif reddedildi"
        });

    } catch (error) {
        console.error('Offer Reject Error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
