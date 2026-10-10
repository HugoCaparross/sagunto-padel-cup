import {
    getPlayerByAuthUserId,
} from "@/lib/services/players";

import {
    getUser,
} from "@/lib/supabase/server";

import {
    getSafeNextPath,
} from "@/lib/auth/safe-next-path";

export { getSafeNextPath } from "@/lib/auth/safe-next-path";

export type AuthDestination = string;

const AUTH_ONLY_PATHS = new Set([
    "/login",
    "/registro",
    "/registro/confirma",
    "/recuperar",
    "/restablecer",
    "/auth/callback",
    "/auth/continue",
]);

function getAllowedPostAuthPath(
    value: string | null | undefined,
): string | null {
    const safePath = getSafeNextPath(value ?? null);

    if (!safePath) {
        return null;
    }

    const pathname = safePath.split(/[?#]/, 1)[0];

    if (
        AUTH_ONLY_PATHS.has(pathname) ||
        pathname.startsWith("/auth/")
    ) {
        return null;
    }

    return safePath;
}

export async function getAuthenticatedContext() {
    const user = await getUser();

    if (!user) {
        return {
            user: null,
            player: null,
        };
    }

    const player = await getPlayerByAuthUserId(user.id);

    return {
        user,
        player,
    };
}

/**
 * Resolves a post-authentication destination using the authenticated
 * database role and onboarding state. A `next` parameter is only a
 * preference: it never grants access to an otherwise protected area.
 */
export async function getAuthenticatedDestination(
    requestedPath?: string | null,
): Promise<AuthDestination> {
    const { user, player } = await getAuthenticatedContext();

    if (!user) {
        return "/login";
    }

    const nextPath = getAllowedPostAuthPath(requestedPath);

    if (player?.role === "admin") {
        return (
            nextPath === "/admin" ||
            nextPath?.startsWith("/admin/") === true
        )
            ? nextPath
            : "/admin/torneos";
    }

    if (!player || !player.onboarding_completado) {
        return "/registro/confirma";
    }

    if (
        nextPath &&
        nextPath !== "/admin" &&
        !nextPath.startsWith("/admin/")
    ) {
        return nextPath;
    }

    return "/app/perfil";
}