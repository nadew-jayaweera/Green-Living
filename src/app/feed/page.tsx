"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { TreePine, Upload, Heart, MapPin, User, Loader2 } from "lucide-react";

interface FeedItem {
    id: string;
    imageUrl: string;
    location: string;
    description: string;
    treeType: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        image: string | null;
    };
    isLiked: boolean;
    _count: {
        likes: number;
    };
}

export default function FeedPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [likeLoading, setLikeLoading] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/uploads?limit=20")
            .then((res) => res.json())
            .then((data) => {
                setPosts(data.uploads || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleLike = async (postId: string) => {
        if (!session?.user) return;
        setLikeLoading(postId);

        // Optimistic update
        setPosts((currentPosts) =>
            currentPosts.map((post) => {
                if (post.id === postId) {
                    const newLiked = !post.isLiked;
                    return {
                        ...post,
                        isLiked: newLiked,
                        _count: {
                            likes: newLiked ? post._count.likes + 1 : post._count.likes - 1,
                        },
                    };
                }
                return post;
            })
        );

        try {
            const res = await fetch(`/api/uploads/${postId}/like`, { method: "POST" });
            if (!res.ok) throw new Error("Failed");
            // Optionally update with server data if needed, but optimistic is usually fine
        } catch {
            // Revert on error
            setPosts((currentPosts) =>
                currentPosts.map((post) => {
                    if (post.id === postId) {
                        const newLiked = !post.isLiked; // Revert
                        return {
                            ...post,
                            isLiked: newLiked,
                            _count: {
                                likes: newLiked ? post._count.likes + 1 : post._count.likes - 1,
                            },
                        };
                    }
                    return post;
                })
            );
        }
        setLikeLoading(null);
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px", display: "flex", gap: "40px", alignItems: "flex-start" }}>

            {/* Main Feed */}
            <div style={{ flex: 1, maxWidth: "700px" }}>
                <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1 className="section-title" style={{ marginBottom: 0 }}>
                        <TreePine size={32} style={{ display: "inline", marginRight: "10px", color: "var(--color-forest)" }} />
                        Global Forest
                    </h1>

                    <Link href="/upload" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px" }}>
                        <Upload size={20} /> Upload Tree
                    </Link>
                </div>

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
                                {/* Header */}
                                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--input-border)" }}>
                                    <div style={{
                                        width: "40px", height: "40px", borderRadius: "50%",
                                        background: "linear-gradient(135deg, var(--color-forest), var(--color-leaf))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "white", fontWeight: 700
                                    }}>
                                        {post.user.image ? <img src={post.user.image} alt={post.user.name} style={{ width: "100%", height: "100%", borderRadius: "50%" }} /> : post.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{post.user.name}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{timeAgo(post.createdAt)}</div>
                                    </div>
                                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "var(--color-forest)", background: "var(--pill-bg)", padding: "4px 10px", borderRadius: "20px" }}>
                                        <TreePine size={14} /> {post.treeType}
                                    </div>
                                </div>

                                {/* Image */}
                                <div style={{ width: "100%", aspectRatio: "4/3", background: "#f0fdf4", position: "relative" }}>
                                    <img src={post.imageUrl} alt={post.description} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                                </div>

                                {/* Content */}
                                <div style={{ padding: "20px" }}>
                                    {/* Action Bar */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            disabled={!session?.user || likeLoading === post.id}
                                            style={{
                                                background: "none", border: "none", cursor: session?.user ? "pointer" : "default",
                                                display: "flex", alignItems: "center", gap: "6px",
                                                color: post.isLiked ? "#ef4444" : "var(--text-secondary)",
                                                fontSize: "1rem", fontWeight: 600, transition: "transform 0.2s"
                                            }}
                                            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
                                            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                                        >
                                            <Heart size={24} fill={post.isLiked ? "#ef4444" : "none"} strokeWidth={post.isLiked ? 0 : 2} />
                                            {post._count.likes > 0 && <span>{post._count.likes}</span>}
                                        </button>
                                    </div>

                                    {/* Caption */}
                                    <div style={{ marginBottom: "8px" }}>
                                        <span style={{ fontWeight: 700, color: "var(--text-primary)", marginRight: "8px" }}>{post.user.name}</span>
                                        <span style={{ color: "var(--text-primary)" }}>{post.description}</span>
                                    </div>

                                    {/* Location */}
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <MapPin size={14} /> {post.location}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar Leaderboard (Desktop only) */}
            <div style={{ width: "320px", display: "none", flexDirection: "column", gap: "24px" }} className="lg:flex"> {/* Note: using tailwind class lg:flex assuming config exists, if not need media query */}
                {/* Embedded style media query fallback */}
                <style jsx>{`
                    @media (min-width: 1024px) {
                        .lg\\:flex { display: flex !important; }
                    }
                `}</style>

                <div className="glass-card" style={{ padding: "24px" }}>
                    <h3 className="section-title" style={{ fontSize: "1.25rem", marginBottom: "20px" }}>Top Planters 🏆</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Placeholder Top Users - In real app fetch this */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#FFD700", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#92400e" }}>1</div>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#e5e7eb", overflow: "hidden" }}>
                                <User size={40} style={{ padding: "8px", color: "#9ca3af" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Sarah Green</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--color-forest)" }}>142 trees</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#C0C0C0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#374151" }}>2</div>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#e5e7eb", overflow: "hidden" }}>
                                <User size={40} style={{ padding: "8px", color: "#9ca3af" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Mike Rivers</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--color-forest)" }}>98 trees</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#CD7F32", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#78350f" }}>3</div>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#e5e7eb", overflow: "hidden" }}>
                                <User size={40} style={{ padding: "8px", color: "#9ca3af" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Emma Woods</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--color-forest)" }}>85 trees</div>
                            </div>
                        </div>
                    </div>

                    <Link href="/leaderboard" style={{ display: "block", textAlign: "center", marginTop: "20px", color: "var(--color-forest)", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>
                        View Full Leaderboard →
                    </Link>
                </div>

                <div className="glass-card" style={{ padding: "24px", background: "linear-gradient(135deg, var(--color-forest), #15803d)", color: "white", border: "none" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Weekly Challenge 🎯</h3>
                    <p style={{ fontSize: "0.9rem", opacity: 0.9, lineHeight: 1.5, marginBottom: "16px" }}>
                        Plant a <strong>native tree</strong> species this week to earn the exclusive "Local Hero" badge!
                    </p>
                    <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "2rem" }}>🏅</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Local Hero</div>
                            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Limited time only</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
