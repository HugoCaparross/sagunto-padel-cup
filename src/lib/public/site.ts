import { createClient } from "@/lib/supabase/server";
import type {
    Category,
    GalleryItem,
    News,
    Player,
    RankingPoint,
    Sponsor,
    Tournament,
} from "@/types/database";

export type PublicResult<T> = {
    data: T;
    error: Error | null;
};

export type PublicTournament = Tournament & {
    club: {
        id: string;
        nombre: string;
        direccion: string | null;
    } | null;
};

export type PublicCategory = Category;

export type PublicNews = News;

export type PublicSponsor = Sponsor;

export type PublicRankingEntry = {
    position: number;
    player: Player;
    points: number;
    tournaments: number;
};

export type PublicGalleryItem = GalleryItem;

function asError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return new Error(error.message);
    }

    return new Error("Ha ocurrido un error inesperado.");
}

function publicPlayerName(
    player: Pick<Player, "nombre" | "apellidos">,
): string {
    return `${player.nombre} ${player.apellidos ?? ""}`.trim();
}

function publicVisibilityAllowsInstagram(
    visibility: unknown,
): boolean {
    if (!visibility || typeof visibility !== "object") {
        return false;
    }

    const value = visibility as Record<string, unknown>;

    return value.instagram === true;
}

export async function getPublicTournaments(): Promise<
    PublicResult<PublicTournament[]>
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("tournaments")
        .select(
            `
            *,
            club:clubs(
                id,
                nombre,
                direccion
            )
            `,
        )
        .in("estado", [
            "publicado",
            "inscripciones_abiertas",
            "en_juego",
            "finalizado",
        ])
        .order("fecha_inicio", { ascending: true });

    if (error) {
        return {
            data: [],
            error: asError(error),
        };
    }

    return {
        data: (data ?? []) as PublicTournament[],
        error: null,
    };
}

export async function getPublicTournament(
    slug: string,
): Promise<PublicResult<PublicTournament | null>> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("tournaments")
        .select(
            `
            *,
            club:clubs(
                id,
                nombre,
                direccion
            )
            `,
        )
        .eq("slug", slug)
        .in("estado", [
            "publicado",
            "inscripciones_abiertas",
            "en_juego",
            "finalizado",
        ])
        .maybeSingle();

    if (error) {
        return {
            data: null,
            error: asError(error),
        };
    }

    return {
        data: data as PublicTournament | null,
        error: null,
    };
}

export async function getPublicCategories(): Promise<
    PublicResult<PublicCategory[]>
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("nivel_orden", { ascending: true });

    if (error) {
        return {
            data: [],
            error: asError(error),
        };
    }

    return {
        data: (data ?? []) as PublicCategory[],
        error: null,
    };
}

export async function getPublicCategory(
    id: string,
): Promise<PublicResult<PublicCategory | null>> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .eq("active", true)
        .maybeSingle();

    if (error) {
        return {
            data: null,
            error: asError(error),
        };
    }

    return {
        data: data as PublicCategory | null,
        error: null,
    };
}

export async function getPublicNews(): Promise<
    PublicResult<PublicNews[]>
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("estado", "publicado")
        .order("fecha_publicacion", {
            ascending: false,
            nullsFirst: false,
        });

    if (error) {
        return {
            data: [],
            error: asError(error),
        };
    }

    return {
        data: (data ?? []) as PublicNews[],
        error: null,
    };
}

export async function getPublicNewsArticle(
    slug: string,
): Promise<PublicResult<PublicNews | null>> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("slug", slug)
        .eq("estado", "publicado")
        .maybeSingle();

    if (error) {
        return {
            data: null,
            error: asError(error),
        };
    }

    return {
        data: data as PublicNews | null,
        error: null,
    };
}

export async function getPublicPlayers(): Promise<
    PublicResult<Player[]>
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("estado", "activo")
        .order("nombre", { ascending: true })
        .order("apellidos", { ascending: true });

    if (error) {
        return {
            data: [],
            error: asError(error),
        };
    }

    return {
        data: (data ?? []) as Player[],
        error: null,
    };
}

