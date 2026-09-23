"use client";

import Link from "next/link";
import {
    Eye,
    EyeOff,
    LoaderCircle,
} from "lucide-react";
import { useState } from "react";

import {
    createClient,
} from "@/lib/supabase/client";

import {
    registerSchema,
} from "@/lib/validators/auth";

import styles from "./EmailPasswordRegisterForm.module.css";

export default function EmailPasswordRegisterForm() {
    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        showConfirm,
        setShowConfirm,
    ] = useState(false);

    const [
        acceptTerms,
        setAcceptTerms,
    ] = useState(false);

    const [
        acceptPrivacy,
        setAcceptPrivacy,
    ] = useState(false);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        success,
        setSuccess,
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
            registerSchema.safeParse({
                email,
                password,
                confirmPassword,
                acceptTerms,
                acceptPrivacy,
            });

        if (!parsed.success) {
            setError(
                parsed.error.issues[0]
                    ?.message ??
                "Revisa los datos.",
            );

            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const supabase =
                createClient();

            const emailRedirectTo =
                new URL(
                    "/auth/callback",
                    window.location.origin,
                );

            emailRedirectTo.searchParams.set(
                "next",
                "/registro/confirma",
            );

            const {
                data,
                error: signUpError,
            } =
                await supabase.auth.signUp({
                    email:
                        parsed.data.email,

                    password:
                        parsed.data.password,

                    options: {
                        emailRedirectTo:
                            emailRedirectTo.toString(),
                    },
                });

            if (signUpError) {
                throw signUpError;
            }

            /*
             * Supabase puede devolver una respuesta
             * deliberadamente obfuscada cuando el
             * email ya pertenece a otra cuenta.
             */
            if (
                data.user &&
                Array.isArray(
                    data.user.identities,
                ) &&
                data.user.identities.length === 0
            ) {
                throw new Error(
                    "ACCOUNT_ALREADY_EXISTS",
                );
            }

            if (data.session) {
                window.location.assign(
                    "/auth/continue",
                );

                return;
            }

            setSuccess(true);
        } catch (error) {
            console.error(
                "[SPC Email Registration]",
                error,
            );

            if (
                error instanceof Error &&
                error.message ===
                "ACCOUNT_ALREADY_EXISTS"
            ) {
                setError(
                    "Ya existe una cuenta asociada a este email. Si la creaste con Google, inicia sesión con Google o recupera el acceso desde el login.",
                );
            } else {
                setError(
                    "No hemos podido crear la cuenta. Comprueba los datos e inténtalo de nuevo.",
                );
            }
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div
                className={styles.success}
                role="status"
            >
                <span
                    className={
                        styles.successEyebrow
                    }
                >
                    CUENTA CREADA
                </span>

                <h3>
                    Revisa tu correo.
                </h3>

                <p>
                    Te hemos enviado un
                    enlace a{" "}
                    <strong>
                        {email
                            .trim()
                            .toLowerCase()}
                    </strong>{" "}
                    para confirmar tu cuenta.
                    Después podrás completar
                    tu perfil de jugador.
                </p>

                <Link
                    href="/login"
                    className={
                        styles.successLink
                    }
                >
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
                <label htmlFor="register-email">
                    Email
                </label>

                <input
                    id="register-email"
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

            <div className={styles.field}>
                <label htmlFor="register-password">
                    Contraseña
                </label>

                <div
                    className={
                        styles.passwordWrap
                    }
                >
                    <input
                        id="register-password"
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value,
                            )
                        }
                        placeholder="Mínimo 8 caracteres"
                        disabled={loading}
                        required
                    />

                    <button
                        type="button"
                        className={
                            styles.passwordToggle
                        }
                        onClick={() =>
                            setShowPassword(
                                (value) =>
                                    !value,
                            )
                        }
                        aria-label={
                            showPassword
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                        }
                        disabled={loading}
                    >
                        {showPassword ? (
                            <EyeOff size={17} />
                        ) : (
                            <Eye size={17} />
                        )}
                    </button>
                </div>

                <small>
                    Incluye al menos una
                    letra y un número.
                </small>
            </div>

            <div className={styles.field}>
                <label htmlFor="register-confirm-password">
                    Repite la contraseña
                </label>

                <div
                    className={
                        styles.passwordWrap
                    }
                >
                    <input
                        id="register-confirm-password"
                        type={
                            showConfirm
                                ? "text"
                                : "password"
                        }
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(
                                event.target.value,
                            )
                        }
                        placeholder="Repite tu contraseña"
                        disabled={loading}
                        required
                    />

                    <button
                        type="button"
                        className={
                            styles.passwordToggle
                        }
                        onClick={() =>
                            setShowConfirm(
                                (value) =>
                                    !value,
                            )
                        }
                        aria-label={
                            showConfirm
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                        }
                        disabled={loading}
                    >
                        {showConfirm ? (
                            <EyeOff size={17} />
                        ) : (
                            <Eye size={17} />
                        )}
                    </button>
                </div>
            </div>

            <div className={styles.checks}>
                <label
                    className={styles.check}
                >
                    <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(event) =>
                            setAcceptTerms(
                                event.target.checked,
                            )
                        }
                        disabled={loading}
                    />

                    <span>
                        Acepto las{" "}
                        <Link
                            href="/aviso-legal"
                            target="_blank"
                        >
                            condiciones de uso
                        </Link>
                        .
                    </span>
                </label>

                <label
                    className={styles.check}
                >
                    <input
                        type="checkbox"
                        checked={acceptPrivacy}
                        onChange={(event) =>
                            setAcceptPrivacy(
                                event.target.checked,
                            )
                        }
                        disabled={loading}
                    />

                    <span>
                        Acepto la{" "}
                        <Link
                            href="/privacidad"
                            target="_blank"
                        >
                            política de privacidad
                        </Link>
                        .
                    </span>
                </label>
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
                        ? "Creando cuenta..."
                        : "Crear cuenta"}
                </span>
            </button>
        </form>
    );
}