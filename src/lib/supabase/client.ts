/**
 * Supabase browser client
 * Sagunto Padel Cup
 *
 * Este cliente se utiliza exclusivamente en código que se ejecuta
 * en el navegador.
 *
 * IMPORTANTE:
 * - Nunca utilizar SUPABASE_SERVICE_ROLE_KEY aquí.
 * - Las operaciones quedan protegidas por RLS.
 * - Las operaciones administrativas deben realizarse mediante
 *   Server Actions / Route Handlers / Server Components.
 */

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

// =============================================================================
// ENVIRONMENT
// =============================================================================

function getSupabaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!url) {
        throw new Error(
            "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL.",
        );
    }

    return url;
}

function getSupabaseAnonKey(): string {
    const key =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!key) {
        throw new Error(
            "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        );
    }

    return key;
}

// =============================================================================
// CLIENT
// =============================================================================

let browserClient:
    | ReturnType<typeof createBrowserClient<Database>>
    | undefined;

/**
 * Devuelve el cliente Supabase para navegador.
 *
 * Se mantiene una única instancia durante el ciclo de vida
 * de la aplicación para evitar crear múltiples clientes
 * innecesariamente.
 */
export function createClient() {
    if (browserClient) {
        return browserClient;
    }

    browserClient = createBrowserClient<Database>(
        getSupabaseUrl(),
        getSupabaseAnonKey(),
        {
            auth: {
                persistSession: true,

                autoRefreshToken: true,

                detectSessionInUrl: true,
            },

            global: {
                headers: {
                    "x-application-name": "sagunto-padel-cup",
                },
            },
        },
    );

    return browserClient;
}

// =============================================================================
// AUTH HELPERS
// =============================================================================

/**
 * Obtiene la sesión actual en el navegador.
 *
 * Para autorización sensible no se debe confiar únicamente
 * en este helper: el servidor debe volver a validar la sesión.
 */
export async function getBrowserSession() {
    const supabase = createClient();

    const {
        data,
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    return data.session;
}

/**
 * Obtiene el usuario autenticado actualmente.
 */
export async function getBrowserUser() {
    const supabase = createClient();

    const {
        data,
        error,
    } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    return data.user;
}

// =============================================================================
// SIGN OUT
// =============================================================================

export async function signOut() {
    const supabase = createClient();

    const {
        error,
    } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }
}

// =============================================================================
// AUTH STATE
// =============================================================================

export function onAuthStateChange(
    callback: (
        event: string,
        session: Awaited<
            ReturnType<
                ReturnType<typeof createClient>["auth"]["getSession"]
            >
        >["data"]["session"],
    ) => void,
) {
    const supabase = createClient();

    return supabase.auth.onAuthStateChange(
        callback,
    );
}

// =============================================================================
// PROFILE
// =============================================================================

/**
 * Obtiene el perfil SPC asociado al usuario autenticado.
 *
 * La relación se realiza mediante auth_user_id.
 */
export async function getCurrentPlayerProfile() {
    const supabase = createClient();

    const user = await getBrowserUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error,
    } = await supabase
        .from("players")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

// =============================================================================
// CURRENT PLAYER
// =============================================================================

/**
 * Alias semántico para componentes del área privada.
 */
export async function getCurrentPlayer() {
    return getCurrentPlayerProfile();
}

// =============================================================================
// TOURNAMENTS
// =============================================================================

export async function getPublishedTournaments() {
    const supabase = createClient();

    const {
        data,
        error,
    } = await supabase
        .from("tournaments")
        .select("*")
        .in("estado", [
            "publicado",
            "inscripciones_abiertas",
            "en_juego",
            "finalizado",
        ])
        .order("start_date", {
            ascending: false,
        });

    if (error) {
        throw error;
    }

    return data;
}

export async function getTournamentBySlug(
    slug: string,
) {
    const supabase = createClient();

    const {
        data,
        error,
    } = await supabase
        .from("tournaments")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

// =============================================================================
// RANKING
// =============================================================================

export async function getRankingSnapshots(
    seasonId: string,
    categoryId: string,
) {
    const supabase = createClient();

    const {
        data,
        error,
    } = await supabase
        .from("ranking_snapshots")
        .select("*")
        .eq("season_id", seasonId)
        .eq("categoria_id", categoryId)
        .order("posicion", {
            ascending: true,
        });

    if (error) {
        throw error;
    }

    return data;
}

// =============================================================================
// MATCHES
// =============================================================================

export async function getTournamentMatches(
    tournamentId: string,
) {
    const supabase = createClient();

    const {
        data,
        error,
    } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("hora_programada", {
            ascending: true,
            nullsFirst: false,
        });

    if (error) {
        throw error;
    }

    return data;
}

// =============================================================================
// REALTIME
// =============================================================================

/**
 * Suscribe el cliente a cambios de partidos de un torneo.
 *
 * Especialmente útil para:
 * - Ahora mismo
 * - pistas
 * - partidos en directo
 * - cambios de horarios
 * - resultados
 */
export function subscribeToTournamentMatches(
    tournamentId: string,
    callback: (payload: unknown) => void,
) {
    const supabase = createClient();

    const channel = supabase
        .channel(
            `tournament:${tournamentId}:matches`,
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "matches",
                filter: `tournament_id=eq.${tournamentId}`,
            },
            callback,
        )
        .subscribe();

    return channel;
}

export async function unsubscribeFromTournamentMatches(
    channel: ReturnType<
        ReturnType<typeof createClient>["channel"]
    >,
) {
    const supabase = createClient();

    await supabase.removeChannel(channel);
}

// =============================================================================
// REALTIME — REGISTRATIONS
// =============================================================================

export function subscribeToTournamentRegistrations(
    tournamentId: string,
    callback: (payload: unknown) => void,
) {
    const supabase = createClient();

    const channel = supabase
        .channel(
            `tournament:${tournamentId}:registrations`,
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "registrations",
                filter: `tournament_id=eq.${tournamentId}`,
            },
            callback as never,
        )
        .subscribe();

    return channel;
}

// =============================================================================
// REALTIME — RANKING
// =============================================================================

export function subscribeToRanking(
    seasonId: string,
    categoryId: string,
    callback: (payload: unknown) => void,
) {
    const supabase = createClient();

    const channel = supabase
        .channel(
            `ranking:${seasonId}:${categoryId}`,
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "ranking_snapshots",
                filter: `season_id=eq.${seasonId}`,
            },
            callback as never,
        )
        .subscribe();

    return channel;
}

// =============================================================================
// STORAGE
// =============================================================================

export function getGalleryBucket() {
    const supabase = createClient();

    return supabase.storage.from(
        "gallery",
    );
}

export function getPublicAssetsBucket() {
    const supabase = createClient();

    return supabase.storage.from(
        "public",
    );
}

// =============================================================================
// ERROR HELPERS
// =============================================================================

export function isSupabaseAuthError(
    error: unknown,
): boolean {
    if (!error) {
        return false;
    }

    if (
        typeof error === "object" &&
        "estado" in error
    ) {
        const estado = (
            error as {
                estado?: number;
            }
        ).estado;

        return (
            estado === 401 ||
            estado === 403
        );
    }

    return false;
}

export function getSupabaseErrorMessage(
    error: unknown,
): string {
    if (
        error &&
        typeof error === "object" &&
        "message" in error
    ) {
        const message = (
            error as {
                message?: string;
            }
        ).message;

        if (message) {
            return message;
        }
    }

    return "Se ha producido un error inesperado.";
}