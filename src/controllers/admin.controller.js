const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAdminDashboard = async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayOfWeek = now.getDay() || 7;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [todayRFQs, weeklyOffers, activeCompanies, monthlyOrders, membershipGroups, totalUsersCount, totalCompaniesCount] = await Promise.all([
            prisma.rFQ.count({
                where: { createdAt: { gte: startOfToday } },
            }),
            prisma.offer.count({
                where: { createdAt: { gte: startOfWeek } },
            }),
            prisma.company.count({
                where: { isActive: true },
            }),
            prisma.order.findMany({
                where: { createdAt: { gte: startOfMonth } },
                select: { price: true, quantity: true },
            }),
            prisma.company.groupBy({
                by: ['membershipType'],
                _count: { _all: true },
            }),
            prisma.user.count(),
            prisma.company.count(),
        ]);

        const monthlyOrderTotal = monthlyOrders.reduce((total, order) => {
            return total + (order.price * order.quantity);
        }, 0);

        const membershipDistribution = {
            basic: 0,
            gold: 0,
            premium: 0,
        };

        membershipGroups.forEach((group) => {
            const type = group.membershipType.toLowerCase();
            if (membershipDistribution[type] !== undefined) {
                membershipDistribution[type] = group._count._all;
            }
        });

        return res.status(200).json({
            stats: {
                todayRFQs,
                weeklyOffers,
                monthlyOrderTotal,
                activeCompanies,
            },
            membershipDistribution,
            totals: {
                monthlyRevenue: monthlyOrderTotal,
                totalUsers: totalUsersCount,
                totalCompanies: totalCompaniesCount,
            }
        });
    } catch (error) {
        console.error('Admin Dashboard Stats Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAdminCompanies = async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                name: true,
                role: true,
                membershipType: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json(companies);
    } catch (error) {
        console.error('Admin Companies Fetch Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateCompanyMembership = async (req, res) => {
    try {
        const { id } = req.params;
        const { membershipType } = req.body;

        if (!['BASIC', 'GOLD', 'PREMIUM'].includes(membershipType)) {
            return res.status(400).json({ error: 'Geçersiz üyelik tipi' });
        }

        const company = await prisma.company.update({
            where: { id: parseInt(id, 10) },
            data: { membershipType },
            select: {
                id: true,
                name: true,
                membershipType: true,
            }
        });

        return res.status(200).json({ message: 'Şirket üyeliği güncellendi', company });
    } catch (error) {
        console.error('Update Company Membership Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'Geçersiz durum' });
        }

        const company = await prisma.company.update({
            where: { id: parseInt(id, 10) },
            data: { isActive },
            select: {
                id: true,
                name: true,
                isActive: true,
            }
        });

        return res.status(200).json({ message: 'Şirket durumu güncellendi', company });
    } catch (error) {
        console.error('Update Company Status Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
