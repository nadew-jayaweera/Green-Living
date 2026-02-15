"use client";

import { Leaf, Heart, TreePine, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
    return (
        <footer
            className="site-footer"
            style={{
                color: "white",
                padding: "60px 24px 30px",
                marginTop: "auto",
            }}
        >
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "40px",
                }}
            >
                {/* Brand */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                        <span
                            style={{
                                background: "rgba(230, 230, 230, 0.2)",
                                borderRadius: "12px",
                                padding: "8px",
                                display: "flex",
                            }}
                        >
                            <Leaf size={24} />
                        </span>
                        <span style={{ fontWeight: 800, fontSize: "1.4rem" }}>Green Living</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: "0.95rem" }}>
                        Together, we can make the world greener. Plant a tree, earn badges, and inspire others to join the movement.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "16px" }}>Explore</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                            { href: "/upload", label: "Upload a Tree" },
                            { href: "/badges", label: "My Badges" },
                            { href: "/forum", label: "Community Forum" },
                            { href: "/leaderboard", label: "Leaderboard" },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    color: "rgba(255,255,255,0.7)",
                                    textDecoration: "none",
                                    fontSize: "0.95rem",
                                    transition: "color 0.3s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#52b788"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Mission */}
                <div>
                    <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "16px" }}>Our Mission</h3>
                    <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: "0.95rem" }}>
                        We believe small actions create big change. Every tree you plant makes a difference for our planet and future generations.
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                        <Mail size={16} />
                        <span>hello@greenliving.eco</span>
                    </div>
                </div>
            </div>

            {/* Divider & Copyright */}
            <div
                style={{
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    marginTop: "40px",
                    paddingTop: "20px",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.85rem",
                }}
            >
                Made with <Heart size={14} style={{ color: "#ef4444" }} /> for the planet
                <span style={{ margin: "0 8px" }}>•</span>
                <TreePine size={14} /> Green Living © {new Date().getFullYear()}
            </div>
        </footer>
    );
}
