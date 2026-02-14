"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock, Leaf, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError(result.error);
        } else {
            router.push("/");
            router.refresh();
        }
    };

    return (
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
            <div className="glass-card animate-fade-in-up" style={{ maxWidth: "460px", width: "100%", padding: "48px 40px" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "64px", height: "64px", borderRadius: "18px",
                        background: "linear-gradient(135deg, #2d6a4f, #52b788)", color: "white", marginBottom: "16px",
                    }}>
                        <Leaf size={32} />
                    </div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1a4d2e", marginBottom: "8px" }}>Welcome Back</h1>
                    <p style={{ color: "#6b7280" }}>Sign in to continue your green journey</p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
                        color: "#dc2626", fontSize: "0.9rem", fontWeight: 500,
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label className="form-label">
                            <Mail size={14} style={{ display: "inline", marginRight: "6px" }} />Email
                        </label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: "28px" }}>
                        <label className="form-label">
                            <Lock size={14} style={{ display: "inline", marginRight: "6px" }} />Password
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}
                        style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "1rem" }}>
                        {loading ? "Signing in..." : <><LogIn size={20} /> Sign In</>}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "24px", color: "#6b7280", fontSize: "0.95rem" }}>
                    Don&apos;t have an account?{" "}
                    <Link href="/register" style={{ color: "#2d6a4f", fontWeight: 600, textDecoration: "none" }}>
                        Create one <ArrowRight size={14} style={{ display: "inline" }} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
