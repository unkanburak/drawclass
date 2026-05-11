import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Sayı Çiz — Sınıf",
  description: "3-6 yaş için gerçek zamanlı sayı çizme atölyesi"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-amber-50 text-slate-800 min-h-screen">{children}</body>
    </html>
  );
}
