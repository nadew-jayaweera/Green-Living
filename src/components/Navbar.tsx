"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
    TreePine,
    Upload,
    Award,
    MessageCircle,
    User,
    LogIn,
    LogOut,
    Menu,
    X,
    Shield,
    Trophy,
    Leaf,
} from "lucide-react";

export default function Navbar() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Home", icon: <TreePine size={18} /> },
        { href: "/upload", label: "Upload", icon: <Upload size={18} /> },
        { href: "/badges", label: "Badges", icon: <Award size={18} /> },
        { href: "/forum", label: "Forum", icon: <MessageCircle size={18} /> },
        { href: "/leaderboard", label: "Leaderboard", icon: <Trophy size={18} /> },
    ];

    const userRole = (session?.user as { role?: string })?.role;

    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(82, 183, 136, 0.15)",
                boxShadow: "0 2px 16px rgba(26, 77, 46, 0.06)",
            }}
        >
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "0 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "70px",
                }}
            >
                {/* Logo */}
                <Link
                    href="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        textDecoration: "none",
                        fontWeight: 800,
                        fontSize: "1.4rem",
                        color: "#1a4d2e",
                    }}
                >
                    <span
                        style={{
                            background: "linear-gradient(135deg, #2d6a4f, #52b788)",
                            borderRadius: "12px",
                            padding: "8px",
                            display: "flex",
                            color: "white",
                        }}
                    >
                        <Leaf size={24} />
                    </span>
                    Green Living
                </Link>

                {/* Desktop Navigation */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                    className="hidden md:flex"
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                borderRadius: "50px",
                                fontSize: "0.9rem",
                                fontWeight: 500,
                                color: "#2d6a4f",
                                textDecoration: "none",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(82, 183, 136, 0.1)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                            }}
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}

                    {session?.user ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {userRole === "ADMIN" && (
                                <Link
                                    href="/admin"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 16px",
                                        borderRadius: "50px",
                                        fontSize: "0.9rem",
                                        fontWeight: 500,
                                        color: "#dc2626",
                                        textDecoration: "none",
                                        transition: "all 0.3s ease",
                                    }}
                                >
                                    <Shield size={18} /> Admin
                                </Link>
                            )}
                            <Link
                                href="/profile"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 16px",
                                    borderRadius: "50px",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    color: "#1a4d2e",
                                    textDecoration: "none",
                                    background: "rgba(82, 183, 136, 0.1)",
                                }}
                            >
                                <User size={18} /> {session.user.name}
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="btn-secondary"
                                style={{ padding: "8px 18px", fontSize: "0.85rem" }}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Link href="/login" className="btn-secondary" style={{ padding: "8px 18px", fontSize: "0.85rem", textDecoration: "none" }}>
                                <LogIn size={16} /> Login
                            </Link>
                            <Link href="/register" className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem", textDecoration: "none" }}>
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden"
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#1a4d2e",
                        padding: "8px",
                    }}
                >
                    {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div
                    className="md:hidden"
                    style={{
                        background: "rgba(255, 255, 255, 0.98)",
                        borderTop: "1px solid rgba(82, 183, 136, 0.1)",
                        padding: "16px 24px",
                        animation: "fadeInUp 0.3s ease-out",
                    }}
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "14px 16px",
                                borderRadius: "12px",
                                fontSize: "1rem",
                                fontWeight: 500,
                                color: "#2d6a4f",
                                textDecoration: "none",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}

                    <div style={{ borderTop: "1px solid rgba(82, 183, 136, 0.1)", paddingTop: "12px", marginTop: "8px" }}>
                        {session?.user ? (
                            <>
                                <Link
                                    href="/profile"
                                    onClick={() => setMenuOpen(false)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "14px 16px",
                                        borderRadius: "12px",
                                        color: "#1a4d2e",
                                        textDecoration: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    <User size={18} /> Profile
                                </Link>
                                {userRole === "ADMIN" && (
                                    <Link href="/admin" onClick={() => setMenuOpen(false)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px",
                                            borderRadius: "12px", color: "#dc2626", textDecoration: "none", fontWeight: 600,
                                        }}>
                                        <Shield size={18} /> Admin Panel
                                    </Link>
                                )}
                                <button
                                    onClick={() => { signOut({ callbackUrl: "/login" }); setMenuOpen(false); }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "14px 16px",
                                        width: "100%",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#dc2626",
                                        fontWeight: 600,
                                        fontSize: "1rem",
                                    }}
                                >
                                    <LogOut size={18} /> Logout
                                </button>
                            </>
                        ) : (
                            <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
                                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>
                                    Login
                                </Link>
                                <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
