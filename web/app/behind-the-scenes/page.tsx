import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Behind the scenes — Nicolas",
  description:
    "Indie maker derrière Colist, Maurice et Milou. Qui je suis, pourquoi je fais ce que je fais, et ce sur quoi je travaille en ce moment.",
  alternates: { canonical: "/behind-the-scenes" },
  openGraph: {
    type: "profile",
    title: "Behind the scenes — Nicolas",
    description:
      "Indie maker derrière Colist, Maurice et Milou. Produits sobres, pensés pour leurs utilisateurs.",
    locale: "fr_FR",
    url: "/behind-the-scenes",
  },
  twitter: {
    card: "summary",
    title: "Behind the scenes — Nicolas",
    description:
      "Indie maker derrière Colist, Maurice et Milou. Produits sobres, pensés pour leurs utilisateurs.",
  },
};

const projects = [
  {
    name: "CoList",
    emoji: "🍽️",
    href: "https://www.colist.fr/",
    blurb:
      "Web app gratuite pour coordonner repas de fêtes et événements conviviaux : qui apporte quoi, listes de courses partagées, zéro doublon.",
  },
  {
    name: "Milou",
    emoji: "💪",
    href: "https://www.milou.studio/",
    blurb:
      "Application mobile gratuite pour coachs sportifs indépendants : gestion des réservations, plannings et forfaits clients.",
  },
  {
    name: "Maurice",
    emoji: "✍️",
    href: "https://www.ecrireavecmaurice.fr/",
    blurb:
      "Assistant d'écriture en ligne pour accompagner et structurer vos projets rédactionnels.",
  },
];

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Nicolas",
  description:
    "Indie maker. Produits sobres, honnêtes, utilisables par leurs utilisateurs — pas par leurs métriques. Derrière Colist, Maurice et Milou.",
  jobTitle: "Indie maker",
  knowsAbout: [
    "Product design",
    "Web apps",
    "Indie making",
    "Bootstrapping",
    "Interface design",
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
                target="_blank"
                rel="noopener"
                className="card card-hover group block space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-3xl leading-none" aria-hidden>
                    {p.emoji}
                  </div>
                  <ArrowUpRight className="size-4 text-muted transition group-hover:text-lime" />
                </div>
                <div className="text-[18px] font-semibold text-lime">
                  {p.name}
                </div>
                <p className="text-sm leading-relaxed text-muted">{p.blurb}</p>
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
