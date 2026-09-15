// src/lib/services/tournaments.ts

import { createClient } from "@/lib/supabase/server";

import type {
    Category,
    Club,
    Json,
    Match,
    Season,
    Tournament,
    TournamentCategory,
} from "@/types/database";

import type {
    TournamentCategorySummary,
    TournamentSummary,
} from "@/types/tournament";

import {
    TOURNAMENT_STATES,
    TOURNAMENT_TYPES,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type TournamentType =
    | "regular"
    | "master";

export type TournamentWithRelations =
    Tournament & {
        season?: Season | null;
        club?: Club | null;
        categories?: TournamentCategory[];
    };

export type TournamentFilters = {
    seasonId?: string;
    estado?: Tournament["estado"];
    tournamentType?: TournamentType;
    categoryId?: string;
    clubId?: string;
    upcomingOnly?: boolean;
    search?: string;
};

export type CreateTournamentInput = {
    seasonId: string;

    name: string;
    slug: string;

    clubId: string;

    startDate: string;
    endDate: string;

    estado?: Tournament["estado"];
    tournamentType?: TournamentType;

    price?: string | null;
    description?: string | null;

    settings?: Json;
};

export type UpdateTournamentInput = {
    seasonId?: string;
    name?: string;
    slug?: string;
    clubId?: string;
    startDate?: string;
    endDate?: string;
    estado?: Tournament["estado"];
    tournamentType?: TournamentType;
    price?: string | null;
    description?: string | null;
    settings?: Json;
    isMaster?: boolean;
};

export type TournamentCategoryInput = {
    tournamentId: string;
    categoryId: string;

    minCapacity?: number | null;
    maxCapacity?: number | null;

    registrationOpen?: boolean;

    settings?: Json;
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function isValidDate(
    value: string,
): boolean {
    return Number.isFinite(
        new Date(value).getTime(),
    );
}

function validateDateRange(
    startDate: string,
    endDate: string,
): boolean {
    if (
        !isValidDate(startDate) ||
        !isValidDate(endDate)
    ) {
        return false;
    }

    return (
        new Date(endDate).getTime() >=
        new Date(startDate).getTime()
    );
}

function normalizeSlug(
    slug: string,
): string {
    return slug
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .replace(
            /[^a-z0-9]+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "");
}

function getTournamentType(
    tournament: Tournament,
): TournamentType {
    if (tournament.tournament_type === "master") {
        return "master";
    }

    const settings =
        isRecord(tournament.settings)
            ? tournament.settings
            : null;

    return settings?.tournament_type ===
        "master"
        ? "master"
        : "regular";
}

function isRecord(
    value: Json | null | undefined,
): value is Record<string, Json> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function buildTournamentSettings(
    input: {
        tournamentType?: TournamentType;
        settings?: Json;
    },
): Json {
    const base = isRecord(
        input.settings,
    )
        ? {
            ...input.settings,
        }
        : {};

    if (
        input.tournamentType !==
        undefined
    ) {
        base.tournament_type =
            input.tournamentType;
    }

    return base;
}

function validateCapacity(
    minCapacity?: number | null,
    maxCapacity?: number | null,
): string[] {
    const errors: string[] = [];

    if (
        minCapacity !== undefined &&
        minCapacity !== null &&
        (
            !Number.isInteger(
                minCapacity,
            ) ||
            minCapacity < 0
        )
    ) {
        errors.push(
            "La capacidad mínima no es válida.",
        );
    }

    if (
        maxCapacity !== undefined &&
        maxCapacity !== null &&
        (
            !Number.isInteger(
                maxCapacity,
            ) ||
            maxCapacity < 0
        )
    ) {
        errors.push(
            "La capacidad máxima no es válida.",
        );
    }

    if (
        minCapacity !== undefined &&
        minCapacity !== null &&
        maxCapacity !== undefined &&
        maxCapacity !== null &&
        minCapacity > maxCapacity
    ) {
        errors.push(
            "La capacidad mínima no puede superar la máxima.",
        );
    }

    return errors;
}

/* -------------------------------------------------------------------------- */
/* QUERY                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los torneos con temporada, club y configuración
 * de categorías.
 */
export async function getTournaments(
    filters: TournamentFilters = {},
): Promise<TournamentWithRelations[]> {
    const supabase =
        await createClient();

    let query = supabase
        .from("tournaments")
        .select(
            `
            *,
            season:seasons(*),
            club:clubs(*),
            categories:tournament_categories(*)
        `,
        )
        .order(
            "fecha_inicio",
            {
                ascending: true,
            },
        );

    if (filters.seasonId) {
        query = query.eq(
            "season_id",
            filters.seasonId,
        );
    }

    if (filters.estado) {
        query = query.eq(
            "estado",
            filters.estado,
        );
    }

    if (filters.clubId) {
        query = query.eq(
            "club_id",
            filters.clubId,
        );
    }

    if (filters.tournamentType) {
        query = query.eq(
            "tournament_type",
            filters.tournamentType,
        );
    }

    if (filters.categoryId) {
        query = query.eq(
            "tournament_categories.categoria_id",
            filters.categoryId,
        );
    }

    if (filters.search?.trim()) {
        query = query.ilike(
            "nombre",
            `%${filters.search.trim()}%`,
        );
    }

    if (filters.upcomingOnly) {
        const today =
            new Date()
                .toISOString()
                .slice(0, 10);

        query = query.gte(
            "fecha_inicio",
            today,
        );
    }

    const {
        data,
        error,
    } = await query;

    if (error) {
        throw new Error(
            `No se pudieron obtener los torneos: ${error.message}`,
        );
    }

    return (
        (data ?? []) as unknown as
        TournamentWithRelations[]
    );
}

/**
 * Obtiene un torneo mediante su slug público.
 */
export async function getTournamentBySlug(
    slug: string,
): Promise<TournamentWithRelations | null> {
    const normalizedSlug =
        normalizeSlug(slug);

    if (!normalizedSlug) {
        return null;
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("tournaments")
        .select(
            `
            *,
            season:seasons(*),
            club:clubs(*),
            categories:tournament_categories(*)
        `,
        )
        .eq(
            "slug",
            normalizedSlug,
        )
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo obtener el torneo: ${error.message}`,
        );
    }

    return (
        data as unknown as
        TournamentWithRelations | null
    );
}

/**
 * Obtiene un torneo por ID.
 */
export async function getTournamentById(
    tournamentId: string,
): Promise<TournamentWithRelations | null> {
    if (!tournamentId) {
        return null;
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("tournaments")
        .select(
            `
            *,
            season:seasons(*),
            club:clubs(*),
            categories:tournament_categories(*)
        `,
        )
        .eq(
            "id",
            tournamentId,
        )
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo obtener el torneo: ${error.message}`,
        );
    }

    return (
        data as unknown as
        TournamentWithRelations | null
    );
}

/* -------------------------------------------------------------------------- */
/* PUBLIC TOURNAMENTS                                                         */
/* -------------------------------------------------------------------------- */

export const PUBLIC_TOURNAMENT_STATES =
    [
        "publicado",
        "inscripciones_abiertas",
        "en_juego",
        "finalizado",
    ] as const;

export async function getPublicTournaments(
    filters: Omit<
        TournamentFilters,
        "estado"
    > = {},
): Promise<TournamentWithRelations[]> {
    const supabase =
        await createClient();

    let query = supabase
        .from("tournaments")
        .select(
            `
            *,
            season:seasons(*),
            club:clubs(*),
            categories:tournament_categories(*)
        `,
        )
        .in(
            "estado",
            [
                ...PUBLIC_TOURNAMENT_STATES,
            ],
        )
        .order(
            "fecha_inicio",
            {
                ascending: true,
            },
        );

    if (filters.seasonId) {
        query = query.eq(
            "season_id",
            filters.seasonId,
        );
    }

    if (filters.clubId) {
        query = query.eq(
            "club_id",
            filters.clubId,
        );
    }

    if (filters.tournamentType) {
        query = query.eq(
            "tournament_type",
            filters.tournamentType,
        );
    }

    if (filters.categoryId) {
        query = query.eq(
            "tournament_categories.categoria_id",
            filters.categoryId,
        );
    }

    if (filters.search?.trim()) {
        query = query.ilike(
            "nombre",
            `%${filters.search.trim()}%`,
        );
    }

    if (filters.upcomingOnly) {
        const today =
            new Date()
                .toISOString()
                .slice(0, 10);

        query = query.gte(
            "fecha_inicio",
            today,
        );
    }

    const {
        data,
        error,
    } = await query;

    if (error) {
        throw new Error(
            `No se pudieron obtener los torneos públicos: ${error.message}`,
        );
    }

    return (
        (data ?? []) as unknown as
        TournamentWithRelations[]
    );
}

/* -------------------------------------------------------------------------- */
/* UPCOMING / ACTIVE / FINISHED                                               */
/* -------------------------------------------------------------------------- */

export async function getUpcomingTournaments(
    seasonId?: string,
): Promise<TournamentWithRelations[]> {
    return getPublicTournaments({
        seasonId,
        upcomingOnly: true,
    });
}

export async function getOpenTournaments(
    seasonId?: string,
): Promise<TournamentWithRelations[]> {
    return getTournaments({
        seasonId,
        estado:
            "inscripciones_abiertas",
    });
}

export async function getLiveTournaments(
    seasonId?: string,
): Promise<TournamentWithRelations[]> {
    return getTournaments({
        seasonId,
        estado: "en_juego",
    });
}

export async function getFinishedTournaments(
    seasonId?: string,
): Promise<TournamentWithRelations[]> {
    return getTournaments({
        seasonId,
        estado: "finalizado",
    });
}

/* -------------------------------------------------------------------------- */
/* CREATION                                                                   */
/* -------------------------------------------------------------------------- */

export function validateCreateTournament(
    input: CreateTournamentInput,
): string[] {
    const errors: string[] = [];

    if (!input.seasonId?.trim()) {
        errors.push(
            "La temporada es obligatoria.",
        );
    }

    if (!input.name.trim()) {
        errors.push(
            "El nombre del torneo es obligatorio.",
        );
    }

    if (!input.slug.trim()) {
        errors.push(
            "El slug del torneo es obligatorio.",
        );
    }

    if (!input.clubId?.trim()) {
        errors.push(
            "El club es obligatorio.",
        );
    }

    if (
        !validateDateRange(
            input.startDate,
            input.endDate,
        )
    ) {
        errors.push(
            "El rango de fechas del torneo no es válido.",
        );
    }

    if (
        input.tournamentType !==
        undefined &&
        !TOURNAMENT_TYPES.includes(
            input.tournamentType,
        )
    ) {
        errors.push(
            "El tipo de torneo no es válido.",
        );
    }

    if (
        input.estado !== undefined &&
        !TOURNAMENT_STATES.includes(
            input.estado,
        )
    ) {
        errors.push(
            "El estado del torneo no es válido.",
        );
    }

    return errors;
}

export async function createTournament(
    input: CreateTournamentInput,
): Promise<Tournament> {
    const errors =
        validateCreateTournament(
            input,
        );

    if (errors.length > 0) {
        throw new Error(
            errors.join(" "),
        );
    }

    const tournamentType =
        input.tournamentType ??
        "regular";

    const supabase =
        await createClient();

    const payload = {
        season_id:
            input.seasonId.trim(),

        nombre:
            input.name.trim(),

        slug:
            normalizeSlug(
                input.slug,
            ),

        club_id:
            input.clubId.trim(),

        fecha_inicio:
            input.startDate,

        fecha_fin:
            input.endDate,

        estado:
            input.estado ??
            "borrador",

        precio_texto:
            input.price?.trim() ||
            null,

        descripcion:
            input.description?.trim() ||
            null,

        settings:
            buildTournamentSettings({
                tournamentType,
                settings:
                    input.settings,
            }),

        tournament_type:
            tournamentType,
    };

    const {
        data,
        error,
    } = await supabase
        .from("tournaments")
        .insert(payload)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear el torneo: ${error.message}`,
        );
    }

    return data as Tournament;
}

/* -------------------------------------------------------------------------- */
/* UPDATE                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateTournament(
    tournamentId: string,
    input: UpdateTournamentInput,
): Promise<Tournament> {
    if (!tournamentId) {
        throw new Error(
            "Falta tournamentId.",
        );
    }

    const current =
        await getTournamentById(
            tournamentId,
        );

    if (!current) {
        throw new Error(
            "El torneo no existe.",
        );
    }

    const startDate =
        input.startDate ??
        current.fecha_inicio;

    const endDate =
        input.endDate ??
        current.fecha_fin;

    if (
        !validateDateRange(
            startDate,
            endDate,
        )
    ) {
        throw new Error(
            "El rango de fechas del torneo no es válido.",
        );
    }

    if (
        input.estado !== undefined &&
        !TOURNAMENT_STATES.includes(
            input.estado,
        )
    ) {
        throw new Error(
            "El estado del torneo no es válido.",
        );
    }

    if (
        input.tournamentType !==
        undefined &&
        !TOURNAMENT_TYPES.includes(
            input.tournamentType,
        )
    ) {
        throw new Error(
            "El tipo de torneo no es válido.",
        );
    }

    const payload: {
        season_id?: string;
        nombre?: string;
        slug?: string;
        club_id?: string;
        fecha_inicio?: string;
        fecha_fin?: string;
        estado?: Tournament["estado"];
        precio_texto?: string | null;
        descripcion?: string | null;
        settings?: Json;
        tournament_type?: Tournament["tournament_type"];
    } = {};

    if (
        input.seasonId !==
        undefined
    ) {
        if (!input.seasonId.trim()) {
            throw new Error(
                "La temporada no puede estar vacía.",
            );
        }

        payload.season_id =
            input.seasonId.trim();
    }

    if (
        input.name !==
        undefined
    ) {
        const name =
            input.name.trim();

        if (!name) {
            throw new Error(
                "El nombre del torneo no puede estar vacío.",
            );
        }

        payload.nombre = name;
    }

    if (
        input.slug !==
        undefined
    ) {
        const slug =
            normalizeSlug(
                input.slug,
            );

        if (!slug) {
            throw new Error(
                "El slug del torneo no puede estar vacío.",
            );
        }

        payload.slug = slug;
    }

    if (
        input.clubId !==
        undefined
    ) {
        if (!input.clubId.trim()) {
            throw new Error(
                "El club no puede estar vacío.",
            );
        }

        payload.club_id =
            input.clubId.trim();
    }

    if (
        input.startDate !==
        undefined
    ) {
        payload.fecha_inicio =
            input.startDate;
    }

    if (
        input.endDate !==
        undefined
    ) {
        payload.fecha_fin =
            input.endDate;
    }

    if (
        input.estado !==
        undefined
    ) {
        payload.estado =
            input.estado;
    }

    if (
        input.price !==
        undefined
    ) {
        payload.precio_texto =
            input.price?.trim() ||
            null;
    }

    if (
        input.description !==
        undefined
    ) {
        payload.descripcion =
            input.description?.trim() ||
            null;
    }

    if (
        input.settings !==
        undefined
    ) {
        payload.settings =
            buildTournamentSettings({
                tournamentType:
                    input.tournamentType,
                settings:
                    input.settings,
            });
    } else if (
        input.tournamentType !==
        undefined
    ) {
        payload.settings =
            buildTournamentSettings({
                tournamentType:
                    input.tournamentType,
                settings:
                    current.settings,
            });
    }

    if (
        input.isMaster !==
        undefined
    ) {
        payload.tournament_type =
            input.isMaster ? "master" : "regular";
    } else if (
        input.tournamentType !==
        undefined
    ) {
        payload.tournament_type =
            input.tournamentType;
    }

    if (
        Object.keys(payload)
            .length === 0
    ) {
        return current;
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("tournaments")
        .update(payload)
        .eq(
            "id",
            tournamentId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar el torneo: ${error.message}`,
        );
    }

    return data as Tournament;
}

