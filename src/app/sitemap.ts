import type { MetadataRoute } from "next";

import {
    getPublicNews,
    getPublicPlayers,
    getPublicTournaments,
} from "@/lib/public/site";

import { absoluteUrl } from "@/lib/public/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [
        tournamentsResult,
        playersResult,
        newsResult,
    ] = await Promise.all([
        getPublicTournaments(),
        getPublicPlayers(),
        getPublicNews(),
    ]);

    const staticPaths = [
        "/",
        "/torneos",
        "/ranking",
        "/jugadores",
        "/circuito",
        "/master-final",
        "/noticias",
        "/galeria",
        "/privacidad",
        "/cookies",
        "/aviso-legal",
    ];

    const urls: MetadataRoute.Sitemap =
        staticPaths.map((path) => ({
            url: absoluteUrl(path),
            changeFrequency:
                path === "/" ? "daily" : "weekly",
            priority:
                path === "/" ? 1 : 0.7,
        }));

    if (!tournamentsResult.error) {
        for (const tournament of tournamentsResult.data) {
            urls.push({
                url: absoluteUrl(
                    `/torneos/${tournament.slug}`,
                ),
                lastModified: tournament.updated_at,
                changeFrequency: "daily",
                priority: 0.8,
            });
        }
    }

    if (!playersResult.error) {
        for (const player of playersResult.data) {
            urls.push({
                url: absoluteUrl(
                    `/jugadores/${player.id}`,
                ),
                lastModified: player.updated_at,
                changeFrequency: "weekly",
                priority: 0.6,
            });
        }
    }

    if (!newsResult.error) {
        for (const news of newsResult.data) {
            urls.push({
                url: absoluteUrl(
                    `/noticias/${news.slug}`,
                ),
                lastModified: news.updated_at,
                changeFrequency: "monthly",
                priority: 0.6,
            });
        }
    }

    return urls;
}