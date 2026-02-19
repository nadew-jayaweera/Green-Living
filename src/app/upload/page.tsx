"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload as UploadIcon, MapPin, FileText, TreePine, Image, Sprout, Loader2, ArrowLeft, ArrowRight, Check, Calendar } from "lucide-react";
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
    const [step, setStep] = useState(1);
    const [datePlanted, setDatePlanted] = useState("");

    if (status === "loading") return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
    if (!session) {
        router.push("/login");
        return null;
    }

    const processImage = async (file: File) => {
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
            setPreview(URL.createObjectURL(compressedFile));

            addToast("Image ready for upload!", "success");

            // Auto-advance to next step if first time
            if (step === 1) setTimeout(() => setStep(2), 500);
        } catch (error) {
            console.error("Compression failed:", error);
            addToast("Failed to process image", "error");
            // Fallback to original if compression fails
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processImage(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) await processImage(file);
    };

    const handlegetLocation = () => {
        if (!navigator.geolocation) {
            addToast("Geolocation is not supported by your browser", "error");
            return;
        }

        addToast("Fetching location...", "info");
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                );
                const data = await res.json();
                const address = data.address;
                const city = address.city || address.town || address.village || address.hamlet || "Unknown Location";
                const country = address.country || "";

                // Format: City, Country
                const locString = country ? `${city}, ${country}` : city;
                setLocation(locString);
                addToast("Location fetched successfully!", "success");
            } catch (error) {
                console.error("Error fetching location:", error);
                addToast("Failed to fetch location name", "error");
            }
        }, () => {
            addToast("Unable to retrieve your location", "error");
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image || !treeType || !location) {
            addToast("Please fill in all required fields", "info");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("image", image);
        formData.append("treeType", treeType);
        formData.append("location", location);
        formData.append("description", description);
        formData.append("datePlanted", datePlanted);

        try {
            const res = await fetch("/api/uploads", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                addToast(data.error || "Upload failed", "error");
            } else {
                addToast(data.message || "Tree uploaded successfully! 🌱", "success");
                setImage(null);
                setPreview("");
                setTreeType("");
                setLocation("");
                setDescription("");
                setDatePlanted(new Date().toISOString().split('T')[0]); // Reset date
                setStep(1);

                setTimeout(() => {
                    router.push("/feed");
                }, 1500);
            }
        } catch (error) {
            console.error("Upload error:", error);
            addToast("Something went wrong", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <h1 className="section-title">
                    <TreePine size={32} style={{ display: "inline", marginRight: "10px", color: "var(--color-forest)" }} />
                    Plant a Tree
                </h1>
                <p className="section-subtitle">Share your contribution to a greener planet</p>
            </div>

            {/* Progress Steps */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
                    <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: step >= 1 ? "var(--color-forest)" : "#e5e7eb",
                        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, transition: "all 0.3s ease"
                    }}>1</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: step >= 1 ? "var(--color-forest)" : "var(--text-secondary)" }}>Photo</div>
                </div>
                <div style={{ width: "60px", height: "2px", background: "#e5e7eb", margin: "0 16px", alignSelf: "center" }}>
                    <div style={{ width: step >= 2 ? "100%" : "0%", height: "100%", background: "var(--color-forest)", transition: "width 0.3s ease" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
                    <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: step >= 2 ? "var(--color-forest)" : "#e5e7eb",
                        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, transition: "all 0.3s ease"
                    }}>2</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: step >= 2 ? "var(--color-forest)" : "var(--text-secondary)" }}>Details</div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: "40px" }}>
                <form onSubmit={handleSubmit}>
                    {step === 1 ? (
                        <div className="animate-fade-in-up">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                    height: "300px",
                                    border: `2px dashed ${isDragging ? "var(--color-forest)" : "var(--color-leaf)"}`,
                                    borderRadius: "16px",
                                    cursor: "pointer",
                                    background: isDragging
                                        ? "rgba(74, 222, 128, 0.1)"
                                        : (preview ? `url(${preview}) center/cover no-repeat` : "rgba(82, 183, 136, 0.05)"),
                                    position: "relative",
                                    overflow: "hidden",
                                    transition: "all 0.2s",
                                    transform: isDragging ? "scale(1.02)" : "scale(1)"
                                }}
                            >
                                {!preview && (
                                    <>
                                        <div style={{ background: "rgba(255,255,255,0.8)", padding: "20px", borderRadius: "50%", marginBottom: "16px" }}>
                                            <UploadIcon size={40} style={{ color: "var(--color-forest)" }} />
                                        </div>
                                        <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-forest)", marginBottom: "8px" }}>
                                            {isDragging ? "Drop your photo here!" : "Click to upload tree photo"}
                                        </div>
                                        <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Supports JPG, PNG (Max 5MB)</div>
                                    </>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: "none" }}
                                />

                                {preview && (
                                    <div style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "rgba(0,0,0,0.3)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        opacity: 0,
                                        transition: "opacity 0.2s"
                                    }}
                                        className="preview-overlay"
                                    >
                                        <div style={{ background: "white", padding: "12px 24px", borderRadius: "30px", fontWeight: 700, color: "var(--color-forest)" }}>
                                            Change Photo
                                        </div>
                                        <style jsx>{`
                                            .preview-overlay:hover { opacity: 1 !important; }
                                        `}</style>
                                    </div>
                                )}
                            </div>

                            {preview && (
                                <div style={{ textAlign: "right", marginTop: "24px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="btn-primary"
                                        style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                                    >
                                        Next Step <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-fade-in-up">
                            {/* Preview Thumbnail */}
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", padding: "12px", background: "rgba(255,255,255,0.5)", borderRadius: "12px" }}>
                                <img src={preview} alt="Preview" style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>Photo Selected</div>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        style={{ background: "none", border: "none", color: "var(--color-forest)", fontSize: "0.85rem", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                                    >
                                        Change photo
                                    </button>
                                </div>
                                <Check size={20} style={{ color: "var(--color-forest)" }} />
                            </div>

                            <div style={{ display: "grid", gap: "20px" }}>
                                <div>
                                    <label className="form-label">
                                        <TreePine size={16} /> Tree Species / Type
                                    </label>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <select
                                            className="form-select"
                                            value={TREE_TYPES.includes(treeType) ? treeType : "Other"}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "Other") setTreeType("");
                                                else setTreeType(val);
                                            }}
                                            style={{ flex: 1 }}
                                        >
                                            <option value="" disabled>Select a type...</option>
                                            {TREE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        {!TREE_TYPES.includes(treeType) && treeType !== "" && (
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Enter type..."
                                                value={treeType}
                                                onChange={(e) => setTreeType(e.target.value)}
                                                style={{ flex: 1 }}
                                                required
                                            />
                                        )}
                                        {/* Allow manual entry if "Other" is selected effectively */}
                                        {(TREE_TYPES.includes(treeType) === false) && (
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Specify type"
                                                value={treeType}
                                                onChange={(e) => setTreeType(e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                        )}
                                    </div>
                                    {/* Fix: simple input for now to avoid complexity with select/text combo */}
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Oak, Maple, Fruit Tree..."
                                        value={treeType}
                                        onChange={(e) => setTreeType(e.target.value)}
                                        required
                                        style={{ marginTop: "8px" }}
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div>
                                        <label className="form-label">
                                            <MapPin size={16} /> Location
                                        </label>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="City, Country"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={handlegetLocation}
                                                className="btn-secondary"
                                                style={{ padding: "0 12px" }}
                                                title="Get Current Location"
                                            >
                                                <MapPin size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            <Calendar size={16} /> Date Planted
                                        </label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={datePlanted}
                                            onChange={(e) => setDatePlanted(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">
                                        <FileText size={16} /> Story / Description
                                    </label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Tell us about why you planted this tree..."
                                        rows={4}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="btn-secondary"
                                        style={{ flex: 1, display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                                    >
                                        <ArrowLeft size={18} /> Back
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={loading}
                                        style={{ flex: 2, display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                                    >
                                        {loading ? "Planting..." : "Plant Tree 🌱"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
