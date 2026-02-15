"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, MapPin, FileText, TreePine, Image, Sprout, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import imageCompression from "browser-image-compression";

const TREE_TYPES = [
    "Oak", "Maple", "Pine", "Birch", "Cedar", "Willow", "Cherry Blossom",
    "Banyan", "Neem", "Coconut Palm", "Mango", "Eucalyptus", "Bamboo",
    "Teak", "Mahogany", "Apple", "Olive", "Other",
];

export default function UploadPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [treeType, setTreeType] = useState("");
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    if (status === "loading") return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
    if (!session) {
        router.push("/login");
        return null;
    }

    const handleCompressedUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            addToast("Please select an image file", "error");
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // Allow up to 10MB input, will compress down
            addToast("Image must be under 10MB", "error");
            return;
        }

        try {
            addToast("Compressing image...", "info");

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);
            setImage(compressedFile);

            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(compressedFile);

            addToast("Image ready for upload!", "success");
        } catch (error) {
            console.error("Compression error:", error);
            addToast("Compression failed, using original image", "info");
            setImage(file);
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleCompressedUpload(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleCompressedUpload(file);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            addToast("Geolocation is not supported by your browser", "error");
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();

                    if (data.display_name) {
                        // Extract a cleaner address (city, state, country)
                        const address = data.address;
                        const city = address.city || address.town || address.village || address.hamlet;
                        const state = address.state;
                        const country = address.country;

                        const formattedLocation = [city, state, country].filter(Boolean).join(", ");
                        setLocation(formattedLocation || data.display_name);
                        addToast("Location found!", "success");
                    } else {
                        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                        addToast("Using coordinates as location", "info");
                    }
                } catch (error) {
                    setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    addToast("Could not get address, using coordinates", "info");
                }
                setLocationLoading(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                let msg = "Failed to get location";
                if (error.code === 1) msg = "Location permission denied";
                if (error.code === 2) msg = "Location unavailable";
                if (error.code === 3) msg = "Location request timed out";
                addToast(msg, "error");
                setLocationLoading(false);
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image || !location || !description || !treeType) {
            addToast("Please fill in all fields", "error");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("image", image);
        formData.append("location", location);
        formData.append("description", description);
        formData.append("treeType", treeType);

        try {
            const res = await fetch("/api/uploads", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) {
                console.error("Upload failed", data);
                addToast(data.details ? `Error: ${data.details}` : (data.error || "Upload failed"), "error");
            } else {
                addToast(data.message || "Tree uploaded successfully! 🌱", "success");

                if (data.newBadges && data.newBadges.length > 0) {
                    setTimeout(() => {
                        data.newBadges.forEach((badge: string) => {
                            addToast(`🎉 New Badge Unlocked: ${badge}!`, "success");
                        });
                    }, 1000);
                }

                // Reset form
                setImage(null);
                setPreview("");
                setLocation("");
                setDescription("");
                setTreeType("");
            }
        } catch {
            addToast("Upload failed to connect. Please try again.", "error");
        }

        setLoading(false);
    };

    return (
        <div className="page-container">
            <div style={{ width: "100%", maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h1 className="section-title" style={{ marginBottom: "8px" }}>
                        <Sprout size={32} style={{ display: "inline", marginRight: "10px", color: "#52b788" }} />
                        Upload Your Tree
                    </h1>
                    <p className="section-subtitle" style={{ marginBottom: "0" }}>Share your contribution with the community</p>
                </div>

                {/* Upload Form */}
                <div className="glass-card animate-fade-in-up" style={{ padding: "36px" }}>
                    <form onSubmit={handleSubmit}>
                        {/* Image Upload */}
                        <div style={{ marginBottom: "24px" }}>
                            <label className="form-label"><Image size={14} style={{ display: "inline", marginRight: "6px" }} />Tree Photo</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                style={{
                                    border: `2px dashed ${isDragging ? "var(--color-forest)" : "var(--input-border)"}`,
                                    borderRadius: "16px",
                                    padding: preview ? "0" : "48px 24px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    overflow: "hidden",
                                    background: isDragging
                                        ? "rgba(74, 222, 128, 0.1)"
                                        : (preview ? "transparent" : "var(--card-bg)"),
                                    transform: isDragging ? "scale(1.02)" : "scale(1)",
                                }}
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "14px" }} />
                                ) : (
                                    <>
                                        <Upload size={40} style={{ color: isDragging ? "var(--color-forest)" : "var(--color-forest-light)", marginBottom: "12px", display: "block", margin: "0 auto 12px", transform: isDragging ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s" }} />
                                        <p style={{ color: isDragging ? "var(--color-forest)" : "var(--text-secondary)", fontWeight: 600 }}>
                                            {isDragging ? "Drop your tree here! 🌳" : "Click or Drag & Drop to upload"}
                                        </p>
                                        <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "4px" }}>Max 10MB, JPG/PNG (Auto-compressed)</p>
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
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>
                                    <MapPin size={14} style={{ display: "inline", marginRight: "6px" }} />Location
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    disabled={locationLoading}
                                    style={{
                                        background: "none", border: "none", color: "var(--color-forest)",
                                        fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: "4px"
                                    }}
                                >
                                    {locationLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                                    {locationLoading ? "Locating..." : "Use Current Location"}
                                </button>
                            </div>
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
            </div>
        </div>
    );
}
