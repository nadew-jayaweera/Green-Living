import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { randomUUID } from "node:crypto";

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

// GET: Fetch forum posts with filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const sort = searchParams.get("sort") || "latest";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const query = category
            ? firestore.collection("forumPosts").where("category", "==", category)
            : firestore.collection("forumPosts");

        const postSnapshot = await query.get();
        const postsWithCounts = await Promise.all(
            postSnapshot.docs.map(async (doc) => {
                const data = doc.data() as Record<string, unknown>;
                const [commentsSnapshot, likesSnapshot, userSnapshot] = await Promise.all([
                    firestore.collection("comments").where("postId", "==", doc.id).get(),
                    firestore.collection("likes").where("postId", "==", doc.id).get(),
                    firestore.collection("users").doc(String(data.userId)).get(),
                ]);

                const userData = userSnapshot.data() as { name?: string; image?: string } | undefined;

                return {
                    id: doc.id,
                    ...data,
                    createdAt: toIsoString(data.createdAt),
                    user: {
                        id: String(data.userId),
                        name: userData?.name ?? "Unknown",
                        image: userData?.image ?? null,
                    },
                    _count: {
                        comments: commentsSnapshot.size,
                        likes: likesSnapshot.size,
                    },
                };
            })
        );

        postsWithCounts.sort((a, b) => {
            if (sort === "popular") {
                return b._count.likes - a._count.likes;
            }
            return toMillis(b.createdAt) - toMillis(a.createdAt);
        });

        const total = postsWithCounts.length;
        const posts = postsWithCounts.slice((page - 1) * limit, page * limit);

        return NextResponse.json({ posts, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

// POST: Create a new forum post
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, content, category } = await request.json();

        if (!title || !content || !category) {
            return NextResponse.json(
                { error: "Title, content, and category are required" },
                { status: 400 }
            );
        }

        // Sanitize input
        const sanitizedTitle = title.trim().slice(0, 200);
        const sanitizedContent = content.trim().slice(0, 5000);

        const userId = (session.user as { id: string }).id;

        const postId = randomUUID();
        const post = {
                id: postId,
                userId,
                title: sanitizedTitle,
                content: sanitizedContent,
                category,
                createdAt: new Date().toISOString(),
            };

        await firestore.collection("forumPosts").doc(postId).set(post);

        const userSnapshot = await firestore.collection("users").doc(userId).get();
        const userData = userSnapshot.data() as { name?: string; image?: string } | undefined;

        return NextResponse.json(
            {
                ...post,
                user: {
                    id: userId,
                    name: userData?.name ?? "Unknown",
                    image: userData?.image ?? null,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
