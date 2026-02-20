"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, MapPin, FileText, TreePine, Image, CheckCircle, AlertCircle, Sprout } from "lucide-react";

const TREE_TYPES = [
    "Oak", "Maple", "Pine", "Birch", "Cedar", "Willow", "Cherry Blossom",
    "Banyan", "Neem", "Coconut Palm", "Mango", "Eucalyptus", "Bamboo",
    "Teak", "Mahogany", "Apple", "Olive", "Other",
];

export default function UploadPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [treeType, setTreeType] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState<{ message: string; newBadges: string[] } | null>(null);

    if (status === "loading") return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
    if (!session) {
        router.push("/login");
        return null;
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be under 5MB");
            return;
        }

        setImage(file);
        setError("");
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image || !location || !description || !treeType) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("image", image);
        formData.append("location", location);
        formData.append("description", description);
        formData.append("treeType", treeType);

        try {
            const res = await fetch("/api/uploads", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error);
            } else {
                setSuccess({ message: data.message, newBadges: data.newBadges || [] });
                // Reset form
                setImage(null);
                setPreview("");
                setLocation("");
                setDescription("");
                setTreeType("");
            }
        } catch {
            setError("Upload failed. Please try again.");
        }

        setLoading(false);
    };

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 24px 80px" }}>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 className="section-title" style={{ marginBottom: "8px" }}>
                    <Sprout size={32} style={{ display: "inline", marginRight: "10px", color: "#52b788" }} />
                    Upload Your Tree
                </h1>
                <p className="section-subtitle" style={{ marginBottom: "0" }}>Share your contribution with the community</p>
            </div>

            {/* Success Message */}
            {success && (
                <div className="glass-card animate-fade-in-up" style={{
                    padding: "24px", marginBottom: "24px", textAlign: "center",
                    border: "2px solid rgba(82, 183, 136, 0.3)",
                }}>
                    <CheckCircle size={48} style={{ color: "#52b788", marginBottom: "12px" }} />
                    <h3 style={{ color: "#1a4d2e", fontWeight: 700, marginBottom: "8px" }}>{success.message}</h3>
                    {success.newBadges.length > 0 && (
                        <div style={{ marginTop: "12px" }}>
                            <p style={{ color: "#52b788", fontWeight: 600 }}>🎉 New Badge Unlocked!</p>
                            {success.newBadges.map((badge) => (
                                <span key={badge} style={{
                                    display: "inline-block", padding: "6px 16px", borderRadius: "50px",
                                    background: "linear-gradient(135deg, #2d6a4f, #52b788)", color: "white",
                                    fontWeight: 600, fontSize: "0.9rem", margin: "4px",
                                }}>
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}
                    <button onClick={() => setSuccess(null)} className="btn-primary" style={{ marginTop: "16px" }}>
                        Upload Another Tree
                    </button>
                </div>
            )}

            {/* Upload Form */}
            {!success && (
                <div className="glass-card animate-fade-in-up" style={{ padding: "36px" }}>
                    {error && (
                        <div style={{
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
                            color: "#dc2626", fontSize: "0.9rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px",
                        }}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Image Upload */}
                        <div style={{ marginBottom: "24px" }}>
                            <label className="form-label"><Image size={14} style={{ display: "inline", marginRight: "6px" }} />Tree Photo</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: "2px dashed rgba(82, 183, 136, 0.3)",
                                    borderRadius: "16px",
                                    padding: preview ? "0" : "48px 24px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    overflow: "hidden",
                                    background: preview ? "transparent" : "rgba(240, 253, 244, 0.5)",
                                }}
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "14px" }} />
                                ) : (
                                    <>
                                        <Upload size={40} style={{ color: "#52b788", marginBottom: "12px", display: "block", margin: "0 auto 12px" }} />
                                        <p style={{ color: "#6b7280", fontWeight: 500 }}>Click to upload your tree photo</p>
                                        <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "4px" }}>Max 5MB, JPG/PNG</p>
                                    </>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                        </div>

                        {/* Tree Type */}
                        <div style={{ marginBottom: "20px" }}>
                            <label className="form-label"><TreePine size={14} style={{ display: "inline", marginRight: "6px" }} />Tree Type</label>
                            <select className="form-select" value={treeType} onChange={(e) => setTreeType(e.target.value)} required>
                                <option value="">Select tree type...</option>
                                {TREE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Location */}
                        <div style={{ marginBottom: "20px" }}>
                            <label className="form-label"><MapPin size={14} style={{ display: "inline", marginRight: "6px" }} />Location</label>
                            <input className="form-input" placeholder="e.g. Central Park, New York" value={location} onChange={(e) => setLocation(e.target.value)} required />
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: "28px" }}>
                            <label className="form-label"><FileText size={14} style={{ display: "inline", marginRight: "6px" }} />Description</label>
                            <textarea
                                className="form-input"
                                placeholder="Tell us about your planting experience..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                style={{ resize: "vertical" }}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}
                            style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            {loading ? "Uploading..." : <><Upload size={20} /> Upload Tree</>}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}