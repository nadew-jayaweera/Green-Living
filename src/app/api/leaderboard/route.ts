import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch leaderboard (top planters)
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        uploads: {
                            where: { status: "APPROVED" },
                        },
                    },
                },
            },
            orderBy: {
                uploads: {
                    _count: "desc",
                },
            },
            take: 50,
        });

        // Filter out users with 0 uploads
        const activeUsers = users.filter((u: { _count: { uploads: number } }) => u._count.uploads > 0);

        return NextResponse.json({ users: activeUsers });
    } catch (error) {
        console.error("Leaderboard error:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
