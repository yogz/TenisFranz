import type { Metadata } from "next";
import { Suspense } from "react";
import { Predictor } from "@/components/predictor/Predictor";
import { loadElo, loadMeta, loadModel, loadPlayers } from "@/lib/data";
import { SITE_URL, absoluteUrl, jsonLdScript, organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "TenisFranz — Qui va gagner ?" },
  description:
    "Prédis n'importe quel match ATP ou WTA en 10 secondes. Modèle de régression logistique entraîné sur 15+ ans de données — probabilités transparentes, features auditables, inférence côté navigateur.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "TenisFranz — Qui va gagner ?",
    description:
      "Prédis n'importe quel match ATP ou WTA. Modèle transparent, inférence dans le navigateur.",
  },
};

export default async function HomePage() {
  const [players, elo, model, meta] = await Promise.all([
    loadPlayers(),
    loadElo(),
    loadModel(),
    loadMeta(),
  ]);

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/#webpage`,
    url: absoluteUrl("/"),
    name: "TenisFranz — Qui va gagner ?",
    description:
      "Prédicteur de matchs ATP & WTA. Sélectionne deux joueurs et une surface, obtiens la probabilité et les features qui la portent.",
    inLanguage: "fr",
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: {
      "@type": "Thing",
      name: "Prédictions de matchs de tennis",
    },
    primaryImageOfPage: absoluteUrl("/opengraph-image"),
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "TenisFranz Predictor",
      applicationCategory: "SportsApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      author: { "@id": `${SITE_URL}#publisher` },
      featureList: [
        "Prédiction probabiliste de matchs ATP",
        "Prédiction probabiliste de matchs WTA",
        "Sélection par joueur et par surface",
        "Explication des features qui portent la prédiction",
      ],
    },
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(webPageJsonLd)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd)}
      />
      <header className="space-y-3">
        <div className="chip">
          <span className="size-1.5 rounded-full bg-lime" />
          Modèle entraîné sur {meta.yearFrom || "2005"}–{meta.yearTo || "2025"}
        </div>
        <h1 className="font-display text-[44px] font-light leading-[0.95] tracking-tight">
          Qui va gagner&nbsp;?
        </h1>
        <p className="max-w-sm text-[15px] leading-relaxed text-muted">
          Sélectionne deux joueurs, une surface. Le modèle te donne une probabilité — et pourquoi.
        </p>
      </header>
      {players.length === 0 ? (
        <div className="card">
          <p className="text-sm text-muted">
            Les données ne sont pas encore générées. Lance le pipeline&nbsp;:
          </p>
          <pre className="mt-2 overflow-auto rounded-lg bg-surface2 p-3 text-xs">
            cd pipeline{"\n"}uv sync{"\n"}uv run python -m tenisfranz.run_all --years 2018-2024
          </pre>
        </div>
      ) : (
        <Suspense fallback={null}>
          <Predictor players={players} elo={elo} model={model} />
        </Suspense>
      )}
    </div>
  );
}
