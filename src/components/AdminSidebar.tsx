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
    MoreHorizontal,
} from "lucide-react";

interface AdminSidebarProps {
    activeTab: "overview" | "uploads" | "posts" | "users";
    onTabChange: (tab: "overview" | "uploads" | "posts" | "users") => void;
    pendingCount?: number;
}

export default function AdminSidebar({ activeTab, onTabChange, pendingCount = 0 }: AdminSidebarProps) {
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(true);

    const navItems = [
        { key: "overview" as const, label: "Dashboard", icon: <LayoutDashboard size={20} /> },
        { key: "users" as const, label: "Users", icon: <Users size={20} /> },
        { key: "uploads" as const, label: "Uploads", icon: <Image size={20} />, badge: pendingCount },
        { key: "posts" as const, label: "Posts", icon: <MessageCircle size={20} /> },
    ];

    const userName = session?.user?.name || "Admin";
    const userEmail = (session?.user as { email?: string })?.email || "admin@greenlife.com";

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

        </aside>
    );
}
