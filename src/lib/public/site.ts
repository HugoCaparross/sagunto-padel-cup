import type {
    Database,
    Json,
} from "@/types/database";

import {
    createClient,
} from "@/lib/supabase/server";

type Tables =
    Database["public"]["Tables"];

type Player =
    Tables["players"]["Row"];

type Category =
    Tables["categories"]["Row"];

type Tournament =
    Tables["tournaments"]["Row"];

type Club =
    Tables["clubs"]["Row"];

type News =
    Tables["news"]["Row"];

type GalleryItem =
    Tables["gallery_items"]["Row"];

type RankingPoint =
    Tables["ranking_points"]["Row"];

type Match =
    Tables["matches"]["Row"];

type Pair =
    Tables["pairs"]["Row"];

type GroupStanding =
    Tables["group_standings"]["Row"];

type Bracket =
    Tables["brackets"]["Row"];

type Sponsor =
    Tables["sponsors"]["Row"];

type PublicResult<T> =
    | {
        data: T;
        error: null;
    }
    | {
        data: null;
        error: Error;
    };

function asError(
    error: unknown,
): Error {
    if (error instanceof Error) {
        return error;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
    ) {
        return new Error(
            String(
                (
                    error as {
                        message: unknown;
                    }
                ).message,
            ),
        );
    }

    return new Error(
        "No se han podido cargar los datos públicos.",
    );
}

function isPublishedTournament(
    tournament: Tournament,
): boolean {
    return (
        tournament.estado !==
        "borrador" &&
        tournament.estado !==
        "archivado"
    );
}

function publicPlayerName(
    player: Pick<
        Player,
        "nombre" | "apellidos"
    >,
): string {
    return [
        player.nombre,
        player.apellidos,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();
}

function publicVisibilityAllowsInstagram(
    value: Json,
): boolean {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return false;
    }

    const visibility =
        value as Record<
            string,
            Json | undefined
        >;

    return (
        visibility.instagram !== false
    );
}

/* -------------------------------------------------------------------------- */
/* CATEGORIES                                                                 */
/* -------------------------------------------------------------------------- */

export async function getPublicCategories(): Promise<
    PublicResult<Category[]>
> {
    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order(
            "nivel_orden",
            {
                ascending: true,
            },
        );

    if (error) {
        return {
            data: null,
            error: asError(error),
        };
    }

    return {
        data: data ?? [],
        error: null,
    };
}

/* -------------------------------------------------------------------------- */
/* TOURNAMENTS                                                                */
/* -------------------------------------------------------------------------- */

export async function getPublicTournaments(): Promise<
    PublicResult<
        Array<
            Tournament & {
                club: Club | null;
            }
        >
    >
> {
    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("tournaments")
        .select("*, clubs(*)")
        .neq(
            "estado",
            "borrador",
        )
        .neq(
            "estado",
            "archivado",
        )
        .order(
            "fecha_inicio",
            {
                ascending: false,
            },
        );

    if (error) {
        return {
            data: null,
            error: asError(error),
        };
    }

    const rows =
        (data ?? []).map(
            (row) => {
                const raw =
                    row as Tournament & {
                        clubs?:
                        | Club
                        | null;
                    };

                return {
                    ...raw,
                    club:
                        raw.clubs ??
                        null,
                };
            },
        );

    return {
        data: rows.filter(
            isPublishedTournament,
        ),
        error: null,
    };
}

/* -------------------------------------------------------------------------- */
/* TOURNAMENT DETAIL                                                          */
/* -------------------------------------------------------------------------- */

export async function getPublicTournamentBySlug(
    slug: string,
): Promise<
    PublicResult<{
        tournament: Tournament;
        club: Club | null;
        season:
        Tables["seasons"]["Row"] |
        null;

        categories: Array<
            Tables["tournament_categories"]["Row"] & {
                category:
                | Category
                | null;
            }
        >;

        pairs: Array<
            Pair & {
                player1:
                | Player
                | null;

                player2:
                | Player
                | null;
            }
        >;

        matches: Array<
            Match & {
                pair1:
                | Pair
                | null;

                pair2:
                | Pair
                | null;
            }
        >;

        standings: Array<
            GroupStanding & {
                groupName: string;
            }
        >;

        brackets: Bracket[];

        sponsors: Sponsor[];
    }>
