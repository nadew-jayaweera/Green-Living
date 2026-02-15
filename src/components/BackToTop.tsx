"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    if (!isVisible) return null;

    return (
        <>
            <style jsx>{`
                .back-to-top {
                    bottom: 20px;
                }
                @media (max-width: 768px) {
                    .back-to-top {
                        bottom: 82px !important;
                    }
                }
            `}</style>
            <button
                onClick={scrollToTop}
                className="back-to-top"
                aria-label="Back to Top"
                style={{
                    position: "fixed",
                    right: "24px",
                    background: "linear-gradient(135deg, #2d6a4f, #52b788)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(45, 106, 79, 0.3)",
                    zIndex: 1000,
                    transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(45, 106, 79, 0.4)";
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(45, 106, 79, 0.3)";
                }}
            >
                <ArrowUp size={24} strokeWidth={3} />
            </button>
        </>
    );
}