export async function getPublicRanking(
    categoryId?: string,
): Promise<
    PublicResult<{
        season: {
            id: string;
            name: string;
            slug: string;
            start_date: string;
            end_date: string;
        } | null;
        category: PublicCategory | null;
        entries: PublicRankingEntry[];
    }>
> {
    const supabase = await createClient();

    const seasonQ = await supabase
        .from("seasons")
        .select("id,name,slug,start_date,end_date")
        .eq("status", "activa")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (seasonQ.error) {
        return {
            data: {
                season: null,
                category: null,
                entries: [],
            },
            error: asError(seasonQ.error),
        };
    }

    const season = seasonQ.data ?? null;

    if (!season) {
        return {
            data: {
                season: null,
                category: null,
                entries: [],
            },
            error: null,
        };
    }

    const categoryQ = categoryId
        ? await supabase
            .from("categories")
            .select("*")
            .eq("id", categoryId)
            .maybeSingle()
        : await supabase
            .from("categories")
            .select("*")
            .eq("active", true)
            .order("nivel_orden", {
                ascending: true,
            })
            .limit(1)
            .maybeSingle();

    if (categoryQ.error) {
        return {
            data: null as never,
            error: asError(categoryQ.error),
        };
    }

    const category = categoryQ.data ?? null;

    if (!category) {
        return {
            data: {
                season,
                category: null,
                entries: [],
            },
            error: null,
        };
    }

    const pointsQ = await supabase
        .from("ranking_points")
        .select("*")
        .eq("season_id", season.id)
        .eq("categoria_id", category.id);

    if (pointsQ.error) {
        return {
            data: null as never,
            error: asError(pointsQ.error),
        };
    }

    const playerIds = [
        ...new Set(
            (pointsQ.data ?? []).map(
                (point) => point.player_id,
            ),
        ),
    ];

    if (!playerIds.length) {
        return {
            data: {
                season,
                category,
                entries: [],
            },
            error: null,
        };
    }

    const playersQ = await supabase
        .from("players")
        .select("*")
        .in("id", playerIds)
        .eq("estado", "activo");

    if (playersQ.error) {
        return {
            data: null as never,
            error: asError(playersQ.error),
        };
    }

    const playersById = new Map(
        (playersQ.data ?? []).map(
            (player) => [player.id, player],
        ),
    );

    const totals = new Map<
        string,
        {
            points: number;
            tournaments: Set<string>;
        }
    >();

    for (const point of pointsQ.data ?? []) {
        const current = totals.get(point.player_id) ?? {
            points: 0,
            tournaments: new Set<string>(),
        };

        current.points += point.puntos_obtenidos;
        current.tournaments.add(point.tournament_id);

        totals.set(point.player_id, current);
    }

    const entries = [...totals.entries()]
        .map(([playerId, value]) => ({
            player: playersById.get(playerId),
            points: value.points,
            tournaments: value.tournaments.size,
        }))
        .filter(
            (
                entry,
            ): entry is {
                player: Player;
                points: number;
                tournaments: number;
            } => Boolean(entry.player),
        )
        .sort(
            (a, b) =>
                b.points - a.points ||
                publicPlayerName(a.player).localeCompare(
                    publicPlayerName(b.player),
                    "es",
                ),
        )
        .map((entry, index) => ({
            position: index + 1,
            ...entry,
        }));

    return {
        data: {
            season,
            category,
            entries,
        },
        error: null,
    };
}

export async function getPublicSponsors(
    tournamentIds: string[],
): Promise<PublicResult<PublicSponsor[]>> {
    if (!tournamentIds.length) {
        return {
            data: [],
            error: null,
        };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("sponsors")
        .select("*")
        .in("tournament_id", tournamentIds)
        .eq("active", true)
        .order("orden", { ascending: true });

    if (error) {
        return {
            data: [],
            error: asError(error),
        };
    }

    return {
        data: (data ?? []) as PublicSponsor[],
        error: null,
    };
}

export async function getPublicGallery(): Promise<
    PublicResult<PublicGalleryItem[]>
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("published", true)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        return {
            data: [],
            error: asError(error),
        };
    }

    return {
        data: (data ?? []) as PublicGalleryItem[],
        error: null,
    };
}

