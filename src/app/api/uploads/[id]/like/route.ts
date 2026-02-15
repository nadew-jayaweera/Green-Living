import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

        // Check if upload exists
        const upload = await prisma.upload.findUnique({
            where: { id },
        });

        if (!upload) {
            return NextResponse.json({ error: "Upload not found" }, { status: 404 });
        }

        // Check if already liked
        const existingLike = await (prisma as any).uploadLike.findUnique({
            where: {
                userId_uploadId: {
                    userId,
                    uploadId: id,
                },
            },
        });

        if (existingLike) {
            // Unlike
            await (prisma as any).uploadLike.delete({
                where: {
                    userId_uploadId: {
                        userId,
                        uploadId: id,
                    },
                },
            });
            return NextResponse.json({ liked: false });
        } else {
            // Like
            await (prisma as any).uploadLike.create({
                data: {
                    userId,
                    uploadId: id,
                },
            });
            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error("Like error:", error);
        return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
    }
}
