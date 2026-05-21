import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/blob";
import { checkAndAwardBadges } from "@/lib/badges";

// GET: Fetch uploads (public = approved only, or user's own = can filter by status)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const userId = searchParams.get("userId");
        const status = searchParams.get("status"); // Optional: APPROVED, PENDING, REJECTED

        let where: any = userId ? { userId } : { status: "APPROVED" };
        
        // If status is specified for user uploads, apply it
        if (userId && status) {
            where.status = status;
        }

        const [uploads, total] = await Promise.all([
            prisma.upload.findMany({
                where,
                include: { user: { select: { id: true, name: true, image: true } } },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.upload.count({ where }),
        ]);

        return NextResponse.json({ uploads, total, pages: Math.ceil(total / limit) });
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("image") as File | null;
        const location = formData.get("location") as string;
        const description = formData.get("description") as string;
        const treeType = formData.get("treeType") as string;

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
        const imageUrl = await uploadImage(buffer, "green-living", file.name, file.type);

        const userId = (session.user as { id: string }).id;

        // Create upload record
        const upload = await prisma.upload.create({
            data: {
                userId,
                imageUrl,
                location,
                description,
                treeType,
                status: "PENDING", // Awaiting admin approval
            },
        });

        return NextResponse.json(
            { message: "Tree uploaded successfully! Awaiting admin approval.", upload },
            { status: 201 }
        );
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
    }
}
