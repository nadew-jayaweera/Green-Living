import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Toggle like on a forum post
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;

        // Check if already liked
        const existingLike = await prisma.like.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existingLike) {
            // Unlike
            await prisma.like.delete({ where: { id: existingLike.id } });
            return NextResponse.json({ liked: false });
        } else {
            // Like
            await prisma.like.create({ data: { userId, postId } });
            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
    }
}
