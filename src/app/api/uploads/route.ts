import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { firestore, Timestamp } from "@/lib/firebase-admin";
import { uploadImage } from "@/lib/cloudinary";
import { checkAndAwardBadges } from "@/lib/badges";
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

type UploadDoc = {
    id: string;
    userId?: string;
    imageUrl?: string;
    location?: string;
    description?: string;
    treeType?: string;
    status?: string;
    createdAt?: unknown;
};

// GET: Fetch uploads (public = approved only, or user's own)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const userId = searchParams.get("userId");

        const query = userId
            ? firestore.collection("uploads").where("userId", "==", userId)
            : firestore.collection("uploads").where("status", "==", "APPROVED");

        const snapshot = await query.get();
        const uploadDocs: UploadDoc[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Record<string, unknown>),
        }));

        uploadDocs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        const paged = uploadDocs.slice((page - 1) * limit, page * limit);

        const userIds = Array.from(new Set(paged.map((u) => u.userId).filter((id): id is string => typeof id === "string")));
        const users = await Promise.all(userIds.map((id) => firestore.collection("users").doc(id).get()));
        const userMap = new Map(
            users
                .filter((doc) => doc.exists)
                .map((doc) => {
                    const data = doc.data() as { name?: string; image?: string };
                    return [doc.id, { id: doc.id, name: data?.name ?? "Unknown", image: data?.image ?? null }];
                })
        );

        const uploads = paged.map((upload) => ({
            ...upload,
            createdAt: toIsoString(upload.createdAt),
            user: userMap.get(upload.userId as string) ?? null,
        }));

        const total = uploadDocs.length;

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
        const imageUrl = await uploadImage(buffer);

        const userId = (session.user as { id: string }).id;

        // Create upload record
        const uploadId = randomUUID();
        const uploadData = {
                id: uploadId,
                userId,
                imageUrl,
                location,
                description,
                treeType,
                status: "PENDING", // Awaiting admin approval
                createdAt: new Date().toISOString(),
            };

        await firestore.collection("uploads").doc(uploadId).set(uploadData);

        // Check and award badges
        const newBadges = await checkAndAwardBadges(userId);

        return NextResponse.json(
            { message: "Tree uploaded successfully!", upload: uploadData, newBadges },
            { status: 201 }
        );
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
    }
}
