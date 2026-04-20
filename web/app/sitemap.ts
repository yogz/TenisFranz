import type { MetadataRoute } from "next";
import { loadMeta, loadPlayers, loadUpcoming } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [meta, upcoming, players] = await Promise.all([
    loadMeta().catch(() => null),
    loadUpcoming().catch(() => null),
    loadPlayers().catch(() => [] as Awaited<ReturnType<typeof loadPlayers>>),
  ]);

  const now = new Date();
  const modelUpdated = meta?.trainedAt ? new Date(meta.trainedAt) : now;
  const matchesUpdated = upcoming?.updatedAt ? new Date(upcoming.updatedAt) : now;

  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1.0, lastModified: matchesUpdated },
    { url: `${SITE_URL}/matches`, changeFrequency: "hourly", priority: 0.9, lastModified: matchesUpdated },
    { url: `${SITE_URL}/players`, changeFrequency: "weekly", priority: 0.8, lastModified: modelUpdated },
    { url: `${SITE_URL}/model`, changeFrequency: "weekly", priority: 0.7, lastModified: modelUpdated },
    { url: `${SITE_URL}/behind-the-scenes`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
  ];

  // Only list players pre-rendered by generateStaticParams (active within 2 years).
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 2);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const activePlayers = players
    .filter((p) => p.career?.lastMatchDate && p.career.lastMatchDate >= cutoffStr)
    .map<MetadataRoute.Sitemap[number]>((p) => ({
      url: `${SITE_URL}/players/${p.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
      lastModified: p.career.lastMatchDate ? new Date(p.career.lastMatchDate) : modelUpdated,
    }));

  return [...base, ...activePlayers];
}