> {
    const supabase =
        await createClient();

    const tournamentQuery =
        await supabase
            .from("tournaments")
            .select("*")
            .eq("slug", slug)
            .maybeSingle();

    if (tournamentQuery.error) {
        return {
            data: null,
            error: asError(
                tournamentQuery.error,
            ),
        };
    }

    if (
        !tournamentQuery.data ||
        !isPublishedTournament(
            tournamentQuery.data,
        )
    ) {
        return {
            data: null,
            error: new Error(
                "TORNEO_NOT_FOUND",
            ),
        };
    }

    const tournament =
        tournamentQuery.data;

    const [
        clubQ,
        seasonQ,
        categoriesQ,
        pairsQ,
        matchesQ,
        groupsQ,
        bracketsQ,
        sponsorsQ,
    ] = await Promise.all([
        tournament.club_id
            ? supabase
                .from("clubs")
                .select("*")
                .eq(
                    "id",
                    tournament.club_id,
                )
                .maybeSingle()
            : Promise.resolve({
                data: null,
                error: null,
            }),

        tournament.season_id
            ? supabase
                .from("seasons")
                .select("*")
                .eq(
                    "id",
                    tournament.season_id,
                )
                .maybeSingle()
            : Promise.resolve({
                data: null,
                error: null,
            }),

        supabase
            .from("tournament_categories")
            .select("*")
            .eq(
                "tournament_id",
                tournament.id,
            )
            .eq(
                "enabled",
                true,
            ),

        supabase
            .from("pairs")
            .select("*")
            .eq(
                "tournament_id",
                tournament.id,
            )
            .neq(
                "estado",
                "pendiente_pago",
            )
            .order(
                "fecha_inscripcion",
                {
                    ascending: true,
                },
            ),

        supabase
            .from("matches")
            .select("*")
            .eq(
                "tournament_id",
                tournament.id,
            )
            .order(
                "hora_programada",
                {
                    ascending: true,
                    nullsFirst: false,
                },
            ),

        supabase
            .from("groups")
            .select(
                "id,nombre",
            )
            .eq(
                "tournament_id",
                tournament.id,
            ),

        supabase
            .from("brackets")
            .select("*")
            .eq(
                "tournament_id",
                tournament.id,
            ),

        supabase
            .from("sponsors")
            .select("*")
            .eq(
                "tournament_id",
                tournament.id,
            )
            .eq(
                "active",
                true,
            )
            .order(
                "orden",
                {
                    ascending: true,
                },
            ),
    ]);

    for (const query of [
        clubQ,
        seasonQ,
        categoriesQ,
        pairsQ,
        matchesQ,
        groupsQ,
        bracketsQ,
        sponsorsQ,
    ]) {
        if (query.error) {
            return {
                data: null,
                error: asError(
                    query.error,
                ),
            };
        }
    }

    const categoryIds =
        (
            categoriesQ.data ??
            []
        ).map(
            (item) =>
                item.categoria_id,
        );

    const [
        categoryRows,
        playerRows,
    ] = await Promise.all([
        categoryIds.length
            ? supabase
                .from("categories")
                .select("*")
                .in(
                    "id",
                    categoryIds,
                )
            : Promise.resolve({
                data: [],
                error: null,
            }),

        (() => {
            const ids =
                new Set<string>();

            for (const pair of
                pairsQ.data ?? []) {
                if (
                    pair.player_1_id
                ) {
                    ids.add(
                        pair.player_1_id,
                    );
                }

                if (
                    pair.player_2_id
                ) {
                    ids.add(
                        pair.player_2_id,
                    );
                }
            }

            return ids.size
                ? supabase
                    .from("players")
                    .select("*")
                    .in(
                        "id",
                        [...ids],
                    )
                : Promise.resolve({
                    data: [],
                    error: null,
                });
        })(),
    ]);

    if (
        categoryRows.error ||
        playerRows.error
    ) {
        return {
            data: null,
            error: asError(
                categoryRows.error ??
                playerRows.error,
            ),
        };
    }

    const categoriesById =
        new Map(
            (
                categoryRows.data ??
                []
            ).map(
                (item) => [
                    item.id,
                    item,
                ],
            ),
        );

    const playersById =
        new Map(
            (
                playerRows.data ??
                []
            ).map(
                (item) => [
                    item.id,
                    item,
                ],
            ),
        );

    const groupsById =
        new Map(
            (
                groupsQ.data ??
                []
            ).map(
                (item) => [
                    item.id,
                    item.nombre,
                ],
            ),
        );

    const standingsQ =
        (
            groupsQ.data ?? []
        ).length
            ? await supabase
                .from(
                    "group_standings",
                )
                .select("*")
                .in(
                    "group_id",
                    (
                        groupsQ.data ??
                        []
                    ).map(
                        (item) =>
                            item.id,
                    ),
                )
                .order(
                    "posicion",
                    {
                        ascending: true,
                    },
                )
            : {
                data: [],
                error: null,
            };

    if (standingsQ.error) {
        return {
            data: null,
            error: asError(
                standingsQ.error,
            ),
        };
    }

    return {
        data: {
            tournament,

            club:
                clubQ.data ??
                null,

            season:
                seasonQ.data ??
                null,

            categories: (
                categoriesQ.data ??
                []
            ).map(
                (item) => ({
                    ...item,

                    category:
                        categoriesById.get(
                            item.categoria_id,
                        ) ??
                        null,
                }),
            ),

            pairs: (
                pairsQ.data ??
                []
            ).map(
                (pair) => ({
                    ...pair,

                    player1:
                        pair.player_1_id
                            ? playersById.get(
                                pair.player_1_id,
                            ) ??
                            null
                            : null,

                    player2:
                        pair.player_2_id
                            ? playersById.get(
                                pair.player_2_id,
                            ) ??
                            null
                            : null,
                }),
            ),

            matches: (
                matchesQ.data ??
                []
            ).map(
                (match) => ({
                    ...match,

                    pair1:
                        match.pair_1_id
                            ? (
                                pairsQ.data ??
                                []
                            ).find(
                                (
                                    pair,
                                ) =>
                                    pair.id ===
                                    match.pair_1_id,
                            ) ??
                            null
                            : null,

                    pair2:
                        match.pair_2_id
                            ? (
                                pairsQ.data ??
                                []
                            ).find(
                                (
                                    pair,
                                ) =>
                                    pair.id ===
                                    match.pair_2_id,
                            ) ??
                            null
                            : null,
                }),
            ),

            standings: (
                standingsQ.data ??
                []
            ).map(
                (standing) => ({
                    ...standing,

                    groupName:
                        groupsById.get(
                            standing.group_id,
                        ) ??
                        "Grupo",
                }),
            ),

            brackets:
                bracketsQ.data ??
                [],

            sponsors:
                sponsorsQ.data ??
                [],
        },

        error: null,
    };
}

