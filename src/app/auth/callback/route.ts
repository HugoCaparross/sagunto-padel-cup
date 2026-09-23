import { NextResponse } from "next/server";

import {
    getAuthenticatedDestination,
    getSafeNextPath,
} from "@/lib/auth/flow";

import {
    createClient,
} from "@/lib/supabase/server";

function loginUrl(
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
    const url =
        new URL(request.url);

    const code =
        url.searchParams.get("code");

    const oauthError =
        url.searchParams.get("error");

    const next =
        getSafeNextPath(
            url.searchParams.get(
                "next",
            ),
        );

    if (oauthError) {
        return NextResponse.redirect(
            loginUrl(
                request.url,
                "oauth_denied",
            ),
        );
    }

    if (!code) {
        return NextResponse.redirect(
            loginUrl(
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
                "[SPC Auth Callback]",
                error,
            );

            return NextResponse.redirect(
                loginUrl(
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
                loginUrl(
                    request.url,
                    "session_not_created",
                ),
            );
        }

        const destination =
            next ??
            await getAuthenticatedDestination();

        return NextResponse.redirect(
            new URL(
                destination,
                request.url,
            ),
        );
    } catch (error) {
        console.error(
            "[SPC Auth Callback]",
            error,
        );

        return NextResponse.redirect(
            loginUrl(
                request.url,
                "oauth_callback_failed",
            ),
        );
    }
}