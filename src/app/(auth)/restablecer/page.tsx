import type { Metadata } from "next";

import PublicShell from "@/components/public/PublicShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

import {
    getUser,
} from "@/lib/supabase/server";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Restablecer contraseña",

    description:
        "Establece una nueva contraseña para tu cuenta de Sagunto Padel Cup.",

    alternates: {
        canonical: "/restablecer",
    },

    robots: {
        index: false,
        follow: false,
    },
};

export default async function RestablecerPage() {
    const user =
        await getUser();

    return (
        <PublicShell>
            <div className={styles.page}>
                <section
                    className={styles.section}
                    aria-labelledby="reset-title"
                >
                    <div
                        className={styles.layout}
                    >
                        <div
                            className={styles.intro}
                        >
                            <span
                                className={
                                    styles.eyebrow
                                }
                            >
                                ACCESO · SEGURIDAD
                            </span>

                            <h1 id="reset-title">
                                Nueva contraseña.
                            </h1>

                            <p>
                                Establece una
                                contraseña nueva
                                y vuelve a
                                utilizar tu
                                cuenta de
                                Sagunto Padel
                                Cup.
                            </p>
                        </div>

                        <div
                            className={styles.panel}
                        >
                            {user ? (
                                <>
                                    <h2>
                                        Crear nueva
                                        contraseña
                                    </h2>

                                    <p>
                                        Utiliza una
                                        contraseña
                                        que puedas
                                        recordar y
                                        que no
                                        compartas
                                        con nadie.
                                    </p>

                                    <ResetPasswordForm />
                                </>
                            ) : (
                                <>
                                    <h2>
                                        Enlace no
                                        válido
                                    </h2>

                                    <p>
                                        El enlace de
                                        recuperación
                                        no es válido
                                        o ha
                                        caducado.
                                        Solicita uno
                                        nuevo para
                                        continuar.
                                    </p>

                                    <a
                                        className={
                                            styles.button
                                        }
                                        href="/recuperar"
                                    >
                                        Solicitar
                                        otro enlace
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </PublicShell>
    );
}