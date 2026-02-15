"use client";

import { useState, useEffect, useRef } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const treeCounter = useCounter(stats.totalTrees);
  const userCounter = useCounter(stats.totalUsers);

  // Stats fetching
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats({ totalTrees: data.totalTrees || 0, totalUsers: data.totalUsers || 0 });
        setRecentUploads(data.recentUploads || []);
      })
      .catch((err) => console.error("Failed to fetch stats:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Start counters when stats are loaded
  useEffect(() => {
    if (!isLoading && stats.totalTrees > 0) treeCounter.start();
    if (!isLoading && stats.totalUsers > 0) userCounter.start();
  }, [stats, isLoading]);


  // Scroll Reveal Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [recentUploads]); // Re-run when uploads load

  return (
    <div style={{ overflowX: "hidden" }}>
      {/* ===== HERO SECTION ===== */}
      <section className="hero-gradient" style={{ padding: "0 24px 80px", color: "white", textAlign: "center", position: "relative" }}>
        {/* Animated Background Blobs */}
        <div className="blob-shape" style={{ width: "300px", height: "300px", background: "rgba(82, 183, 136, 0.3)", top: "10%", left: "10%" }} />
        <div className="blob-shape" style={{ width: "400px", height: "400px", background: "rgba(59, 130, 246, 0.2)", bottom: "20%", right: "5%", animationDelay: "2s" }} />

        <div style={{ maxWidth: "800px", margin: "0 auto", paddingTop: "100px", position: "relative", zIndex: 10 }}>
          <div className="reveal-on-scroll" style={{ marginBottom: "24px" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255, 255, 255, 0.15)", padding: "8px 20px",
              borderRadius: "50px", fontSize: "0.9rem", fontWeight: 600,
              backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)"
            }}>
              🌍 Join the Movement
            </span>
          </div>

          <h1
            className="reveal-on-scroll delay-100"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "24px",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 20px rgba(0,0,0,0.1)"
            }}
          >
            Plant Today,<br />
            Protect Tomorrow <span className="animate-float" style={{ display: "inline-block" }}>🌱</span>
          </h1>

          <p
            className="reveal-on-scroll delay-200"
            style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.9)", maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.7 }}
          >
            Upload photos of your planted trees, earn eco badges, and be part of a global community making the world greener.
          </p>

          <div className="reveal-on-scroll delay-300" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/upload" className="btn-primary" style={{ padding: "16px 40px", fontSize: "1.1rem" }}>
              <Sprout size={22} /> Start Planting
            </Link>
            <Link href="/forum" className="btn-secondary" style={{
              padding: "16px 40px", fontSize: "1.1rem", color: "white", borderColor: "rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.1)", textDecoration: "none", backdropFilter: "blur(4px)"
            }}>
              Join Community <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Decorative wave */}
        <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", height: "80px", overflow: "hidden" }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="var(--background)" />
          </svg>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section style={{ padding: "100px 24px", background: "var(--background)", position: "relative" }}>
        <div className="blob-shape" style={{ width: "500px", height: "500px", background: "rgba(254, 243, 199, 0.4)", top: "10%", left: "-10%" }} />

        <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="reveal-on-scroll">
            <h2 className="section-title text-gradient-forest">Our Impact</h2>
            <p className="section-subtitle">Every tree planted is a step toward a healthier planet</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "32px" }}>
            {[
              { icon: <TreePine size={48} />, value: treeCounter.count || stats.totalTrees, label: "Trees Planted", color: "var(--color-forest)" },
              { icon: <Users size={48} />, value: userCounter.count || stats.totalUsers, label: "Active Members", color: "var(--color-leaf)" },
              { icon: <Camera size={48} />, value: recentUploads.length, label: "Recent Uploads", color: "#3b82f6" },
            ].map((stat, i) => (
              <div
                key={i}
                className={`glass-card reveal-on-scroll delay-${(i + 1) * 100}`}
                style={{
                  padding: "40px 24px", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                }}
              >
                <div style={{
                  color: stat.color, marginBottom: "16px",
                  background: `rgba(255,255,255,0.5)`, padding: "16px", borderRadius: "50%",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }}>
                  {stat.icon}
                </div>
                {isLoading ? (
                  <div className="skeleton" style={{ width: "120px", height: "3.5rem", marginBottom: "8px" }} />
                ) : (
                  <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "var(--color-forest)", lineHeight: 1, marginBottom: "8px" }}>
                    {stat.value}
                  </div>
                )}
                <div style={{ fontSize: "1.1rem", color: "var(--text-secondary)", fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: "100px 24px", position: "relative" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="reveal-on-scroll">
            <h2 className="section-title text-gradient-forest">How It Works</h2>
            <p className="section-subtitle">Three simple steps to make a difference</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            {[
              { step: "01", icon: <Sprout size={32} />, title: "Plant a Tree", desc: "Go outside and plant a tree in your community, garden, or local park." },
              { step: "02", icon: <Camera size={32} />, title: "Upload a Photo", desc: "Take a picture of your planted tree and upload it with details to our platform." },
              { step: "03", icon: <Award size={32} />, title: "Earn Badges", desc: "Earn eco badges as milestones. The more you plant, the higher your rank!" },
            ].map((item, i) => (
              <div
                key={i}
                className={`glass-card reveal-on-scroll delay-${(i + 1) * 100}`}
                style={{ padding: "40px 32px", textAlign: "left", position: "relative", overflow: "hidden" }}
              >
                <div style={{
                  position: "absolute", top: "-20px", right: "-20px",
                  fontSize: "8rem", fontWeight: 900, color: "var(--step-number-color)", lineHeight: 1
                }}>
                  {item.step}
                </div>

                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "64px", height: "64px", borderRadius: "16px",
                  background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                  color: "white", marginBottom: "24px",
                  boxShadow: "0 8px 16px rgba(45, 106, 79, 0.2)"
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-forest)", marginBottom: "12px" }}>{item.title}</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "1.05rem" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section style={{ padding: "100px 24px", background: "var(--color-cream)", position: "relative", overflow: "hidden" }}>
        <div className="blob-shape" style={{ width: "600px", height: "600px", background: "rgba(186, 230, 253, 0.3)", top: "20%", right: "-10%" }} />

        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="reveal-on-scroll">
            <h2 className="section-title text-gradient-forest">Platform Features</h2>
            <p className="section-subtitle">Everything you need to make a green impact</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {[
              { icon: <Camera size={28} />, title: "Photo Uploads", desc: "Share your tree planting journey with the community" },
              { icon: <Award size={28} />, title: "Badge System", desc: "Earn 5 unique badges from Seed Starter to Earth Champion" },
              { icon: <MessageCircle size={28} />, title: "Community Forum", desc: "Discuss sustainability tips and climate topics" },
              { icon: <TrendingUp size={28} />, title: "Leaderboard", desc: "Compete with others and become a top planter" },
            ].map((feat, i) => (
              <div
                key={i}
                className={`glass-card reveal-on-scroll delay-${(i % 2 + 1) * 100}`}
                style={{ padding: "32px 24px", display: "flex", gap: "20px", alignItems: "flex-start" }}
              >
                <div style={{
                  background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))", borderRadius: "14px",
                  padding: "12px", color: "white", flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(45, 106, 79, 0.2)"
                }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: "var(--color-forest)", marginBottom: "8px", fontSize: "1.2rem" }}>{feat.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RECENT UPLOADS GALLERY ===== */}
      {(recentUploads.length > 0 || isLoading) && (
        <section style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="reveal-on-scroll">
              <h2 className="section-title text-gradient-forest">Recent Community Uploads</h2>
              <p className="section-subtitle">See what our members have been planting</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "32px" }}>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card" style={{ overflow: "hidden", padding: 0, height: "350px" }}>
                    <div className="skeleton" style={{ width: "100%", height: "240px", borderRadius: 0 }} />
                    <div style={{ padding: "20px 24px" }}>
                      <div className="skeleton" style={{ width: "60%", height: "1.2rem", marginBottom: "12px" }} />
                      <div className="skeleton" style={{ width: "40%", height: "1rem" }} />
                    </div>
                  </div>
                ))
                : recentUploads.map((upload, i) => (
                  <div key={upload.id} className={`glass-card reveal-on-scroll delay-${(i % 3 + 1) * 100}`} style={{ overflow: "hidden", padding: 0 }}>
                    <div style={{ height: "240px", overflow: "hidden", position: "relative" }}>
                      <img
                        src={upload.imageUrl}
                        alt={upload.treeType}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                      />
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                        padding: "20px", color: "white"
                      }}>
                        <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{upload.treeType}</span>
                      </div>
                    </div>
                    <div style={{ padding: "20px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.9rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                          📍 {upload.location}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#2d6a4f", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>👤</div>
                        {upload.user.name}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="reveal-on-scroll delay-200" style={{ textAlign: "center", marginTop: "60px" }}>
              <Link href="/upload" className="btn-primary" style={{ textDecoration: "none", padding: "16px 48px", fontSize: "1.1rem" }}>
                <Sprout size={22} /> Upload Your Tree
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA SECTION ===== */}
      <section className="cta-section" style={{
        padding: "100px 24px",
        textAlign: "center",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", position: "relative", zIndex: 10 }}>
          <h2 className="reveal-on-scroll" style={{ fontSize: "3rem", fontWeight: 900, marginBottom: "20px", textShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
            Ready to Make a Difference? 🌍
          </h2>
          <p className="reveal-on-scroll delay-100" style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.9)", marginBottom: "40px", lineHeight: 1.7 }}>
            Join thousands of eco-warriors who are planting trees and earning badges. Your contribution matters!
          </p>
          <div className="reveal-on-scroll delay-200">
            <Link href="/register" className="btn-primary" style={{
              padding: "20px 56px", fontSize: "1.25rem",
              background: "white", color: "#1a4d2e", textDecoration: "none",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
            }}>
              Join Green Living <ArrowRight size={24} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
