import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Faster_One, Geist } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  jsonLdScript,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
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

const defaultTitle = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: defaultTitle,
    description: SITE_DESCRIPTION,
    locale: SITE_LOCALE,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  authors: [{ name: "Nicolas", url: `${SITE_URL}/behind-the-scenes` }],
  creator: "Nicolas",
  publisher: SITE_NAME,
  category: "sports",
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
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="872273a6-0736-4c12-ade5-820f0916b595" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd)}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd)}
        />
      </head>
      <body className="font-sans">
        <main className="mx-auto flex min-h-[100svh] max-w-xl flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+24px)]">
          <div className="flex-1">{children}</div>
          <footer className="mt-16 border-t border-border/60 pt-5 text-center">
            <Link
              href="/behind-the-scenes"
              className="text-xs text-muted transition hover:text-text"
            >
              Behind the scenes →
            </Link>
          </footer>
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