/* -------------------------------------------------------------------------- */
/* STATE TRANSITIONS                                                          */
/* -------------------------------------------------------------------------- */

const ALLOWED_STATE_TRANSITIONS:
    Record<
        Tournament["estado"],
        Tournament["estado"][]
    > = {
    borrador: [
        "publicado",
        "archivado",
    ],

    publicado: [
        "inscripciones_abiertas",
        "archivado",
    ],

    inscripciones_abiertas: [
        "en_juego",
        "archivado",
    ],

    en_juego: [
        "finalizado",
        "archivado",
    ],

    finalizado: [
        "archivado",
    ],

    archivado: [],
};

export function canTransitionTournamentState(
    from: Tournament["estado"],
    to: Tournament["estado"],
): boolean {
    if (from === to) {
        return true;
    }

    return ALLOWED_STATE_TRANSITIONS[
        from
    ].includes(to);
}

export async function updateTournamentState(
    tournamentId: string,
    estado: Tournament["estado"],
): Promise<Tournament> {
    if (!tournamentId) {
        throw new Error(
            "Falta tournamentId.",
        );
    }

    const tournament =
        await getTournamentById(
            tournamentId,
        );

    if (!tournament) {
        throw new Error(
            "El torneo no existe.",
        );
    }

    if (
        !canTransitionTournamentState(
            tournament.estado,
            estado,
        )
    ) {
        throw new Error(
            `No se puede cambiar el estado de ${tournament.estado} a ${estado}.`,
        );
    }

    return updateTournament(
        tournamentId,
        {
            estado,
        },
    );
}

