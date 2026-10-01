import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { getUser } from "@/lib/supabase/server";

import SetPasswordForm from "./SetPasswordForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Seguridad | Sagunto Padel Cup",
    description:
        "Gestiona la contraseña y la seguridad de tu cuenta de Sagunto Padel Cup.",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function SeguridadPage() {
    const user = await getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <Link href="/app/perfil" className={styles.back}>
                    <ArrowLeft size={15} aria-hidden="true" />
                    <span>Volver a mi perfil</span>
                </Link>

                <header className={styles.header}>
                    <span className={styles.eyebrow}>
                        CUENTA · SEGURIDAD
                    </span>

                    <div className={styles.titleRow}>
                        <div className={styles.icon} aria-hidden="true">
                            <ShieldCheck size={22} />
                        </div>

                        <h1>Seguridad de la cuenta</h1>
                    </div>

                    <p className={styles.intro}>
                        Gestiona tu contraseña para acceder a Sagunto Padel
                        Cup de forma segura.
                    </p>
                </header>

                <section
                    className={styles.panel}
                    aria-labelledby="password-title"
                >
                    <div className={styles.panelHeader}>
                        <h2 id="password-title">Contraseña</h2>
                        <p>
                            Puedes establecer una contraseña o cambiar la
                            que utilizas actualmente. Si te registraste con
                            Google, también podrás acceder con tu email y
                            contraseña después de configurarla.
                        </p>
                    </div>

                    <SetPasswordForm />
                </section>
            </div>
        </main>
    );
}