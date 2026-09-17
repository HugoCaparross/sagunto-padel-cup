import type { MetadataRoute } from "next";
import { getPublicNews } from "@/lib/public/site";
import { getPublicPlayers, getPublicTournaments } from "@/lib/public/site";
import { absoluteUrl } from "@/lib/public/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [tournaments, players, news] = await Promise.all([getPublicTournaments(), getPublicPlayers(), getPublicNews()]);
    const staticPaths = ["/", "/torneos", "/ranking", "/jugadores", "/circuito", "/master", "/noticias", "/galeria", "/privacidad", "/cookies", "/aviso-legal"];
    const urls: MetadataRoute.Sitemap = staticPaths.map((path) => ({ url: absoluteUrl(path), changeFrequency: path === "/" ? "daily" : "weekly", priority: path === "/" ? 1 : 0.7 }));
    if (!tournaments.error) for (const tournament of tournaments.data) urls.push({ url: absoluteUrl(`/torneos/${tournament.slug}`), lastModified: tournament.updated_at, changeFrequency: "daily", priority: 0.8 });
    if (!players.error) for (const player of players.data) urls.push({ url: absoluteUrl(`/jugadores/${player.id}`), lastModified: player.updated_at, changeFrequency: "weekly", priority: 0.6 });
    if (!news.error) for (const item of news.data) urls.push({ url: absoluteUrl(`/noticias/${item.slug}`), lastModified: item.updated_at, changeFrequency: "monthly", priority: 0.6 });
    return urls;
}
