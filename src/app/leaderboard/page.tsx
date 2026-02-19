"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, User } from "lucide-react";
import { useSession } from "next-auth/react";

interface LeaderboardUser {
    id: string;
    name: string;
    image: string | null;
    _count: { uploads: number };
}

export default function LeaderboardPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/leaderboard")
            .then((res) => res.json())
            .then((data) => {
                const fetchedUsers = data.users || [];
                setUsers(fetchedUsers);

                if (session?.user?.name) {
                    const rank = fetchedUsers.findIndex((u: LeaderboardUser) => u.name === session.user?.name) + 1;
                    if (rank > 0) setCurrentUserRank(rank);
                }
            });
    }, [session]);

    const TopThree = () => {
        if (users.length === 0) return null;

        const first = users[0];
        const second = users[1];
        const third = users[2];

        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "16px", marginBottom: "48px", paddingTop: "20px" }}>
                {/* 2nd Place */}
                {second && (
                    <div className="glass-card animate-fade-in-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px", width: "100px", maxWidth: "30%", textAlign: "center", animationDelay: "0.1s", background: "rgba(255, 255, 255, 0.6)" }}>
                        <div style={{ position: "relative", marginBottom: "8px" }}>
                            <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "3px solid #94a3b8", overflow: "hidden", background: "#e2e8f0" }}>
                                {second.image ? <img src={second.image} alt={second.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                            </div>
                            <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", background: "#94a3b8", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold" }}>2</div>
                        </div>
                        <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{second.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--color-forest)", fontWeight: "600" }}>{second._count.uploads} 🌲</div>
                    </div>
                )}

                {/* 1st Place */}
                {first && (
                    <div className="glass-card animate-fade-in-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", width: "120px", maxWidth: "35%", textAlign: "center", transform: "translateY(-20px)", border: "2px solid #fbbf24", boxShadow: "0 10px 25px rgba(251, 191, 36, 0.3)" }}>
                        <div style={{ position: "absolute", top: "-20px", fontSize: "2rem" }}>👑</div>
                        <div style={{ position: "relative", marginBottom: "8px" }}>
                            <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "4px solid #fbbf24", overflow: "hidden", background: "#fef3c7" }}>
                                {first.image ? <img src={first.image} alt={first.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                            </div>
                            <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", background: "#fbbf24", color: "white", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "bold" }}>1</div>
                        </div>
                        <div style={{ fontWeight: "800", fontSize: "1rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{first.name}</div>
                        <div style={{ fontSize: "0.9rem", color: "var(--color-forest)", fontWeight: "700" }}>{first._count.uploads} Trees</div>
                    </div>
                )}

                {/* 3rd Place */}
                {third && (
                    <div className="glass-card animate-fade-in-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px", width: "100px", maxWidth: "30%", textAlign: "center", animationDelay: "0.2s", background: "rgba(255, 255, 255, 0.6)" }}>
                        <div style={{ position: "relative", marginBottom: "8px" }}>
                            <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "3px solid #cd7f32", overflow: "hidden", background: "#ffedd5" }}>
                                {third.image ? <img src={third.image} alt={third.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                            </div>
                            <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", background: "#cd7f32", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold" }}>3</div>
                        </div>
                        <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{third.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--color-forest)", fontWeight: "600" }}>{third._count.uploads} 🌲</div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="page-container" style={{ paddingBottom: session?.user ? "80px" : "32px" }}>
            <div style={{ maxWidth: "600px", width: "100%", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <h1 className="section-title">
                        <Trophy size={32} style={{ display: "inline", marginRight: "10px", color: "#f59e0b" }} />
                        Leaderboard
                    </h1>
                    <p className="section-subtitle">Top tree planters in our community</p>
                </div>

                <TopThree />

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {users.slice(3).map((user, i) => {
                        const rank = i + 4;
                        return (
                            <div key={user.id} className="glass-card animate-fade-in-up" style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px 20px",
                                gap: "16px",
                                animationDelay: `${i * 0.05 + 0.3}s` // Staggered animation
                            }}>
                                <div style={{ width: "30px", fontWeight: "700", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                    #{rank}
                                </div>
                                <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", background: "var(--color-cream)", flexShrink: 0 }}>
                                    {user.image ? (
                                        <img src={user.image} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "var(--color-forest)" }}>
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>{user.name}</div>
                                </div>
                                <div style={{ fontWeight: 700, color: "var(--color-forest)", fontSize: "1.1rem" }}>
                                    {user._count.uploads}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sticky user rank for logged in user */}
            {session?.user && currentUserRank && currentUserRank > 3 && (
                <div style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "16px",
                    background: "var(--card-bg)",
                    borderTop: "1px solid var(--card-border)",
                    backdropFilter: "blur(10px)",
                    zIndex: 50,
                    boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}>
                    <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ fontWeight: "700", color: "var(--color-forest)" }}>Your Rank:</div>
                            <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)" }}>#{currentUserRank}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                            Keep planting! 🌿
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
