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
      {/* suppressHydrationWarning: browser extensions (Grammarly, QuillBot, etc.)
          inject attributes like data-gr-ext-installed into <body> before React
          hydrates. That's a real DOM difference, but it's the extension's doing,
          not a bug in this app — suppressing it here (body only, not deeper)
          silences that specific false-positive warning without hiding a real
          mismatch anywhere else in the tree. */}
      <body
        className="antialiased bg-slate-50 text-slate-900 min-h-screen"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
