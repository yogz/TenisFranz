import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Behind the scenes — Nicolas",
  description:
    "Indie maker derrière TenisFranz et WBear. Qui je suis, pourquoi je fais ce que je fais, et ce sur quoi je travaille en ce moment.",
  alternates: { canonical: "/behind-the-scenes" },
  openGraph: {
    type: "profile",
    title: "Behind the scenes — Nicolas",
    description:
      "Indie maker derrière TenisFranz et WBear. Produits sobres, pensés pour leurs utilisateurs.",
    locale: "fr_FR",
    url: "/behind-the-scenes",
  },
  twitter: {
    card: "summary",
    title: "Behind the scenes — Nicolas",
    description:
      "Indie maker derrière TenisFranz et WBear. Produits sobres, pensés pour leurs utilisateurs.",
  },
};

const projects = [
  {
    name: "TenisFranz",
    status: "2024 · actif",
    href: "/",
    external: false,
    blurb:
      "Prédictions transparentes pour tous les matchs ATP & WTA. Régression logistique entraînée sur 15+ ans de données, modèle shippé en JSON, inférence dans le navigateur. Track record public.",
  },
  {
    name: "WBear",
    status: "2026 · en cours",
    href: "/wbear/presentation.html",
    external: false,
    blurb:
      "Refonte d'une app communautaire — community over hookup. Interface pacifiée pour les 40+, feed éditorial, FAB en geste tap/hold.",
  },
];

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Nicolas",
  description:
    "Indie maker. Produits sobres, honnêtes, utilisables par leurs utilisateurs — pas par leurs métriques. Derrière TenisFranz et WBear.",
  jobTitle: "Indie maker",
  knowsAbout: [
    "Product design",
    "Web apps",
    "Machine learning",
    "Data visualization",
    "Tennis analytics",
    "Social apps",
  ],
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "/behind-the-scenes",
  },
};

export default function BehindTheScenesPage() {
  return (
    <article className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <header className="space-y-3">
        <div className="chip">
          <span className="size-1.5 rounded-full bg-lime" />
          Behind the scenes
        </div>
        <h1 className="font-display text-[44px] font-light leading-[0.95] tracking-tight">
          Nicolas
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-muted">
          Indie maker. Produits sobres, pensés pour leurs utilisateurs — pas
          pour leurs métriques.
        </p>
      </header>

      <section className="space-y-4 text-[15.5px] leading-relaxed text-text/90">
        <p>
          Je construis des logiciels à petite échelle, pour des gens que je
          comprends. Je préfère les interfaces qui se font oublier, les modèles
          qu&apos;on peut relire ligne par ligne, les produits qui tiennent
          debout sans dark patterns.
        </p>
        <p>
          Je travaille seul la plupart du temps — design, code, data,
          déploiement sur le même laptop. Quand un sujet me dépasse, je creuse
          jusqu&apos;à ce qu&apos;il ne me dépasse plus.
        </p>
        <p className="text-muted">
          Fil rouge de mes projets&nbsp;: rendre lisible ce qui est souvent
          opaque. Un modèle de prédiction qu&apos;on peut auditer. Une app
          communautaire qui ne confond pas activité et engagement. Un feed qui
          respecte ton attention.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          En ce moment
        </h2>
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.name}>
              <a
                href={p.href}
                className="card card-hover group block space-y-2"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[17px] font-semibold text-lime">
                    {p.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {p.status}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted">{p.blurb}</p>
                <span className="inline-flex items-center gap-1 text-xs text-muted transition group-hover:text-text">
                  Ouvrir <ArrowUpRight className="size-3.5" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="pt-6 text-xs text-muted/80">
        Page pensée pour être lisible par humains comme par crawlers et LLM —
        structure sémantique, <code className="text-muted">Person</code> schema,
        OpenGraph. Sers-toi.
      </footer>
    </article>
  );
}
