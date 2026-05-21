import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

type BadgeDoc = {
    id: string;
    name?: string;
    icon?: string;
    description?: string;
    threshold?: number;
    badgeId?: string;
    earnedAt?: unknown;
};

// GET: Fetch badges for a user
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            // Return all badges
            const badgesSnapshot = await firestore.collection("badges").get();
            const badges: BadgeDoc[] = badgesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Record<string, unknown>),
            })) as BadgeDoc[];
            badges.sort((a, b) => Number(a.threshold ?? 0) - Number(b.threshold ?? 0));
            return NextResponse.json({ badges });
        }

        // Return user's earned badges
        const userBadgesSnapshot = await firestore
            .collection("userBadges")
            .where("userId", "==", userId)
            .get();

        const userBadges: BadgeDoc[] = await Promise.all(
            userBadgesSnapshot.docs.map(async (doc) => {
                const userBadge = doc.data() as { badgeId?: string; earnedAt?: unknown };
                const badgeSnapshot = userBadge.badgeId
                    ? await firestore.collection("badges").doc(userBadge.badgeId).get()
                    : null;

                return {
                    id: doc.id,
                    badgeId: userBadge.badgeId,
                    earnedAt: userBadge.earnedAt,
                    ...(badgeSnapshot?.data() ?? {}),
                };
            })
        );

        userBadges.sort((a, b) => {
            const aTime = typeof a.earnedAt === "string" ? new Date(a.earnedAt).getTime() : 0;
            const bTime = typeof b.earnedAt === "string" ? new Date(b.earnedAt).getTime() : 0;
            return bTime - aTime;
        });

        return NextResponse.json({
            badges: userBadges,
        });
    } catch (error) {
        console.error("Error fetching badges:", error);
        return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
    }
}
