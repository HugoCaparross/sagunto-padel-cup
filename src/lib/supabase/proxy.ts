// src/lib/supabase/middleware.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Refreshes the Supabase authentication session and synchronizes
 * authentication cookies between the request and response.
 *
 * This function is intentionally kept focused on session management.
 * Authorization rules belong to the application/domain layer.
 */
export async function updateSession(request: NextRequest) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error(
            "Missing Supabase environment variables: " +
            "NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY",
        );
    }

    let response = NextResponse.next({
        request,
    });

    const supabase = createServerClient<Database>(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },

                setAll(cookiesToSet) {
                    for (const {
                        name,
                        value,
                        options,
                    } of cookiesToSet) {
                        request.cookies.set(name, value);

                        response = NextResponse.next({
                            request,
                        });

                        response.cookies.set(name, value, options);
                    }
                },
            },
        },
    );

    /**
     * Important:
     *
     * Do not replace getUser() with getSession() for authentication
     * decisions. getUser() performs an authenticated request to Supabase
     * and validates the current user.
     */
    await supabase.auth.getUser();

    return response;
}