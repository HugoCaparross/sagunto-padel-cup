"use client";

import { useState } from "react";

import {
    createClient,
} from "@/lib/supabase/client";

import styles from "./GoogleSignInButton.module.css";

type GoogleSignInButtonProps = {
    label?: string;
    next?: string;
};

export default function GoogleSignInButton({
    label = "Continuar con Google",
    next,
}: GoogleSignInButtonProps) {
    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    async function handleSignIn() {
        if (loading) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const supabase =
                createClient();

            const callback =
                new URL(
                    "/auth/callback",
                    window.location.origin,
                );

            if (
                next?.startsWith("/") &&
                !next.startsWith("//")
            ) {
                callback.searchParams.set(
                    "next",
                    next,
                );
            }

            const {
                error: signInError,
            } =
                await supabase.auth.signInWithOAuth(
                    {
                        provider: "google",

                        options: {
                            redirectTo:
                                callback.toString(),

                            queryParams: {
                                prompt:
                                    "select_account",
                            },
                        },
                    },
                );

            if (signInError) {
                throw signInError;
            }
        } catch (error) {
            console.error(
                "[SPC Google Auth]",
                error,
            );

            setLoading(false);

            setError(
                "No hemos podido iniciar sesión con Google. Inténtalo de nuevo.",
            );
        }
    }

    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.button}
                onClick={handleSignIn}
                disabled={loading}
                aria-busy={loading}
            >
                <span
                    className={styles.icon}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        focusable="false"
                    >
                        <path
                            fill="#4285F4"
                            d="M21.35 11.1h-9.18v2.98h5.29c-.23 1.57-1.79 4.6-5.29 4.6-3.19 0-5.79-2.64-5.79-5.89s2.6-5.89 5.79-5.89c1.82 0 3.04.78 3.74 1.45l2.57-2.51C16.54 4.3 14.57 3.4 12.17 3.4 7.38 3.4 3.5 7.3 3.5 12s3.88 8.6 8.67 8.6c5 0 8.31-3.5 8.31-8.43 0-.57-.06-1-.13-1.07Z"
                        />
                    </svg>
                </span>

                <span>
                    {loading
                        ? "Conectando con Google..."
                        : label}
                </span>

                {loading && (
                    <span
                        className={
                            styles.spinner
                        }
                        aria-hidden="true"
                    />
                )}
            </button>

            {error && (
                <p
                    className={styles.error}
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
}