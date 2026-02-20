import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndAwardBadges } from "@/lib/badges";

// Middleware helper to check admin role
async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    const role = (session.user as { role: string }).role;
    if (role !== "ADMIN") return null;
    return session;
}

// GET: Admin dashboard stats
export async function GET() {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const [totalUsers, totalUploads, pendingUploads, totalPosts, totalComments] = await Promise.all([
            prisma.user.count(),
            prisma.upload.count(),
            prisma.upload.count({ where: { status: "PENDING" } }),
            prisma.forumPost.count(),
            prisma.comment.count(),
        ]);

        const recentUploads = await prisma.upload.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const recentPosts = await prisma.forumPost.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                suspended: true,
                createdAt: true,
                _count: { select: { uploads: true, badges: true, forumPosts: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL || "";

        return NextResponse.json({
            stats: { totalUsers, totalUploads, pendingUploads, totalPosts, totalComments },
            recentUploads,
            recentPosts,
            allUsers,
            mainAdminEmail,
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: "Failed to fetch admin data" }, { status: 500 });
    }
}

// PATCH: Moderate uploads (approve/reject)
export async function PATCH(request: Request) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { uploadId, action } = await request.json();

        if (!uploadId || !["APPROVED", "REJECTED"].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const upload = await prisma.upload.update({
            where: { id: uploadId },
            data: { status: action },
        });

        // Award badges only when upload is approved
        let newBadges = null;
        if (action === "APPROVED") {
            newBadges = await checkAndAwardBadges(upload.userId);
        }

        return NextResponse.json({ message: `Upload ${action.toLowerCase()}`, upload, newBadges });
    } catch (error) {
        console.error("Moderation error:", error);
        return NextResponse.json({ error: "Failed to moderate" }, { status: 500 });
    }
}

// PUT: Toggle user role
export async function PUT(request: Request) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { userId, newRole } = await request.json();

        if (!userId || !["USER", "ADMIN"].includes(newRole)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // Only the main admin can promote/demote users
        const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL || "";
        const currentUserEmail = (session.user as { email?: string })?.email;
        if (currentUserEmail !== mainAdminEmail) {
            return NextResponse.json({ error: "Only the main admin can manage user roles" }, { status: 403 });
        }

        // Prevent self-demotion
        const currentUser = (session.user as { id?: string });
        if (currentUser.id === userId) {
            return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
        }

        // Prevent demoting the main admin
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (targetUser?.email === mainAdminEmail) {
            return NextResponse.json({ error: "Cannot change the main admin's role" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        return NextResponse.json({ message: `User role updated to ${newRole}`, user });
    } catch (error) {
        console.error("Role update error:", error);
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }
}

// DELETE: Remove content
export async function DELETE(request: Request) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { type, id } = await request.json();

        if (type === "upload") {
            await prisma.upload.delete({ where: { id } });
        } else if (type === "post") {
            await prisma.forumPost.delete({ where: { id } });
        } else if (type === "user") {
            // Prevent self-deletion
            const currentUser = (session.user as { id?: string });
            if (currentUser.id === id) {
                return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
            }
            // Prevent deleting the main admin
            const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL || "";
            const targetUser = await prisma.user.findUnique({ where: { id } });
            if (targetUser?.email === mainAdminEmail) {
                return NextResponse.json({ error: "Cannot delete the main admin" }, { status: 400 });
            }
            await prisma.user.delete({ where: { id } });
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        return NextResponse.json({ message: "Content deleted" });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}

// POST: Suspend/unsuspend user
export async function POST(request: Request) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { userId, action } = await request.json();

        if (!userId || !["suspend", "unsuspend"].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // Prevent self-suspension
        const currentUser = (session.user as { id?: string });
        if (currentUser.id === userId) {
            return NextResponse.json({ error: "Cannot suspend yourself" }, { status: 400 });
        }

        // Prevent suspending the main admin
        const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL || "";
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (targetUser?.email === mainAdminEmail) {
            return NextResponse.json({ error: "Cannot suspend the main admin" }, { status: 400 });
        }

        const suspended = action === "suspend";
        const user = await prisma.user.update({
            where: { id: userId },
            data: { suspended },
        });

        return NextResponse.json({ 
            message: `User ${suspended ? "suspended" : "unsuspended"} successfully`, 
            user 
        });
    } catch (error) {
        console.error("Suspension error:", error);
        return NextResponse.json({ error: "Failed to update suspension status" }, { status: 500 });
    }
}
