import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { firestore } from "@/lib/firebase-admin";
import { randomUUID } from "node:crypto";

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

        const postSnapshot = await firestore.collection("forumPosts").doc(postId).get();
        if (!postSnapshot.exists) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // Check if already liked
        const existingLike = await firestore
            .collection("likes")
            .where("userId", "==", userId)
            .where("postId", "==", postId)
            .limit(1)
            .get();

        if (!existingLike.empty) {
            // Unlike
            await firestore.collection("likes").doc(existingLike.docs[0].id).delete();
            return NextResponse.json({ liked: false });
        } else {
            // Like
            await firestore.collection("likes").doc(randomUUID()).set({
                userId,
                postId,
                createdAt: new Date().toISOString(),
            });
            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
    }
}
