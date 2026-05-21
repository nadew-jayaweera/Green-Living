import { NextResponse } from "next/server";
import { firestore, Timestamp } from "@/lib/firebase-admin";

type UploadDoc = {
    id: string;
    userId?: string;
    createdAt?: unknown;
    status?: string;
};

function toMillis(value: unknown): number {
    if (!value) return 0;
    if (typeof value === "string") {
        const ms = new Date(value).getTime();
        return Number.isNaN(ms) ? 0 : ms;
    }
    if (value instanceof Date) return value.getTime();
    if (value instanceof Timestamp) return value.toDate().getTime();
    return 0;
}

// GET: Fetch platform statistics
export async function GET() {
    try {
        const [usersSnapshot, uploadsSnapshot] = await Promise.all([
            firestore.collection("users").get(),
            firestore.collection("uploads").where("status", "==", "APPROVED").get(),
        ]);

        const totalUsers = usersSnapshot.size;
        const approvedUploads: UploadDoc[] = uploadsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Record<string, unknown>),
        })) as UploadDoc[];

        approvedUploads.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        const recentUploads = await Promise.all(
            approvedUploads.slice(0, 6).map(async (upload) => {
                const userSnapshot = upload.userId ? await firestore.collection("users").doc(String(upload.userId)).get() : null;
                const userData = userSnapshot?.data() as { name?: string } | undefined;
                return {
                    ...upload,
                    user: { name: userData?.name ?? "Unknown" },
                };
            })
        );

        const totalTrees = approvedUploads.length;

        return NextResponse.json({ totalTrees, totalUsers, recentUploads });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
