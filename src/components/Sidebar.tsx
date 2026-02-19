"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    Leaf,
    TreePine,
    Upload,
    Award,
    MessageCircle,
    Trophy,
    Shield,
    User,
    LogIn,
    LogOut,
    Settings,
    MoreHorizontal,
    Sun,
    Moon,
    Image,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);
    const { theme, toggleTheme } = useTheme();

    const userRole = (session?.user as { role?: string })?.role;
    const userName = session?.user?.name || "Guest";
    const userEmail = (session?.user as { email?: string })?.email || "";

    const navItems = [
        { href: "/", label: "Home", icon: <TreePine size={20} /> },
        { href: "/upload", label: "Upload", icon: <Upload size={20} /> },
        { href: "/badges", label: "Badges", icon: <Award size={20} /> },
        { href: "/forum", label: "Forum", icon: <MessageCircle size={20} /> },
        { href: "/leaderboard", label: "Leaderboard", icon: <Trophy size={20} /> },
        { href: "/profile", label: "Profile", icon: <User size={20} /> },
    ];

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <>
            <aside
                className={`admin-sidebar ${collapsed ? "admin-sidebar-collapsed" : ""}`}
                onMouseEnter={() => setCollapsed(false)}
                onMouseLeave={() => setCollapsed(true)}
            >
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Leaf size={collapsed ? 20 : 22} />
                    </div>
                    {!collapsed && <span className="sidebar-logo-text">Green Living</span>}
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-nav-item ${isActive(item.href) ? "sidebar-nav-item-active" : ""}`}
                            title={collapsed ? item.label : undefined}
                            style={{ textDecoration: "none" }}
                        >
                            <span className="sidebar-nav-icon">{item.icon}</span>
                            {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
                        </Link>
                    ))}

                    {/* Admin link — only for admin users */}
                    {userRole === "ADMIN" && (
                        <Link
                            href="/admin"
                            className={`sidebar-nav-item ${isActive("/admin") ? "sidebar-nav-item-active" : ""}`}
                            title={collapsed ? "Admin" : undefined}
                            style={{ textDecoration: "none", marginTop: "8px" }}
                        >
                            <span className="sidebar-nav-icon" style={{ color: isActive("/admin") ? "#dc2626" : undefined }}>
                                <Shield size={20} />
                            </span>
                            {!collapsed && <span className="sidebar-nav-label" style={{ color: isActive("/admin") ? "#dc2626" : undefined }}>Admin</span>}
                        </Link>
                    )}
                </nav>

                {/* Bottom Section */}
                <div className="sidebar-bottom">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="sidebar-nav-item"
                        title={collapsed ? (theme === "light" ? "Dark Mode" : "Light Mode") : undefined}
                    >
                        <span className="sidebar-nav-icon">
                            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                        </span>
                        {!collapsed && <span className="sidebar-nav-label">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
                    </button>

                    {/* User Profile / Auth */}
                    {session?.user ? (
                        <div className="sidebar-profile">
                            <div className="sidebar-profile-avatar">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            {!collapsed && (
                                <div className="sidebar-profile-info">
                                    <div className="sidebar-profile-name">{userName}</div>
                                    <div className="sidebar-profile-email">{userEmail}</div>
                                </div>
                            )}
                            {!collapsed && (
                                <button
                                    className="sidebar-profile-more"
                                    title="Logout"
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ padding: collapsed ? "8px 4px" : "8px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <Link
                                href="/login"
                                className="sidebar-nav-item"
                                style={{ textDecoration: "none", justifyContent: collapsed ? "center" : undefined }}
                            >
                                <span className="sidebar-nav-icon"><LogIn size={20} /></span>
                                {!collapsed && <span className="sidebar-nav-label">Sign In</span>}
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <div className="mobile-bottom-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`mobile-nav-item ${isActive(item.href) ? "mobile-nav-item-active" : ""}`}
                    >
                        <span className="mobile-nav-icon">{item.icon}</span>
                        <span className="mobile-nav-label">{item.label}</span>
                    </Link>
                ))}
                {userRole === "ADMIN" && (
                    <Link
                        href="/admin"
                        className={`mobile-nav-item ${isActive("/admin") ? "mobile-nav-item-active" : ""}`}
                    >
                        <span className="mobile-nav-icon" style={{ color: isActive("/admin") ? "#dc2626" : undefined }}>
                            <Shield size={20} />
                        </span>
                        <span className="mobile-nav-label" style={{ color: isActive("/admin") ? "#dc2626" : undefined }}>Admin</span>
                    </Link>
                )}
                {session?.user && (
                    <button
                        className="mobile-nav-item"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        <span className="mobile-nav-icon"><LogOut size={20} /></span>
                        <span className="mobile-nav-label">Logout</span>
                    </button>
                )}
                {!session?.user && (
                    <Link
                        href="/login"
                        className="mobile-nav-item"
                    >
                        <span className="mobile-nav-icon"><LogIn size={20} /></span>
                        <span className="mobile-nav-label">Login</span>
                    </Link>
                )}
            </div>
        </>
    );
}
