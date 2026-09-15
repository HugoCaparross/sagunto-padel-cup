// src/lib/services/players.ts

import { createClient } from "@/lib/supabase/server";

import type {
    Category,
    CategoryChange,
    CategoryChangeInsert,
    Player,
    PlayerInsert,
    PlayerUpdate,
} from "@/types/database";

import type {
    PlayerProfile,
    PlayerPublicProfile,
} from "@/types/player";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type PlayerFilters = {
    search?: string;
    categoryId?: string;
    estado?: Player["estado"];
    city?: string;
    role?: Player["role"];
    onboardingCompleted?: boolean;
    visibleOnly?: boolean;
};

export type PlayerWithCategory =
    Player & {
        category?: Category | null;
    };

export type PlayerStats = {
    playerId: string;
    tournamentsPlayed: number;
    tournamentsWon: number;
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
};

export type CreatePlayerInput = {
    authUserId?: string | null;

    name: string;
    surname: string;

    email: string;
    telefono?: string | null;

    foto_url?: string | null;

    currentCategoryId?: string | null;

    dominantHand?: Player["mano_dominante"];
    pala?: string | null;

    city?: string | null;
    instagram?: string | null;

    visibilidad_json?: Player["visibilidad_json"];

    role?: Player["role"];
    estado?: Player["estado"];

    onboardingCompleted?: boolean;
};

export type UpdatePlayerInput =
    Partial<CreatePlayerInput>;

export type PlayerCategoryChangeInput = {
    playerId: string;
    fromCategoryId?: string | null;
    toCategoryId: string;
    reason?: string | null;
};

export type PlayerCategoryChangeRequest = {
    playerId: string;
    toCategoryId: string;
    reason?: string | null;
};

export type PlayerVisibility = {
    profile?: boolean;
    telefono?: boolean;
    email?: boolean;
    instagram?: boolean;
    foto_url?: boolean;
};

/* -------------------------------------------------------------------------- */
/* INTERNAL TYPES                                                             */
/* -------------------------------------------------------------------------- */

type PlayerVisibilityObject =
    PlayerVisibility;

type MatchStatsRow = {
    id: string;
    pair_1_id: string | null;
    pair_2_id: string | null;
    estado: string;
    resultado_json: unknown;
};

type PlayerPairRow = {
    id: string;
};

type TournamentPairRow = {
    tournament_id: string;
};

type ChampionBracketRow = {
    tournament_id: string;
    campeon_pair_id: string | null;
};

/* -------------------------------------------------------------------------- */
/* NORMALIZATION                                                              */
/* -------------------------------------------------------------------------- */

function normalizeText(
    value?: string | null,
): string | null {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const normalized =
        value.trim();

    return normalized || null;
}

function normalizeInstagram(
    value?: string | null,
): string | null {
    const normalized =
        normalizeText(value);

    if (!normalized) {
        return null;
    }

    return normalized
        .replace(/^@/, "")
        .trim();
}

/**
 * Converts the Json privacy field into the object shape used by the
 * application.
 *
 * Player.visibilidad_json is intentionally stored as Json in the database model,
 * so accessing properties directly without narrowing is unsafe.
 */
function getPlayerVisibility(
    value: Player["visibilidad_json"],
): PlayerVisibilityObject {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return {};
    }

    const object =
        value as Record<
            string,
            unknown
        >;

    return {
        profile:
            typeof object.profile ===
                "boolean"
                ? object.profile
                : undefined,

        telefono:
            typeof object.telefono ===
                "boolean"
                ? object.telefono
                : undefined,

        email:
            typeof object.email ===
                "boolean"
                ? object.email
                : undefined,

        instagram:
            typeof object.instagram ===
                "boolean"
                ? object.instagram
                : undefined,

        foto_url:
            typeof object.foto_url ===
                "boolean"
                ? object.foto_url
                : undefined,
    };
}

/**
 * Converts the public visibilidad_json object into valid Json.
 */
function toVisibilityJson(
    visibilidad_json: PlayerVisibility,
): Player["visibilidad_json"] {
    return {
        profile:
            visibilidad_json.profile ?? true,

        telefono:
            visibilidad_json.telefono ?? false,

        email:
            visibilidad_json.email ?? false,

        instagram:
            visibilidad_json.instagram ?? true,

        foto_url:
            visibilidad_json.foto_url ?? true,
    };
}

