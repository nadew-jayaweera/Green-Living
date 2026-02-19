"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Heart, MessageSquare, Send, ArrowLeft, Clock, Trash2 } from "lucide-react";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
}

interface PostDetail {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
    user: { id: string; name: string };
    comments: Comment[];
    isLiked: boolean;
    _count: { comments: number; likes: number };
}

export default function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const [post, setPost] = useState<PostDetail | null>(null);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [likeLoading, setLikeLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);

    const fetchPost = () => {
        fetch(`/api/forum/${id}`)
            .then((res) => res.json())
            .then((data) => {
                setPost(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchPost();
    }, [id]);

    const handleLike = async () => {
        if (!session?.user) return;
        setLikeLoading(true);
        try {
            const res = await fetch(`/api/forum/${id}/like`, { method: "POST" });
            const data = await res.json();
            if (post) {
                setPost({
                    ...post,
                    isLiked: data.liked,
                    _count: {
                        ...post._count,
                        likes: data.liked ? post._count.likes + 1 : post._count.likes - 1,
                    },
                });
            }
        } catch { /* ignore */ }
        setLikeLoading(false);
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !session?.user) return;

        setCommentLoading(true);
        try {
            const res = await fetch(`/api/forum/${id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: comment }),
            });

            if (res.ok) {
                setComment("");
                fetchPost(); // Refresh to get new comment
            }
        } catch { /* ignore */ }
        setCommentLoading(false);
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (loading) return <div style={{ padding: "100px", textAlign: "center", color: "var(--text-secondary)" }}>Loading...</div>;
    if (!post) return <div style={{ padding: "100px", textAlign: "center", color: "var(--text-secondary)" }}>Post not found</div>;

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px 80px" }}>
            <Link href="/forum" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-forest)", textDecoration: "none", fontWeight: 600, marginBottom: "24px" }}>
                <ArrowLeft size={18} /> Back to Forum
            </Link>

            {/* Post */}
            <div className="glass-card animate-fade-in-up" style={{ padding: "36px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{
                        padding: "4px 14px", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 600,
                        background: "var(--pill-bg)", color: "var(--color-forest)",
                    }}>
                        {post.category}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={14} /> {timeAgo(post.createdAt)}
                    </span>
                </div>

                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px" }}>{post.title}</h1>

                <p style={{ fontSize: "0.9rem", color: "var(--color-forest)", fontWeight: 600, marginBottom: "20px" }}>
                    by {post.user.name}
                </p>

                <div style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "1rem", whiteSpace: "pre-wrap" }}>
                    {post.content}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "16px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(82, 183, 136, 0.1)" }}>
                    <button
                        onClick={handleLike}
                        disabled={!session?.user || likeLoading}
                        style={{
                            display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
                            borderRadius: "50px", border: "none", cursor: session?.user ? "pointer" : "default",
                            background: post.isLiked ? "rgba(239,68,68,0.1)" : "var(--pill-bg)",
                            color: post.isLiked ? "#ef4444" : "var(--color-forest)",
                            fontWeight: 600, fontSize: "0.9rem", transition: "all 0.3s",
                        }}
                    >
                        <Heart size={18} fill={post.isLiked ? "#ef4444" : "none"} /> {post._count.likes}
                    </button>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        <MessageSquare size={18} /> {post._count.comments} comments
                    </span>
                </div>
            </div>

            {/* Comment Form */}
            {session?.user && (
                <form onSubmit={handleComment} className="glass-card" style={{ padding: "20px 24px", marginBottom: "24px", display: "flex", gap: "12px" }}>
                    <input
                        className="form-input"
                        placeholder="Write a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn-primary" disabled={commentLoading} style={{ padding: "12px 24px" }}>
                        <Send size={18} />
                    </button>
                </form>
            )}

            {/* Comments */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {post.comments.map((c, i) => (
                    <div key={c.id} className="glass-card animate-fade-in-up" style={{ padding: "20px 24px", animationDelay: `${i * 0.05}s` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{c.user.name}</span>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{timeAgo(c.createdAt)}</span>
                        </div>
                        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>{c.content}</p>
                    </div>
                ))}

                {post.comments.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                        No comments yet. Be the first to comment!
                    </div>
                )}
            </div>
        </div>
    );
}
