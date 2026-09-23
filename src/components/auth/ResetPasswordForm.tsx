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
    resetPasswordSchema,
} from "@/lib/validators/auth";

import styles from "./ResetPasswordForm.module.css";

export default function ResetPasswordForm() {
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
            resetPasswordSchema.safeParse({
                password,
                confirmPassword,
            });

        if (!parsed.success) {
            setError(
                parsed.error.issues[0]
                    ?.message ??
                "Revisa la contraseña.",
            );

            return;
        }

        setLoading(true);
        setError(null);

        try {
            const supabase =
                createClient();

            const {
                data: {
                    user,
                },
            } =
                await supabase.auth.getUser();

            if (!user) {
                throw new Error(
                    "RECOVERY_SESSION_REQUIRED",
                );
            }

            const {
                error: updateError,
            } =
                await supabase.auth.updateUser({
                    password:
                        parsed.data.password,
                });

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);
        } catch (error) {
            console.error(
                "[SPC Password Reset]",
                error,
            );

            setError(
                "El enlace no es válido o ha caducado. Solicita uno nuevo.",
            );
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
                <span>
                    CONTRASEÑA ACTUALIZADA
                </span>

                <h2>
                    Ya puedes volver a
                    entrar.
                </h2>

                <p>
                    Tu contraseña se ha
                    actualizado
                    correctamente.
                </p>

                <Link href="/login">
                    Ir a iniciar sesión
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
                <label htmlFor="reset-password">
                    Nueva contraseña
                </label>

                <div
                    className={
                        styles.passwordWrap
                    }
                >
                    <input
                        id="reset-password"
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
                        className={styles.toggle}
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
                <label htmlFor="reset-confirm-password">
                    Repite la contraseña
                </label>

                <div
                    className={
                        styles.passwordWrap
                    }
                >
                    <input
                        id="reset-confirm-password"
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
                        className={styles.toggle}
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
                        ? "Guardando..."
                        : "Guardar nueva contraseña"}
                </span>
            </button>
        </form>
    );
}