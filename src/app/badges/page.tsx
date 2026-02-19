"use client";

import { useSession } from "next-auth/react";
import { Award, Lock, CheckCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    threshold: number;
}

const ALL_BADGES: Badge[] = [
    { id: "1", name: "Seed Starter", icon: "🌱", description: "Planted your first tree!", threshold: 1 },
    { id: "2", name: "Eco Warrior", icon: "🌿", description: "Planted 5 trees!", threshold: 5 },
    { id: "3", name: "Forest Guardian", icon: "🌳", description: "Planted 10 trees!", threshold: 10 },
    { id: "4", name: "Earth Hero", icon: "🌍", description: "Planted 25 trees!", threshold: 25 },
    { id: "5", name: "Climate Champion", icon: "🏆", description: "Planted 50 trees!", threshold: 50 },
    { id: "6", name: "Green Legend", icon: "🦸", description: "Planted 100 trees!", threshold: 100 },
    { id: "7", name: "Nature Spirit", icon: "✨", description: "Planted 200 trees!", threshold: 200 },
    { id: "8", name: "Planet Saviour", icon: "🚀", description: "Planted 500 trees!", threshold: 500 },
];

export default function BadgesPage() {
    const { data: session } = useSession();
    const { addToast } = useToast();
    const [userTreeCount, setUserTreeCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.name) {
            fetch("/api/leaderboard")
                .then((res) => res.json())
                .then((data) => {
                    const user = data.users.find((u: any) => u.name === session.user?.name);
                    setUserTreeCount(user?._count.uploads || 0);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [session]);

    const handleShareBadge = async (badge: Badge) => {
        const shareData = {
            title: `I unlocked the ${badge.name} badge!`,
            text: `I just earned the "${badge.name}" badge on Green Living by planting ${badge.threshold} trees! 🌱`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                addToast("Badge shared successfully!", "success");
            } else {
                await navigator.clipboard.writeText(`I just earned the "${badge.name}" badge on Green Living!`);
                addToast("Copied to clipboard!", "success");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    return (
        <div className="page-container">
            <div style={{ maxWidth: "1000px", width: "100%", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "48px" }}>
                    <h1 className="section-title">
                        <Award size={32} style={{ display: "inline", marginRight: "10px", color: "#8b5cf6" }} />
                        Achievements
                    </h1>
                    <p className="section-subtitle">Track your impact and earn badges</p>

                    {!session?.user && (
                        <div className="glass-card animate-fade-in-up" style={{
                            marginTop: "32px",
                            background: "linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(82, 183, 136, 0.1))",
                            border: "1px solid var(--color-leaf)",
                            display: "inline-flex",
                            flexDirection: "column",
                            gap: "16px",
                            padding: "24px 40px"
                        }}>
                            <h3 style={{ color: "var(--color-forest)", fontWeight: 700 }}>Start Your Journey</h3>
                            <p style={{ color: "var(--text-secondary)" }}>Sign in to track your progress and earn badges!</p>
                            <Link href="/login" className="btn-primary" style={{ textDecoration: "none" }}>
                                Sign In / Register
                            </Link>
                        </div>
                    )}
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "24px",
                    opacity: loading ? 0.5 : 1,
                    transition: "opacity 0.3s ease"
                }}>
                    {ALL_BADGES.map((badge, i) => {
                        const isUnlocked = userTreeCount >= badge.threshold;

                        return (
                            <div
                                key={badge.id}
                                className={`glass-card badge-card ${isUnlocked ? 'unlocked' : 'locked'} animate-fade-in-up`}
                                style={{
                                    animationDelay: `${i * 0.05}s`,
                                    position: "relative",
                                    overflow: "hidden",
                                    padding: "32px 24px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "16px",
                                    opacity: (!session?.user || !isUnlocked) ? 0.8 : 1,
                                    transform: (!session?.user || !isUnlocked) ? "scale(0.98)" : "scale(1)",
                                    filter: (!session?.user || !isUnlocked) ? "grayscale(0.6)" : "none",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                <div style={{
                                    fontSize: "3.5rem",
                                    marginBottom: "8px",
                                    filter: isUnlocked ? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" : "none"
                                }}>
                                    {badge.icon}
                                </div>

                                <div>
                                    <h3 style={{
                                        fontWeight: 800,
                                        fontSize: "1.2rem",
                                        color: "var(--text-primary)",
                                        marginBottom: "8px"
                                    }}>
                                        {badge.name}
                                    </h3>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                        {badge.description}
                                    </p>
                                </div>

                                <div style={{
                                    marginTop: "auto",
                                    width: "100%",
                                    textAlign: "center"
                                }}>
                                    {isUnlocked ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                                            <div style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                background: "rgba(82, 183, 136, 0.2)",
                                                color: "var(--color-forest)",
                                                padding: "6px 16px",
                                                borderRadius: "20px",
                                                fontSize: "0.85rem",
                                                fontWeight: 700,
                                                alignSelf: "center"
                                            }}>
                                                <CheckCircle size={14} /> Unlocked
                                            </div>

                                            <button
                                                onClick={() => handleShareBadge(badge)}
                                                style={{
                                                    background: "transparent",
                                                    border: "1px solid var(--color-leaf)",
                                                    color: "var(--color-forest)",
                                                    padding: "8px 16px",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "8px",
                                                    fontSize: "0.9rem",
                                                    fontWeight: 600,
                                                    transition: "all 0.2s"
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = "rgba(82, 183, 136, 0.1)"}
                                                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                                            >
                                                <Share2 size={16} /> Share Achievement
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ width: "100%" }}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                color: "var(--text-secondary)",
                                                fontSize: "0.85rem",
                                                marginBottom: "8px"
                                            }}>
                                                <Lock size={14} /> Locked
                                            </div>
                                            <div style={{
                                                width: "100%",
                                                height: "6px",
                                                background: "rgba(0,0,0,0.1)",
                                                borderRadius: "10px",
                                                overflow: "hidden"
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(100, (userTreeCount / badge.threshold) * 100)}%`,
                                                    height: "100%",
                                                    background: "var(--color-leaf)",
                                                    transition: "width 1s ease"
                                                }} />
                                            </div>
                                            <div style={{
                                                marginTop: "4px",
                                                fontSize: "0.75rem",
                                                color: "var(--text-secondary)"
                                            }}>
                                                {userTreeCount} / {badge.threshold} trees
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
