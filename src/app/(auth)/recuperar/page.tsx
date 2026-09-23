import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import PublicShell from "@/components/public/PublicShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

import {
    getUser,
} from "@/lib/supabase/server";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Recuperar contraseña",

    description:
        "Solicita un enlace para recuperar tu contraseña de Sagunto Padel Cup.",

    alternates: {
        canonical: "/recuperar",
    },

    robots: {
        index: false,
        follow: false,
    },
};

export default async function RecuperarPage() {
    const user =
        await getUser();

    if (user) {
        redirect(
            "/auth/continue",
        );
    }

    return (
        <PublicShell>
            <div className={styles.page}>
                <section
                    className={styles.section}
                    aria-labelledby="forgot-title"
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

                            <h1 id="forgot-title">
                                Recupera el
                                acceso.
                            </h1>

                            <p>
                                Introduce el email
                                con el que creaste
                                tu cuenta y te
                                enviaremos un enlace
                                seguro para
                                establecer una nueva
                                contraseña.
                            </p>
                        </div>

                        <div
                            className={styles.panel}
                        >
                            <h2>
                                Restablecer
                                contraseña
                            </h2>

                            <p>
                                Por seguridad, la
                                respuesta es la misma
                                tanto si el email está
                                registrado como si no.
                            </p>

                            <ForgotPasswordForm />

                            <div
                                className={
                                    styles.secondary
                                }
                            >
                                <Link href="/registro">
                                    Crear una cuenta
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PublicShell>
    );
}