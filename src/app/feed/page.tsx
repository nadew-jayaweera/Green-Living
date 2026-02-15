"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { TreePine, Heart, Share2, Upload, MapPin, Calendar, Search } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface Post {
    id: string;
    imageUrl: string;
    treeType: string;
    location: string;
    description: string;
    createdAt: string;
    user: { id: string; name: string; image: string | null };
    isLiked: boolean;
    _count: { likes: number };
}

export default function FeedPage() {
    const { data: session } = useSession();
    const { addToast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [topPlanters, setTopPlanters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
        fetchPosts();
        fetchTopPlanters();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch("/api/uploads?limit=20");
            const data = await res.json();
            // The API returns { uploads: [...] }
            setPosts(data.uploads || []);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
            addToast("Failed to load feed", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchTopPlanters = async () => {
        try {
            const res = await fetch("/api/leaderboard");
            const data = await res.json();
            setTopPlanters((data.users || []).slice(0, 5));
        } catch (error) {
            console.error("Failed to fetch top planters:", error);
        }
    };

    const handleLike = async (postId: string) => {
        if (!session) {
            addToast("Please login to like posts", "info");
            return;
        }

        try {
            const res = await fetch(`/api/uploads/${postId}/like`, { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                // The API returns { likes: number, isLiked: boolean }
                setPosts(posts.map(p =>
                    p.id === postId
                        ? { ...p, isLiked: data.isLiked, _count: { ...p._count, likes: data.likes } }
                        : p
                ));
            }
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    const formatDate = (dateString: string) => {
        if (!isHydrated) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    return (
        <div className="page-container">
            <div style={{ width: "100%", maxWidth: "1100px", marginBottom: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <h1 className="section-title" style={{ marginBottom: 0 }}>
                    <TreePine size={32} style={{ display: "inline", marginRight: "10px", color: "var(--color-forest)" }} />
                    Global Forest
                </h1>

                <Link href="/upload" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", width: "fit-content", textDecoration: "none" }}>
                    <Upload size={20} /> Upload Tree
                </Link>
            </div>

            <div className="feed-container" style={{ width: "100%", maxWidth: "1100px", justifyContent: "center", alignItems: "flex-start" }}>

                {/* Main Feed */}
                <div style={{ flex: 1, maxWidth: "700px", width: "100%" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>Loading forests...</div>
                    ) : posts.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }} className="glass-card">
                            No trees planted yet! Be the first to plant one. 🌱
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {posts.map((post) => (
                                <div key={post.id} className="glass-card animate-fade-in-up" style={{ padding: "0", overflow: "hidden" }}>
                                    {/* Post Header */}
                                    <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--card-border)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-cream)", color: "var(--color-forest)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem", border: "2px solid var(--color-leaf)" }}>
                                                {post.user.name?.[0]?.toUpperCase() || "U"}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.95rem" }}>{post.user.name}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <Calendar size={12} /> {formatDate(post.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="category-pill" style={{ background: "rgba(82, 183, 136, 0.1)", color: "var(--color-forest)", border: "1px solid rgba(82, 183, 136, 0.2)", pointerEvents: "none" }}>
                                            <TreePine size={14} style={{ marginRight: "4px" }} /> {post.treeType}
                                        </span>
                                    </div>

                                    {/* Tree Image */}
                                    <div style={{ width: "100%", overflow: "hidden", background: "#f8fafc" }}>
                                        <img
                                            src={post.imageUrl}
                                            alt={post.treeType}
                                            style={{ width: "100%", height: "auto", minHeight: "300px", display: "block", transition: "transform 0.5s ease" }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                        />
                                    </div>

                                    {/* Post Body */}
                                    <div style={{ padding: "20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-forest)", fontWeight: "600", marginBottom: "12px", fontSize: "0.9rem" }}>
                                            <MapPin size={16} /> {post.location}
                                        </div>
                                        <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "20px", fontSize: "1rem" }}>
                                            {post.description}
                                        </p>

                                        {/* Actions */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "20px", borderTop: "1px solid var(--card-border)", paddingTop: "16px" }}>
                                            <button
                                                onClick={() => handleLike(post.id)}
                                                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: post.isLiked ? "#ef4444" : "var(--text-secondary)", transition: "all 0.2s" }}
                                            >
                                                <Heart size={20} fill={post.isLiked ? "#ef4444" : "none"} />
                                                <span style={{ fontWeight: "700" }}>{post._count.likes}</span>
                                            </button>
                                            <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", marginLeft: "auto" }}>
                                                <Share2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div style={{ width: "320px", display: "none", flexDirection: "column", gap: "24px", position: "sticky", top: "40px" }} className="lg-flex-custom">
                    <div className="glass-card" style={{ padding: "24px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-forest)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            Top Planters 👑
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {topPlanters.length > 0 ? (
                                topPlanters.map((user, index) => (
                                    <div key={user.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : index === 2 ? "#cd7f32" : "var(--color-cream)", display: "flex", alignItems: "center", justifyContent: "center", color: index < 3 ? "white" : "var(--color-forest)", fontWeight: "bold", fontSize: "0.8rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-cream)", color: "var(--color-forest)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>
                                            {user.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-primary)" }}>{user.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--color-leaf)", fontWeight: "600" }}>{user._count.uploads} trees</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "center" }}>Loading planters...</p>
                            )}
                        </div>
                        <Link href="/leaderboard" style={{ display: "block", textAlign: "center", marginTop: "24px", color: "var(--color-forest)", fontWeight: "700", textDecoration: "none", fontSize: "0.85rem", padding: "10px", borderRadius: "10px", background: "rgba(45, 106, 79, 0.05)", transition: "all 0.2s" }}>
                            View Full Leaderboard →
                        </Link>
                    </div>

                    <div className="glass-card" style={{ padding: "24px", background: "linear-gradient(135deg, var(--color-forest) 0%, var(--color-leaf) 100%)", border: "none", color: "white", boxShadow: "0 12px 24px rgba(45, 106, 79, 0.2)" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                            Weekly Challenge 🎯
                        </h3>
                        <p style={{ fontSize: "0.9rem", opacity: 0.9, lineHeight: "1.5", marginBottom: "20px" }}>
                            Plant a <b>native tree</b> species this week to earn the exclusive "Local Hero" badge!
                        </p>
                        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid rgba(255,255,255,0.3)" }}>
                            <span style={{ fontSize: "1.5rem" }}>🎖️</span>
                            <div>
                                <div style={{ fontWeight: "800" }}>Local Hero</div>
                                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Limited time only</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
