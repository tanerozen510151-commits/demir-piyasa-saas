const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function authorize(requiredPermission) {
    return async (req, res, next) => {
        try {
            if (!req.session || !req.session.user) {
                return res.status(401).json({ error: 'Lütfen giriş yapın' });
            }

            const userId = req.session.user.id || req.session.user;

            const user = await prisma.user.findUnique({
                where: { id: parseInt(userId, 10) },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            });

            if (!user || !user.role) {
                return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
            }

            const hasPerm = user.role.permissions.some(rp => rp.permission.name === requiredPermission);

            if (!hasPerm) {
                return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
            }

            req.currentUser = user;
            return next();
        } catch (error) {
            return res.status(500).json({ error: 'Sunucu hatası' });
        }
    };
}

module.exports = authorize;
