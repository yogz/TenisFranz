import type { Metadata, Viewport } from "next";
import { Faster_One, Geist } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fasterOne = Faster_One({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "TenisFranz — Qui va gagner ?",
  description:
    "Prédictions transparentes pour tous les matchs ATP & WTA. Modèle statistique, track record public.",
  manifest: "/manifest.webmanifest",
  applicationName: "TenisFranz",
  appleWebApp: {
    capable: true,
    title: "TenisFranz",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} ${fasterOne.variable}`}>
      <body className="font-sans">
        <main className="mx-auto min-h-[100svh] max-w-xl px-5 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+24px)]">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
