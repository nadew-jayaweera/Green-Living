"use client";

import { useState, useEffect } from "react";
import { Trophy, TreePine, Medal, Award } from "lucide-react";

interface LeaderboardUser {
    id: string;
    name: string;
    _count: { uploads: number };
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/leaderboard")
            .then((r) => r.json())
            .then((d) => { setUsers(d.users || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const getRankStyle = (rank: number) => {
        if (rank === 1) return { bg: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#92400e", icon: "🥇" };
        if (rank === 2) return { bg: "linear-gradient(135deg, #d1d5db, #9ca3af)", color: "#374151", icon: "🥈" };
        if (rank === 3) return { bg: "linear-gradient(135deg, #d97706, #b45309)", color: "#78350f", icon: "🥉" };
        return { bg: "linear-gradient(135deg, rgba(82,183,136,0.1), rgba(82,183,136,0.05))", color: "#2d6a4f", icon: `#${rank}` };
    };

    const getBadge = (count: number) => {
        if (count >= 50) return "🌍 Earth Champion";
        if (count >= 25) return "🌲 Forest Hero";
        if (count >= 10) return "🌳 Tree Guardian";
        if (count >= 5) return "🌿 Eco Friend";
        if (count >= 1) return "🌱 Seed Starter";
        return "No badge yet";
    };

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px 80px" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
                <h1 className="section-title">
                    <Trophy size={32} style={{ display: "inline", marginRight: "10px", color: "#f59e0b" }} />
                    Leaderboard
                </h1>
                <p className="section-subtitle">Top tree planters in our community</p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>Loading leaderboard...</div>
            ) : users.length === 0 ? (
                <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                    <TreePine size={48} style={{ color: "#d1d5db", marginBottom: "16px" }} />
                    <h3 style={{ color: "#6b7280" }}>No planters yet. Be the first!</h3>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {users.map((user, i) => {
                        const rank = i + 1;
                        const style = getRankStyle(rank);

                        return (
                            <div
                                key={user.id}
                                className="glass-card animate-fade-in-up"
                                style={{
                                    padding: "20px 28px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "20px",
                                    animationDelay: `${i * 0.05}s`,
                                    borderLeft: rank <= 3 ? `4px solid ${rank === 1 ? "#fbbf24" : rank === 2 ? "#9ca3af" : "#d97706"}` : "none",
                                }}
                            >
                                {/* Rank */}
                                <div style={{
                                    width: "50px", height: "50px", borderRadius: "50%",
                                    background: style.bg, display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 800, fontSize: rank <= 3 ? "1.5rem" : "1.1rem",
                                    color: rank <= 3 ? "white" : style.color, flexShrink: 0,
                                }}>
                                    {rank <= 3 ? style.icon : rank}
                                </div>

                                {/* User Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: "#1a4d2e", fontSize: "1.1rem" }}>{user.name}</div>
                                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{getBadge(user._count.uploads)}</div>
                                </div>

                                {/* Tree Count */}
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#52b788", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <TreePine size={20} /> {user._count.uploads}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>trees</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
