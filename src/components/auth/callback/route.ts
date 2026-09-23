import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getLoginUrl(
    requestUrl: string,
    errorCode?: string,
) {
    const url =
        new URL(
            "/login",
            requestUrl,
        );

    if (errorCode) {
        url.searchParams.set(
            "error",
            errorCode,
        );
    }

    return url;
}

export async function GET(
    request: Request,
) {
    const requestUrl =
        new URL(request.url);

    const code =
        requestUrl.searchParams.get(
            "code",
        );

    const oauthError =
        requestUrl.searchParams.get(
            "error",
        );

    if (oauthError) {
        return NextResponse.redirect(
            getLoginUrl(
                request.url,
                "oauth_denied",
            ),
        );
    }

    if (!code) {
        return NextResponse.redirect(
            getLoginUrl(
                request.url,
                "missing_code",
            ),
        );
    }

    try {
        const supabase =
            await createClient();

        const {
            error,
        } =
            await supabase.auth.exchangeCodeForSession(
                code,
            );

        if (error) {
            console.error(
                "[Auth Callback]",
                error,
            );

            return NextResponse.redirect(
                getLoginUrl(
                    request.url,
                    "oauth_callback_failed",
                ),
            );
        }

        const {
            data: {
                user,
            },
        } =
            await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(
                getLoginUrl(
                    request.url,
                    "session_not_created",
                ),
            );
        }

        /*
         * En esta primera fase enviamos al usuario
         * a la Home después de autenticarse.
         *
         * Más adelante, cuando construyamos el área
         * privada y el onboarding del jugador,
         * este punto será el encargado de decidir:
         *
         * - jugador existente → área privada
         * - usuario nuevo → completar perfil
         * - administrador → administración
         */
        return NextResponse.redirect(
            new URL(
                "/",
                request.url,
            ),
        );
    } catch (error) {
        console.error(
            "[Auth Callback]",
            error,
        );

        return NextResponse.redirect(
            getLoginUrl(
                request.url,
                "oauth_callback_failed",
            ),
        );
    }
}