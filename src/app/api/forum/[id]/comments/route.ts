import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { firestore } from "@/lib/firebase-admin";
import { randomUUID } from "node:crypto";

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

        const postSnapshot = await firestore.collection("forumPosts").doc(postId).get();
        if (!postSnapshot.exists) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const commentId = randomUUID();
        const comment = {
            id: commentId,
            userId,
            postId,
            content: sanitizedContent,
            createdAt: new Date().toISOString(),
        };

        await firestore.collection("comments").doc(commentId).set({
            userId,
            postId,
            content: sanitizedContent,
            createdAt: comment.createdAt,
        });

        const userSnapshot = await firestore.collection("users").doc(userId).get();
        const userData = userSnapshot.data() as { name?: string; image?: string } | undefined;

        return NextResponse.json(
            {
                ...comment,
                user: {
                    id: userId,
                    name: userData?.name ?? "Unknown",
                    image: userData?.image ?? null,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
