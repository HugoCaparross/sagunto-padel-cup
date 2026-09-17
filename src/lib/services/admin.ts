// src/lib/services/admin.ts

import { createClient } from "@/lib/supabase/server";

import type {
    Category,
    Club,
    Match,
    News,
    Player,
    Prize,
    Sponsor,
    Tournament,
    Json,
    AuditAction,
} from "@/types/database";

import type {
    MatchTier,
} from "@/types/database";

import {
    getTournaments,
    getTournamentById,
    getTournamentSummary,
    updateTournament,
    updateTournamentState,
} from "@/lib/services/tournaments";

import {
    getPlayers,
    getPlayerById,
    updatePlayer,
} from "@/lib/services/players";

import {
    getCategoryRanking,
    getRankingSummary,
    getRankingPoints,
} from "@/lib/services/ranking";

import {
    getRegistrations,
    getRegistrationSummary,
    verifyRegistrationPayment,
    checkInRegistration,
    updateRegistrationStatus,
    adminConfirmRegistration,
} from "@/lib/services/registrations";

import {
    getMatches,
    getMatchOperationalSummary,
    updateMatch,
} from "@/lib/services/matches";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type AdminDashboardSummary = {
    tournaments: {
        total: number;
        open: number;
        live: number;
        finished: number;
    };

    players: {
        total: number;
        active: number;
    };

    registrations: {
        total: number;
        pendingPayment: number;
        confirmed: number;
        waitingList: number;
        checkedIn: number;
    };

    matches: {
        total: number;
        pending: number;
        live: number;
        finished: number;
        postponed: number;
    };

    ranking: {
        totalPlayers: number;
        totalPoints: number;
    };
};

export type AdminTournamentOverview = {
    tournament: Tournament;

    summary: Awaited<
        ReturnType<
            typeof getTournamentSummary
        >
    >;

    registrations: Awaited<
        ReturnType<
            typeof getRegistrationSummary
        >
    >;

    matches: Awaited<
        ReturnType<
            typeof getMatchOperationalSummary
        >
    >;
};

export type AdminPlayerFilters = {
    search?: string;
    categoryId?: string;
    estado?: Player["estado"];
    role?: Player["role"];
};

/**
 * Estados que utiliza la interfaz administrativa.
 *
 * Se mantienen en español porque corresponden al dominio de SPC.
 * El servicio de registros realiza su propia normalización interna.
 */
export type AdminRegistrationStatus =
    | "confirmada"
    | "lista_espera"
    | "pendiente_pago"
    | "cancelada";

export type AdminPaymentStatus =
    | "pendiente"
    | "rechazado"
    | "verificado"
    | "no_requerido";

export type AdminRegistrationFilters = {
    tournamentId?: string;
    categoryId?: string;
    estado?: AdminRegistrationStatus;
    paymentStatus?: AdminPaymentStatus;
    checkIn?: boolean;
};

export type AdminMatchFilters = {
    tournamentId?: string;
    categoryId?: string;
    fase?: Match["fase"];
    estado?: Match["estado"];
    tramo?: MatchTier;
    pista?: number | "all";
};

export type AdminAuditEntry = {
    accion: string;
    entityType: string;
    entityId: string;
    metadata?: Record<
        string,
        unknown
    >;
};

/* -------------------------------------------------------------------------- */
/* REGISTRATION SERVICE ADAPTERS                                              */
/* -------------------------------------------------------------------------- */

/**
 * The competition/domain layer uses the Spanish SPC states while the
 * registration service exposes its own service-level estado type.
 *
 * Keep this conversion isolated here instead of spreading casts throughout
 * the admin service.
 */
function toServiceRegistrationStatus(
    estado: AdminRegistrationStatus,
): AdminRegistrationStatus {
    return estado;
}

/**
 * Converts the admin payment filter into the service payment filter.
 */
