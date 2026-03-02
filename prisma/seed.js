const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const permissionsList = [
        'RFQ_CREATE',
        'RFQ_VIEW',
        'OFFER_CREATE',
        'OFFER_ACCEPT',
        'ORDER_VIEW',
        'USER_MANAGE',
        'COMPANY_MANAGE',
        'ADMIN_PANEL_VIEW'
    ];

    for (const permName of permissionsList) {
        await prisma.permission.upsert({
            where: { name: permName },
            update: {},
            create: { name: permName }
        });
    }

    const allPerms = await prisma.permission.findMany();
    const getPermIds = (names) => allPerms.filter(p => names.includes(p.name)).map(p => ({ permissionId: p.id }));

    const roleDefinitions = [
        {
            name: 'SUPER_ADMIN',
            perms: permissionsList
        },
        {
            name: 'COMPANY_ADMIN',
            perms: ['RFQ_CREATE', 'RFQ_VIEW', 'OFFER_ACCEPT', 'ORDER_VIEW', 'USER_MANAGE']
        },
        {
            name: 'SALES',
            perms: ['OFFER_CREATE', 'RFQ_VIEW']
        },
        {
            name: 'PROCUREMENT',
            perms: ['RFQ_CREATE', 'RFQ_VIEW', 'OFFER_ACCEPT']
        }
    ];

    for (const r of roleDefinitions) {
        const createdRole = await prisma.role.upsert({
            where: { name: r.name },
            update: {},
            create: { name: r.name }
        });

        const currentRolePerms = await prisma.rolePermission.findMany({ where: { roleId: createdRole.id } });
        if (currentRolePerms.length === 0) {
            const permsToConnect = getPermIds(r.perms);
            for (const p of permsToConnect) {
                await prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId: createdRole.id, permissionId: p.permissionId } },
                    update: {},
                    create: { roleId: createdRole.id, permissionId: p.permissionId }
                });
            }
        }
    }

    const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });

    const company = await prisma.company.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'SYSTEM',
            type: 'both',
            taxNumber: '0000000000',
            city: 'System',
            role: 'BOTH',
            membershipType: 'PREMIUM',
            isActive: true,
            membershipStart: new Date(),
        },
    });

    const adminEmail = 'admin@demirpiyasa.com';
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { roleId: superAdminRole.id },
        create: {
            name: 'Super Admin',
            email: adminEmail,
            password: '123456',
            roleId: superAdminRole.id,
            companyId: company.id,
        },
    });

    console.log('[SEED] RBAC data, SYSTEM company, and SUPER_ADMIN user seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
