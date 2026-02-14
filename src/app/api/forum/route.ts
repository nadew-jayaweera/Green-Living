import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch forum posts with filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const sort = searchParams.get("sort") || "latest";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const where = category ? { category } : {};

        const orderBy =
            sort === "popular"
                ? { likes: { _count: "desc" as const } }
                : { createdAt: "desc" as const };

        const posts = await prisma.forumPost.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, image: true } },
                _count: { select: { comments: true, likes: true } },
            },
            orderBy: sort === "popular" ? { likes: { _count: "desc" } } : { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.forumPost.count({ where });

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

        const post = await prisma.forumPost.create({
            data: {
                userId,
                title: sanitizedTitle,
                content: sanitizedContent,
                category,
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
