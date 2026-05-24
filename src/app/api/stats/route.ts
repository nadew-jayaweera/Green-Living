import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ensureBootstrapAdmin() {
    const totalUsers = await prisma.user.count();
    if (totalUsers > 0) return;

    const adminEmail = process.env.MAIN_ADMIN_EMAIL || "admin@greenliving.eco";
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "admin123";

    await prisma.user.create({
        data: {
            name: "Admin",
            email: adminEmail,
            password: await bcrypt.hash(adminPassword, 12),
            role: "ADMIN",
        },
    });
}

// GET: Fetch platform statistics
export async function GET() {
    try {
        await ensureBootstrapAdmin();

        const [totalTrees, totalUsers, recentUploads] = await Promise.all([
            prisma.upload.count({ where: { status: "APPROVED" } }),
            prisma.user.count(),
            prisma.upload.findMany({
                where: { status: "APPROVED" },
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: "desc" },
                take: 6,
            }),
        ]);

        return NextResponse.json({ totalTrees, totalUsers, recentUploads });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
