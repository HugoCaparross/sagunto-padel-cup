import {
    getPlayerByAuthUserId,
} from "@/lib/services/players";

import {
    getUser,
} from "@/lib/supabase/server";

export type AuthDestination =
    | "/login"
    | "/registro/confirma"
    | "/app/perfil";

export async function getAuthenticatedContext() {
    const user =
        await getUser();

    if (!user) {
        return {
            user: null,
            player: null,
        };
    }

    const player =
        await getPlayerByAuthUserId(
            user.id,
        );

    return {
        user,
        player,
    };
}

export async function getAuthenticatedDestination(): Promise<AuthDestination> {
    const {
        user,
        player,
    } =
        await getAuthenticatedContext();

    if (!user) {
        return "/login";
    }

    if (
        !player ||
        !player.onboarding_completado
    ) {
        return "/registro/confirma";
    }

    return "/app/perfil";
}

export function getSafeNextPath(
    value: string | null,
): string | null {
    if (!value) {
        return null;
    }

    if (!value.startsWith("/")) {
        return null;
    }

    if (value.startsWith("//")) {
        return null;
    }

    return value;
}