"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, TreePine, Award, Image, MessageCircle, Calendar, Camera, MapPin, FileText, Trash2, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

interface Upload {
    id: string;
    imageUrl: string;
    treeType: string;
    location: string;
    description: string;
    createdAt: string;
}

interface Badge {
    name: string;
    icon: string;
    description: string;
    earnedAt: string;
}

interface Post {
    id: string;
    title: string;
    category: string;
    createdAt: string;
    _count: { comments: number; likes: number };
}

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const { addToast } = useToast();
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [treeCount, setTreeCount] = useState(0);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<"uploads" | "badges" | "posts">("uploads");

    // Profile Edit State
    const [profileName, setProfileName] = useState("");
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");

    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showAvatarOverlay, setShowAvatarOverlay] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [uploadToDelete, setUploadToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const userId = (session.user as { id: string }).id;

            fetch(`/api/uploads?userId=${userId}&limit=50`)
                .then((r) => r.json())
                .then((d) => { setUploads(d.uploads || []); setTreeCount(d.total || 0); });

            fetch(`/api/badges?userId=${userId}`)
                .then((r) => r.json())
                .then((d) => setBadges(d.badges || []));

            fetch(`/api/forum`)
                .then((r) => r.json())
                .then((d) => {
                    const userPosts = (d.posts || []).filter((p: { user: { id: string } }) => p.user.id === userId);
                    setPosts(userPosts);
                });

            // Load Bio/Location from localStorage (Simulation)
            const savedBio = localStorage.getItem(`user_bio_${userId}`);
            const savedLoc = localStorage.getItem(`user_location_${userId}`);
            if (savedBio) setBio(savedBio);
            if (savedLoc) setLocation(savedLoc);
        }
    }, [session, status]);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (session?.user) {
            setProfileName(session.user.name || "");
            setProfileImage(session.user.image || null);
        }
    }, [session]);

    useEffect(() => {
        if (!selectedImage) {
            setAvatarPreview(null);
            return;
        }

        const previewUrl = URL.createObjectURL(selectedImage);
        setAvatarPreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [selectedImage]);

    if (status === "loading") return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
    if (!session) { router.push("/login"); return null; }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setSelectedImage(file);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleSaveProfile = async (event: React.FormEvent) => {
        event.preventDefault();

        // Validate that we have something to save
        if (!profileName.trim() && !selectedImage && !bio && !location) {
            addToast("No changes to save", "info");
            return;
        }

        setIsSaving(true);

        try {
            // Save Bio/Location to localStorage (simulating DB persistence)
            const userId = (session.user as { id: string }).id;
            localStorage.setItem(`user_bio_${userId}`, bio);
            localStorage.setItem(`user_location_${userId}`, location);

            const formData = new FormData();
            if (profileName.trim()) {
                formData.append("name", profileName.trim());
            }
            if (selectedImage) {
                formData.append("image", selectedImage);
            }

            // Only call API if name or image changed
            if (profileName.trim() !== session.user?.name || selectedImage) {
                const response = await fetch("/api/profile", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.error || "Failed to update profile");
                }

                setProfileName(data.user.name || "");
                setProfileImage(data.user.image || null);
                setSelectedImage(null);
                setAvatarPreview(null);
                await update({ user: { name: data.user.name, image: data.user.image } });
            }

            addToast("Profile updated successfully!", "success");
        } catch (error) {
            console.error("Profile save error:", error);
            addToast(error instanceof Error ? error.message : "Failed to update profile", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteModal = (uploadId: string) => {
        setUploadToDelete(uploadId);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setUploadToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        if (!uploadToDelete) return;
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/uploads?id=${uploadToDelete}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to delete");

            setUploads(prev => prev.filter(u => u.id !== uploadToDelete));
            setTreeCount(prev => Math.max(0, prev - 1));
            addToast("Tree deleted successfully", "success");
            closeDeleteModal();
        } catch (error) {
            console.error("Delete error:", error);
            addToast("Failed to delete tree", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const tabs = [
        { key: "uploads", label: "My Trees", icon: <Image size={18} />, count: treeCount },
        { key: "badges", label: "Badges", icon: <Award size={18} />, count: badges.length },
        { key: "posts", label: "Posts", icon: <MessageCircle size={18} />, count: posts.length },
    ];

    return (
        <div className="page-container">
            <div style={{ width: "100%", maxWidth: "1100px" }}>
                <style jsx>{`
                .stats-grid { display: flex; justify-content: center; gap: 32px; }
                @media (max-width: 600px) {
                    .stats-grid { flex-wrap: wrap; gap: 16px; }
                    .stats-grid > div { flex: 1; min-width: 80px; }
                }
            `}</style>
                {/* Profile Header */}
                {isHydrated && (
                    <div className="glass-card animate-fade-in-up" style={{ padding: "40px", textAlign: "center", marginBottom: "32px" }}>
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            onMouseEnter={() => setShowAvatarOverlay(true)}
                            onMouseLeave={() => setShowAvatarOverlay(false)}
                            title="Change profile photo"
                            style={{
                                width: "100px", height: "100px", borderRadius: "50%",
                                background: "var(--color-cream)",
                                border: "2px solid var(--color-forest)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 16px", color: "var(--color-forest)", fontSize: "2.5rem", fontWeight: 700,
                                padding: 0,
                                cursor: "pointer",
                                overflow: "hidden",
                                position: "relative",
                            }}>
                            {avatarPreview || profileImage ? (
                                <img
                                    src={avatarPreview || profileImage || ""}
                                    alt="User avatar"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                session.user?.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                            <span
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "rgba(0, 0, 0, 0.45)",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: showAvatarOverlay ? 1 : 0,
                                    transition: "opacity 0.2s ease",
                                }}
                                aria-hidden
                            >
                                <Camera size={22} />
                            </span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                            disabled={isSaving}
                        />

                        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-forest)", marginBottom: "4px" }}>
                            {profileName || session.user?.name}
                        </h1>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>{session.user?.email}</p>

                        <div className="stats-grid">
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--color-forest-light)" }}>{treeCount}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Trees Planted</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--color-forest-light)" }}>{badges.length}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Badges Earned</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--color-forest-light)" }}>{posts.length}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Forum Posts</div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} style={{ marginTop: "28px", textAlign: "left", maxWidth: "400px", margin: "28px auto 0" }}>
                            <div style={{ display: "grid", gap: "16px" }}>
                                <div>
                                    <label className="form-label" style={{ marginBottom: "6px" }}><User size={14} style={{ display: "inline", marginRight: "4px" }} /> Display Name</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        placeholder="Enter your name"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div>
                                    <label className="form-label" style={{ marginBottom: "6px" }}><FileText size={14} style={{ display: "inline", marginRight: "4px" }} /> Bio</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Short bio about yourself..."
                                        disabled={isSaving}
                                    />
                                </div>

                                <div>
                                    <label className="form-label" style={{ marginBottom: "6px" }}><MapPin size={14} style={{ display: "inline", marginRight: "4px" }} /> Location</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="City, Country"
                                        disabled={isSaving}
                                    />
                                </div>

                                {selectedImage && (
                                    <div style={{ fontSize: "0.9rem", color: "#52b788", padding: "8px 12px", background: "rgba(82, 183, 136, 0.1)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        ✓ Image ready to upload: {selectedImage.name}
                                    </div>
                                )}

                                <button type="submit" className="btn-primary" disabled={isSaving} style={{ justifyContent: "center" }}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto" }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as "uploads" | "badges" | "posts")}
                            className={`category-pill ${activeTab === tab.key ? "active" : ""}`}
                            style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            {tab.icon} {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Uploads Tab */}
                {activeTab === "uploads" && (
                    <div>
                        {uploads.length === 0 ? (
                            <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                                <TreePine size={48} style={{ color: "var(--text-secondary)", opacity: 0.5, marginBottom: "16px" }} />
                                <h3 style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>No trees uploaded yet</h3>
                                <Link href="/upload" className="btn-primary" style={{ textDecoration: "none", marginTop: "12px", display: "inline-flex" }}>
                                    Upload Your First Tree
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                                {uploads.map((upload) => (
                                    <div key={upload.id} className="glass-card group" style={{ overflow: "hidden", position: "relative" }}>
                                        <div style={{ height: "180px", overflow: "hidden" }}>
                                            <img src={upload.imageUrl} alt={upload.treeType}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                        <div style={{ padding: "14px 18px" }}>
                                            <div style={{ fontWeight: 700, color: "#1a4d2e", marginBottom: "4px" }}>{upload.treeType}</div>
                                            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>📍 {upload.location}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <Calendar size={12} /> {new Date(upload.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => openDeleteModal(upload.id)}
                                            style={{
                                                position: "absolute",
                                                top: "10px",
                                                right: "10px",
                                                background: "rgba(255,255,255,0.9)",
                                                border: "none",
                                                borderRadius: "50%",
                                                width: "32px",
                                                height: "32px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                color: "#e63946",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                transition: "transform 0.2s"
                                            }}
                                            title="Delete Upload"
                                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Badges Tab */}
                {activeTab === "badges" && (
                    <div>
                        <div className="glass-card" style={{ padding: "32px", marginBottom: "32px" }}>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "24px", textAlign: "center" }}>
                                Next Milestone
                            </h3>
                            {(() => {
                                const milestones = [
                                    { name: "Seed Starter", icon: "🌱", threshold: 1 },
                                    { name: "Eco Friend", icon: "🌿", threshold: 5 },
                                    { name: "Tree Guardian", icon: "🌳", threshold: 10 },
                                    { name: "Forest Hero", icon: "🌲", threshold: 25 },
                                    { name: "Earth Champion", icon: "🌍", threshold: 50 },
                                ];

                                const nextBadge = milestones.find(m => treeCount < m.threshold);

                                if (!nextBadge) {
                                    return (
                                        <div style={{ textAlign: "center", color: "#2d6a4f" }}>
                                            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🏆</div>
                                            <h4 style={{ fontSize: "1.2rem", fontWeight: 700 }}>You are a Legend!</h4>
                                            <p>You've earned all available badges. Keep planting to inspire others!</p>
                                        </div>
                                    );
                                }

                                const prevThreshold = milestones[milestones.indexOf(nextBadge) - 1]?.threshold || 0;
                                const progress = Math.min(100, Math.max(0, ((treeCount - prevThreshold) / (nextBadge.threshold - prevThreshold)) * 100));
                                const treesNeeded = nextBadge.threshold - treeCount;

                                return (
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px" }}>
                                            <div>
                                                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>Current Progress</div>
                                                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--color-forest)" }}>
                                                    {treeCount} <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 500 }}>/ {nextBadge.threshold} Trees</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "2.5rem", lineHeight: 1 }}>{nextBadge.icon}</div>
                                                <div style={{ fontSize: "0.85rem", color: "var(--color-forest)", fontWeight: 700 }}>{nextBadge.name}</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ height: "16px", background: "rgba(0,0,0,0.06)", borderRadius: "50px", overflow: "hidden", position: "relative" }}>
                                            <div style={{
                                                width: `${progress}%`,
                                                height: "100%",
                                                background: "linear-gradient(90deg, #2d6a4f, #52b788)",
                                                borderRadius: "50px",
                                                transition: "width 1s ease-out",
                                                position: "relative"
                                            }}>
                                                <div style={{
                                                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                                                    backgroundImage: "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)",
                                                    backgroundSize: "1rem 1rem",
                                                    animation: "shimmer 1s linear infinite"
                                                }} />
                                            </div>
                                        </div>

                                        <p style={{ textAlign: "center", marginTop: "16px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                                            Plant <strong>{treesNeeded} more {treesNeeded === 1 ? 'tree' : 'trees'}</strong> to unlock the <strong>{nextBadge.name}</strong> badge!
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1a4d2e", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Award size={20} /> Your Collection
                        </h3>

                        {badges.length === 0 ? (
                            <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
                                <p style={{ color: "#9ca3af" }}>Plant your first tree to start your collection!</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" }}>
                                {badges.map((badge) => (
                                    <div key={badge.name} className="glass-card" style={{
                                        padding: "24px",
                                        textAlign: "center",
                                        border: "2px solid var(--input-border)",
                                        background: "var(--card-bg)"
                                    }}>
                                        <div style={{ fontSize: "3rem", marginBottom: "12px", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}>{badge.icon}</div>
                                        <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px", fontSize: "1rem" }}>{badge.name}</h3>
                                        <div style={{ fontSize: "0.75rem", color: "var(--color-forest)", fontWeight: 600 }}>
                                            {new Date(badge.earnedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {/* Show locked badges dimmed */}
                                {(() => {
                                    const allMilestones = [
                                        { name: "Seed Starter", icon: "🌱", threshold: 1 },
                                        { name: "Eco Friend", icon: "🌿", threshold: 5 },
                                        { name: "Tree Guardian", icon: "🌳", threshold: 10 },
                                        { name: "Forest Hero", icon: "🌲", threshold: 25 },
                                        { name: "Earth Champion", icon: "🌍", threshold: 50 },
                                    ];
                                    const earnedNames = badges.map(b => b.name);
                                    const lockedBadges = allMilestones.filter(m => !earnedNames.includes(m.name));

                                    return lockedBadges.map(badge => (
                                        <div key={badge.name} className="glass-card" style={{
                                            padding: "24px",
                                            textAlign: "center",
                                            opacity: 0.5,
                                            filter: "grayscale(1)",
                                            border: "2px dashed var(--text-secondary)"
                                        }}>
                                            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>{badge.icon}</div>
                                            <h3 style={{ fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px", fontSize: "1rem" }}>{badge.name}</h3>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                                Unlocks at {badge.threshold}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* Posts Tab */}
                {activeTab === "posts" && (
                    <div>
                        {posts.length === 0 ? (
                            <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                                <MessageCircle size={48} style={{ color: "#d1d5db", marginBottom: "16px" }} />
                                <h3 style={{ color: "#6b7280", marginBottom: "8px" }}>No forum posts yet</h3>
                                <Link href="/forum/create" className="btn-primary" style={{ textDecoration: "none", marginTop: "12px", display: "inline-flex" }}>
                                    Create Your First Post
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {posts.map((post) => (
                                    <Link key={post.id} href={`/forum/${post.id}`} className="glass-card"
                                        style={{ padding: "20px 24px", textDecoration: "none", color: "inherit" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <h3 style={{ fontWeight: 700, color: "#1a4d2e", marginBottom: "4px" }}>{post.title}</h3>
                                                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                                                    {post.category} • {new Date(post.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", color: "#9ca3af" }}>
                                                <span>❤️ {post._count.likes}</span>
                                                <span>💬 {post._count.comments}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    backdropFilter: "blur(5px)"
                }}>
                    <div className="glass-card animate-fade-in-up" style={{ padding: "32px", maxWidth: "400px", width: "90%", textAlign: "center" }}>
                        <div style={{
                            width: "60px", height: "60px", borderRadius: "50%", background: "#fecaca",
                            color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 16px"
                        }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>Delete Tree?</h3>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
                            Are you sure you want to delete this upload? This action cannot be undone.
                        </p>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={closeDeleteModal}
                                style={{ flex: 1, padding: "12px", border: "1px solid var(--input-border)", borderRadius: "12px", background: "white", cursor: "pointer", fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                style={{
                                    flex: 1, padding: "12px", border: "none", borderRadius: "12px",
                                    background: "#dc2626", color: "white", cursor: "pointer", fontWeight: 600
                                }}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
