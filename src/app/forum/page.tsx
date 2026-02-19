"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageCircle, Plus, Heart, MessageSquare, Clock, TrendingUp, Search, Loader2 } from "lucide-react";

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
    user: { id: string; name: string; image: string | null };
    _count: { comments: number; likes: number };
}

export default function ForumPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
    const [category, setCategory] = useState("");
    const [sort, setSort] = useState("latest");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        setPage(1);
        fetchPosts(1, true);
    }, [category, sort]);

    // Client-side search filtering
    useEffect(() => {
        if (!searchTerm.trim()) {
            setDisplayedPosts(posts);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
        const filtered = posts.filter(post =>
            post.title.toLowerCase().includes(lowerTerm) ||
            post.content.toLowerCase().includes(lowerTerm) ||
            post.user.name.toLowerCase().includes(lowerTerm)
        );
        setDisplayedPosts(filtered);
    }, [searchTerm, posts]);

    const fetchPosts = async (pageNum: number, isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            else setIsLoadingMore(true);

            const params = new URLSearchParams();
            if (category) params.set("category", category);
            params.set("sort", sort);
            params.set("page", pageNum.toString());
            params.set("limit", "10");

            const res = await fetch(`/api/forum?${params}`);
            const data = await res.json();

            if (isInitial) {
                setPosts(data.posts || []);
                setTotalPages(data.pages || 1);
            } else {
                setPosts(prev => [...prev, ...(data.posts || [])]);
            }

            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (page < totalPages) {
            fetchPosts(page + 1);
        }
    };

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
        if (!isHydrated) return "";
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
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", marginBottom: "32px" }}>
                    <div>
                        <h1 className="section-title" style={{ marginBottom: "4px" }}>
                            <MessageCircle size={32} style={{ display: "inline", marginRight: "10px", color: "var(--color-forest)" }} />
                            Community Forum
                        </h1>
                        <p className="section-subtitle" style={{ marginBottom: 0 }}>Discuss sustainability topics with the community</p>
                    </div>

                    <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "600px", flexWrap: "wrap", justifyContent: "center" }}>
                        <div className="glass-card" style={{ padding: "8px 16px", flex: 1, minWidth: "240px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Search size={18} style={{ color: "var(--text-secondary)" }} />
                            <input
                                type="text"
                                placeholder="Search discussions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    outline: "none",
                                    width: "100%",
                                    fontSize: "0.95rem",
                                    color: "var(--text-primary)"
                                }}
                            />
                        </div>

                        {session?.user && (
                            <Link href="/forum/create" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", whiteSpace: "nowrap", textDecoration: "none" }}>
                                <Plus size={20} /> New Post
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px", alignItems: "center" }}>
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
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                        Loading discussions...
                    </div>
                ) : displayedPosts.length === 0 ? (
                    <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                        <Search size={48} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "16px" }} />
                        <h3 style={{ color: "var(--text-secondary)", fontWeight: 600, marginBottom: "8px" }}>
                            {searchTerm ? "No posts found" : "No posts yet"}
                        </h3>
                        <p style={{ color: "var(--text-secondary)", opacity: 0.8 }}>
                            {searchTerm ? "Try a different search term" : "Be the first to start a discussion!"}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {displayedPosts.map((post, i) => (
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

                                        <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "0.85rem", color: "var(--text-secondary)", alignItems: "center" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <Heart size={14} /> {post._count.likes}
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                <MessageSquare size={14} /> {post._count.comments}
                                            </span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "8px" }}>
                                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", overflow: "hidden", background: "var(--color-cream)", border: "1px solid var(--color-leaf)" }}>
                                                    {post.user.image ? (
                                                        <img src={post.user.image} alt={post.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    ) : (
                                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: "bold", color: "var(--color-forest)" }}>
                                                            {post.user.name?.[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <span>by {post.user.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Load More */}
                        {!searchTerm && page < totalPages && (
                            <div style={{ textAlign: "center", marginTop: "20px" }}>
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="btn-secondary"
                                    style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                                >
                                    {isLoadingMore ? <Loader2 className="animate-spin" size={18} /> : null}
                                    {isLoadingMore ? "Loading..." : "Load More Posts"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
