"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    Leaf,
    LayoutDashboard,
    Users,
    Image,
    MessageCircle,
    Settings,
    Moon,
    Sun,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
} from "lucide-react";

interface AdminSidebarProps {
    activeTab: "overview" | "uploads" | "posts" | "users";
    onTabChange: (tab: "overview" | "uploads" | "posts" | "users") => void;
    pendingCount?: number;
}

export default function AdminSidebar({ activeTab, onTabChange, pendingCount = 0 }: AdminSidebarProps) {
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const navItems = [
        { key: "overview" as const, label: "Dashboard", icon: <LayoutDashboard size={20} /> },
        { key: "users" as const, label: "Users", icon: <Users size={20} /> },
        { key: "uploads" as const, label: "Uploads", icon: <Image size={20} />, badge: pendingCount },
        { key: "posts" as const, label: "Posts", icon: <MessageCircle size={20} /> },
    ];

    const userName = session?.user?.name || "Admin";
    const userEmail = (session?.user as { email?: string })?.email || "admin@greenlife.com";

    return (
        <aside className={`admin-sidebar ${collapsed ? "admin-sidebar-collapsed" : ""}`}>
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
                    <button
                        key={item.key}
                        onClick={() => onTabChange(item.key)}
                        className={`sidebar-nav-item ${activeTab === item.key ? "sidebar-nav-item-active" : ""}`}
                        title={collapsed ? item.label : undefined}
                    >
                        <span className="sidebar-nav-icon">{item.icon}</span>
                        {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
                        {item.badge && item.badge > 0 && (
                            <span className="sidebar-badge">{item.badge}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="sidebar-bottom">
                {/* Settings Link */}
                <Link
                    href="/admin"
                    className="sidebar-nav-item"
                    title={collapsed ? "Settings" : undefined}
                    style={{ textDecoration: "none" }}
                >
                    <span className="sidebar-nav-icon"><Settings size={20} /></span>
                    {!collapsed && <span className="sidebar-nav-label">Settings</span>}
                </Link>

                {/* Dark Mode Toggle */}
                <div className="sidebar-toggle-row">
                    {!collapsed && <span className="sidebar-toggle-label">Dark Mode</span>}
                    <button
                        className="sidebar-dark-toggle"
                        onClick={() => setDarkMode(!darkMode)}
                        title="Toggle dark mode"
                    >
                        <span className={`sidebar-toggle-track ${darkMode ? "sidebar-toggle-active" : ""}`}>
                            <span className="sidebar-toggle-thumb">
                                {darkMode ? <Moon size={12} /> : <Sun size={12} />}
                            </span>
                        </span>
                    </button>
                </div>

                {/* User Profile */}
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
                        <button className="sidebar-profile-more" title="Options">
                            <MoreHorizontal size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Collapse Toggle */}
            <button
                className="sidebar-collapse-btn"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        </aside>
    );
}
