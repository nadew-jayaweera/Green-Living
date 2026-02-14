"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, TreePine, Award, Image, MessageCircle, Calendar } from "lucide-react";
import Link from "next/link";

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
    const { data: session, status } = useSession();
    const router = useRouter();
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [treeCount, setTreeCount] = useState(0);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<"uploads" | "badges" | "posts">("uploads");

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
        }
    }, [session, status]);

    if (status === "loading") return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
    if (!session) { router.push("/login"); return null; }

    const tabs = [
        { key: "uploads", label: "My Trees", icon: <Image size={18} />, count: treeCount },
        { key: "badges", label: "Badges", icon: <Award size={18} />, count: badges.length },
        { key: "posts", label: "Posts", icon: <MessageCircle size={18} />, count: posts.length },
    ];

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px 80px" }}>
            {/* Profile Header */}
            <div className="glass-card animate-fade-in-up" style={{ padding: "40px", textAlign: "center", marginBottom: "32px" }}>
                <div style={{
                    width: "100px", height: "100px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #2d6a4f, #52b788)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px", color: "white", fontSize: "2.5rem", fontWeight: 700,
                }}>
                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1a4d2e", marginBottom: "4px" }}>
                    {session.user?.name}
                </h1>
                <p style={{ color: "#6b7280", marginBottom: "20px" }}>{session.user?.email}</p>

                <div style={{ display: "flex", justifyContent: "center", gap: "32px" }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#52b788" }}>{treeCount}</div>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 500 }}>Trees Planted</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#52b788" }}>{badges.length}</div>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 500 }}>Badges Earned</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#52b788" }}>{posts.length}</div>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 500 }}>Forum Posts</div>
                    </div>
                </div>
            </div>

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
                            <TreePine size={48} style={{ color: "#d1d5db", marginBottom: "16px" }} />
                            <h3 style={{ color: "#6b7280", marginBottom: "8px" }}>No trees uploaded yet</h3>
                            <Link href="/upload" className="btn-primary" style={{ textDecoration: "none", marginTop: "12px", display: "inline-flex" }}>
                                Upload Your First Tree
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                            {uploads.map((upload) => (
                                <div key={upload.id} className="glass-card" style={{ overflow: "hidden" }}>
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
                <div>
                    {badges.length === 0 ? (
                        <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                            <Award size={48} style={{ color: "#d1d5db", marginBottom: "16px" }} />
                            <h3 style={{ color: "#6b7280", marginBottom: "8px" }}>No badges earned yet</h3>
                            <p style={{ color: "#9ca3af" }}>Plant your first tree to earn the Seed Starter badge!</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
                            {badges.map((badge) => (
                                <div key={badge.name} className="badge-card unlocked">
                                    <span className="badge-icon">{badge.icon}</span>
                                    <h3 style={{ fontWeight: 700, color: "#1a4d2e", marginBottom: "4px" }}>{badge.name}</h3>
                                    <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>{badge.description}</p>
                                    <div style={{ fontSize: "0.75rem", color: "#52b788", marginTop: "8px" }}>
                                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
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
    );
}
