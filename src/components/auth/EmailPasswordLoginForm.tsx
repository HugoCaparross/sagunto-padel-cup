"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validators/auth";
import styles from "./EmailPasswordLoginForm.module.css";

export default function EmailPasswordLoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (loading) {
            return;
        }

        const parsed = loginSchema.safeParse({
            email,
            password,
        });

        if (!parsed.success) {
            setError(
                parsed.error.issues[0]?.message ??
                "Revisa los datos introducidos.",
            );
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const { error: signInError } =
                await supabase.auth.signInWithPassword({
                    email: parsed.data.email,
                    password: parsed.data.password,
                });

            if (signInError) {
                const message = signInError.message.toLowerCase();

                if (message.includes("email not confirmed")) {
                    throw new Error("EMAIL_NOT_CONFIRMED");
                }

                throw new Error("INVALID_CREDENTIALS");
            }

            window.location.assign("/auth/continue");
        } catch (error) {
            setLoading(false);

            if (
                error instanceof Error &&
                error.message === "EMAIL_NOT_CONFIRMED"
            ) {
                setError(
                    "Tu email todavía no está confirmado. Revisa tu bandeja de entrada.",
                );
                return;
            }

            setError("El email o la contraseña no son correctos.");
        }
    }

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
        >
            <div className={styles.field}>
                <label htmlFor="login-email">
                    Email
                </label>

                <input
                    id="login-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                    placeholder="tu@email.com"
                    disabled={loading}
                    required
                />
            </div>

            <div className={styles.field}>
                <div className={styles.labelRow}>
                    <label htmlFor="login-password">
                        Contraseña
                    </label>

                    <Link href="/recuperar">
                        ¿Has olvidado tu contraseña?
                    </Link>
                </div>

                <div className={styles.passwordWrap}>
                    <input
                        id="login-password"
                        name="password"
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        placeholder="Tu contraseña"
                        disabled={loading}
                        required
                    />

                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() =>
                            setShowPassword(
                                (value) => !value,
                            )
                        }
                        aria-label={
                            showPassword
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                        }
                        aria-pressed={showPassword}
                        disabled={loading}
                    >
                        {showPassword ? (
                            <EyeOff size={17} />
                        ) : (
                            <Eye size={17} />
                        )}
                    </button>
                </div>
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
                type="submit"
                className={styles.submit}
                disabled={loading}
                aria-busy={loading}
            >
                {loading ? (
                    <LoaderCircle
                        className={styles.loader}
                        size={17}
                        aria-hidden="true"
                    />
                ) : null}

                <span>
                    {loading
                        ? "Iniciando sesión..."
                        : "Iniciar sesión"}
                </span>
            </button>
        </form>
    );
}