function toServicePaymentStatus(
    estado: AdminPaymentStatus,
): AdminPaymentStatus {
    return estado;
}

/* -------------------------------------------------------------------------- */
/* ADMIN ACCESS                                                               */
/* -------------------------------------------------------------------------- */

/**
 * All administrative operations must run through an authenticated admin
 * context. RLS remains the final security boundary in Supabase.
 */
export async function requireAdminContext(): Promise<{
    userId: string;
    player: Player;
}> {
    const supabase =
        await createClient();

    const {
        data:
        userData,
        error:
        userError,
    } = await supabase.auth.getUser();

    if (
        userError ||
        !userData.user
    ) {
        throw new Error(
            "Es necesario iniciar sesión.",
        );
    }

    const {
        data:
        player,
        error:
        playerError,
    } = await supabase
        .from("players")
        .select("*")
        .eq(
            "auth_user_id",
            userData.user.id,
        )
        .maybeSingle();

    if (playerError) {
        throw new Error(
            `No se pudo comprobar el usuario administrador: ${playerError.message}`,
        );
    }

    if (
        !player ||
        player.role !==
        "admin"
    ) {
        throw new Error(
            "No tienes permisos de administrador.",
        );
    }

    return {
        userId:
            userData.user.id,

        player:
            player as unknown as Player,
    };
}

/* -------------------------------------------------------------------------- */
/* DASHBOARD                                                                  */
/* -------------------------------------------------------------------------- */

export async function getAdminDashboardSummary(
    seasonId?: string,
): Promise<AdminDashboardSummary> {
    await requireAdminContext();

    const [
        tournaments,
        players,
        registrations,
        matches,
        ranking,
    ] = await Promise.all([
        getTournaments({
            seasonId,
        }),

        getPlayers(),

        getRegistrations(),

        getMatches(),

        getRankingSummary({
            seasonId,
        }),
    ]);

    const tournamentIds =
        seasonId
            ? tournaments.map(
                (tournament: Tournament) =>
                    tournament.id,
            )
            : [];

    const scopedRegistrations =
        seasonId
            ? registrations.filter(
                (registration: import("@/types/database").Registration) =>
                    tournamentIds.includes(
                        registration.tournament_id,
                    ),
            )
            : registrations;

    const scopedMatches =
        seasonId
            ? matches.filter(
                (match: Match) =>
                    tournamentIds.includes(
                        match.tournament_id,
                    ),
            )
            : matches;

    return {
        tournaments: {
            total:
                tournaments.length,

            open:
                tournaments.filter(
                    (tournament: Tournament) =>
                        tournament.estado ===
                        "inscripciones_abiertas",
                ).length,

            live:
                tournaments.filter(
                    (tournament: Tournament) =>
                        tournament.estado ===
                        "en_juego",
                ).length,

            finished:
                tournaments.filter(
                    (tournament: Tournament) =>
                        tournament.estado ===
                        "finalizado",
                ).length,
        },

        players: {
            total:
                players.length,

            active:
                players.filter(
                    (player: Player) =>
                        player.estado ===
                        "activo",
                ).length,
        },

        registrations: {
            total:
                scopedRegistrations.length,

            pendingPayment:
                scopedRegistrations.filter(
                    (registration: import("@/types/database").Registration) =>
                        registration.estado ===
                        "pendiente_pago",
                ).length,

            confirmed:
                scopedRegistrations.filter(
                    (registration: import("@/types/database").Registration) =>
                        registration.estado ===
                        "confirmada",
                ).length,

            waitingList:
                scopedRegistrations.filter(
                    (registration: import("@/types/database").Registration) =>
                        registration.estado ===
                        "lista_espera",
                ).length,

            checkedIn:
                scopedRegistrations.filter(
                    (registration: import("@/types/database").Registration) =>
                        registration.checked_in,
                ).length,
        },

        matches: {
            total:
                scopedMatches.length,

            pending:
                scopedMatches.filter(
                    (match: Match) =>
                        match.estado ===
                        "pendiente",
                ).length,

            live:
                scopedMatches.filter(
                    (match: Match) =>
                        match.estado ===
                        "en_juego",
                ).length,

            finished:
                scopedMatches.filter(
                    (match: Match) =>
                        match.estado ===
                        "finalizado",
                ).length,

            postponed:
                scopedMatches.filter(
                    (match: Match) =>
                        match.estado ===
                        "aplazado",
                ).length,
        },

        ranking: {
            totalPlayers:
                ranking.totalPlayers,

            totalPoints:
                ranking.totalPoints,
        },
    };
}

