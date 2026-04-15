import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TenisFranz — Qui va gagner ?",
  description:
    "Prédictions transparentes pour tous les matchs ATP & WTA. Modèle statistique, track record public.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${instrument.variable}`}>
      <body className="font-sans">
        <main className="mx-auto min-h-[100svh] max-w-xl px-4 pb-28 pt-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
