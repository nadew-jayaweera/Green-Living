import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { firestore, Timestamp } from "@/lib/firebase-admin";

function toMillis(value: unknown): number {
    if (!value) return 0;
    if (typeof value === "string") {
        const ms = new Date(value).getTime();
        return Number.isNaN(ms) ? 0 : ms;
    }
    if (value instanceof Date) return value.getTime();
    if (value instanceof Timestamp) return value.toDate().getTime();
    if (typeof value === "object" && value && "toDate" in (value as object)) {
        try {
            return ((value as { toDate: () => Date }).toDate()).getTime();
        } catch {
            return 0;
        }
    }
    return 0;
}

function toIsoString(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (typeof value === "object" && value && "toDate" in (value as object)) {
        try {
            return ((value as { toDate: () => Date }).toDate()).toISOString();
        } catch {
            return null;
        }
    }
    return null;
}

// GET: Fetch a single forum post with comments
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string })?.id;

        const postSnapshot = await firestore.collection("forumPosts").doc(id).get();
        if (!postSnapshot.exists) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const postData = postSnapshot.data() as { userId: string; createdAt?: unknown };

        const [postUserSnapshot, commentsSnapshot, likesSnapshot] = await Promise.all([
            firestore.collection("users").doc(postData.userId).get(),
            firestore.collection("comments").where("postId", "==", id).get(),
            firestore.collection("likes").where("postId", "==", id).get(),
        ]);

        const comments = await Promise.all(
            commentsSnapshot.docs.map(async (doc) => {
                const data = doc.data() as { userId: string; createdAt?: unknown };
                const commentUserSnapshot = await firestore.collection("users").doc(data.userId).get();
                const commentUser = commentUserSnapshot.data() as { name?: string; image?: string } | undefined;
                return {
                    id: doc.id,
                    ...data,
                    createdAt: toIsoString(data.createdAt),
                    user: {
                        id: data.userId,
                        name: commentUser?.name ?? "Unknown",
                        image: commentUser?.image ?? null,
                    },
                };
            })
        );

        comments.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));

        const likes = likesSnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as { userId: string }) }));
        const isLiked = userId ? likes.some((like) => like.userId === userId) : false;

        const postUser = postUserSnapshot.data() as { name?: string; image?: string } | undefined;

        const post = {
            id: postSnapshot.id,
            ...(postSnapshot.data() as Record<string, unknown>),
            createdAt: toIsoString(postData.createdAt),
            user: {
                id: postData.userId,
                name: postUser?.name ?? "Unknown",
                image: postUser?.image ?? null,
            },
            comments,
            _count: {
                comments: comments.length,
                likes: likes.length,
            },
            isLiked,
        };

        return NextResponse.json(post);
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

        const postRef = firestore.collection("forumPosts").doc(id);
        const postSnapshot = await postRef.get();
        if (!postSnapshot.exists) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const post = postSnapshot.data() as { userId: string };

        if (post.userId !== userId && userRole !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const [commentsSnapshot, likesSnapshot] = await Promise.all([
            firestore.collection("comments").where("postId", "==", id).get(),
            firestore.collection("likes").where("postId", "==", id).get(),
        ]);

        const batch = firestore.batch();
        commentsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        likesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        batch.delete(postRef);
        await batch.commit();

        return NextResponse.json({ message: "Post deleted" });
    } catch (error) {
        console.error("Error deleting post:", error);
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}
