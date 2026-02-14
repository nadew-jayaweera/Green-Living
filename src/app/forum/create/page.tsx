"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PenLine, Tag, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
    "Tree Planting",
    "Climate Change",
    "Recycling",
    "Sustainable Living Tips",
];

export default function CreatePostPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (status === "loading") return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
    if (!session) { router.push("/login"); return null; }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !category) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/forum", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, category }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to create post");
            } else {
                router.push("/forum");
            }
        } catch {
            setError("Something went wrong");
        }

        setLoading(false);
    };

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 24px 80px" }}>
            <Link href="/forum" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#2d6a4f", textDecoration: "none", fontWeight: 600, marginBottom: "24px" }}>
                <ArrowLeft size={18} /> Back to Forum
            </Link>

            <h1 className="section-title" style={{ textAlign: "left", marginBottom: "32px" }}>
                <PenLine size={28} style={{ display: "inline", marginRight: "10px", color: "#52b788" }} />
                Create New Post
            </h1>

            <div className="glass-card animate-fade-in-up" style={{ padding: "36px" }}>
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
                        color: "#dc2626", fontSize: "0.9rem", fontWeight: 500,
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label className="form-label"><Tag size={14} style={{ display: "inline", marginRight: "6px" }} />Category</label>
                        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
                            <option value="">Select a category...</option>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label className="form-label"><PenLine size={14} style={{ display: "inline", marginRight: "6px" }} />Title</label>
                        <input className="form-input" placeholder="What's on your mind?" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
                    </div>

                    <div style={{ marginBottom: "28px" }}>
                        <label className="form-label"><FileText size={14} style={{ display: "inline", marginRight: "6px" }} />Content</label>
                        <textarea
                            className="form-input"
                            placeholder="Share your thoughts, tips, or ask a question..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            style={{ resize: "vertical" }}
                            required
                            maxLength={5000}
                        />
                        <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#9ca3af", marginTop: "4px" }}>
                            {content.length}/5000
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}
                        style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "1rem" }}>
                        {loading ? "Posting..." : "Publish Post"}
                    </button>
                </form>
            </div>
        </div>
    );
}