/* -------------------------------------------------------------------------- */
/* NEWS                                                                       */
/* -------------------------------------------------------------------------- */

export async function getPublicNews(): Promise<
    PublicResult<News[]>
> {
    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("news")
        .select("*")
        .eq(
            "estado",
            "publicado",
        )
        .order(
            "fecha_publicacion",
            {
                ascending: false,
                nullsFirst: false,
            },
        );

    if (error) {
        return {
            data: null,
            error: asError(error),
        };
    }

    return {
        data: data ?? [],
        error: null,
    };
}

export async function getPublicNewsBySlug(
    slug: string,
): Promise<
    PublicResult<News>
> {
    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("news")
        .select("*")
        .eq(
            "slug",
            slug,
        )
        .eq(
            "estado",
            "publicado",
        )
        .maybeSingle();

    if (error) {
        return {
            data: null,
            error: asError(error),
        };
    }

    if (!data) {
        return {
            data: null,
            error: new Error(
                "NEWS_NOT_FOUND",
            ),
        };
    }

    return {
        data,
        error: null,
    };
}

/* -------------------------------------------------------------------------- */
/* PLAYERS                                                                    */
/* -------------------------------------------------------------------------- */

export async function getPublicPlayers(): Promise<
    PublicResult<
        Array<
            Player & {
                category:
                | Category
                | null;

                points: number;
            }
        >
    >