/* -------------------------------------------------------------------------- */
/* TOURNAMENT ADMIN                                                           */
/* -------------------------------------------------------------------------- */

export async function getAdminTournamentOverview(
    tournamentId: string,
): Promise<AdminTournamentOverview> {
    await requireAdminContext();

    const tournament =
        await getTournamentById(
            tournamentId,
        );

    if (!tournament) {
        throw new Error(
            "El torneo no existe.",
        );
    }

    const [
        summary,
        registrations,
        matches,
    ] = await Promise.all([
        getTournamentSummary(
            tournamentId,
        ),

        getRegistrationSummary(
            tournamentId,
        ),

        getMatchOperationalSummary(
            tournamentId,
        ),
    ]);

    return {
        tournament,
        summary,
        registrations,
        matches,
    };
}

export async function publishTournament(
    tournamentId: string,
): Promise<Tournament> {
    await requireAdminContext();

    return updateTournamentState(
        tournamentId,
        "publicado",
    );
}

export async function openTournamentRegistrations(
    tournamentId: string,
): Promise<Tournament> {
    await requireAdminContext();

    return updateTournamentState(
        tournamentId,
        "inscripciones_abiertas",
    );
}

export async function startTournament(
    tournamentId: string,
): Promise<Tournament> {
    await requireAdminContext();

    return updateTournamentState(
        tournamentId,
        "en_juego",
    );
}

export async function finishTournament(
    tournamentId: string,
): Promise<Tournament> {
    await requireAdminContext();

    return updateTournamentState(
        tournamentId,
        "finalizado",
    );
}

export async function archiveTournament(
    tournamentId: string,
): Promise<Tournament> {
    await requireAdminContext();

    return updateTournamentState(
        tournamentId,
        "archivado",
    );
}

export async function editTournament(
    tournamentId: string,
    input: Parameters<
        typeof updateTournament
    >[1],
): Promise<Tournament> {
    await requireAdminContext();

    return updateTournament(
        tournamentId,
        input,
    );
}

/* -------------------------------------------------------------------------- */
/* PLAYER ADMIN                                                               */
/* -------------------------------------------------------------------------- */

export async function getAdminPlayers(
    filters: AdminPlayerFilters = {},
) {
    await requireAdminContext();

    return getPlayers({
        ...filters,
    });
}

export async function getAdminPlayer(
    playerId: string,
) {
    await requireAdminContext();

    return getPlayerById(
        playerId,
    );
}

export async function activatePlayerAdmin(
    playerId: string,
): Promise<Player> {
    await requireAdminContext();

    return updatePlayer(
        playerId,
        {
            estado:
                "activo",
        },
    );
}

export async function deactivatePlayerAdmin(
    playerId: string,
): Promise<Player> {
    await requireAdminContext();

    return updatePlayer(
        playerId,
        {
            estado:
                "baja",
        },
    );
}

export async function changePlayerRoleAdmin(
    playerId: string,
    role: Player["role"],
): Promise<Player> {
    await requireAdminContext();

    if (
        role !== "player" &&
        role !== "admin"
    ) {
        throw new Error(
            "Rol no válido.",
        );
    }

    return updatePlayer(
        playerId,
        {
            role,
        },
    );
}

