import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import EmailPasswordRegisterForm from "@/components/auth/EmailPasswordRegisterForm";
import PublicShell from "@/components/public/PublicShell";

import {
    getUser,
} from "@/lib/supabase/server";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Crear cuenta",

    description:
        "Crea tu cuenta de Sagunto Padel Cup y forma parte del circuito.",

    alternates: {
        canonical: "/registro",
    },

    robots: {
        index: false,
        follow: false,
    },
};

export default async function RegistroPage() {
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
                    aria-labelledby="register-title"
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
                                SAGUNTO PADEL CUP ·
                                REGISTRO
                            </span>

                            <h1 id="register-title">
                                Tu temporada
                                empieza aquí.
                            </h1>

                            <p>
                                Crea tu cuenta para
                                formar parte del
                                circuito,
                                consultar tu
                                ranking, seguir
                                tus resultados y
                                gestionar tus
                                participaciones.
                            </p>

                            <ul
                                className={
                                    styles.benefits
                                }
                            >
                                <li>
                                    Ranking
                                    individual y
                                    evolución
                                </li>

                                <li>
                                    Historial de
                                    torneos y
                                    resultados
                                </li>

                                <li>
                                    Gestión de tus
                                    participaciones
                                </li>

                                <li>
                                    Race to Master
                                </li>
                            </ul>
                        </div>

                        <div
                            className={styles.panel}
                        >
                            <span
                                className={
                                    styles.panelEyebrow
                                }
                            >
                                CREAR CUENTA
                            </span>

                            <h2>
                                Empieza ahora.
                            </h2>

                            <p
                                className={
                                    styles.panelIntro
                                }
                            >
                                Crea tu cuenta con
                                email y
                                contraseña o
                                utiliza Google.
                                Después
                                completaremos tu
                                perfil de jugador.
                            </p>

                            <EmailPasswordRegisterForm />

                            <div
                                className={
                                    styles.divider
                                }
                                aria-hidden="true"
                            >
                                <span />

                                <small>
                                    O
                                </small>

                                <span />
                            </div>

                            <GoogleSignInButton
                                label="Crear cuenta con Google"
                            />

                            <div
                                className={
                                    styles.loginBox
                                }
                            >
                                <p>
                                    ¿Ya tienes una
                                    cuenta?
                                </p>

                                <Link href="/login">
                                    Iniciar sesión
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PublicShell>
    );
}