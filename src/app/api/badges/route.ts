import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch badges for a user
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            // Return all badges
            const badges = await prisma.badge.findMany({
                orderBy: { threshold: "asc" },
            });
            return NextResponse.json({ badges });
        }

        // Return user's earned badges
        const userBadges = await prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true },
            orderBy: { earnedAt: "desc" },
        });

        return NextResponse.json({
            badges: userBadges.map((ub) => ({
                badgeId: ub.badgeId,
                earnedAt: ub.earnedAt,
                ...ub.badge,
            })),
        });
    } catch (error) {
        console.error("Error fetching badges:", error);
        return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
    }
}