/* -------------------------------------------------------------------------- */
/* REGISTRATION ADMIN                                                         */
/* -------------------------------------------------------------------------- */

export async function getAdminRegistrations(
    filters: AdminRegistrationFilters = {},
) {
    await requireAdminContext();

    return getRegistrations({
        tournamentId:
            filters.tournamentId,

        categoryId:
            filters.categoryId,

        estado:
            filters.estado
                ? toServiceRegistrationStatus(
                    filters.estado,
                )
                : undefined,

        paymentStatus:
            filters.paymentStatus
                ? toServicePaymentStatus(
                    filters.paymentStatus,
                )
                : undefined,

        checkIn:
            filters.checkIn,
    });
}

export async function confirmRegistrationPaymentAdmin(
    input: Parameters<
        typeof verifyRegistrationPayment
    >[0],
) {
    await requireAdminContext();

    return verifyRegistrationPayment(
        input,
    );
}

export async function confirmRegistrationAdmin(
    registrationId: string,
) {
    await requireAdminContext();

    return adminConfirmRegistration(registrationId);
}

export async function moveRegistrationToWaitingListAdmin(
    registrationId: string,
) {
    await requireAdminContext();

    return updateRegistrationStatus(
        registrationId,
        toServiceRegistrationStatus(
            "lista_espera",
        ),
    );
}

export async function cancelRegistrationAdmin(
    registrationId: string,
) {
    await requireAdminContext();

    return updateRegistrationStatus(
        registrationId,
        toServiceRegistrationStatus(
            "cancelada",
        ),
    );
}

export async function checkInPlayerAdmin(
    registrationId: string,
) {
    await requireAdminContext();

    return checkInRegistration(
        registrationId,
    );
}

/* -------------------------------------------------------------------------- */
/* MATCH ADMIN                                                                */
/* -------------------------------------------------------------------------- */

export async function getAdminMatches(
    filters: AdminMatchFilters = {},
) {
    await requireAdminContext();

    return getMatches({
        tournamentId:
            filters.tournamentId,

        categoryId:
            filters.categoryId,

        fase:
            filters.fase,

        estado:
            filters.estado,

        tramo:
            filters.tramo,

        pista:
            filters.pista,
    });
}

export async function assignMatchCourtAdmin(
    matchId: string,
    pista: number | string | null,
) {
    await requireAdminContext();

    return updateMatch(
        matchId,
        {
            pista:
                pista === null
                    ? null
                    : Number(pista),
        },
    );
}

export async function updateMatchScheduleAdmin(
    matchId: string,
    scheduledAt: string | null,
) {
    await requireAdminContext();

    return updateMatch(
        matchId,
        {
            scheduledAt,
        },
    );
}

export async function updateMatchStatusAdmin(
    matchId: string,
    estado: Match["estado"],
) {
    await requireAdminContext();

    return updateMatch(
        matchId,
        {
            estado,
        },
    );
}

/* -------------------------------------------------------------------------- */
/* RANKING ADMIN                                                              */
/* -------------------------------------------------------------------------- */

export async function getAdminRanking(
    seasonId: string,
    categoryId: string,
) {
    await requireAdminContext();

    return getCategoryRanking(
        seasonId,
        categoryId,
    );
}

export async function getAdminRankingSummary(
    seasonId?: string,
) {
    await requireAdminContext();

    return getRankingSummary({
        seasonId,
    });
}

export async function getAdminRankingPoints(
    filters: {
        seasonId?: string;
        categoryId?: string;
        playerId?: string;
        tournamentId?: string;
    },
) {
    await requireAdminContext();

    return getRankingPoints(
        filters,
    );
}

/* -------------------------------------------------------------------------- */
/* CLUBS                                                                      */
/* -------------------------------------------------------------------------- */

export async function getClubs(): Promise<
    Club[]