/**
 * Safely converts unknown match resultado_json JSON into an object.
 */
function getResultObject(
    value: unknown,
): Record<string, unknown> | null {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return null;
    }

    return value as Record<
        string,
        unknown
    >;
}

/**
 * Reads a winner pair ID from the current MatchResult representation.
 *
 * The current contract uses winner_pair_id. The legacy camelCase property
 * is intentionally accepted when reading historical records so existing
 * tournament data does not break.
 */
function getWinnerPairId(
    resultado_json: unknown,
): string | null {
    const object =
        getResultObject(resultado_json);

    if (!object) {
        return null;
    }

    if (
        typeof object.winner_pair_id ===
        "string"
    ) {
        return object.winner_pair_id;
    }

    if (
        typeof object.winnerPairId ===
        "string"
    ) {
        return object.winnerPairId;
    }

    return null;
}

/**
 * Returns an array of JSON objects representing sets.
 */
function getSets(
    resultado_json: unknown,
): Array<Record<string, unknown>> {
    const object =
        getResultObject(resultado_json);

    if (!object) {
        return [];
    }

    if (!Array.isArray(object.sets)) {
        return [];
    }

    return object.sets.filter(
        (
            item,
        ): item is Record<
            string,
            unknown
        > =>
            Boolean(
                item &&
                typeof item ===
                "object" &&
                !Array.isArray(item),
            ),
    );
}

/**
 * Reads a score from either the current or legacy score representation.
 */
function getSetScore(
    set: Record<string, unknown>,
    keys: string[],
): number | null {
    for (const key of keys) {
        const value =
            set[key];

        if (
            typeof value ===
            "number" &&
            Number.isFinite(value)
        ) {
            return value;
        }

        if (
            typeof value ===
            "string" &&
            value.trim() !== ""
        ) {
            const parsed =
                Number(value);

            if (
                Number.isFinite(parsed)
            ) {
                return parsed;
            }
        }
    }

    return null;
}

/* -------------------------------------------------------------------------- */
/* BASIC QUERIES                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Returns players using the filters supplied by the caller.
 *
 * Public pages should normally use getPublicPlayers().
 * Admin pages can use this function with the appropriate RLS context.
 */
export async function getPlayers(
    filters: PlayerFilters = {},
): Promise<PlayerWithCategory[]> {
    const supabase =
        await createClient();

    let query = supabase
        .from("players")
        .select(
            `
                *,
                category:categories(*)
            `,
        )
        .order(
            "nombre",
            {
                ascending: true,
            },
        )
        .order(
            "apellidos",
            {
                ascending: true,
            },
        );

    if (filters.categoryId) {
        query = query.eq(
            "categoria_actual_id",
            filters.categoryId,
        );
    }

    if (filters.estado) {
        query = query.eq(
            "estado",
            filters.estado,
        );
    }

    if (filters.role) {
        query = query.eq(
            "role",
            filters.role,
        );
    }

    if (filters.city?.trim()) {
        query = query.ilike(
            "ciudad",
            `%${filters.city.trim()}%`,
        );
    }

    if (
        filters.onboardingCompleted !==
        undefined
    ) {
        query = query.eq(
            "onboarding_completado",
            filters.onboardingCompleted,
        );
    }

    if (filters.search?.trim()) {
        const search =
            filters.search.trim();

        query = query.or(
            [
                `nombre.ilike.%${search}%`,
                `apellidos.ilike.%${search}%`,
                `email.ilike.%${search}%`,
            ].join(","),
        );
    }

    const {
        data,
        error,
    } = await query;

    if (error) {
        throw new Error(
            `No se pudieron obtener los jugadores: ${error.message}`,
        );
    }

    let players =
        (data ?? []) as unknown as PlayerWithCategory[];

    if (filters.visibleOnly) {
        players =
            players.filter(
                (player) =>
                    getPlayerVisibility(
                        player.visibilidad_json,
                    ).profile !== false,
            );
    }

    return players;
}

/**
 * Returns a player by ID.
 */
