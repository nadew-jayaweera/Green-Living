import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Green Living – Plant Today, Protect Tomorrow 🌱",
  description:
    "Join the Green Living community! Upload photos of planted trees, earn eco badges, and discuss sustainability with like-minded people.",
  keywords: ["sustainability", "tree planting", "eco", "environment", "green living", "badges"],
  openGraph: {
    title: "Green Living – Sustainability Platform",
    description: "Plant trees, earn badges, protect the planet.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <SessionProvider>
          <ToastProvider>
            <Sidebar />
            <div className="admin-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <main className="leaf-pattern" style={{ flex: 1 }}>
                {children}
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
