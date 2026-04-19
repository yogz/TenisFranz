// Central SEO/AEO constants and structured-data helpers.
//
// SITE_URL is read from NEXT_PUBLIC_SITE_URL at build time so Vercel can
// inject the real canonical host. Default stays in sync with the French
// project identity; override on Vercel if the domain differs.

const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://tenisfranz.fr";
export const SITE_URL = rawUrl.replace(/\/+$/, "");

export const SITE_NAME = "TenisFranz";
export const SITE_TAGLINE = "Qui va gagner ?";
export const SITE_DESCRIPTION =
  "Prédictions transparentes pour tous les matchs ATP & WTA. Modèle de régression logistique entraîné sur 15+ ans de données, track record public.";
export const SITE_LOCALE = "fr_FR";
export const SITE_LANG = "fr";

export const ORG_AUTHOR = {
  "@type": "Person" as const,
  name: "Nicolas",
  url: `${SITE_URL}/behind-the-scenes`,
};

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export function jsonLdScript(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data) };
}

// ── Site-level: WebSite + Organization ─────────────────────────────────

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  name: SITE_NAME,
  alternateName: "TenisFranz — Qui va gagner ?",
  url: SITE_URL,
  inLanguage: SITE_LANG,
  description: SITE_DESCRIPTION,
  publisher: { "@id": `${SITE_URL}#publisher` },
} as const;

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}#publisher`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/icon.svg"),
  founder: ORG_AUTHOR,
  description: SITE_DESCRIPTION,
  knowsAbout: [
    "ATP tennis",
    "WTA tennis",
    "Match prediction",
    "Logistic regression",
    "Elo rating",
    "Sports analytics",
  ],
} as const;
