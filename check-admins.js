
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true, name: true }
    });
    console.log('ADMINS:');
    console.log(JSON.stringify(admins, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