> {
    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("clubs")
        .select("*")
        .order(
            "nombre",
            {
                ascending: true,
            },
        );

    if (error) {
        throw new Error(
            `No se pudieron obtener los clubes: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as unknown as Club[];
}

export async function createClub(
    input: {
        name: string;
        address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        courts?: number | null;
        telefono?: string | null;
        photos?: unknown;
    },
): Promise<Club> {
    await requireAdminContext();

    const name =
        input.name.trim();

    if (!name) {
        throw new Error(
            "El nombre del club es obligatorio.",
        );
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("clubs")
        .insert({
            nombre: name,

            direccion:
                input.address?.trim() ||
                null,

            lat:
                input.latitude ?? null,

            lng:
                input.longitude ?? null,

            num_pistas:
                input.courts ??
                null,

            telefono:
                input.telefono?.trim() ||
                null,

            fotos_json:
                (input.photos ?? []) as Json,
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear el club: ${error.message}`,
        );
    }

    return data as unknown as Club;
}

export async function updateClub(
    clubId: string,
    input: {
        name?: string;
        address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        courts?: number | null;
        telefono?: string | null;
        photos?: unknown;
    },
): Promise<Club> {
    await requireAdminContext();

    if (
        input.name ===
        undefined &&
        input.address ===
        undefined &&
        input.latitude ===
        undefined &&
        input.longitude ===
        undefined &&
        input.courts ===
        undefined &&
        input.telefono ===
        undefined &&
        input.photos ===
        undefined
    ) {
        throw new Error(
            "No hay cambios que guardar.",
        );
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("clubs")
        .update({
            ...(input.name !==
                undefined
                ? {
                    nombre:
                        input.name.trim(),
                }
                : {}),

            ...(input.address !==
                undefined
                ? {
                    direccion:
                        input.address,
                }
                : {}),

            ...(input.latitude !==
                undefined
                ? {
                    lat:
                        input.latitude,
                }
                : {}),

            ...(input.longitude !==
                undefined
                ? {
                    lng:
                        input.longitude,
                }
                : {}),

            ...(input.courts !==
                undefined &&
                input.courts !==
                null
                ? {
                    num_pistas:
                        input.courts,
                }
                : {}),

            ...(input.telefono !==
                undefined
                ? {
                    telefono:
                        input.telefono,
                }
                : {}),

            ...(input.photos !==
                undefined
                ? {
                    fotos_json:
                        input.photos as Json,
                }
                : {}),
        })
        .eq(
            "id",
            clubId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar el club: ${error.message}`,
        );
    }

    return data as unknown as Club;
}

/* -------------------------------------------------------------------------- */
/* CATEGORIES                                                                 */
/* -------------------------------------------------------------------------- */

export async function getCategories(): Promise<
    Category[]
> {
    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("categories")
        .select("*")
        .order(
            "nivel_orden",
            {
                ascending: true,
            },
        );

    if (error) {
        throw new Error(
            `No se pudieron obtener las categorías: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as unknown as Category[];
}

export async function createCategory(
    input: {
        name: string;
        order: number;
    },
): Promise<Category> {
    await requireAdminContext();

    const name =
        input.name.trim();

    if (!name) {
        throw new Error(
            "El nombre de la categoría es obligatorio.",
        );
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("categories")
        .insert({
            nombre: name,

            nivel_orden:
                input.order,
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear la categoría: ${error.message}`,
        );
    }

    return data as unknown as Category;
}

export async function updateCategory(
    categoryId: string,
    input: {
        name?: string;
        order?: number;
    },
): Promise<Category> {
    await requireAdminContext();

    if (
        input.name ===
        undefined &&
        input.order ===
        undefined
    ) {
        throw new Error(
            "No hay cambios que guardar.",
        );
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("categories")
        .update({
            ...(input.name !==
                undefined
                ? {
                    nombre:
                        input.name.trim(),
                }
                : {}),

            ...(input.order !==
                undefined
                ? {
                    nivel_orden:
                        input.order,
                }
                : {}),
        })
        .eq(
            "id",
            categoryId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar la categoría: ${error.message}`,
        );
    }

    return data as unknown as Category;
}

/* -------------------------------------------------------------------------- */
/* NEWS                                                                       */
/* -------------------------------------------------------------------------- */

export async function getAdminNews(): Promise<
    News[]
> {
    await requireAdminContext();

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("news")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false,
            },
        );

    if (error) {
        throw new Error(
            `No se pudieron obtener las noticias: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as unknown as News[];
}

export async function createNews(
    input: {
        title: string;
        slug: string;
        excerpt?: string | null;
        content?: string | null;
        image?: string | null;
        published?: boolean;
    },
): Promise<News> {
    await requireAdminContext();

    const title =
        input.title.trim();

    const slug =
        input.slug.trim();

    if (!title) {
        throw new Error(
            "El título es obligatorio.",
        );
    }

    if (!slug) {
        throw new Error(
            "El slug es obligatorio.",
        );
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("news")
        .insert({
            titulo: title,

            slug,

            ...(input.excerpt !==
                undefined &&
                input.excerpt !==
                null
                ? {
                    excerpt:
                        input.excerpt.trim(),
                }
                : {}),

            contenido:
                input.content ??
                "",

            ...(input.image !==
                undefined
                ? {
                    imagen_destacada:
                        input.image,
                }
                : {}),

            estado:
                input.published === true
                    ? "publicado"
                    : "borrador",

            fecha_publicacion:
                input.published === true
                    ? new Date().toISOString()
                    : null,
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear la noticia: ${error.message}`,
        );
    }

    return data as unknown as News;
}

export async function updateNews(
    newsId: string,
    input: {
        title?: string;
        slug?: string;
        excerpt?: string | null;
        content?: string | null;
        image?: string | null;
        published?: boolean;
    },
): Promise<News> {
    await requireAdminContext();

    if (
        input.title ===
        undefined &&
        input.slug ===
        undefined &&
        input.excerpt ===
        undefined &&
        input.content ===
        undefined &&
        input.image ===
        undefined &&
        input.published ===
        undefined
    ) {
        throw new Error(
            "No hay cambios que guardar.",
        );
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("news")
        .update({
            ...(input.title !==
                undefined
                ? {
                    titulo:
                        input.title.trim(),
                }
                : {}),

            ...(input.slug !==
                undefined
                ? {
                    slug:
                        input.slug.trim(),
                }
                : {}),

            ...(input.excerpt !==
                undefined &&
                input.excerpt !==
                null
                ? {
                    excerpt:
                        input.excerpt,
                }
                : {}),

            ...(input.content !==
                undefined &&
                input.content !==
                null
                ? {
                    contenido:
                        input.content,
                }
                : {}),

            ...(input.image !==
                undefined
                ? {
                    imagen_destacada:
                        input.image,
                }
                : {}),

            ...(input.published !==
                undefined
                ? {
                    estado:
                        input.published
                            ? "publicado"
                            : "borrador",

                    fecha_publicacion:
                        input.published
                            ? new Date().toISOString()
                            : null,
                }
                : {}),
        })
        .eq(
            "id",
            newsId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar la noticia: ${error.message}`,
        );
    }

    return data as unknown as News;
}

/* -------------------------------------------------------------------------- */
/* SPONSORS                                                                   */
/* -------------------------------------------------------------------------- */

export async function getAdminSponsors(): Promise<
    Sponsor[]
> {
    await requireAdminContext();

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("sponsors")
        .select("*")
        .order(
            "orden",
            {
                ascending: true,
            },
        );

    if (error) {
        throw new Error(
            `No se pudieron obtener los patrocinadores: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as unknown as Sponsor[];
}

export async function createSponsor(
    input: {
        tournamentId: string;
        name: string;
        logo?: string | null;
        website?: string | null;
        tramo?: string | null;
        order?: number;
        active?: boolean;
    },
): Promise<Sponsor> {
    await requireAdminContext();

    const name =
        input.name.trim();

    if (!name) {
        throw new Error(
            "El nombre del patrocinador es obligatorio.",
        );
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("sponsors")
        .insert({
            tournament_id: input.tournamentId,
            nombre: name,

            logo_url:
                input.logo ??
                null,

            enlace:
                input.website ??
                null,

            tipo: "comercial",

            orden:
                input.order ??
                0,

            active:
                input.active !== false,
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear el patrocinador: ${error.message}`,
        );
    }

    return data as unknown as Sponsor;
}

/* -------------------------------------------------------------------------- */
/* PRIZES                                                                     */
/* -------------------------------------------------------------------------- */

export async function getAdminPrizes(
    tournamentId?: string,
): Promise<Prize[]> {
    await requireAdminContext();

    const supabase =
        await createClient();

    let query = supabase
        .from("premios")
        .select("*")
        .order(
            "created_at",
            {
                ascending: true,
            },
        );

    if (
        tournamentId
    ) {
        query = query.eq(
            "tournament_id",
            tournamentId,
        );
    }

    const {
        data,
        error,
    } = await query;

    if (error) {
        throw new Error(
            `No se pudieron obtener los premios: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as unknown as Prize[];
}

/* -------------------------------------------------------------------------- */
/* AUDIT LOG                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Writes a minimal administrative audit event.
 *
 * It intentionally does not contain passwords, tokens or payment
 * credentials.
 */
const AUDIT_ACTIONS: AuditAction[] = [
    "create",
    "update",
    "delete",
    "publish",
    "cancel",
    "login",
    "logout",
    "result_update",
    "category_change",
    "registration_update",
    "other",
];

function normalizeAuditAction(
    accion: string,
): AuditAction {
    return AUDIT_ACTIONS.includes(
        accion as AuditAction,
    )
        ? (accion as AuditAction)
        : "other";
}

export async function writeAdminAuditLog(
    entry: AdminAuditEntry,
): Promise<void> {
    const {
        userId,
    } = await requireAdminContext();

    const supabase =
        await createClient();

    const metadata =
        entry.metadata ??
        {};

    const {
        error,
    } = await supabase
        .from("audit_log")
        .insert({
            usuario_id:
                userId,

            accion:
                normalizeAuditAction(
                    entry.accion,
                ),

            entidad:
                entry.entityType,

            entidad_id:
                entry.entityId,

            metadata:
                metadata as Json,
        });

    if (error) {
        throw new Error(
            `No se pudo registrar la operación administrativa: ${error.message}`,
        );
    }
}

/* -------------------------------------------------------------------------- */
/* ADMIN HEALTH                                                               */
/* -------------------------------------------------------------------------- */

export async function getAdminSystemHealth() {
    await requireAdminContext();

    const supabase =
        await createClient();

    const checks: Record<
        string,
        boolean
    > = {};

    const {
        error:
        playersError,
    } = await supabase
        .from("players")
        .select(
            "id",
            {
                head: true,
                count: "exact",
            },
        );

    checks.players =
        !playersError;

    const {
        error:
        tournamentsError,
    } = await supabase
        .from("tournaments")
        .select(
            "id",
            {
                head: true,
                count: "exact",
            },
        );

    checks.tournaments =
        !tournamentsError;

    const {
        error:
        matchesError,
    } = await supabase
        .from("matches")
        .select(
            "id",
            {
                head: true,
                count: "exact",
            },
        );

    checks.matches =
        !matchesError;

    const {
        error:
        rankingError,
    } = await supabase
        .from("ranking_points")
        .select(
            "id",
            {
                head: true,
                count: "exact",
            },
        );

    checks.ranking =
        !rankingError;

    return {
        healthy:
            Object.values(
                checks,
            ).every(Boolean),

        checks,

        checkedAt:
            new Date().toISOString(),
    };
}