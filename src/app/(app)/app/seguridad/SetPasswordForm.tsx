"use client";

import {
    Eye,
    EyeOff,
    LoaderCircle,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validators/auth";

import styles from "./SetPasswordForm.module.css";

export default function SetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [show, setShow] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function handlePasswordChange(value: string) {
        setPassword(value);
        setError(null);
        setMessage(null);
    }

    function handleConfirmPasswordChange(value: string) {
        setConfirmPassword(value);
        setError(null);
        setMessage(null);
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (loading) return;

        const parsed = resetPasswordSchema.safeParse({
            password,
            confirmPassword,
        });

        if (!parsed.success) {
            setError(
                parsed.error.issues[0]?.message ??
                "Revisa los datos introducidos.",
            );
            setMessage(null);
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const supabase = createClient();

            const { error: updateError } =
                await supabase.auth.updateUser({
                    password: parsed.data.password,
                });

            if (updateError) {
                throw updateError;
            }

            setPassword("");
            setConfirmPassword("");
            setShow(false);
            setShowConfirm(false);

            setMessage(
                "Contraseña actualizada correctamente.",
            );
        } catch (cause) {
            console.error("[SPC Set Password]", cause);

            setError(
                "No hemos podido actualizar la contraseña. Comprueba tu conexión e inténtalo de nuevo.",
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
            aria-busy={loading}
        >
            <div className={styles.field}>
                <label htmlFor="security-password">
                    Nueva contraseña
                </label>

                <div className={styles.wrap}>
                    <input
                        id="security-password"
                        name="password"
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) =>
                            handlePasswordChange(event.target.value)
                        }
                        disabled={loading}
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                            error ? "password-feedback" : undefined
                        }
                    />

                    <button
                        type="button"
                        onClick={() => setShow((value) => !value)}
                        aria-label={
                            show
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                        }
                        aria-pressed={show}
                        disabled={loading}
                    >
                        {show ? (
                            <EyeOff size={17} aria-hidden="true" />
                        ) : (
                            <Eye size={17} aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="security-password-confirm">
                    Repite la contraseña
                </label>

                <div className={styles.wrap}>
                    <input
                        id="security-password-confirm"
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                            handleConfirmPasswordChange(
                                event.target.value,
                            )
                        }
                        disabled={loading}
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                            error ? "password-feedback" : undefined
                        }
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowConfirm((value) => !value)
                        }
                        aria-label={
                            showConfirm
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                        }
                        aria-pressed={showConfirm}
                        disabled={loading}
                    >
                        {showConfirm ? (
                            <EyeOff size={17} aria-hidden="true" />
                        ) : (
                            <Eye size={17} aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div
                    id="password-feedback"
                    className={styles.error}
                    role="alert"
                >
                    {error}
                </div>
            )}

            {message && (
                <div
                    className={styles.success}
                    role="status"
                    aria-live="polite"
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
                        className={styles.loader}
                        size={17}
                        aria-hidden="true"
                    />
                )}

                <span>
                    {loading
                        ? "Guardando..."
                        : "Guardar contraseña"}
                </span>
            </button>
        </form>
    );
}