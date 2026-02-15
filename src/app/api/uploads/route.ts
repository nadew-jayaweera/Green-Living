import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { checkAndAwardBadges } from "@/lib/badges";

// GET: Fetch uploads (public = approved only, or user's own)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const userId = searchParams.get("userId");

        const where = userId
            ? { userId }
            : { status: "APPROVED" };

        const [uploads, total] = await Promise.all([
            prisma.upload.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    // @ts-ignore
                    likes: true, // Include likes to count/check
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.upload.count({ where }),
        ]);

        // Get current user session to check isLiked
        const session = await getServerSession(authOptions);
        const currentUserId = session?.user ? (session.user as { id: string }).id : null;

        const uploadsWithLikes = uploads.map(upload => {
            const u = upload as any;
            return {
                ...upload,
                likes: undefined, // Remove raw likes array
                isLiked: currentUserId ? u.likes.some((like: any) => like.userId === currentUserId) : false,
                _count: { likes: u.likes.length }
            };
        });

        return NextResponse.json({ uploads: uploadsWithLikes, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error("Error fetching uploads:", error);
        return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 });
    }
}

// POST: Create a new upload
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            console.error("Upload attempt without session");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        console.log("Upload request from user:", session.user.email, "ID:", userId);

        if (!userId) {
            console.error("User ID missing in session");
            return NextResponse.json({ error: "User ID missing. Try logging out and back in." }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get("image") as File | null;
        const location = formData.get("location") as string;
        const description = formData.get("description") as string;
        const treeType = formData.get("treeType") as string;

        console.log("Upload data:", { location, description, treeType, fileSize: file?.size, fileType: file?.type });

        if (!file || !location || !description || !treeType) {
            return NextResponse.json(
                { error: "Image, location, description, and tree type are required" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
        }

        // Upload image
        const buffer = Buffer.from(await file.arrayBuffer());
        const imageUrl = await uploadImage(buffer);

        // const userId = (session.user as { id: string }).id;

        // Create upload record
        const upload = await prisma.upload.create({
            data: {
                userId,
                imageUrl,
                location,
                description,
                treeType,
                status: "APPROVED", // Auto-approve for now
            },
        });

        // Check and award badges
        const newBadges = await checkAndAwardBadges(userId);

        return NextResponse.json(
            { message: "Tree uploaded successfully!", upload, newBadges },
            { status: 201 }
        );
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
