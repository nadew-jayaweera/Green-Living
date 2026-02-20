"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageCircle, Plus, Heart, MessageSquare, Clock, TrendingUp, Search } from "lucide-react";

const CATEGORIES = [
    { value: "", label: "All Topics" },
    { value: "Tree Planting", label: "🌳 Tree Planting" },
    { value: "Climate Change", label: "🌡️ Climate Change" },
    { value: "Recycling", label: "♻️ Recycling" },
    { value: "Sustainable Living Tips", label: "💡 Sustainable Living" },
];

interface Post {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
    user: { id: string; name: string };
    _count: { comments: number; likes: number };
}

export default function ForumPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [category, setCategory] = useState("");
    const [sort, setSort] = useState("latest");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        params.set("sort", sort);

        fetch(`/api/forum?${params}`)
            .then((res) => res.json())
            .then((data) => {
                setPosts(data.posts || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [category, sort]);

    const getCategoryEmoji = (cat: string) => {
        const map: Record<string, string> = {
            "Tree Planting": "🌳",
            "Climate Change": "🌡️",
            "Recycling": "♻️",
            "Sustainable Living Tips": "💡",
        };
        return map[cat] || "🌱";
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="page-container">
            <div style={{ maxWidth: "1000px", width: "100%" }}>
                {/* Header */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", marginBottom: "40px" }}>
                    <div>
                        <h1 className="section-title" style={{ marginBottom: "4px" }}>
                            <MessageCircle size={32} style={{ display: "inline", marginRight: "10px", color: "var(--color-forest)" }} />
                            Community Forum
                        </h1>
                        <p className="section-subtitle" style={{ marginBottom: 0 }}>Discuss sustainability topics with the community</p>
                    </div>

                    {session?.user && (
                        <Link href="/forum/create" className="btn-primary" style={{ textDecoration: "none", width: "fit-content" }}>
                            <Plus size={20} /> New Post
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "40px", alignItems: "center" }}>
                    {/* Categories */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={`category-pill ${category === cat.value ? "active" : ""}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={() => setSort("latest")}
                            className={`category-pill ${sort === "latest" ? "active" : ""}`}
                            style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            <Clock size={14} /> Latest
                        </button>
                        <button
                            onClick={() => setSort("popular")}
                            className={`category-pill ${sort === "popular" ? "active" : ""}`}
                            style={{ display: "flex", alignItems: "center", gap: "6px" }}
                        >
                            <TrendingUp size={14} /> Popular
                        </button>
                    </div>
                </div>

                {/* Posts List */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>Loading discussions...</div>
                ) : posts.length === 0 ? (
                    <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                            <Search size={48} style={{ color: "#d1d5db" }} />
                        </div>
                        <h3 style={{ color: "var(--text-secondary)", fontWeight: 600, marginBottom: "8px" }}>No posts yet</h3>
                        <p style={{ color: "var(--text-secondary)" }}>Be the first to start a discussion!</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {posts.map((post, i) => (
                            <Link
                                key={post.id}
                                href={`/forum/${post.id}`}
                                className="glass-card animate-fade-in-up"
                                style={{
                                    padding: "24px 28px",
                                    textDecoration: "none",
                                    color: "inherit",
                                    animationDelay: `${i * 0.05}s`,
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                            <span style={{
                                                padding: "4px 12px", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 600,
                                                background: "rgba(82, 183, 136, 0.1)", color: "var(--color-forest)",
                                            }}>
                                                {getCategoryEmoji(post.category)} {post.category}
                                            </span>
                                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                                <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                                                {timeAgo(post.createdAt)}
                                            </span>
                                        </div>

                                        <h3 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1.1rem", marginBottom: "6px" }}>
                                            {post.title}
                                        </h3>

                                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                            {post.content.slice(0, 150)}
                                            {post.content.length > 150 ? "..." : ""}
                                        </p>

                                        <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <Heart size={14} /> {post._count.likes}
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <MessageSquare size={14} /> {post._count.comments}
                                            </span>
                                            <span>by {post.user.name}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
