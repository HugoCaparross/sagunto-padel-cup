import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import EmailPasswordLoginForm from "@/components/auth/EmailPasswordLoginForm";
import PublicShell from "@/components/public/PublicShell";

import {
    getUser,
} from "@/lib/supabase/server";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Iniciar sesión",

    description:
        "Accede a tu cuenta de Sagunto Padel Cup.",

    alternates: {
        canonical: "/login",
    },

    robots: {
        index: false,
        follow: false,
    },
};

type Props = {
    searchParams: Promise<{
        error?: string;
    }>;
};

function getErrorMessage(
    error?: string,
) {
    switch (error) {
        case "oauth_denied":
            return "Has cancelado el inicio de sesión con Google.";

        case "missing_code":
            return "No hemos recibido la autorización necesaria para iniciar sesión.";

        case "oauth_callback_failed":
            return "No hemos podido completar el inicio de sesión con Google. Inténtalo de nuevo.";

        case "session_not_created":
            return "La sesión no se ha podido crear. Inténtalo de nuevo.";

        default:
            return null;
    }
}

export default async function LoginPage({
    searchParams,
}: Props) {
    const user =
        await getUser();

    if (user) {
        redirect(
            "/auth/continue",
        );
    }

    const params =
        await searchParams;

    const errorMessage =
        getErrorMessage(
            params.error,
        );

    return (
        <PublicShell>
            <div className={styles.page}>
                <section
                    className={styles.section}
                    aria-labelledby="login-title"
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
                                ACCESO
                            </span>

                            <h1 id="login-title">
                                Vuelve a la
                                competición.
                            </h1>

                            <p>
                                Accede a tu cuenta
                                para seguir tu
                                evolución,
                                consultar tu ranking
                                y gestionar todo lo
                                relacionado con tu
                                participación en el
                                circuito.
                            </p>

                            <div
                                className={styles.line}
                                aria-hidden="true"
                            />
                        </div>

                        <div
                            className={styles.panel}
                        >
                            <span
                                className={
                                    styles.panelEyebrow
                                }
                            >
                                INICIAR SESIÓN
                            </span>

                            <h2>
                                Accede a tu cuenta.
                            </h2>

                            <p
                                className={
                                    styles.panelIntro
                                }
                            >
                                Puedes entrar con
                                tu email y
                                contraseña o
                                continuar con Google.
                            </p>

                            {errorMessage && (
                                <div
                                    className={
                                        styles.alert
                                    }
                                    role="alert"
                                >
                                    <strong>
                                        No hemos podido
                                        iniciar sesión.
                                    </strong>

                                    <span>
                                        {errorMessage}
                                    </span>
                                </div>
                            )}

                            <EmailPasswordLoginForm />

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

                            <GoogleSignInButton />

                            <div
                                className={
                                    styles.registerBox
                                }
                            >
                                <p>
                                    ¿Todavía no tienes
                                    una cuenta?
                                </p>

                                <Link href="/registro">
                                    Crear una cuenta
                                </Link>
                            </div>

                            <p
                                className={
                                    styles.legal
                                }
                            >
                                Al continuar,
                                aceptas las
                                condiciones de uso
                                y la política de
                                privacidad de
                                Sagunto Padel Cup.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </PublicShell>
    );
}