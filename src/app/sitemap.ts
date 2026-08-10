import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const staticPages: MetadataRoute.Sitemap = [
  { url: siteUrl, changeFrequency: "weekly", priority: 1 },
  { url: `${siteUrl}/calendario`, changeFrequency: "daily", priority: 0.9 },
  { url: `${siteUrl}/ranking`, changeFrequency: "daily", priority: 0.8 },
  { url: `${siteUrl}/master-final`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/circuito`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${siteUrl}/circuito/faq`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${siteUrl}/circuito/reglamento`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${siteUrl}/jugadores`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${siteUrl}/noticias`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${siteUrl}/patrocinadores`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/contacto`, changeFrequency: "yearly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [{ data: tournaments }, { data: news }] = await Promise.all([
    supabase
      .from("tournaments")
      .select("slug, fecha_inicio, fecha_fin")
      .neq("estado", "borrador"),
    supabase
      .from("news")
      .select("slug, fecha_publicacion")
      .eq("estado", "publicado"),
  ]);

  const tournamentPages = (tournaments ?? []).map((tournament) => ({
    url: `${siteUrl}/torneo/${tournament.slug}`,
    lastModified: tournament.fecha_fin ?? tournament.fecha_inicio,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const newsPages = (news ?? []).map((article) => ({
    url: `${siteUrl}/noticias/${article.slug}`,
    lastModified: article.fecha_publicacion,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...tournamentPages, ...newsPages];
}
