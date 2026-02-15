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
} from "lucide-react";

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);

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
                {/* Settings Link */}
                <Link
                    href="/profile"
                    className="sidebar-nav-item"
                    title={collapsed ? "Settings" : undefined}
                    style={{ textDecoration: "none" }}
                >
                    <span className="sidebar-nav-icon"><Settings size={20} /></span>
                    {!collapsed && <span className="sidebar-nav-label">Settings</span>}
                </Link>

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
    );
}
