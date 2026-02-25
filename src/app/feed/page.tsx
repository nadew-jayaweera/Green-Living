"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MessageCircle, MapPin, TreePine, Calendar, User, Leaf } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface Upload {
    id: string;
    imageUrl: string;
    location: string;
    description: string;
    treeType: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        image: string | null;
    };
}

export default function FeedPage() {
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { addToast } = useToast();

    const fetchUploads = async (page: number) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/uploads?page=${page}&limit=9`);
            const data = await res.json();
            setUploads(data.uploads || []);
            setTotalPages(data.pages || 1);
        } catch (error) {
            addToast("Failed to load feed", "error");
            console.error("Error fetching uploads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUploads(currentPage);
    }, [currentPage]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "short", 
            day: "numeric" 
        });
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
                <h1 className="section-title" style={{ marginBottom: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                    <Leaf size={36} style={{ color: "#52b788" }} />
                    Community Feed
                </h1>
                <p className="section-subtitle">Discover trees planted by our eco-warriors</p>
            </div>

            {/* Loading State */}
            {loading && (
                <div style={{ textAlign: "center", padding: "60px 24px" }}>
                    <div style={{
                        display: "inline-block",
                        width: "40px",
                        height: "40px",
                        border: "4px solid rgba(82, 183, 136, 0.2)",
                        borderTop: "4px solid #52b788",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}></div>
                    <p style={{ marginTop: "16px", color: "#6b7280" }}>Loading community feed...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && uploads.length === 0 && (
                <div className="glass-card animate-fade-in-up" style={{
                    textAlign: "center",
                    padding: "60px 24px",
                }}>
                    <Leaf size={48} style={{ color: "#52b788", margin: "0 auto 16px", display: "block" }} />
                    <h2 style={{ color: "#1a4d2e", fontWeight: 700, marginBottom: "8px" }}>No trees yet</h2>
                    <p style={{ color: "#6b7280", marginBottom: "24px" }}>Be the first to upload your tree!</p>
                    <Link href="/upload" className="btn-primary" style={{ display: "inline-block", padding: "12px 24px" }}>
                        Plant Your Tree
                    </Link>
                </div>
            )}

            {/* Uploads Grid */}
            {!loading && uploads.length > 0 && (
                <>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: "24px",
                        marginBottom: "40px",
                    }}>
                        {uploads.map((upload) => (
                            <div key={upload.id} className="glass-card animate-fade-in-up" style={{
                                overflow: "hidden",
                                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                            }}>
                                {/* Image */}
                                <div style={{
                                    width: "100%",
                                    height: "240px",
                                    overflow: "hidden",
                                    backgroundColor: "#f0fdfa",
                                }}>
                                    <img 
                                        src={upload.imageUrl} 
                                        alt={upload.treeType}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            transition: "transform 0.3s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.target as HTMLImageElement).style.transform = "scale(1.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.target as HTMLImageElement).style.transform = "scale(1)";
                                        }}
                                    />
                                </div>

                                {/* Content */}
                                <div style={{ padding: "20px" }}>
                                    {/* User Info */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        marginBottom: "16px",
                                    }}>
                                        {upload.user.image ? (
                                            <img 
                                                src={upload.user.image} 
                                                alt={upload.user.name}
                                                style={{
                                                    width: "40px",
                                                    height: "40px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                background: "linear-gradient(135deg, #2d6a4f, #52b788)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                                fontWeight: 600,
                                            }}>
                                                {upload.user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                fontWeight: 600,
                                                color: "#1a4d2e",
                                                margin: "0",
                                                fontSize: "0.95rem",
                                            }}>
                                                {upload.user.name}
                                            </p>
                                            <p style={{
                                                fontSize: "0.8rem",
                                                color: "#6b7280",
                                                margin: "0",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                            }}>
                                                <Calendar size={12} />
                                                {formatDate(upload.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tree Type & Location */}
                                    <div style={{
                                        display: "flex",
                                        gap: "8px",
                                        marginBottom: "12px",
                                        flexWrap: "wrap",
                                    }}>
                                        <span style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            background: "rgba(82, 183, 136, 0.1)",
                                            color: "#52b788",
                                            padding: "4px 12px",
                                            borderRadius: "20px",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                        }}>
                                            <TreePine size={12} />
                                            {upload.treeType}
                                        </span>
                                        <span style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            background: "rgba(82, 183, 136, 0.1)",
                                            color: "#52b788",
                                            padding: "4px 12px",
                                            borderRadius: "20px",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                        }}>
                                            <MapPin size={12} />
                                            {upload.location}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p style={{
                                        color: "#6b7280",
                                        fontSize: "0.9rem",
                                        margin: "0 0 16px 0",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}>
                                        {upload.description}
                                    </p>

                                    {/* Actions */}
                                    <div style={{
                                        display: "flex",
                                        gap: "8px",
                                        paddingTop: "16px",
                                        borderTop: "1px solid rgba(82, 183, 136, 0.1)",
                                    }}>
                                        <button style={{
                                            flex: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "6px",
                                            padding: "10px",
                                            background: "rgba(82, 183, 136, 0.1)",
                                            color: "#52b788",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            fontSize: "0.9rem",
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(82, 183, 136, 0.2)";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(82, 183, 136, 0.1)";
                                        }}
                                        >
                                            <Heart size={16} />
                                            Like
                                        </button>
                                        <button style={{
                                            flex: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "6px",
                                            padding: "10px",
                                            background: "rgba(82, 183, 136, 0.1)",
                                            color: "#52b788",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            fontSize: "0.9rem",
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(82, 183, 136, 0.2)";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(82, 183, 136, 0.1)";
                                        }}
                                        >
                                            <MessageCircle size={16} />
                                            Comment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "40px",
                        }}>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="btn-primary"
                                style={{
                                    padding: "10px 16px",
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                }}
                            >
                                Previous
                            </button>
                            <div style={{
                                display: "flex",
                                gap: "4px",
                            }}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "8px",
                                            border: "none",
                                            background: currentPage === page 
                                                ? "linear-gradient(135deg, #2d6a4f, #52b788)"
                                                : "rgba(82, 183, 136, 0.1)",
                                            color: currentPage === page ? "white" : "#52b788",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="btn-primary"
                                style={{
                                    padding: "10px 16px",
                                    opacity: currentPage === totalPages ? 0.5 : 1,
                                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* CSS for loading animation */}
            <style>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
