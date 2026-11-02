"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "../recuperar-contrasena/recovery.module.css";

export default function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [message, setMessage] = useState("");

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (password.length < 8) {
            setMessage(
                "La contraseña debe tener al menos 8 caracteres."
            );
            setStatus("error");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Las contraseñas no coinciden.");
            setStatus("error");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) {
                setMessage(
                    "El enlace puede haber caducado o no ser válido. Solicita uno nuevo e inténtalo otra vez."
                );
                setStatus("error");
                return;
            }

            setStatus("success");
            setMessage(
                "Tu contraseña se ha actualizado. Ya puedes iniciar sesión."
            );
        } catch {
            setMessage(
                "No se ha podido actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez."
            );
            setStatus("error");
        }
    }

    return (
        <main className={styles.page}>
            <section className={styles.panel}>
                <Link
                    className={styles.back}
                    href="/iniciar-sesion"
                >
                    ← Volver al inicio de sesión
                </Link>

                <div className={styles.accent} />

                <h1>NUEVA CONTRASEÑA</h1>

                <p>
                    Elige una contraseña nueva para recuperar el acceso
                    a tu cuenta.
                </p>

                {status === "success" ? (
                    <div
                        className={styles.success}
                        role="status"
                    >
                        {message}
                        <p>
                            <Link href="/iniciar-sesion">
                                Ir al inicio de sesión
                            </Link>
                        </p>
                    </div>
                ) : (
                    <form onSubmit={submit}>
                        <label htmlFor="new-password">
                            Nueva contraseña
                        </label>

                        <div className={styles.input}>
                            <LockKeyhole size={18} />
                            <input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                minLength={8}
                                required
                            />
                        </div>

                        <label htmlFor="confirm-password">
                            Repite la contraseña
                        </label>

                        <div className={styles.input}>
                            <LockKeyhole size={18} />
                            <input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
                                minLength={8}
                                required
                            />
                        </div>

                        {status === "error" && (
                            <p
                                className={styles.error}
                                role="alert"
                            >
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={status === "loading"}
                        >
                            {status === "loading"
                                ? "Guardando…"
                                : "Guardar contraseña"}
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}