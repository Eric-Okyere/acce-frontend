import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACCE Attendance",
  description: "Geo-verified student attendance for Accra College of Education",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">{children}</body>
    </html>
  );
}
