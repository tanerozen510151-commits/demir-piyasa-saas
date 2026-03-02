const express = require('express');
const path = require('path');
const session = require('express-session');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const companyRoutes = require('./routes/company.routes');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const exchangeRoutes = require('./routes/exchange.routes');
const discountRoutes = require('./routes/discount.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const rfqRoutes = require('./routes/rfqRoutes');
const offerRoutes = require('./routes/offerRoutes');
const adminRoutes = require('./routes/admin.routes');
const { authenticate } = require('./middleware/auth.middleware');

const app = express();

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'demirpiyasa_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Login Route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                company: true
            }
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı' });
        }

        req.session.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId
        };

        const userData = {
            id: user.id,
            name: user.name,
            role: user.role
        };

        if (user.company) {
            userData.company = {
                id: user.company.id,
                name: user.company.name,
                role: user.company.role
            };
        }

        return res.status(200).json({ user: userData });
    } catch (error) {
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Dashboard Route (Protected)
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, './views/dashboard.html'));
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Domain routes
app.use('/auth', authRoutes);
app.use('/companies', companyRoutes);
app.use('/offers', offerRoutes); // Yeni offer sistemini direkt bağlıyoruz, authenticate kaldırıldı.
app.use('/admin', adminRoutes);
app.use('/products', authenticate, productRoutes);
app.use('/exchange-rates', authenticate, exchangeRoutes);
app.use('/discount-rules', authenticate, discountRoutes);
app.use('/dashboard-api', authenticate, dashboardRoutes);

// RFQ Routes
app.use('/api/rfqs', rfqRoutes);

// Static Middleware - EN SONRA
app.use(express.static(path.join(__dirname, '../public')));

module.exports = app;
