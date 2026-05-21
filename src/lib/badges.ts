import { firestore } from "@/lib/firebase-admin";
import { randomUUID } from "node:crypto";

// Badge milestone definitions
const BADGE_MILESTONES = [
    { name: "Seed Starter", icon: "🌱", description: "Planted your first tree!", threshold: 1 },
    { name: "Eco Friend", icon: "🌿", description: "Planted 5 trees!", threshold: 5 },
    { name: "Tree Guardian", icon: "🌳", description: "Planted 10 trees!", threshold: 10 },
    { name: "Forest Hero", icon: "🌲", description: "Planted 25 trees!", threshold: 25 },
    { name: "Earth Champion", icon: "🌍", description: "Planted 50 trees!", threshold: 50 },
];

export { BADGE_MILESTONES };

/**
 * Check and award badges to a user based on their total tree count.
 * Called after each successful upload.
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
    // Count user's approved uploads
    const uploadsSnapshot = await firestore
        .collection("uploads")
        .where("userId", "==", userId)
        .where("status", "==", "APPROVED")
        .get();
    const treeCount = uploadsSnapshot.size;

    // Get badges user already has
    const existingUserBadges = await firestore
        .collection("userBadges")
        .where("userId", "==", userId)
        .get();
    const existingBadgeIds = new Set(
        existingUserBadges.docs
            .map((doc) => doc.data().badgeId)
            .filter((badgeId): badgeId is string => typeof badgeId === "string")
    );

    const allBadgesSnapshot = await firestore.collection("badges").get();
    const badgesByName = new Map(
        allBadgesSnapshot.docs.map((doc) => {
            const data = doc.data() as { name?: string };
            return [data.name ?? "", { id: doc.id, ...data }];
        })
    );
    const newBadges: string[] = [];

    // Check each milestone
    for (const milestone of BADGE_MILESTONES) {
        if (treeCount >= milestone.threshold) {
            // Find or create the badge
            let badge = badgesByName.get(milestone.name) as
                | { id: string; name?: string }
                | undefined;

            if (!badge) {
                const badgeId = randomUUID();
                await firestore.collection("badges").doc(badgeId).set({
                    name: milestone.name,
                    icon: milestone.icon,
                    description: milestone.description,
                    threshold: milestone.threshold,
                });
                badge = { id: badgeId, name: milestone.name };
                badgesByName.set(milestone.name, badge);
            }

            if (existingBadgeIds.has(badge.id)) {
                continue;
            }

            // Award badge to user
            await firestore.collection("userBadges").doc(randomUUID()).set({
                userId,
                badgeId: badge.id,
                earnedAt: new Date().toISOString(),
            });

            existingBadgeIds.add(badge.id);

            newBadges.push(milestone.name);
        }
    }

    return newBadges;
}