> {
    const supabase =
        await createClient();

    const {
        data: players,
        error,
    } = await supabase
        .from("players")
        .select("*")
        .eq(
            "estado",
            "activo",
        )
        .order(
            "nombre",
            {
                ascending: true,
            },
        );

    if (error) {
        return {
            data: null,
            error: asError(error),
        };
    }

    if (!players?.length) {
        return {
            data: [],
            error: null,
        };
    }

    const categoryIds =
        [
            ...new Set(
                players
                    .map(
                        (player) =>
                            player.categoria_actual_id,
                    )
                    .filter(
                        (
                            id,
                        ): id is string =>
                            Boolean(id),
                    ),
            ),
        ];

    const categoriesQ =
        categoryIds.length
            ? await supabase
                .from("categories")
                .select("*")
                .in(
                    "id",
                    categoryIds,
                )
            : {
                data: [],
                error: null,
            };

    if (categoriesQ.error) {
        return {
            data: null,
            error: asError(
                categoriesQ.error,
            ),
        };
    }

    const pointsQ =
        await getCurrentSeasonPoints(
            supabase,
            players.map(
                (player) =>
                    player.id,
            ),
        );

    if (pointsQ.error) {
        return {
            data: null,
            error: pointsQ.error,
        };
    }

    const pointsByPlayer =
        new Map<string, number>();

    for (const point of
        pointsQ.data) {
        pointsByPlayer.set(
            point.player_id,
            (
                pointsByPlayer.get(
                    point.player_id,
                ) ?? 0
            ) +
            point.puntos_obtenidos,
        );
    }

    const categoriesById =
        new Map(
            (
                categoriesQ.data ??
                []
            ).map(
                (category) => [
                    category.id,
                    category,
                ],
            ),
        );

    return {
        data: players.map(
            (player) => ({
                ...player,

                category:
                    player.categoria_actual_id
                        ? categoriesById.get(
                            player.categoria_actual_id,
                        ) ??
                        null
                        : null,

                points:
                    pointsByPlayer.get(
                        player.id,
                    ) ?? 0,
            }),
        ),

        error: null,
    };
}

/* -------------------------------------------------------------------------- */
/* CURRENT SEASON POINTS                                                      */
/* -------------------------------------------------------------------------- */

async function getCurrentSeasonPoints(
    supabase: Awaited<
        ReturnType<
            typeof createClient
        >
    >,

    playerIds: string[],
) {
    const seasonQ =
        await supabase
            .from("seasons")
            .select("id")
            .eq(
                "status",
                "activa",
            )
            .order(
                "start_date",
                {
                    ascending: false,
                },
            )
            .limit(1)
            .maybeSingle();

    if (seasonQ.error) {
        return {
            data:
                [] as RankingPoint[],
            error: asError(
                seasonQ.error,
            ),
        };
    }

    if (!seasonQ.data) {
        return {
            data:
                [] as RankingPoint[],
            error: null,
        };
    }

    const pointsQ =
        await supabase
            .from("ranking_points")
            .select("*")
            .eq(
                "season_id",
                seasonQ.data.id,
            )
            .in(
                "player_id",
                playerIds,
            );

    if (pointsQ.error) {
        return {
            data:
                [] as RankingPoint[],
            error: asError(
                pointsQ.error,
            ),
        };
    }

    return {
        data:
            pointsQ.data ?? [],
        error: null,
    };
}

