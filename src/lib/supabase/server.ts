// src/lib/supabase/server.ts

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Validates the public Supabase configuration.
 *
 * This client must only use the anon/publishable key.
 * Never use SUPABASE_SERVICE_ROLE_KEY in this module.
 */
function getSupabaseConfig() {
    if (!SUPABASE_URL) {
        throw new Error(
            "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL",
        );
    }

    if (!SUPABASE_ANON_KEY) {
        throw new Error(
            "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY",
        );
    }

    return {
        url: SUPABASE_URL,
        key: SUPABASE_ANON_KEY,
    };
}

/**
 * Creates a Supabase client for Server Components, Server Actions,
 * Route Handlers and other server-side App Router contexts.
 *
 * Supabase Auth stores the session in cookies. The cookie adapter below
 * reads all cookies and writes authentication changes back when the
 * current server context allows it.
 */
export async function createClient() {
    const { url, key } = getSupabaseConfig();
    const cookieStore = await cookies();

    return createServerClient<Database>(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },

            setAll(cookiesToSet) {
                try {
                    for (const {
                        name,
                        value,
                        options,
                    } of cookiesToSet) {
                        cookieStore.set(name, value, options);
                    }
                } catch {
                    /**
                     * Server Components can read cookies but may not be allowed
                     * to mutate them.
                     *
                     * Authentication cookie refreshes are handled by the
                     * middleware/proxy layer, so this is intentionally ignored
                     * in contexts where cookies are read-only.
                     */
                }
            },
        },
    });
}

/**
 * Returns the currently authenticated Supabase user.
 *
 * `auth.getUser()` performs a server-side authenticated request and
 * should be preferred over reading the user directly from an untrusted
 * session payload.
 */
export async function getUser() {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        return null;
    }

    return user;
}

/**
 * Returns the current authenticated session.
 *
 * Useful when the application explicitly needs session information
 * such as access_token or expires_at.
 *
 * For authorization decisions, prefer getUser().
 */
export async function getSession() {
    const supabase = await createClient();

    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        return null;
    }

    return session;
}

/**
 * Returns the authenticated user together with their application profile.
 *
 * The profile is intentionally queried from `public.profiles` rather
 * than relying exclusively on Auth metadata.
 */
export async function getCurrentUserWithProfile() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            user: null,
            profile: null,
        };
    }

    const { data: profile, error: profileError } = await supabase
        .from("players")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (profileError) {
        return {
            user,
            profile: null,
        };
    }

    return {
        user,
        profile,
    };
}

/**
 * Requires an authenticated user.
 *
 * Throws a controlled error when the request is unauthenticated.
 * This is useful in Server Actions and protected server-side logic.
 */
export async function requireUser() {
    const user = await getUser();

    if (!user) {
        throw new Error("AUTHENTICATION_REQUIRED");
    }

    return user;
}

/**
 * Requires an authenticated player profile.
 *
 * Unlike `requireUser()`, this also verifies that the authenticated
 * account has an associated application-level player record.
 */
export async function requirePlayer() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("AUTHENTICATION_REQUIRED");
    }

    const { data: player, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (playerError || !player) {
        throw new Error("PLAYER_PROFILE_REQUIRED");
    }

    return {
        user,
        player,
    };
}

/**
 * Requires an authenticated administrator.
 *
 * Authorization is checked against the application-level `players.role`
 * field. RLS remains the final security boundary at database level.
 */
export async function requireAdmin() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("AUTHENTICATION_REQUIRED");
    }

    const { data: player, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (playerError || !player) {
        throw new Error("PLAYER_PROFILE_REQUIRED");
    }

    if (player.role !== "admin") {
        throw new Error("ADMIN_ACCESS_REQUIRED");
    }

    return {
        user,
        player,
    };
}

/**
 * Checks whether the current authenticated account is an administrator.
 *
 * Unlike requireAdmin(), this never throws for normal unauthenticated
 * or unauthorized requests.
 */
export async function isAdmin() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { data: player } = await supabase
        .from("players")
        .select("role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    return player?.role === "admin";
}

/**
 * Retrieves the current player's database record.
 *
 * Returns null when the account is authenticated but has not yet
 * completed the player profile.
 */
export async function getCurrentPlayer() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data: player, error } = await supabase
        .from("players")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (error) {
        return null;
    }

    return player;
}

/**
 * Signs out the current authenticated user.
 *
 * The Supabase SSR client takes care of updating the auth cookies.
 */
export async function signOut() {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Centralized helper for Supabase errors.
 *
 * Keeps raw database/client errors from leaking unnecessarily into
 * application-level UI.
 */
export function getSupabaseErrorMessage(
    error: unknown,
    fallback = "Ha ocurrido un error inesperado.",
) {
    if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }

    return fallback;
}