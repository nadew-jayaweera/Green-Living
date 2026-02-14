"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TreePine, Users, Camera, ArrowRight, Sprout, Award, MessageCircle, TrendingUp } from "lucide-react";

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, started]);

  return { count, start: () => setStarted(true) };
}

interface Upload {
  id: string;
  imageUrl: string;
  treeType: string;
  location: string;
  user: { name: string };
}

export default function HomePage() {
  const [stats, setStats] = useState({ totalTrees: 0, totalUsers: 0 });
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const treeCounter = useCounter(stats.totalTrees);
  const userCounter = useCounter(stats.totalUsers);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats({ totalTrees: data.totalTrees || 0, totalUsers: data.totalUsers || 0 });
        setRecentUploads(data.recentUploads || []);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (stats.totalTrees > 0) treeCounter.start();
    if (stats.totalUsers > 0) userCounter.start();
  }, [stats]);

  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section className="hero-gradient" style={{ padding: "100px 24px 80px", color: "white", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="animate-fade-in-up" style={{ marginBottom: "24px" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.15)", padding: "8px 20px",
              borderRadius: "50px", fontSize: "0.9rem", fontWeight: 600, backdropFilter: "blur(10px)",
            }}>
              🌍 Join the Movement
            </span>
          </div>

          <h1
            className="animate-fade-in-up delay-100"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "24px",
              letterSpacing: "-0.02em",
            }}
          >
            Plant Today,<br />
            Protect Tomorrow <span className="animate-float" style={{ display: "inline-block" }}>🌱</span>
          </h1>

          <p
            className="animate-fade-in-up delay-200"
            style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.85)", maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.7 }}
          >
            Upload photos of your planted trees, earn eco badges, and be part of a global community making the world greener.
          </p>

          <div className="animate-fade-in-up delay-300" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/upload" className="btn-primary" style={{ padding: "16px 40px", fontSize: "1.1rem" }}>
              <Sprout size={22} /> Start Planting
            </Link>
            <Link href="/forum" className="btn-secondary" style={{
              padding: "16px 40px", fontSize: "1.1rem", color: "white", borderColor: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.1)", textDecoration: "none"
            }}>
              Join Community <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", height: "80px", overflow: "hidden" }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="#f0fdf4" />
          </svg>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section style={{ padding: "80px 24px", background: "var(--color-cream)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2 className="section-title">Our Impact</h2>
          <p className="section-subtitle">Every tree planted is a step toward a healthier planet</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            {[
              { icon: <TreePine size={40} />, value: treeCounter.count || stats.totalTrees, label: "Trees Planted", color: "#2d6a4f" },
              { icon: <Users size={40} />, value: userCounter.count || stats.totalUsers, label: "Active Members", color: "#52b788" },
              { icon: <Camera size={40} />, value: recentUploads.length, label: "Recent Uploads", color: "#87ceeb" },
            ].map((stat, i) => (
              <div
                key={i}
                className="glass-card animate-fade-in-up"
                style={{ padding: "36px 24px", textAlign: "center", animationDelay: `${i * 0.15}s` }}
              >
                <div style={{ color: stat.color, marginBottom: "12px", display: "flex", justifyContent: "center" }}>{stat.icon}</div>
                <div style={{ fontSize: "3rem", fontWeight: 900, color: "#1a4d2e", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "0.95rem", color: "#6b7280", marginTop: "8px", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three simple steps to make a difference</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            {[
              { step: "01", icon: <Sprout size={36} />, title: "Plant a Tree", desc: "Go outside and plant a tree in your community, garden, or local park." },
              { step: "02", icon: <Camera size={36} />, title: "Upload a Photo", desc: "Take a picture of your planted tree and upload it with details to our platform." },
              { step: "03", icon: <Award size={36} />, title: "Earn Badges", desc: "Earn eco badges as milestones. The more you plant, the higher your rank!" },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card animate-fade-in-up"
                style={{ padding: "40px 32px", textAlign: "center", animationDelay: `${i * 0.2}s` }}
              >
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "80px", height: "80px", borderRadius: "20px",
                  background: "linear-gradient(135deg, rgba(45,106,79,0.1), rgba(82,183,136,0.1))",
                  color: "#2d6a4f", marginBottom: "20px",
                }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#52b788", fontWeight: 800, letterSpacing: "0.1em", marginBottom: "8px" }}>
                  STEP {item.step}
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1a4d2e", marginBottom: "12px" }}>{item.title}</h3>
                <p style={{ color: "#6b7280", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section style={{ padding: "80px 24px", background: "var(--color-cream)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 className="section-title">Platform Features</h2>
          <p className="section-subtitle">Everything you need to make a green impact</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
            {[
              { icon: <Camera size={28} />, title: "Photo Uploads", desc: "Share your tree planting journey with the community" },
              { icon: <Award size={28} />, title: "Badge System", desc: "Earn 5 unique badges from Seed Starter to Earth Champion" },
              { icon: <MessageCircle size={28} />, title: "Community Forum", desc: "Discuss sustainability tips and climate topics" },
              { icon: <TrendingUp size={28} />, title: "Leaderboard", desc: "Compete with others and become a top planter" },
            ].map((feat, i) => (
              <div
                key={i}
                className="glass-card"
                style={{ padding: "28px 24px", display: "flex", gap: "16px", alignItems: "flex-start" }}
              >
                <div style={{
                  background: "linear-gradient(135deg, #2d6a4f, #52b788)", borderRadius: "14px",
                  padding: "12px", color: "white", flexShrink: 0,
                }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: "#1a4d2e", marginBottom: "6px" }}>{feat.title}</h3>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6 }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RECENT UPLOADS GALLERY ===== */}
      {recentUploads.length > 0 && (
        <section style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h2 className="section-title">Recent Community Uploads</h2>
            <p className="section-subtitle">See what our members have been planting</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {recentUploads.map((upload) => (
                <div key={upload.id} className="glass-card" style={{ overflow: "hidden", borderRadius: "20px" }}>
                  <div style={{ height: "200px", overflow: "hidden" }}>
                    <img
                      src={upload.imageUrl}
                      alt={upload.treeType}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    />
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, color: "#1a4d2e" }}>{upload.treeType}</span>
                      <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>📍 {upload.location}</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#52b788", fontWeight: 600 }}>
                      Planted by {upload.user.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <Link href="/upload" className="btn-primary" style={{ textDecoration: "none" }}>
                <Sprout size={20} /> Upload Your Tree
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA SECTION ===== */}
      <section style={{
        padding: "80px 24px",
        background: "linear-gradient(135deg, #2d6a4f 0%, #40916c 50%, #52b788 100%)",
        textAlign: "center",
        color: "white",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "16px" }}>
            Ready to Make a Difference? 🌍
          </h2>
          <p style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.85)", marginBottom: "36px", lineHeight: 1.7 }}>
            Join thousands of eco-warriors who are planting trees and earning badges. Your contribution matters!
          </p>
          <Link href="/register" className="btn-primary" style={{
            padding: "18px 48px", fontSize: "1.15rem",
            background: "white", color: "#1a4d2e", textDecoration: "none",
          }}>
            Join Green Living <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
