"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./recovery.module.css";

export default function RecoveryForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<
        "idle" | "loading" | "sent" | "error"
    >("idle");

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatus("loading");

        try {
            const supabase = createClient();
            const redirectTo =
                `${window.location.origin}/restablecer-contrasena`;

            const { error } =
                await supabase.auth.resetPasswordForEmail(
                    email.trim(),
                    { redirectTo }
                );

            setStatus(error ? "error" : "sent");
        } catch {
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
                    <ArrowLeft size={17} />
                    Volver al inicio de sesión
                </Link>

                <div className={styles.accent} />

                <h1>RECUPERAR CONTRASEÑA</h1>

                <p>
                    Introduce el correo asociado a tu cuenta y te
                    enviaremos instrucciones para crear una nueva
                    contraseña.
                </p>

                {status === "sent" ? (
                    <div
                        className={styles.success}
                        role="status"
                    >
                        Si existe una cuenta asociada a ese correo,
                        recibirás un mensaje con los siguientes pasos.
                        Revisa también la carpeta de correo no deseado.
                    </div>
                ) : (
                    <form onSubmit={submit}>
                        <label htmlFor="recovery-email">
                            Correo electrónico
                        </label>

                        <div className={styles.input}>
                            <Mail size={18} />

                            <input
                                id="recovery-email"
                                type="email"
                                autoComplete="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                required
                            />
                        </div>

                        {status === "error" && (
                            <p
                                className={styles.error}
                                role="alert"
                            >
                                No se ha podido enviar la solicitud.
                                Comprueba la configuración e inténtalo
                                de nuevo.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={status === "loading"}
                        >
                            {status === "loading"
                                ? "Enviando…"
                                : "Enviar instrucciones"}
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}