"use client";

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

import styles from "./SetPasswordForm.module.css";

export default function SetPasswordForm() {
    const [password, setPassword] =
        useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [
        show,
        setShow,
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
        message,
        setMessage,
    ] = useState<string | null>(null);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    async function submit(
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
        setMessage(null);

        try {
            const supabase =
                createClient();

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

            setMessage(
                "Contraseña actualizada. Ya puedes iniciar sesión manualmente con tu email y esta contraseña.",
            );

            setPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error(
                "[SPC Set Password]",
                error,
            );

            setError(
                "No hemos podido actualizar la contraseña. Inténtalo de nuevo.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            className={styles.form}
            onSubmit={submit}
            noValidate
        >
            <div className={styles.field}>
                <label htmlFor="security-password">
                    Nueva contraseña
                </label>

                <div
                    className={styles.wrap}
                >
                    <input
                        id="security-password"
                        type={
                            show
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
                        disabled={loading}
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShow(
                                (value) =>
                                    !value,
                            )
                        }
                        aria-label={
                            show
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                        }
                        disabled={loading}
                    >
                        {show ? (
                            <EyeOff size={17} />
                        ) : (
                            <Eye size={17} />
                        )}
                    </button>
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="security-password-confirm">
                    Repite la contraseña
                </label>

                <div
                    className={styles.wrap}
                >
                    <input
                        id="security-password-confirm"
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
                        disabled={loading}
                    />

                    <button
                        type="button"
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

            {message && (
                <div
                    className={
                        styles.success
                    }
                    role="status"
                >
                    {message}
                </div>
            )}

            <button
                type="submit"
                className={styles.submit}
                disabled={loading}
            >
                {loading && (
                    <LoaderCircle
                        className={
                            styles.loader
                        }
                        size={17}
                    />
                )}

                {loading
                    ? "Guardando..."
                    : "Guardar contraseña"}
            </button>
        </form>
    );
}