/* -------------------------------------------------------------------------- */
/* PUBLIC RANKING                                                             */
/* -------------------------------------------------------------------------- */

export async function getPublicRanking(
    categoryId?: string,
): Promise<
    PublicResult<{
        season:
        Tables["seasons"]["Row"] |
        null;

        category:
        Category | null;

        entries: Array<{
            position: number;
            player: Player;
            points: number;
            tournaments: number;
        }>;
    }>
> {
    const supabase =
        await createClient();

    const seasonQ =
        await supabase
            .from("seasons")
            .select("*")
            .eq(
                "status",
                "activa",
            )
            .order(
                "start_date",
                {
                    ascending: false,
                },
            )
            .limit(1)
            .maybeSingle();

    if (seasonQ.error) {
        return {
            data: null,
            error: asError(
                seasonQ.error,
            ),
        };
    }

    const season =
        seasonQ.data ?? null;

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

    const categoryQ =
        categoryId
            ? await supabase
                .from("categories")
                .select("*")
                .eq(
                    "id",
                    categoryId,
                )
                .maybeSingle()
            : await supabase
                .from("categories")
                .select("*")
                .eq(
                    "active",
                    true,
                )
                .order(
                    "nivel_orden",
                    {
                        ascending: true,
                    },
                )
                .limit(1)
                .maybeSingle();

    if (categoryQ.error) {
        return {
            data: null,
            error: asError(
                categoryQ.error,
            ),
        };
    }

    const category =
        categoryQ.data ?? null;

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

    const pointsQ =
        await supabase
            .from("ranking_points")
            .select("*")
            .eq(
                "season_id",
                season.id,
            )
            .eq(
                "categoria_id",
                category.id,
            );

    if (pointsQ.error) {
        return {
            data: null,
            error: asError(
                pointsQ.error,
            ),
        };
    }

    const playerIds =
        [
            ...new Set(
                (
                    pointsQ.data ??
                    []
                ).map(
                    (point) =>
                        point.player_id,
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

    const playersQ =
        await supabase
            .from("players")
            .select("*")
            .in(
                "id",
                playerIds,
            )
            .eq(
                "estado",
                "activo",
            );

    if (playersQ.error) {
        return {
            data: null,
            error: asError(
                playersQ.error,
            ),
        };
    }

    const playersById =
        new Map(
            (
                playersQ.data ??
                []
            ).map(
                (player) => [
                    player.id,
                    player,
                ],
            ),
        );

    const totals =
        new Map<
            string,
            {
                points: number;
                tournaments: Set<string>;
            }
        >();

    for (const point of
        pointsQ.data ?? []) {
        const current =
            totals.get(
                point.player_id,
            ) ?? {
                points: 0,
                tournaments:
                    new Set<string>(),
            };

        current.points +=
            point.puntos_obtenidos;

        current.tournaments.add(
            point.tournament_id,
        );

        totals.set(
            point.player_id,
            current,
        );
    }

    const entries =
        [
            ...totals.entries(),
        ]
            .map(
                ([
                    playerId,
                    value,
                ]) => ({
                    player:
                        playersById.get(
                            playerId,
                        ),

                    points:
                        value.points,

                    tournaments:
                        value.tournaments
                            .size,
                }),
            )
            .filter(
                (
                    entry,
                ): entry is {
                    player: Player;
                    points: number;
                    tournaments: number;
                } =>
                    Boolean(
                        entry.player,
                    ),
            )
            .sort(
                (a, b) =>
                    b.points -
                    a.points ||
                    publicPlayerName(
                        a.player,
                    ).localeCompare(
                        publicPlayerName(
                            b.player,
                        ),
                        "es",
                    ),
            )
            .map(
                (
                    entry,
                    index,
                ) => ({
                    position:
                        index + 1,
                    ...entry,
                }),
            );

    return {
        data: {
            season,
            category,
            entries,
        },

        error: null,
    };
}

/* -------------------------------------------------------------------------- */
/* PLAYER DETAIL                                                              */
/* -------------------------------------------------------------------------- */

export async function getPublicPlayerById(
    id: string,
): Promise<
    PublicResult<{
        player: Player;

        category:
        | Category
        | null;

        points: number;

        tournaments: number;

        results: Array<
            RankingPoint & {
                tournament:
                | Tournament
                | null;
            }
        >;

        instagramVisible: boolean;
    }>
> {
    const supabase =
        await createClient();

    const playerQ =
        await supabase
            .from("players")
            .select("*")
            .eq(
                "id",
                id,
            )
            .eq(
                "estado",
                "activo",
            )
            .maybeSingle();

    if (playerQ.error) {
        return {
            data: null,
            error: asError(
                playerQ.error,
            ),
        };
    }

    if (!playerQ.data) {
        return {
            data: null,
            error: new Error(
                "PLAYER_NOT_FOUND",
            ),
        };
    }

    const player =
        playerQ.data;

    const [
        categoryQ,
        pointsQ,
        seasonQ,
    ] = await Promise.all([
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
            .eq(
                "player_id",
                player.id,
            )
            .order(
                "fecha",
                {
                    ascending: false,
                },
            ),

        supabase
            .from("seasons")
            .select("id")
            .eq(
                "status",
                "activa",
            )
            .order(
                "start_date",
                {
                    ascending: false,
                },
            )
            .limit(1)
            .maybeSingle(),
    ]);

    if (
        categoryQ.error ||
        pointsQ.error ||
        seasonQ.error
    ) {
        return {
            data: null,
            error: asError(
                categoryQ.error ??
                pointsQ.error ??
                seasonQ.error,
            ),
        };
    }

    /*
     * Keep the season query narrowed before accessing its id.
     *
     * This avoids the TypeScript "possibly null" error while also making
     * the intended business rule explicit: only the active season contributes
     * to the current public ranking total.
     */
    const allPoints =
        pointsQ.data ?? [];

    const activeSeason =
        seasonQ.data;

    const currentPoints =
        activeSeason
            ? allPoints.filter(
                (point) =>
                    point.season_id ===
                    activeSeason.id,
            )
            : [];

    const tournamentIds =
        [
            ...new Set(
                allPoints.map(
                    (point) =>
                        point.tournament_id,
                ),
            ),
        ];

    const tournamentsQ =
        tournamentIds.length
            ? await supabase
                .from("tournaments")
                .select("*")
                .in(
                    "id",
                    tournamentIds,
                )
            : {
                data: [],
                error: null,
            };

    if (tournamentsQ.error) {
        return {
            data: null,
            error: asError(
                tournamentsQ.error,
            ),
        };
    }

    const tournamentsById =
        new Map(
            (
                tournamentsQ.data ??
                []
            ).map(
                (tournament) => [
                    tournament.id,
                    tournament,
                ],
            ),
        );

    return {
        data: {
            player,

            category:
                categoryQ.data ??
                null,

            points:
                currentPoints.reduce(
                    (
                        sum,
                        item,
                    ) =>
                        sum +
                        item.puntos_obtenidos,
                    0,
                ),

            tournaments:
                new Set(
                    currentPoints.map(
                        (item) =>
                            item.tournament_id,
                    ),
                ).size,

            results:
                allPoints.map(
                    (item) => ({
                        ...item,

                        tournament:
                            tournamentsById.get(
                                item.tournament_id,
                            ) ??
                            null,
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

/* -------------------------------------------------------------------------- */
/* DISPLAY HELPERS                                                            */
/* -------------------------------------------------------------------------- */

export function displayPlayerName(
    player: Pick<
        Player,
        "nombre" | "apellidos"
    > | null,
): string {
    return player
        ? publicPlayerName(
            player,
        )
        : "Jugador pendiente";
}

export function safeExternalUrl(
    value: string | null,
): string | null {
    if (!value) {
        return null;
    }

    try {
        const url =
            new URL(value);

        return url.protocol ===
            "https:" ||
            url.protocol ===
            "http:"
            ? url.toString()
            : null;
    } catch {
        return null;
    }
}