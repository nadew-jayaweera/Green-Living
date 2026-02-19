"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { TreePine, Heart, Share2, Upload, MapPin, Calendar, Search, Loader2 } from "lucide-react";
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
    const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
    const [topPlanters, setTopPlanters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
        fetchPosts(1, true); // Initial fetch
        fetchTopPlanters();
    }, []);

    // Filter posts when search term changes
    useEffect(() => {
        if (!searchTerm.trim()) {
            setDisplayedPosts(posts);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
        const filtered = posts.filter(post =>
            post.treeType.toLowerCase().includes(lowerTerm) ||
            post.location.toLowerCase().includes(lowerTerm) ||
            post.description.toLowerCase().includes(lowerTerm) ||
            post.user.name.toLowerCase().includes(lowerTerm)
        );
        setDisplayedPosts(filtered);
    }, [searchTerm, posts]);

    const fetchPosts = async (pageNum: number, isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            else setIsLoadingMore(true);

            const res = await fetch(`/api/uploads?limit=10&page=${pageNum}`);
            const data = await res.json();

            if (isInitial) {
                setPosts(data.uploads || []);
                setTotalPages(data.pages || 1);
            } else {
                setPosts(prev => [...prev, ...(data.uploads || [])]);
            }

            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
            addToast("Failed to load feed", "error");
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
                // Update local state
                const updatePost = (p: Post) =>
                    p.id === postId
                        ? { ...p, isLiked: data.isLiked, _count: { ...p._count, likes: data.likes } }
                        : p;

                setPosts(prev => prev.map(updatePost));
            }
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    const handleShare = async (post: Post) => {
        const shareData = {
            title: `Check out this ${post.treeType}!`,
            text: `View ${post.user.name}'s update on Green Living: "${post.description}"`,
            url: window.location.href, // Ideally direct link to post if implemented
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                addToast("Shared successfully!", "success");
            } else {
                await navigator.clipboard.writeText(window.location.href);
                addToast("Link copied to clipboard!", "success");
            }
        } catch (err) {
            console.error("Error sharing:", err);
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
            <style jsx>{`
                .feed-grid {
                    display: grid; 
                    grid-template-columns: 1fr;
                    gap: 32px;
                    max-width: 1100px;
                    width: 100%;
                    margin: 0 auto;
                }
                
                @media (min-width: 1024px) {
                    .feed-grid {
                        grid-template-columns: 1fr 320px;
                        align-items: start;
                    }
                    .sidebar-column {
                        position: sticky;
                        top: 24px;
                    }
                }
            `}</style>

            <div style={{ width: "100%", maxWidth: "1100px", marginBottom: "32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <h1 className="section-title" style={{ marginBottom: 0 }}>
                    <TreePine size={32} style={{ display: "inline", marginRight: "10px", color: "var(--color-forest)" }} />
                    Global Forest
                </h1>

                <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "600px", flexWrap: "wrap", justifyContent: "center" }}>
                    <div className="glass-card" style={{ padding: "8px 16px", flex: 1, minWidth: "240px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Search size={18} style={{ color: "var(--text-secondary)" }} />
                        <input
                            type="text"
                            placeholder="Search trees, locations, or people..."
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

                    <Link href="/upload" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", whiteSpace: "nowrap", textDecoration: "none" }}>
                        <Upload size={18} /> Upload Tree
                    </Link>
                </div>
            </div>

            <div className="feed-grid">
                {/* Main Feed */}
                <div style={{ width: "100%" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                            <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                            Loading forests...
                        </div>
                    ) : displayedPosts.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: "center", padding: "60px" }}>
                            <TreePine size={48} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: "16px" }} />
                            <h3 style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>
                                {searchTerm ? "No results found" : "No trees planted yet!"}
                            </h3>
                            <p style={{ color: "var(--text-secondary)", opacity: 0.8 }}>
                                {searchTerm ? "Try a different search term" : "Be the first to plant one. 🌱"}
                            </p>
                            {!searchTerm && (
                                <Link href="/upload" className="btn-primary" style={{ display: "inline-flex", marginTop: "16px", textDecoration: "none" }}>
                                    Upload Tree
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {displayedPosts.map((post) => (
                                <div key={post.id} className="glass-card animate-fade-in-up" style={{ padding: "0", overflow: "hidden" }}>
                                    {/* Post Header */}
                                    <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--card-border)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", background: "var(--color-cream)", border: "2px solid var(--color-leaf)" }}>
                                                {post.user.image ? (
                                                    <img src={post.user.image} alt={post.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem", color: "var(--color-forest)" }}>
                                                        {post.user.name?.[0]?.toUpperCase() || "U"}
                                                    </div>
                                                )}
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
                                    <div style={{ width: "100%", height: "400px", overflow: "hidden", background: "#f8fafc", position: "relative" }}>
                                        <img
                                            src={post.imageUrl}
                                            alt={post.treeType}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
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
                                            <button
                                                onClick={() => handleShare(post)}
                                                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", marginLeft: "auto", transition: "color 0.2s" }}
                                                onMouseOver={(e) => e.currentTarget.style.color = "var(--color-forest)"}
                                                onMouseOut={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                                            >
                                                <Share2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
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
                                        {isLoadingMore ? "Loading..." : "Load More Trees"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="sidebar-column">
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", background: "var(--color-cream)", border: "1px solid var(--color-leaf)" }}>
                                                {user.image ? (
                                                    <img src={user.image} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-forest)", fontWeight: "700" }}>
                                                        {user.name?.[0]?.toUpperCase() || "U"}
                                                    </div>
                                                )}
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
        </div>
    );
}
