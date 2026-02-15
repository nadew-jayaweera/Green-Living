import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const nameInput = formData.get("name");
        const name = typeof nameInput === "string" ? nameInput.trim() : "";
        const file = formData.get("image") as File | null;

        console.log("Profile update request received:", { name: name.length > 0, hasFile: !!file, fileSize: file?.size, fileType: file?.type });

        const updateData: { name?: string; image?: string } = {};

        if (name) {
            if (name.length < 2 || name.length > 50) {
                return NextResponse.json(
                    { error: "Name must be between 2 and 50 characters" },
                    { status: 400 }
                );
            }
            updateData.name = name;
        }

        if (file) {
            if (!file.type.startsWith("image/")) {
                return NextResponse.json({ error: "File must be an image" }, { status: 400 });
            }

            if (file.size > 3 * 1024 * 1024) {
                return NextResponse.json({ error: "Image must be under 3MB" }, { status: 400 });
            }

            try {
                const buffer = Buffer.from(await file.arrayBuffer());
                const uploadedUrl = await uploadImage(buffer, "green-living/avatars");
                console.log("Image uploaded successfully to:", uploadedUrl);
                updateData.image = uploadedUrl;
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return NextResponse.json(
                    { error: "Failed to upload image to cloud storage" },
                    { status: 500 }
                );
            }
        }

        if (!updateData.name && !updateData.image) {
            return NextResponse.json({ error: "No changes provided" }, { status: 400 });
        }

        const userId = (session.user as { id: string }).id;
        console.log("Updating user", userId, "with data:", { hasName: !!updateData.name, hasImage: !!updateData.image, imageSizeKB: updateData.image ? (updateData.image.length / 1024).toFixed(2) : 0 });
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, email: true, image: true },
        });

        console.log("User updated successfully:", { id: user.id, name: user.name, hasImage: !!user.image });

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
