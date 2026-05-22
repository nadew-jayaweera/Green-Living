const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

const BADGES = [
    { name: "Seed Starter", icon: "🌱", description: "Planted your first tree!", threshold: 1 },
    { name: "Eco Friend", icon: "🌿", description: "Planted 5 trees!", threshold: 5 },
    { name: "Tree Guardian", icon: "🌳", description: "Planted 10 trees!", threshold: 10 },
    { name: "Forest Hero", icon: "🌲", description: "Planted 25 trees!", threshold: 25 },
    { name: "Earth Champion", icon: "🌍", description: "Planted 50 trees!", threshold: 50 },
];

async function main() {
    console.log("🌱 Seeding database...");

    for (const badge of BADGES) {
        await prisma.badge.upsert({
            where: { name: badge.name },
            update: {},
            create: badge,
        });
    }
    console.log("✅ Badges created");

    const adminPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.upsert({
        where: { email: "admin@greenliving.eco" },
        update: {},
        create: {
            name: "Admin",
            email: "admin@greenliving.eco",
            password: adminPassword,
            role: "ADMIN",
        },
    });
    console.log("✅ Admin user created (admin@greenliving.eco / admin123)");

    console.log("🌍 Database seeded successfully!");
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
