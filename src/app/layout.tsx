import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const theme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <SessionProvider>
          <ThemeProvider>
            <ToastProvider>
              <Sidebar />
              <div className="admin-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <main className="leaf-pattern" style={{ flex: 1 }}>
                  {children}
                </main>
                <Footer />
              </div>
              <BackToTop />
            </ToastProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