export async function getPlayerById(
    playerId: string,
): Promise<PlayerWithCategory | null> {
    if (!playerId) {
        return null;
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("players")
        .select(
            `
                *,
                category:categories(*)
            `,
        )
        .eq(
            "id",
            playerId,
        )
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo obtener el jugador: ${error.message}`,
        );
    }

    return (
        data as unknown as
        PlayerWithCategory | null
    );
}

/**
 * Returns a player associated with a Supabase Auth user.
 */
export async function getPlayerByAuthUserId(
    authUserId: string,
): Promise<PlayerWithCategory | null> {
    if (!authUserId) {
        return null;
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("players")
        .select(
            `
                *,
                category:categories(*)
            `,
        )
        .eq(
            "auth_user_id",
            authUserId,
        )
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo obtener el jugador asociado al usuario: ${error.message}`,
        );
    }

    return (
        data as unknown as
        PlayerWithCategory | null
    );
}

/**
 * Returns a player by email.
 */
export async function getPlayerByEmail(
    email: string,
): Promise<PlayerWithCategory | null> {
    const normalizedEmail =
        email.trim().toLowerCase();

    if (!normalizedEmail) {
        return null;
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("players")
        .select(
            `
                *,
                category:categories(*)
            `,
        )
        .eq(
            "email",
            normalizedEmail,
        )
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo obtener el jugador por email: ${error.message}`,
        );
    }

    return (
        data as unknown as
        PlayerWithCategory | null
    );
}

/* -------------------------------------------------------------------------- */
/* PUBLIC PLAYERS                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Public player directory.
 *
 * A player is publicly discoverable only when the profile visibilidad_json flag
 * explicitly allows it.
 */
export async function getPublicPlayers(
    filters: Omit<
        PlayerFilters,
        "visibleOnly" | "estado"
    > = {},
): Promise<PlayerWithCategory[]> {
    return getPlayers({
        ...filters,
        visibleOnly: true,
        estado: "activo",
    });
}

/* -------------------------------------------------------------------------- */
/* PROFILE MAPPING                                                            */
/* -------------------------------------------------------------------------- */

export function toPlayerProfile(
    player: PlayerWithCategory,
): PlayerProfile {
    return {
        ...player,
        category:
            player.category ?? null,
    } as unknown as PlayerProfile;
}

/**
 * Converts a database player into the reduced public representation.
 *
 * Private contact data is never exposed through this mapper.
 */
export function toPublicPlayerProfile(
    player: PlayerWithCategory,
): PlayerPublicProfile {
    const visibilidad_json =
        getPlayerVisibility(
            player.visibilidad_json,
        );

    return {
        id: player.id,
        name: player.nombre,
        surname: player.apellidos ?? "",

        foto_url:
            visibilidad_json.foto_url === false
                ? null
                : player.foto_url,

        currentCategory:
            player.category ?? null,

        city: player.ciudad,

        instagram:
            visibilidad_json.instagram === false
                ? null
                : player.instagram,

        dominantHand:
            player.mano_dominante,

        pala:
            player.pala,
    } as unknown as PlayerPublicProfile;
}

/* -------------------------------------------------------------------------- */
/* CREATION                                                                   */
/* -------------------------------------------------------------------------- */

export function validateCreatePlayer(
    input: CreatePlayerInput,
): string[] {
    const errors: string[] = [];

    if (!input.name.trim()) {
        errors.push(
            "El nombre es obligatorio.",
        );
    }

    if (!input.surname.trim()) {
        errors.push(
            "Los apellidos son obligatorios.",
        );
    }

    if (!input.email.trim()) {
        errors.push(
            "El email es obligatorio.",
        );
    }

    if (
        input.email.trim() &&
        !input.email.includes("@")
    ) {
        errors.push(
            "El email no es válido.",
        );
    }

    return errors;
}

export async function createPlayer(
    input: CreatePlayerInput,
): Promise<Player> {
    const errors =
        validateCreatePlayer(input);

    if (errors.length > 0) {
        throw new Error(
            errors.join(" "),
        );
    }

    const visibilidad_json =
        input.visibilidad_json !== undefined
            ? getPlayerVisibility(
                input.visibilidad_json,
            )
            : {
                profile: true,
                telefono: false,
                email: false,
                instagram: true,
                foto_url: true,
            };

    const payload: PlayerInsert = {
        auth_user_id:
            input.authUserId ?? null,

        nombre:
            input.name.trim(),

        apellidos:
            input.surname.trim(),

        email:
            input.email
                .trim()
                .toLowerCase(),

        telefono:
            normalizeText(input.telefono),

        foto_url:
            normalizeText(input.foto_url),

        categoria_actual_id:
            input.currentCategoryId ??
            null,

        mano_dominante:
            input.dominantHand ?? null,

        pala:
            normalizeText(input.pala),

        ciudad:
            normalizeText(input.city),

        instagram:
            normalizeInstagram(
                input.instagram,
            ),

        visibilidad_json:
            toVisibilityJson(
                visibilidad_json,
            ),

        role:
            input.role ?? "player",

        estado:
            input.estado ?? "activo",

        onboarding_completado:
            input.onboardingCompleted ??
            false,
    };

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("players")
        .insert(payload)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear el jugador: ${error.message}`,
        );
    }

    return data as unknown as Player;
}

