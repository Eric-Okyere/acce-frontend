import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACCE Attendance",
  description: "Geo-verified student attendance for Accra College of Education",
  icons: {
    // Filenames are versioned (…-v3) on purpose — see the comment in Nav.tsx.
    // Bumping the filename on every asset change guarantees a fresh URL that
    // no browser or Next.js image cache has ever served before, so a stale
    // image can never be shown under a name that already looks "current".
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/favicon-32-v3.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/acce-crest-v3.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon-v3.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">{children}</body>
    </html>
  );
}
