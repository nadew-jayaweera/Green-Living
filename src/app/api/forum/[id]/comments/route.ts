import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Add a comment to a forum post
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

        const { content } = await request.json();
        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
        }

        const userId = (session.user as { id: string }).id;

        // Sanitize
        const sanitizedContent = content.trim().slice(0, 2000);

        const comment = await prisma.comment.create({
            data: { userId, postId, content: sanitizedContent },
            include: {
                user: { select: { id: true, name: true, image: true } },
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