/* -------------------------------------------------------------------------- */
/* TOURNAMENT CATEGORIES                                                      */
/* -------------------------------------------------------------------------- */

export async function getTournamentCategories(
    tournamentId: string,
): Promise<TournamentCategory[]> {
    if (!tournamentId) {
        return [];
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from(
            "tournament_categories",
        )
        .select("*")
        .eq(
            "tournament_id",
            tournamentId,
        )
        .order(
            "created_at",
            {
                ascending: true,
            },
        );

    if (error) {
        throw new Error(
            `No se pudieron obtener las categorías del torneo: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as TournamentCategory[];
}

export async function addTournamentCategory(
    input: TournamentCategoryInput,
): Promise<TournamentCategory> {
    if (
        !input.tournamentId ||
        !input.categoryId
    ) {
        throw new Error(
            "Torneo y categoría son obligatorios.",
        );
    }

    const capacityErrors =
        validateCapacity(
            input.minCapacity,
            input.maxCapacity,
        );

    if (capacityErrors.length > 0) {
        throw new Error(
            capacityErrors.join(" "),
        );
    }

    const supabase =
        await createClient();

    const payload = {
        tournament_id:
            input.tournamentId,

        categoria_id:
            input.categoryId,

        cupo_minimo:
            input.minCapacity ??
            null,

        cupo_maximo:
            input.maxCapacity ??
            null,

        enabled:
            input.registrationOpen ??
            true,

        settings:
            input.settings ??
            {},
    };

    const {
        data,
        error,
    } = await supabase
        .from(
            "tournament_categories",
        )
        .insert(payload)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo añadir la categoría al torneo: ${error.message}`,
        );
    }

    return data as TournamentCategory;
}

export type UpdateTournamentCategoryInput =
    Partial<
        Omit<
            TournamentCategoryInput,
            | "tournamentId"
            | "categoryId"
        >
    >;

export async function updateTournamentCategory(
    id: string,
    input: UpdateTournamentCategoryInput,
): Promise<TournamentCategory> {
    if (!id) {
        throw new Error(
            "Falta el identificador de la categoría del torneo.",
        );
    }

    const capacityErrors =
        validateCapacity(
            input.minCapacity,
            input.maxCapacity,
        );

    if (capacityErrors.length > 0) {
        throw new Error(
            capacityErrors.join(" "),
        );
    }

    const supabase =
        await createClient();

    const payload: {
        cupo_minimo?: number | null;
        cupo_maximo?: number | null;
        enabled?: boolean;
        settings?: Json;
    } = {};

    if (
        input.minCapacity !==
        undefined
    ) {
        payload.cupo_minimo =
            input.minCapacity;
    }

    if (
        input.maxCapacity !==
        undefined
    ) {
        payload.cupo_maximo =
            input.maxCapacity;
    }

    if (
        input.registrationOpen !==
        undefined
    ) {
        payload.enabled =
            input.registrationOpen;
    }

    if (
        input.settings !==
        undefined
    ) {
        payload.settings =
            input.settings;
    }

    if (
        Object.keys(payload)
            .length === 0
    ) {
        const {
            data,
            error,
        } = await supabase
            .from(
                "tournament_categories",
            )
            .select("*")
            .eq(
                "id",
                id,
            )
            .single();

        if (error) {
            throw new Error(
                `No se pudo obtener la categoría del torneo: ${error.message}`,
            );
        }

        return data as TournamentCategory;
    }

    const {
        data,
        error,
    } = await supabase
        .from(
            "tournament_categories",
        )
        .update(payload)
        .eq(
            "id",
            id,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar la categoría del torneo: ${error.message}`,
        );
    }

    return data as TournamentCategory;
}

export async function removeTournamentCategory(
    id: string,
): Promise<void> {
    if (!id) {
        throw new Error(
            "Falta el identificador de la categoría del torneo.",
        );
    }

    const supabase =
        await createClient();

    const {
        error,
    } = await supabase
        .from(
            "tournament_categories",
        )
        .delete()
        .eq(
            "id",
            id,
        );

    if (error) {
        throw new Error(
            `No se pudo eliminar la categoría del torneo: ${error.message}`,
        );
    }
}

/* -------------------------------------------------------------------------- */
/* TOURNAMENT SUMMARY                                                         */
/* -------------------------------------------------------------------------- */

export async function getTournamentSummary(
    tournamentId: string,
): Promise<TournamentSummary | null> {
    if (!tournamentId) {
        return null;
    }

    const supabase =
        await createClient();

    const {
        data: tournamentData,
        error: tournamentError,
    } = await supabase
        .from("tournaments")
        .select(
            `
            *,
            season:seasons(*),
            club:clubs(*)
        `,
        )
        .eq(
            "id",
            tournamentId,
        )
        .maybeSingle();

    if (tournamentError) {
        throw new Error(
            `No se pudo obtener el torneo: ${tournamentError.message}`,
        );
    }

    if (!tournamentData) {
        return null;
    }

    const tournament =
        tournamentData as unknown as
        Tournament & {
            season: Season | null;
            club: Club | null;
        };

    const [
        categoriesResult,
        pairsResult,
        registrationsResult,
        matchesResult,
    ] = await Promise.all([
        supabase
            .from(
                "tournament_categories",
            )
            .select(
                `
                *,
                category:categories(*)
            `,
            )
            .eq(
                "tournament_id",
                tournamentId,
            ),

        supabase
            .from("pairs")
            .select(
                "id, categoria_id, player_2_id, estado",
            )
            .eq(
                "tournament_id",
                tournamentId,
            ),

        supabase
            .from("registrations")
            .select(
                "id, pair_id, estado",
            )
            .eq(
                "tournament_id",
                tournamentId,
            ),

        supabase
            .from("matches")
            .select("*")
            .eq(
                "tournament_id",
                tournamentId,
            )
            .order(
                "hora_programada",
                {
                    ascending: true,
                    nullsFirst: false,
                },
            ),
    ]);

    if (categoriesResult.error) {
        throw new Error(
            `No se pudieron obtener las categorías del torneo: ${categoriesResult.error.message}`,
        );
    }

    if (pairsResult.error) {
        throw new Error(
            `No se pudieron obtener las parejas del torneo: ${pairsResult.error.message}`,
        );
    }

    if (registrationsResult.error) {
        throw new Error(
            `No se pudieron obtener las inscripciones del torneo: ${registrationsResult.error.message}`,
        );
    }

    if (matchesResult.error) {
        throw new Error(
            `No se pudieron obtener los partidos del torneo: ${matchesResult.error.message}`,
        );
    }

    type TournamentCategoryWithCategory =
        TournamentCategory & {
            category?: Category | null;
        };

    type TournamentPairSummary = {
        id: string;
        categoria_id: string;
        player_2_id: string | null;
        estado: string;
    };

    type TournamentRegistrationSummary = {
        id: string;
        pair_id: string | null;
        estado: string;
    };

    const categories =
        (categoriesResult.data ?? []) as unknown as
        TournamentCategoryWithCategory[];

    const pairs =
        (pairsResult.data ?? []) as unknown as
        TournamentPairSummary[];

    const registrations =
        (registrationsResult.data ?? []) as unknown as
        TournamentRegistrationSummary[];

    const matches =
        (matchesResult.data ?? []) as Match[];

    const confirmedPairs =
        registrations.filter(
            (registration) =>
                registration.estado ===
                "confirmada",
        );

    const pendingPaymentPairs =
        registrations.filter(
            (registration) =>
                registration.estado ===
                "pendiente_pago",
        );

    const waitingListPairs =
        registrations.filter(
            (registration) =>
                registration.estado ===
                "lista_espera",
        );

    /*
     * Una pareja incompleta es aquella que todavía no tiene
     * segundo jugador.
     *
     * No depende del estado de la inscripción porque una inscripción
     * puede seguir pendiente mientras se completa la pareja.
     */
    const incompletePairs =
        pairs.filter(
            (pair) =>
                pair.player_2_id ===
                null,
        );

    const completedMatches =
        matches.filter(
            (match) =>
                match.estado ===
                "finalizado",
        );

    const liveMatches =
        matches.filter(
            (match) =>
                match.estado ===
                "en_juego",
        );

    const pendingMatches =
        matches.filter(
            (match) =>
                match.estado ===
                "pendiente",
        );

    const nextMatch =
        matches.find(
            (match) =>
                (
                    match.estado ===
                    "pendiente"
                ) &&
                Boolean(
                    match.hora_programada,
                ),
        ) ?? null;

    const categorySummaries:
        TournamentCategorySummary[] =
        categories.map(
            (tournamentCategory) => {
                const categoryPairs =
                    pairs.filter(
                        (pair) =>
                            pair.categoria_id ===
                            tournamentCategory.categoria_id,
                    );

                const pairIds =
                    new Set(
                        categoryPairs.map(
                            (pair) =>
                                pair.id,
                        ),
                    );

                const categoryRegistrations =
                    registrations.filter(
                        (registration) =>
                            registration.pair_id !==
                            null &&
                            pairIds.has(
                                registration.pair_id,
                            ),
                    );

                const categoryMatches =
                    matches.filter(
                        (match) =>
                            match.categoria_id ===
                            tournamentCategory.categoria_id,
                    );

                return {
                    tournament_category:
                        tournamentCategory as unknown as TournamentCategory,

                    category:
                        tournamentCategory.category ??
                        null,

                    pair_count:
                        categoryPairs.length,

                    confirmed_pair_count:
                        categoryRegistrations.filter(
                            (registration) =>
                                registration.estado ===
                                "confirmada",
                        ).length,

                    completed_match_count:
                        categoryMatches.filter(
                            (match) =>
                                match.estado ===
                                "finalizado",
                        ).length,

                    pending_match_count:
                        categoryMatches.filter(
                            (match) =>
                                match.estado ===
                                "pendiente",
                        ).length,

                    live_match_count:
                        categoryMatches.filter(
                            (match) =>
                                match.estado ===
                                "en_juego",
                        ).length,
                };
            },
        );

    return {
        tournament:
            tournament as Tournament,

        season:
            tournament.season,

        club:
            tournament.club,

        categories:
            categorySummaries,

        total_pairs:
            pairs.length,

        confirmed_pairs:
            confirmedPairs.length,

        pending_payment_pairs:
            pendingPaymentPairs.length,

        waiting_list_pairs:
            waitingListPairs.length,

        incomplete_pairs:
            incompletePairs.length,

        completed_matches:
            completedMatches.length,

        pending_matches:
            pendingMatches.length,

        live_matches:
            liveMatches.length,

        next_match:
            nextMatch,
    };
}

/* -------------------------------------------------------------------------- */
/* DELETE / ARCHIVE                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Los torneos no se eliminan físicamente.
 *
 * El histórico debe conservarse porque los torneos participan en:
 * - ranking
 * - resultados
 * - estadísticas
 * - histórico de jugadores
 * - auditoría
 */
export async function archiveTournament(
    tournamentId: string,
): Promise<Tournament> {
    return updateTournamentState(
        tournamentId,
        "archivado",
    );
}

/**
 * La eliminación física no forma parte de las operaciones normales
 * de administración.
 */
export async function deleteTournament(
    _tournamentId: string,
): Promise<never> {
    throw new Error(
        "Los torneos no se eliminan físicamente. Deben archivarse para preservar el histórico.",
    );
}

/* -------------------------------------------------------------------------- */
/* UTILITY EXPORTS                                                            */
/* -------------------------------------------------------------------------- */

export function isMasterTournament(
    tournament: Tournament,
): boolean {
    return tournament.tournament_type;
}

export function getTournamentTypeLabel(
    tournament: Tournament,
): TournamentType {
    return getTournamentType(
        tournament,
    );
}