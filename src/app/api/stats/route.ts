import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch platform statistics
export async function GET() {
    try {
        const [totalTrees, totalUsers, recentUploads] = await Promise.all([
            prisma.upload.count({ where: { status: "APPROVED" } }),
            prisma.user.count(),
            prisma.upload.findMany({
                where: { status: "APPROVED" },
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: "desc" },
                take: 12,
            }),
        ]);

        return NextResponse.json({ totalTrees, totalUsers, recentUploads });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
