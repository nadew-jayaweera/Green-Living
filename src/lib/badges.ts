import { prisma } from "@/lib/prisma";

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
    const treeCount = await prisma.upload.count({
        where: { userId, status: "APPROVED" },
    });

    // Get badges user already has
    const existingBadges = await prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
    });

    const existingBadgeNames = existingBadges.map((ub) => ub.badge.name);
    const newBadges: string[] = [];

    // Check each milestone
    for (const milestone of BADGE_MILESTONES) {
        if (treeCount >= milestone.threshold && !existingBadgeNames.includes(milestone.name)) {
            // Find or create the badge
            let badge = await prisma.badge.findUnique({
                where: { name: milestone.name },
            });

            if (!badge) {
                badge = await prisma.badge.create({
                    data: {
                        name: milestone.name,
                        icon: milestone.icon,
                        description: milestone.description,
                        threshold: milestone.threshold,
                    },
                });
            }

            // Award badge to user
            await prisma.userBadge.create({
                data: { userId, badgeId: badge.id },
            });

            newBadges.push(milestone.name);
        }
    }

    return newBadges;
}
