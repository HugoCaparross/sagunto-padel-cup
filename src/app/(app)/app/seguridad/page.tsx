import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
    getUser,
} from "@/lib/supabase/server";

import SetPasswordForm from "./SetPasswordForm";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Seguridad",

    description:
        "Gestiona la seguridad de tu cuenta de Sagunto Padel Cup.",

    robots: {
        index: false,
        follow: false,
    },
};

export default async function SeguridadPage() {
    const user =
        await getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <main className={styles.page}>
            <div
                className={
                    styles.container
                }
            >
                <Link
                    href="/app/perfil"
                    className={styles.back}
                >
                    Volver a mi perfil
                </Link>

                <span
                    className={
                        styles.eyebrow
                    }
                >
                    CUENTA · SEGURIDAD
                </span>

                <h1>
                    Protege tu acceso.
                </h1>

                <p
                    className={
                        styles.intro
                    }
                >
                    Puedes añadir o cambiar
                    la contraseña de tu cuenta.
                    Esto permite utilizar el
                    acceso manual con email y
                    contraseña incluso si
                    originalmente creaste la
                    cuenta con Google.
                </p>

                <section
                    className={
                        styles.panel
                    }
                >
                    <h2>
                        Contraseña
                    </h2>

                    <p>
                        Usa al menos 8
                        caracteres, con una
                        letra y un número.
                    </p>

                    <SetPasswordForm />
                </section>
            </div>
        </main>
    );
}