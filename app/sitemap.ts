import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/calendario`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/ranking`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/reglamento`, changeFrequency: "monthly", priority: 0.5 },
  ];
}