/* -------------------------------------------------------------------------- */
/* UPDATE                                                                     */
/* -------------------------------------------------------------------------- */

export async function updatePlayer(
    playerId: string,
    input: UpdatePlayerInput,
): Promise<Player> {
    if (!playerId) {
        throw new Error(
            "Falta playerId.",
        );
    }

    const payload: PlayerUpdate = {};

    if (
        input.authUserId !==
        undefined
    ) {
        payload.auth_user_id =
            input.authUserId;
    }

    if (
        input.name !==
        undefined
    ) {
        const name =
            input.name.trim();

        if (!name) {
            throw new Error(
                "El nombre no puede estar vacío.",
            );
        }

        payload.nombre = name;
    }

    if (
        input.surname !==
        undefined
    ) {
        const surname =
            input.surname.trim();

        if (!surname) {
            throw new Error(
                "Los apellidos no pueden estar vacíos.",
            );
        }

        payload.apellidos = surname;
    }

    if (
        input.email !==
        undefined
    ) {
        const email =
            input.email
                .trim()
                .toLowerCase();

        if (
            !email ||
            !email.includes("@")
        ) {
            throw new Error(
                "El email no es válido.",
            );
        }

        payload.email = email;
    }

    if (
        input.telefono !==
        undefined
    ) {
        payload.telefono =
            normalizeText(
                input.telefono,
            );
    }

    if (
        input.foto_url !==
        undefined
    ) {
        payload.foto_url =
            normalizeText(
                input.foto_url,
            );
    }

    if (
        input.currentCategoryId !==
        undefined
    ) {
        payload.categoria_actual_id =
            input.currentCategoryId;
    }

    if (
        input.dominantHand !==
        undefined
    ) {
        payload.mano_dominante =
            input.dominantHand;
    }

    if (
        input.pala !==
        undefined
    ) {
        payload.pala =
            normalizeText(
                input.pala,
            );
    }

    if (
        input.city !==
        undefined
    ) {
        payload.ciudad =
            normalizeText(
                input.city,
            );
    }

    if (
        input.instagram !==
        undefined
    ) {
        payload.instagram =
            normalizeInstagram(
                input.instagram,
            );
    }

    if (
        input.visibilidad_json !==
        undefined
    ) {
        payload.visibilidad_json =
            toVisibilityJson(
                getPlayerVisibility(
                    input.visibilidad_json,
                ),
            );
    }

    if (
        input.role !==
        undefined
    ) {
        payload.role =
            input.role;
    }

    if (
        input.estado !==
        undefined
    ) {
        payload.estado =
            input.estado;
    }

    if (
        input.onboardingCompleted !==
        undefined
    ) {
        payload.onboarding_completado =
            input.onboardingCompleted;
    }

    if (
        Object.keys(payload).length === 0
    ) {
        const existing =
            await getPlayerById(
                playerId,
            );

        if (!existing) {
            throw new Error(
                "El jugador no existe.",
            );
        }

        return existing;
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("players")
        .update(payload)
        .eq(
            "id",
            playerId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar el jugador: ${error.message}`,
        );
    }

    return data as unknown as Player;
}

/* -------------------------------------------------------------------------- */
/* VISIBILITY                                                                 */
/* -------------------------------------------------------------------------- */

export async function updatePlayerVisibility(
    playerId: string,
    visibilidad_json: PlayerVisibility,
): Promise<Player> {
    const current =
        await getPlayerById(
            playerId,
        );

    if (!current) {
        throw new Error(
            "El jugador no existe.",
        );
    }

    const currentVisibility =
        getPlayerVisibility(
            current.visibilidad_json,
        );

    const mergedVisibility: PlayerVisibility = {
        ...currentVisibility,
        ...visibilidad_json,
    };

    return updatePlayer(
        playerId,
        {
            visibilidad_json:
                toVisibilityJson(
                    mergedVisibility,
                ),
        },
    );
}

/* -------------------------------------------------------------------------- */
/* CATEGORY                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Changes the player's active category.
 *
 * Historical tournament results and ranking puntos_obtenidos are not modified.
 * The change applies to future competition.
 */
export async function changePlayerCategory(
    input: PlayerCategoryChangeInput,
): Promise<Player> {
    if (
        !input.playerId ||
        !input.toCategoryId
    ) {
        throw new Error(
            "Jugador y categoría destino son obligatorios.",
        );
    }

    const player =
        await getPlayerById(
            input.playerId,
        );

    if (!player) {
        throw new Error(
            "El jugador no existe.",
        );
    }

    const fromCategoryId =
        input.fromCategoryId ??
        player.categoria_actual_id;

    if (
        fromCategoryId ===
        input.toCategoryId
    ) {
        throw new Error(
            "La categoría destino debe ser diferente.",
        );
    }

    const supabase =
        await createClient();

    const historyPayload:
        CategoryChangeInsert = {
        player_id:
            input.playerId,

        categoria_anterior_id:
            fromCategoryId,

        categoria_nueva_id:
            input.toCategoryId,

        motivo:
            normalizeText(input.reason) ??
            "Cambio de categoría",

        status:
            "aprobada",

        fecha:
            new Date().toISOString(),
    };

    const {
        error:
        historyError,
    } = await supabase
        .from(
            "category_changes",
        )
        .insert(
            historyPayload,
        );

    if (historyError) {
        throw new Error(
            `No se pudo registrar el cambio de categoría: ${historyError.message}`,
        );
    }

    try {
        return await updatePlayer(
            input.playerId,
            {
                currentCategoryId:
                    input.toCategoryId,
            },
        );
    } catch (error) {
        /*
         * The database should eventually expose a transactional RPC for
         * this two-step operation. We deliberately propagate the error
         * instead of reporting a successful category change.
         */
        throw error;
    }
}

export async function getPlayerCategoryChanges(
    playerId: string,
): Promise<CategoryChange[]> {
    if (!playerId) {
        return [];
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from(
            "category_changes",
        )
        .select("*")
        .eq(
            "player_id",
            playerId,
        )
        .order(
            "created_at",
            {
                ascending: false,
            },
        );

    if (error) {
        throw new Error(
            `No se pudo obtener el histórico de categorías: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as unknown as CategoryChange[];
}

/* -------------------------------------------------------------------------- */
/* PLAYER STATUS                                                              */
/* -------------------------------------------------------------------------- */

export async function activatePlayer(
    playerId: string,
): Promise<Player> {
    return updatePlayer(
        playerId,
        {
            estado: "activo",
        },
    );
}

export async function deactivatePlayer(
    playerId: string,
): Promise<Player> {
    return updatePlayer(
        playerId,
        {
            estado: "baja",
        },
    );
}

/* -------------------------------------------------------------------------- */
/* ONBOARDING                                                                 */
/* -------------------------------------------------------------------------- */

export async function completePlayerOnboarding(
    playerId: string,
): Promise<Player> {
    return updatePlayer(
        playerId,
        {
            onboardingCompleted: true,
        },
    );
}

/* -------------------------------------------------------------------------- */
/* SEARCH                                                                     */
/* -------------------------------------------------------------------------- */

export async function searchPlayers(
    search: string,
    options: {
        categoryId?: string;
        limit?: number;
    } = {},
): Promise<PlayerWithCategory[]> {
    const term =
        search.trim();

    if (!term) {
        return [];
    }

    const limit =
        Number.isInteger(
            options.limit,
        ) &&
            (options.limit ?? 0) > 0
            ? Math.min(
                options.limit ?? 20,
                100,
            )
            : 20;

    const supabase =
        await createClient();

    let query = supabase
        .from("players")
        .select(
            `
                *,
                category:categories(*)
            `,
        )
        .eq(
            "estado",
            "activo",
        )
        .or(
            [
                `nombre.ilike.%${term}%`,
                `apellidos.ilike.%${term}%`,
                `email.ilike.%${term}%`,
            ].join(","),
        )
        .order(
            "nombre",
            {
                ascending: true,
            },
        )
        .order(
            "apellidos",
            {
                ascending: true,
            },
        )
        .limit(limit);

    if (options.categoryId) {
        query = query.eq(
            "categoria_actual_id",
            options.categoryId,
        );
    }

    const {
        data,
        error,
    } = await query;

    if (error) {
        throw new Error(
            `No se pudieron buscar jugadores: ${error.message}`,
        );
    }

    return (
        (data ?? []) as unknown as PlayerWithCategory[]
    );
}

/* -------------------------------------------------------------------------- */
/* PLAYER STATISTICS                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Returns statistics calculated from completed matches.
 *
 * Ranking puntos_obtenidos are deliberately not calculated here. Ranking is a
 * separate domain handled by competition/ranking.ts and services/ranking.ts.
 */
export async function getPlayerStats(
    playerId: string,
): Promise<PlayerStats> {
    if (!playerId) {
        throw new Error(
            "Falta playerId.",
        );
    }

    const supabase =
        await createClient();

    /*
     * First retrieve all pairs belonging to this player.
     */
    const {
        data:
        rawPairs,
        error:
        pairsError,
    } = await supabase
        .from("pairs")
        .select("id")
        .or(
            [
                `player_1_id.eq.${playerId}`,
                `player_2_id.eq.${playerId}`,
            ].join(","),
        );

    if (pairsError) {
        throw new Error(
            `No se pudieron obtener las parejas del jugador: ${pairsError.message}`,
        );
    }

    const pairs =
        (rawPairs ??
            []) as unknown as PlayerPairRow[];

    const pairIds =
        new Set<string>(
            pairs.map(
                (pair) =>
                    pair.id,
            ),
        );

    if (pairIds.size === 0) {
        return {
            playerId,
            tournamentsPlayed: 0,
            tournamentsWon: 0,
            matchesPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
            setsWon: 0,
            setsLost: 0,
            gamesWon: 0,
            gamesLost: 0,
        };
    }

    /*
     * Retrieve completed matches.
     */
    const {
        data:
        rawMatches,
        error:
        matchesError,
    } = await supabase
        .from("matches")
        .select(
            `
                id,
                pair_1_id,
                pair_2_id,
                estado,
                resultado_json
            `,
        )
        .eq(
            "estado",
            "finalizado",
        );

    if (matchesError) {
        throw new Error(
            `No se pudieron obtener los partidos del jugador: ${matchesError.message}`,
        );
    }

    const matches =
        (rawMatches ??
            []) as unknown as MatchStatsRow[];

    const playerMatches =
        matches.filter(
            (match) =>
                (
                    match.pair_1_id !== null &&
                    pairIds.has(
                        match.pair_1_id,
                    )
                ) ||
                (
                    match.pair_2_id !== null &&
                    pairIds.has(
                        match.pair_2_id,
                    )
                ),
        );

    let matchesWon = 0;
    let matchesLost = 0;

    let setsWon = 0;
    let setsLost = 0;

    let gamesWon = 0;
    let gamesLost = 0;

    for (
        const match of playerMatches
    ) {
        const winnerPairId =
            getWinnerPairId(
                match.resultado_json,
            );

        const playerPairId =
            match.pair_1_id !== null &&
                pairIds.has(
                    match.pair_1_id,
                )
                ? match.pair_1_id
                : match.pair_2_id;

        if (
            playerPairId &&
            winnerPairId ===
            playerPairId
        ) {
            matchesWon += 1;
        } else if (
            playerPairId &&
            winnerPairId
        ) {
            matchesLost += 1;
        }

        const sets =
            getSets(
                match.resultado_json,
            );

        const playerIsPair1 =
            playerPairId ===
            match.pair_1_id;

        for (
            const set of sets
        ) {
            const score1 =
                getSetScore(
                    set,
                    [
                        "score1",
                        "pair1",
                        "pair1_score",
                    ],
                );

            const score2 =
                getSetScore(
                    set,
                    [
                        "score2",
                        "pair2",
                        "pair2_score",
                    ],
                );

            if (
                score1 === null ||
                score2 === null
            ) {
                continue;
            }

            const playerScore =
                playerIsPair1
                    ? score1
                    : score2;

            const opponentScore =
                playerIsPair1
                    ? score2
                    : score1;

            gamesWon +=
                playerScore;

            gamesLost +=
                opponentScore;

            if (
                playerScore >
                opponentScore
            ) {
                setsWon += 1;
            } else if (
                opponentScore >
                playerScore
            ) {
                setsLost += 1;
            }
        }
    }

    /*
     * Retrieve tournaments in which the player has participated.
     */
    const {
        data:
        rawTournamentPairs,
        error:
        tournamentPairsError,
    } = await supabase
        .from("pairs")
        .select("tournament_id")
        .or(
            [
                `player_1_id.eq.${playerId}`,
                `player_2_id.eq.${playerId}`,
            ].join(","),
        );

    if (tournamentPairsError) {
        throw new Error(
            `No se pudieron obtener los torneos del jugador: ${tournamentPairsError.message}`,
        );
    }

    const tournamentPairs =
        (rawTournamentPairs ??
            []) as unknown as TournamentPairRow[];

    const tournamentIds =
        new Set<string>(
            tournamentPairs
                .map(
                    (pair) =>
                        pair.tournament_id,
                )
                .filter(
                    (
                        id,
                    ): id is string =>
                        typeof id ===
                        "string" &&
                        id.length > 0,
                ),
        );

    let tournamentsWon = 0;

    if (tournamentIds.size > 0) {
        const {
            data:
            rawBrackets,
            error:
            bracketsError,
        } = await supabase
            .from("brackets")
            .select(
                "tournament_id, campeon_pair_id",
            )
            .in(
                "tournament_id",
                Array.from(
                    tournamentIds,
                ),
            );

        if (bracketsError) {
            throw new Error(
                `No se pudieron obtener los campeonatos del jugador: ${bracketsError.message}`,
            );
        }

        const brackets =
            (rawBrackets ??
                []) as unknown as ChampionBracketRow[];

        const wonTournamentIds =
            new Set<string>();

        for (
            const bracket of brackets
        ) {
            if (
                bracket.campeon_pair_id &&
                pairIds.has(
                    bracket.campeon_pair_id,
                )
            ) {
                wonTournamentIds.add(
                    bracket.tournament_id,
                );
            }
        }

        tournamentsWon =
            wonTournamentIds.size;
    }

    return {
        playerId,

        tournamentsPlayed:
            tournamentIds.size,

        tournamentsWon,

        matchesPlayed:
            matchesWon +
            matchesLost,

        matchesWon,
        matchesLost,

        setsWon,
        setsLost,

        gamesWon,
        gamesLost,
    };
}

/* -------------------------------------------------------------------------- */
/* ADMIN HELPERS                                                              */
/* -------------------------------------------------------------------------- */

export async function getPlayerCount(
    filters: PlayerFilters = {},
): Promise<number> {
    const players =
        await getPlayers(
            filters,
        );

    return players.length;
}

export async function getActivePlayerCount(): Promise<number> {
    return getPlayerCount({
        estado: "activo",
    });
}

/**
 * Admin operation for changing the player's role.
 *
 * RLS and requireAdmin() must protect the caller.
 */
export async function updatePlayerRole(
    playerId: string,
    role: Player["role"],
): Promise<Player> {
    if (
        role !== "player" &&
        role !== "admin"
    ) {
        throw new Error(
            "Rol de jugador no válido.",
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
/* CATEGORY CHANGE REQUEST                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Creates a category change request without directly changing the active
 * category. The organizer can approve it later.
 */
export async function requestCategoryChange(
    request: PlayerCategoryChangeRequest,
): Promise<CategoryChange> {
    if (
        !request.playerId ||
        !request.toCategoryId
    ) {
        throw new Error(
            "Jugador y categoría solicitada son obligatorios.",
        );
    }

    const player =
        await getPlayerById(
            request.playerId,
        );

    if (!player) {
        throw new Error(
            "El jugador no existe.",
        );
    }

    if (
        player.categoria_actual_id ===
        request.toCategoryId
    ) {
        throw new Error(
            "El jugador ya pertenece a esa categoría.",
        );
    }

    const payload:
        CategoryChangeInsert = {
        player_id:
            request.playerId,

        categoria_anterior_id:
            player.categoria_actual_id,

        categoria_nueva_id:
            request.toCategoryId,

        motivo:
            normalizeText(request.reason) ??
            "Solicitud de cambio de categoría",

        status:
            "pendiente",

        requested_at:
            new Date().toISOString(),

        reviewed_at:
            null,

        confirmado_por:
            null,
    };

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from(
            "category_changes",
        )
        .insert(payload)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear la solicitud de cambio de categoría: ${error.message}`,
        );
    }

    return data as unknown as CategoryChange;
}

/* -------------------------------------------------------------------------- */
/* ADMIN CATEGORY CHANGE APPROVAL                                             */
/* -------------------------------------------------------------------------- */

export async function approveCategoryChange(
    changeId: string,
): Promise<Player> {
    if (!changeId) {
        throw new Error(
            "Falta changeId.",
        );
    }

    const supabase =
        await createClient();

    const {
        data:
        rawChange,
        error:
        changeError,
    } = await supabase
        .from(
            "category_changes",
        )
        .select("*")
        .eq(
            "id",
            changeId,
        )
        .single();

    if (changeError) {
        throw new Error(
            `No se pudo obtener el cambio de categoría: ${changeError.message}`,
        );
    }

    const categoryChange =
        rawChange as unknown as CategoryChange;

    if (
        categoryChange.status ===
        "aprobado"
    ) {
        const player =
            await getPlayerById(
                categoryChange.player_id,
            );

        if (!player) {
            throw new Error(
                "El jugador no existe.",
            );
        }

        return player;
    }

    if (
        categoryChange.status ===
        "rechazado"
    ) {
        throw new Error(
            "La solicitud de cambio de categoría ya fue rechazada.",
        );
    }

    const player =
        await getPlayerById(
            categoryChange.player_id,
        );

    if (!player) {
        throw new Error(
            "El jugador no existe.",
        );
    }

    const {
        error:
        playerError,
    } = await supabase
        .from("players")
        .update({
            categoria_actual_id:
                categoryChange.categoria_nueva_id,
        } satisfies PlayerUpdate)
        .eq(
            "id",
            categoryChange.player_id,
        );

    if (playerError) {
        throw new Error(
            `No se pudo actualizar la categoría del jugador: ${playerError.message}`,
        );
    }

    const {
        data:
        updatedChange,
        error:
        updateChangeError,
    } = await supabase
        .from(
            "category_changes",
        )
        .update({
            status:
                "aprobada",

            fecha:
                new Date().toISOString(),
        } satisfies Partial<CategoryChangeInsert>)
        .eq(
            "id",
            changeId,
        )
        .select("*")
        .single();

    if (updateChangeError) {
        throw new Error(
            `La categoría se actualizó, pero no se pudo cerrar la solicitud: ${updateChangeError.message}`,
        );
    }

    void updatedChange;

    const updatedPlayer =
        await getPlayerById(
            categoryChange.player_id,
        );

    if (!updatedPlayer) {
        throw new Error(
            "No se pudo recuperar el jugador actualizado.",
        );
    }

    return updatedPlayer;
}

/* -------------------------------------------------------------------------- */
/* SAFE PUBLIC FIELDS                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Returns only fields that can safely be used in public player cards.
 */
export function getPublicPlayerFields(
    player: PlayerWithCategory,
) {
    const visibilidad_json =
        getPlayerVisibility(
            player.visibilidad_json,
        );

    return {
        id: player.id,

        name: player.nombre,

        surname:
            player.apellidos,

        foto_url:
            visibilidad_json.foto_url === false
                ? null
                : player.foto_url,

        city:
            player.ciudad,

        instagram:
            visibilidad_json.instagram === false
                ? null
                : player.instagram,

        category:
            player.category ?? null,
    };
}