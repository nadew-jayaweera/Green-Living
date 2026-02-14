import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch a single forum post with comments
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string })?.id;

        const post = await prisma.forumPost.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, image: true } },
                comments: {
                    include: {
                        user: { select: { id: true, name: true, image: true } },
                    },
                    orderBy: { createdAt: "asc" },
                },
                likes: true,
                _count: { select: { comments: true, likes: true } },
            },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const isLiked = userId ? post.likes.some((like) => like.userId === userId) : false;

        return NextResponse.json({ ...post, isLiked, likes: undefined });
    } catch (error) {
        console.error("Error fetching post:", error);
        return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    }
}

// DELETE: Delete a forum post (owner or admin only)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;
        const userRole = (session.user as { role: string }).role;

        const post = await prisma.forumPost.findUnique({ where: { id } });
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        if (post.userId !== userId && userRole !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.forumPost.delete({ where: { id } });
        return NextResponse.json({ message: "Post deleted" });
    } catch (error) {
        console.error("Error deleting post:", error);
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}
