"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Award, Lock } from "lucide-react";

interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    threshold: number;
}

interface UserBadge {
    badgeId: string;
    earnedAt: string;
}

const ALL_BADGES: Badge[] = [
    { id: "1", name: "Seed Starter", icon: "🌱", description: "Planted your first tree!", threshold: 1 },
    { id: "2", name: "Eco Friend", icon: "🌿", description: "Planted 5 trees!", threshold: 5 },
    { id: "3", name: "Tree Guardian", icon: "🌳", description: "Planted 10 trees!", threshold: 10 },
    { id: "4", name: "Forest Hero", icon: "🌲", description: "Planted 25 trees!", threshold: 25 },
    { id: "5", name: "Earth Champion", icon: "🌍", description: "Planted 50 trees!", threshold: 50 },
];

export default function BadgesPage() {
    const { data: session } = useSession();
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [treeCount, setTreeCount] = useState(0);

    useEffect(() => {
        if (session?.user) {
            const userId = (session.user as { id: string }).id;
            // Fetch user's badges and tree count
            fetch(`/api/uploads?userId=${userId}&limit=999`)
                .then((res) => res.json())
                .then((data) => setTreeCount(data.total || 0))
                .catch(() => { });

            fetch(`/api/badges?userId=${userId}`)
                .then((res) => res.json())
                .then((data) => setUserBadges(data.badges || []))
                .catch(() => { });
        }
    }, [session]);

    const hasBadge = (badgeName: string) => {
        // Simple check based on tree count and threshold
        const badge = ALL_BADGES.find((b) => b.name === badgeName);
        return badge ? treeCount >= badge.threshold : false;
    };

    return (
        <div className="page-container">
            <div style={{ width: "100%", maxWidth: "1100px" }}>
                <div style={{ textAlign: "center", marginBottom: "48px" }}>
                    <h1 className="section-title">
                        <Award size={32} style={{ display: "inline", marginRight: "10px", color: "#52b788" }} />
                        Eco Badges
                    </h1>
                    <p className="section-subtitle">Plant more trees to unlock all badges!</p>

                    {session?.user && (
                        <div className="glass-card" style={{ display: "inline-flex", alignItems: "center", gap: "12px", padding: "12px 28px", marginTop: "8px" }}>
                            <span style={{ fontSize: "1.5rem" }}>🌳</span>
                            <span style={{ fontWeight: 700, color: "var(--color-forest)", fontSize: "1.1rem" }}>
                                Your Trees: <span style={{ color: "var(--color-leaf)" }}>{treeCount}</span>
                            </span>
                        </div>
                    )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "28px" }}>
                    {ALL_BADGES.map((badge, i) => {
                        const unlocked = session?.user ? hasBadge(badge.name) : false;
                        const progress = session?.user ? Math.min((treeCount / badge.threshold) * 100, 100) : 0;

                        return (
                            <div
                                key={badge.id}
                                className={`badge-card animate-fade-in-up ${unlocked ? "unlocked" : "locked"}`}
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="badge-icon" style={{ filter: unlocked ? "none" : "grayscale(0.8)" }}>
                                    {badge.icon}
                                </div>

                                {!unlocked && (
                                    <Lock size={20} style={{ color: "#9ca3af", marginBottom: "8px" }} />
                                )}

                                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: unlocked ? "var(--color-forest)" : "var(--text-secondary)", marginBottom: "6px" }}>
                                    {badge.name}
                                </h3>

                                <p style={{ color: unlocked ? "var(--text-secondary)" : "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "16px", opacity: unlocked ? 1 : 0.7 }}>
                                    {badge.description}
                                </p>

                                {/* Progress bar */}
                                <div style={{
                                    background: "rgba(82, 183, 136, 0.1)", borderRadius: "50px", height: "8px",
                                    overflow: "hidden", marginBottom: "8px",
                                }}>
                                    <div style={{
                                        width: `${progress}%`, height: "100%",
                                        background: unlocked
                                            ? "linear-gradient(90deg, var(--color-forest), var(--color-leaf))"
                                            : "linear-gradient(90deg, var(--text-secondary), var(--text-secondary))",
                                        borderRadius: "50px",
                                        transition: "width 1s ease-out",
                                        opacity: unlocked ? 1 : 0.5
                                    }} />
                                </div>

                                <div style={{ fontSize: "0.8rem", color: unlocked ? "var(--color-leaf)" : "var(--text-secondary)", fontWeight: 600 }}>
                                    {unlocked ? "✅ Unlocked!" : `${treeCount}/${badge.threshold} trees`}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!session?.user && (
                    <div style={{ textAlign: "center", marginTop: "48px" }}>
                        <p style={{ color: "#6b7280", marginBottom: "16px" }}>Sign in to track your badge progress!</p>
                        <a href="/login" className="btn-primary" style={{ textDecoration: "none" }}>Sign In</a>
                    </div>
                )}
            </div>
        </div>
    );
}
