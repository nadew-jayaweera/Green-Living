import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { firestore, Timestamp } from "@/lib/firebase-admin";

// Middleware helper to check admin role
async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    const role = (session.user as { role: string }).role;
    if (role !== "ADMIN") return null;
    return session;
}

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

type FirestoreDoc = {
    id: string;
    createdAt?: unknown;
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
};

async function getUserById(userId: string): Promise<FirestoreDoc | null> {
    const snap = await firestore.collection("users").doc(userId).get();
    return snap.exists ? ({ id: snap.id, ...(snap.data() as Record<string, unknown>) }) : null;
}

// GET: Admin dashboard stats
export async function GET() {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const [usersSnapshot, uploadsSnapshot, pendingUploadsSnapshot, postsSnapshot, commentsSnapshot] = await Promise.all([
            firestore.collection("users").get(),
            firestore.collection("uploads").get(),
            firestore.collection("uploads").where("status", "==", "PENDING").get(),
            firestore.collection("forumPosts").get(),
            firestore.collection("comments").get(),
        ]);

        const allUsersRaw: FirestoreDoc[] = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Record<string, unknown>),
        }));
        allUsersRaw.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        const allPostsRaw: FirestoreDoc[] = postsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Record<string, unknown>),
        }));
        allPostsRaw.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        const allUploadsRaw: FirestoreDoc[] = uploadsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Record<string, unknown>),
        }));
        allUploadsRaw.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        const recentUploads = await Promise.all(
            allUploadsRaw.slice(0, 20).map(async (upload) => ({
                ...upload,
                user: await getUserById(String(upload.userId ?? "")),
            }))
        );

        const recentPosts = await Promise.all(
            allPostsRaw.slice(0, 20).map(async (post) => ({
                ...post,
                user: await getUserById(String(post.userId ?? "")),
            }))
        );

        const allUsers = await Promise.all(
            allUsersRaw.map(async (user) => {
                const userId = String(user.id);
                const [uploadsCountSnap, badgesCountSnap, forumCountSnap] = await Promise.all([
                    firestore.collection("uploads").where("userId", "==", userId).get(),
                    firestore.collection("userBadges").where("userId", "==", userId).get(),
                    firestore.collection("forumPosts").where("userId", "==", userId).get(),
                ]);

                return {
                    id: userId,
                    name: user.name ?? null,
                    email: user.email ?? null,
                    role: user.role ?? "USER",
                    createdAt: user.createdAt ?? null,
                    _count: {
                        uploads: uploadsCountSnap.size,
                        badges: badgesCountSnap.size,
                        forumPosts: forumCountSnap.size,
                    },
                };
            })
        );

        const totalUsers = usersSnapshot.size;
        const totalUploads = uploadsSnapshot.size;
        const pendingUploads = pendingUploadsSnapshot.size;
        const totalPosts = postsSnapshot.size;
        const totalComments = commentsSnapshot.size;

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

        const uploadRef = firestore.collection("uploads").doc(uploadId);
        const uploadSnap = await uploadRef.get();
        if (!uploadSnap.exists) {
            return NextResponse.json({ error: "Upload not found" }, { status: 404 });
        }

        await uploadRef.set({ status: action }, { merge: true });
        const upload = { id: uploadSnap.id, ...(uploadSnap.data() as Record<string, unknown>), status: action };

        return NextResponse.json({ message: `Upload ${action.toLowerCase()}`, upload });
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
        const targetUser = await getUserById(userId);
        if (targetUser?.email === mainAdminEmail) {
            return NextResponse.json({ error: "Cannot change the main admin's role" }, { status: 400 });
        }

        await firestore.collection("users").doc(userId).set({ role: newRole }, { merge: true });
        const updatedUser = await getUserById(userId);
        const user = updatedUser ? { ...updatedUser } : { id: userId, role: newRole };

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
            await firestore.collection("uploads").doc(id).delete();
        } else if (type === "post") {
            const postRef = firestore.collection("forumPosts").doc(id);
            const [commentsSnap, likesSnap] = await Promise.all([
                firestore.collection("comments").where("postId", "==", id).get(),
                firestore.collection("likes").where("postId", "==", id).get(),
            ]);
            const batch = firestore.batch();
            commentsSnap.docs.forEach((doc) => batch.delete(doc.ref));
            likesSnap.docs.forEach((doc) => batch.delete(doc.ref));
            batch.delete(postRef);
            await batch.commit();
        } else if (type === "user") {
            // Prevent self-deletion
            const currentUser = (session.user as { id?: string });
            if (currentUser.id === id) {
                return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
            }
            // Prevent deleting the main admin
            const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL || "";
            const targetUser = await getUserById(id);
            if (targetUser?.email === mainAdminEmail) {
                return NextResponse.json({ error: "Cannot delete the main admin" }, { status: 400 });
            }
            const [uploadsSnap, postsSnap, commentsSnap, likesSnap, badgesSnap] = await Promise.all([
                firestore.collection("uploads").where("userId", "==", id).get(),
                firestore.collection("forumPosts").where("userId", "==", id).get(),
                firestore.collection("comments").where("userId", "==", id).get(),
                firestore.collection("likes").where("userId", "==", id).get(),
                firestore.collection("userBadges").where("userId", "==", id).get(),
            ]);

            const batch = firestore.batch();
            uploadsSnap.docs.forEach((doc) => batch.delete(doc.ref));
            postsSnap.docs.forEach((doc) => batch.delete(doc.ref));
            commentsSnap.docs.forEach((doc) => batch.delete(doc.ref));
            likesSnap.docs.forEach((doc) => batch.delete(doc.ref));
            badgesSnap.docs.forEach((doc) => batch.delete(doc.ref));
            batch.delete(firestore.collection("users").doc(id));
            await batch.commit();
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        return NextResponse.json({ message: "Content deleted" });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