export async function getPublicPlayer(
    id: string,
): Promise<
    PublicResult<{
        player: Player;
        category: PublicCategory | null;
        points: number;
        tournaments: number;
        results: Array<
            RankingPoint & {
                tournament: Tournament | null;
            }
        >;
        instagramVisible: boolean;
    }>
> {
    const supabase = await createClient();

    const playerQ = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .eq("estado", "activo")
        .maybeSingle();

    if (playerQ.error) {
        return {
            data: null as never,
            error: asError(playerQ.error),
        };
    }

    if (!playerQ.data) {
        return {
            data: null as never,
            error: new Error("PLAYER_NOT_FOUND"),
        };
    }

    const player = playerQ.data;

    const [categoryQ, pointsQ, seasonQ] =
        await Promise.all([
            player.categoria_actual_id
                ? supabase
                    .from("categories")
                    .select("*")
                    .eq(
                        "id",
                        player.categoria_actual_id,
                    )
                    .maybeSingle()
                : Promise.resolve({
                    data: null,
                    error: null,
                }),

            supabase
                .from("ranking_points")
                .select("*")
                .eq("player_id", player.id)
                .order("fecha", {
                    ascending: false,
                }),

            supabase
                .from("seasons")
                .select("id")
                .eq("status", "activa")
                .order("start_date", {
                    ascending: false,
                })
                .limit(1)
                .maybeSingle(),
        ]);

    if (
        categoryQ.error ||
        pointsQ.error ||
        seasonQ.error
    ) {
        return {
            data: null as never,
            error: asError(
                categoryQ.error ??
                pointsQ.error ??
                seasonQ.error,
            ),
        };
    }

    const allPoints = pointsQ.data ?? [];
    const activeSeason = seasonQ.data;

    const currentPoints = activeSeason
        ? allPoints.filter(
            (point) =>
                point.season_id === activeSeason.id,
        )
        : [];

    const tournamentIds = [
        ...new Set(
            allPoints.map(
                (point) => point.tournament_id,
            ),
        ),
    ];

    const tournamentsQ = tournamentIds.length
        ? await supabase
            .from("tournaments")
            .select("*")
            .in("id", tournamentIds)
        : {
            data: [],
            error: null,
        };

    if (tournamentsQ.error) {
        return {
            data: null as never,
            error: asError(tournamentsQ.error),
        };
    }

    const tournamentsById = new Map(
        (tournamentsQ.data ?? []).map(
            (tournament) => [
                tournament.id,
                tournament,
            ],
        ),
    );

    return {
        data: {
            player,
            category: categoryQ.data ?? null,
            points: currentPoints.reduce(
                (sum, item) =>
                    sum + item.puntos_obtenidos,
                0,
            ),
            tournaments: new Set(
                currentPoints.map(
                    (item) => item.tournament_id,
                ),
            ).size,
            results: allPoints.map(
                (item) => ({
                    ...item,
                    tournament:
                        tournamentsById.get(
                            item.tournament_id,
                        ) ?? null,
                }),
            ),
            instagramVisible:
                publicVisibilityAllowsInstagram(
                    player.visibilidad_json,
                ),
        },
        error: null,
    };
}

export function displayPlayerName(
    player: Pick<
        Player,
        "nombre" | "apellidos"
    > | null,
): string {
    return player
        ? publicPlayerName(player)
        : "Jugador pendiente";
}

export function safeExternalUrl(
    value: string | null,
): string | null {
    if (!value) {
        return null;
    }

    try {
        const url = new URL(value);

        return url.protocol === "https:" ||
            url.protocol === "http:"
            ? url.toString()
            : null;
    } catch {
        return null;
    }
}