"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Users, TreePine, MessageCircle, Image, Check, X, Trash2, AlertCircle, UserCog, Mail, Calendar, Award, Search, Filter } from "lucide-react";

interface AdminData {
    stats: {
        totalUsers: number;
        totalUploads: number;
        pendingUploads: number;
        totalPosts: number;
        totalComments: number;
    };
    recentUploads: Array<{
        id: string;
        imageUrl: string;
        treeType: string;
        location: string;
        status: string;
        createdAt: string;
        user: { name: string; email: string };
    }>;
    recentPosts: Array<{
        id: string;
        title: string;
        category: string;
        createdAt: string;
        user: { name: string; email: string };
    }>;
    allUsers: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: string;
        _count: { uploads: number; badges: number; forumPosts: number };
    }>;
    mainAdminEmail: string;
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "uploads" | "posts" | "users">("overview");
    const [actionLoading, setActionLoading] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const userRole = (session?.user as { role?: string })?.role;
    const userEmail = (session?.user as { email?: string })?.email;
    const isMainAdmin = data?.mainAdminEmail ? userEmail === data.mainAdminEmail : false;

    // Filter users based on search
    const filteredUsers = data?.allUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    useEffect(() => {
        if (status === "authenticated") {
            if (userRole !== "ADMIN") {
                router.push("/");
                return;
            }
            fetchData();
        }
    }, [session, status]);

    const fetchData = () => {
        fetch("/api/admin")
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    };

    const moderateUpload = async (uploadId: string, action: string) => {
        setActionLoading(uploadId);
        await fetch("/api/admin", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadId, action }),
        });
        fetchData();
        setActionLoading("");
    };

    const toggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
        if (!confirm(`Are you sure you want to ${newRole === "ADMIN" ? "promote" : "demote"} this user to ${newRole}?`)) return;
        setActionLoading(userId);
        await fetch("/api/admin", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, newRole }),
        });
        fetchData();
        setActionLoading("");
    };

    const deleteContent = async (type: string, id: string) => {
        if (!confirm("Are you sure you want to delete this?")) return;
        setActionLoading(id);
        await fetch("/api/admin", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, id }),
        });
        fetchData();
        setActionLoading("");
    };

    if (status === "loading" || loading) return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
    if (!session || userRole !== "ADMIN") return null;

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                <div style={{
                    background: "linear-gradient(135deg, #dc2626, #ef4444)", borderRadius: "14px",
                    padding: "10px", color: "white",
                }}>
                    <Shield size={28} />
                </div>
                <div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1a4d2e", margin: 0 }}>Admin Panel</h1>
                    <p style={{ color: "#6b7280", margin: 0 }}>Manage platform content and users</p>
                </div>
            </div>

            {/* Stats Cards */}
            {data && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                    {[
                        { icon: <Users size={24} />, value: data.stats.totalUsers, label: "Total Users", color: "#2d6a4f" },
                        { icon: <Image size={24} />, value: data.stats.totalUploads, label: "Total Uploads", color: "#52b788" },
                        { icon: <AlertCircle size={24} />, value: data.stats.pendingUploads, label: "Pending Review", color: "#f59e0b" },
                        { icon: <MessageCircle size={24} />, value: data.stats.totalPosts, label: "Forum Posts", color: "#87ceeb" },
                        { icon: <TreePine size={24} />, value: data.stats.totalComments, label: "Comments", color: "#8b6914" },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ color: stat.color }}>{stat.icon}</div>
                            <div>
                                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a4d2e" }}>{stat.value}</div>
                                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                {[
                    { key: "overview", label: "Overview" },
                    { key: "users", label: "Manage Users" },
                    { key: "uploads", label: "Manage Uploads" },
                    { key: "posts", label: "Manage Posts" },
                ].map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`category-pill ${activeTab === tab.key ? "active" : ""}`}
                        style={{
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            transform: activeTab === tab.key ? "scale(1.05)" : "scale(1)",
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Users Management */}
            {(activeTab === "overview" || activeTab === "users") && data && (
                <div className="glass-card animate-fade-in-up" style={{ padding: "24px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ background: "rgba(82,183,136,0.1)", padding: "8px", borderRadius: "8px", color: "#2d6a4f" }}>
                                <UserCog size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontWeight: 700, color: "#1a4d2e", margin: 0 }}>
                                    {activeTab === "overview" ? "Recent Users" : "Registered Users"}
                                </h2>
                                <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>
                                    {activeTab === "overview" ? "Newest members of the community" : `Manage all ${data.allUsers.length} users`}
                                </p>
                            </div>
                        </div>

                        {activeTab === "users" && (
                            <div style={{ position: "relative", minWidth: "250px" }}>
                                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input"
                                    style={{ paddingLeft: "36px", paddingTop: "10px", paddingBottom: "10px", fontSize: "0.9rem" }}
                                />
                            </div>
                        )}
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                            <thead>
                                <tr>
                                    {["Name", "Contact", "Role", "Uploads", "Badges", "Posts", "Joined", "Actions"].map((h) => (
                                        <th key={h} style={{ textAlign: "left", padding: "0 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight: 700 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(activeTab === "overview" ? data.allUsers.slice(0, 5) : filteredUsers).map((user) => {
                                    const isCurrentUser = (session?.user as { email?: string })?.email === user.email;
                                    const isUserMainAdmin = user.email === data.mainAdminEmail;
                                    return (
                                        <tr key={user.id} style={{ transition: "all 0.2s ease" }} className="hover:bg-green-50/50">
                                            <td style={{ padding: "12px 16px", background: "white", borderTopLeftRadius: "12px", borderBottomLeftRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{
                                                        width: "36px", height: "36px", borderRadius: "10px",
                                                        background: isUserMainAdmin ? "linear-gradient(135deg, #dc2626, #f59e0b)" : "linear-gradient(135deg, #2d6a4f, #52b788)",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        color: "white", fontSize: "0.9rem", fontWeight: 700,
                                                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                                    }}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "#1a4d2e", fontSize: "0.95rem" }}>{user.name}</div>
                                                        {isCurrentUser && <span style={{ fontSize: "0.7rem", color: "#6b7280", display: "block" }}>(You)</span>}
                                                        {isUserMainAdmin && <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(220,38,38,0.1)", color: "#dc2626", fontWeight: 700 }}>Main Admin</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4b5563", fontSize: "0.9rem" }}>
                                                    <Mail size={14} /> {user.email}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                <span style={{
                                                    padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.02em",
                                                    background: user.role === "ADMIN" ? "rgba(220,38,38,0.1)" : "rgba(82,183,136,0.15)",
                                                    color: user.role === "ADMIN" ? "#dc2626" : "#2d6a4f",
                                                    border: user.role === "ADMIN" ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(82,183,136,0.2)",
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 16px", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#2d6a4f" }}>
                                                    <div style={{ background: "rgba(82,183,136,0.1)", padding: "4px", borderRadius: "50%" }}><TreePine size={14} /></div>
                                                    {user._count.uploads}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#d97706" }}>
                                                    <div style={{ background: "rgba(245,158,11,0.1)", padding: "4px", borderRadius: "50%" }}><Award size={14} /></div>
                                                    {user._count.badges}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#0284c7" }}>
                                                    <div style={{ background: "rgba(14,165,233,0.1)", padding: "4px", borderRadius: "50%" }}><MessageCircle size={14} /></div>
                                                    {user._count.forumPosts}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                                                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", background: "white", borderTopRightRadius: "12px", borderBottomRightRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                    {isUserMainAdmin ? (
                                                        <span style={{ fontSize: "0.75rem", color: "#6b7280", fontStyle: "italic", fontWeight: 500 }}>Protected</span>
                                                    ) : (
                                                        <>
                                                            {isMainAdmin && !isCurrentUser && (
                                                                <button onClick={() => toggleRole(user.id, user.role)}
                                                                    disabled={actionLoading === user.id}
                                                                    title={user.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
                                                                    className="hover:scale-105 active:scale-95 transition-transform"
                                                                    style={{
                                                                        padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                                                                        fontSize: "0.75rem", fontWeight: 600,
                                                                        background: user.role === "ADMIN" ? "rgba(245,158,11,0.1)" : "rgba(82,183,136,0.1)",
                                                                        color: user.role === "ADMIN" ? "#d97706" : "#2d6a4f",
                                                                        opacity: actionLoading === user.id ? 0.5 : 1,
                                                                    }}>
                                                                    {user.role === "ADMIN" ? "Demote" : "Promote"}
                                                                </button>
                                                            )}
                                                            {isMainAdmin && !isCurrentUser && (
                                                                <button onClick={() => deleteContent("user", user.id)}
                                                                    disabled={actionLoading === user.id}
                                                                    title="Delete User"
                                                                    className="hover:bg-red-100 hover:scale-105 active:scale-95 transition-all"
                                                                    style={{ padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {activeTab === "overview" && data.allUsers.length > 5 && (
                        <div style={{ textAlign: "center", marginTop: "16px" }}>
                            <button onClick={() => setActiveTab("users")} className="btn-secondary" style={{ padding: "8px 24px", fontSize: "0.85rem" }}>
                                View All {data.allUsers.length} Users →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Uploads Management */}
            {(activeTab === "overview" || activeTab === "uploads") && data && (
                <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
                    <h2 style={{ fontWeight: 700, color: "#1a4d2e", marginBottom: "16px" }}>
                        {activeTab === "overview" ? "Recent Uploads" : "All Uploads"}
                    </h2>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid rgba(82,183,136,0.1)" }}>
                                    {["User", "Tree Type", "Location", "Status", "Date", "Actions"].map((h) => (
                                        <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "0.85rem", color: "#6b7280", fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentUploads.map((upload) => (
                                    <tr key={upload.id} style={{ borderBottom: "1px solid rgba(82,183,136,0.05)" }}>
                                        <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{upload.user.name}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{upload.treeType}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{upload.location}</td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{
                                                padding: "4px 12px", borderRadius: "50px", fontSize: "0.75rem", fontWeight: 600,
                                                background: upload.status === "APPROVED" ? "rgba(82,183,136,0.1)" : upload.status === "REJECTED" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                                                color: upload.status === "APPROVED" ? "#2d6a4f" : upload.status === "REJECTED" ? "#dc2626" : "#d97706",
                                            }}>
                                                {upload.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#6b7280" }}>
                                            {new Date(upload.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                {upload.status !== "APPROVED" && (
                                                    <button onClick={() => moderateUpload(upload.id, "APPROVED")}
                                                        disabled={actionLoading === upload.id}
                                                        style={{ padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer", background: "rgba(82,183,136,0.1)", color: "#2d6a4f" }}>
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                {upload.status !== "REJECTED" && (
                                                    <button onClick={() => moderateUpload(upload.id, "REJECTED")}
                                                        disabled={actionLoading === upload.id}
                                                        style={{ padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                                                        <X size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => deleteContent("upload", upload.id)}
                                                    disabled={actionLoading === upload.id}
                                                    style={{ padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Posts Management */}
            {(activeTab === "overview" || activeTab === "posts") && data && (
                <div className="glass-card" style={{ padding: "24px" }}>
                    <h2 style={{ fontWeight: 700, color: "#1a4d2e", marginBottom: "16px" }}>
                        {activeTab === "overview" ? "Recent Posts" : "All Posts"}
                    </h2>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid rgba(82,183,136,0.1)" }}>
                                    {["User", "Title", "Category", "Date", "Actions"].map((h) => (
                                        <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "0.85rem", color: "#6b7280", fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentPosts.map((post) => (
                                    <tr key={post.id} style={{ borderBottom: "1px solid rgba(82,183,136,0.05)" }}>
                                        <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{post.user.name}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 600 }}>{post.title}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{post.category}</td>
                                        <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "#6b7280" }}>
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <button onClick={() => deleteContent("post", post.id)}
                                                disabled={actionLoading === post.id}
                                                style={{ padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
