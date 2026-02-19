"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Mail, Lock, User, Leaf, ArrowRight } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            addToast("Passwords do not match", "error");
            return;
        }

        if (password.length < 6) {
            addToast("Password must be at least 6 characters", "error");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                addToast(data.error || "Registration failed", "error");
                setLoading(false);
                return;
            }

            addToast("Account created successfully! 🌱", "success");

            // Auto sign in after registration
            const signInResult = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            setLoading(false);

            if (signInResult?.error) {
                addToast(signInResult.error, "error");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch {
            addToast("Something went wrong", "error");
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
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
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-forest)", marginBottom: "8px" }}>Join Green Living</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Create your account and start planting</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label className="form-label">
                            <User size={14} style={{ display: "inline", marginRight: "6px" }} />Full Name
                        </label>
                        <input type="text" className="form-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label className="form-label">
                            <Mail size={14} style={{ display: "inline", marginRight: "6px" }} />Email
                        </label>
                        <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label className="form-label">
                            <Lock size={14} style={{ display: "inline", marginRight: "6px" }} />Password
                        </label>
                        <input type="password" className="form-input" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: "28px" }}>
                        <label className="form-label">
                            <Lock size={14} style={{ display: "inline", marginRight: "6px" }} />Confirm Password
                        </label>
                        <input type="password" className="form-input" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}
                        style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "1rem" }}>
                        {loading ? "Creating account..." : <><UserPlus size={20} /> Create Account</>}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "24px", color: "#6b7280", fontSize: "0.95rem" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "#2d6a4f", fontWeight: 600, textDecoration: "none" }}>
                        Sign in <ArrowRight size={14} style={{ display: "inline" }} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
