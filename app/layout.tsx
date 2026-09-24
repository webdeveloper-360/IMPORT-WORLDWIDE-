import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({ subsets: ["latin"], variable: "--font-bodoni", style: ["normal", "italic"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Import Worldwide — Global Sourcing, Delivered to Your Door",
  description: "Top trending 2026 products sourced worldwide and delivered to your door.",
};
export const viewport: Viewport = { themeColor: "#06120e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodoni.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
