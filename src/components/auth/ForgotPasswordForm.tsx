"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import {
    createClient,
} from "@/lib/supabase/client";

import {
    forgotPasswordSchema,
} from "@/lib/validators/auth";

import styles from "./ForgotPasswordForm.module.css";

export default function ForgotPasswordForm() {
    const [email, setEmail] =
        useState("");

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        sent,
        setSent,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (loading) {
            return;
        }

        const parsed =
            forgotPasswordSchema.safeParse({
                email,
            });

        if (!parsed.success) {
            setError(
                parsed.error.issues[0]
                    ?.message ??
                "Introduce un email válido.",
            );

            return;
        }

        setLoading(true);
        setError(null);

        try {
            const supabase =
                createClient();

            const redirectTo =
                new URL(
                    "/auth/callback",
                    window.location.origin,
                );

            redirectTo.searchParams.set(
                "next",
                "/restablecer",
            );

            const {
                error: resetError,
            } =
                await supabase.auth.resetPasswordForEmail(
                    parsed.data.email,
                    {
                        redirectTo:
                            redirectTo.toString(),
                    },
                );

            if (resetError) {
                throw resetError;
            }

            setSent(true);
        } catch (error) {
            console.error(
                "[SPC Password Recovery]",
                error,
            );

            setError(
                "No hemos podido enviar el enlace. Inténtalo de nuevo.",
            );
        } finally {
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <div
                className={styles.success}
                role="status"
            >
                <span>
                    ENLACE SOLICITADO
                </span>

                <h2>
                    Revisa tu correo.
                </h2>

                <p>
                    Si existe una cuenta
                    asociada a ese email,
                    recibirás un enlace para
                    restablecer la contraseña.
                </p>

                <Link href="/login">
                    Volver a iniciar sesión
                </Link>
            </div>
        );
    }

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
        >
            <div className={styles.field}>
                <label htmlFor="forgot-email">
                    Email
                </label>

                <input
                    id="forgot-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                        setEmail(
                            event.target.value,
                        )
                    }
                    placeholder="tu@email.com"
                    disabled={loading}
                    required
                />
            </div>

            {error && (
                <div
                    className={styles.error}
                    role="alert"
                >
                    {error}
                </div>
            )}

            <button
                className={styles.submit}
                type="submit"
                disabled={loading}
                aria-busy={loading}
            >
                {loading && (
                    <LoaderCircle
                        className={
                            styles.loader
                        }
                        size={17}
                    />
                )}

                <span>
                    {loading
                        ? "Enviando..."
                        : "Enviar enlace"}
                </span>
            </button>

            <Link
                href="/login"
                className={styles.back}
            >
                Volver a iniciar sesión
            </Link>
        </form>
    );
}