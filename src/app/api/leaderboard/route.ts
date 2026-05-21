import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

// GET: Fetch leaderboard (top planters)
export async function GET() {
    try {
        const [usersSnapshot, uploadsSnapshot] = await Promise.all([
            firestore.collection("users").get(),
            firestore.collection("uploads").where("status", "==", "APPROVED").get(),
        ]);

        const uploadCounts = new Map<string, number>();
        uploadsSnapshot.docs.forEach((doc) => {
            const data = doc.data() as { userId?: string };
            if (!data.userId) return;
            uploadCounts.set(data.userId, (uploadCounts.get(data.userId) ?? 0) + 1);
        });

        const activeUsers = usersSnapshot.docs
            .map((doc) => {
                const data = doc.data() as { name?: string };
                return {
                    id: doc.id,
                    name: data.name ?? "Unknown",
                    _count: { uploads: uploadCounts.get(doc.id) ?? 0 },
                };
            })
            .filter((u) => u._count.uploads > 0)
            .sort((a, b) => b._count.uploads - a._count.uploads)
            .slice(0, 50);

        return NextResponse.json({ users: activeUsers });
    } catch (error) {
        console.error("Leaderboard error:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
