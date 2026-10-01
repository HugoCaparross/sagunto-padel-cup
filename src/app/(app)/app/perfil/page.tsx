import type { Metadata } from "next";
import Link from "next/link";

import { getAuthenticatedContext } from "@/lib/auth/flow";

import ProfileForm from "@/components/private/profile/ProfileForm";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Mi perfil",
    description: "Tu área privada de jugador en Sagunto Padel Cup.",
    robots: {
        index: false,
        follow: false,
    },
};

type Props = {
    searchParams: Promise<{
        welcome?: string;
    }>;
};

export default async function PerfilPage({
    searchParams,
}: Props) {
    const { user, player } = await getAuthenticatedContext();
    const params = await searchParams;

    if (!user || !player) {
        return null;
    }

    const fullName =
        `${player.nombre} ${player.apellidos ?? ""}`.trim();

    const initials =
        `${player.nombre.charAt(0)}${player.apellidos?.charAt(0) ?? ""}`
            .toUpperCase();

    const categoryName =
        player.category?.nombre ?? null;

    const statusLabel =
        player.estado === "activo"
            ? "Activo"
            : player.estado === "suspendido"
                ? "Suspendido"
                : "Baja";

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.container}>
                    {params.welcome === "1" && (
                        <div className={styles.welcome} role="status">
                            <strong>
                                Bienvenido a Sagunto Padel Cup.
                            </strong>
                            <span>
                                Tu perfil de jugador ya está preparado.
                            </span>
                        </div>
                    )}

                    <span className={styles.eyebrow}>
                        ÁREA DE JUGADOR
                    </span>

                    <div className={styles.heroRow}>
                        <div className={styles.identity}>
                            <div className={styles.avatar}>
                                {player.foto_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={player.foto_url}
                                        alt={`Foto de ${fullName}`}
                                    />
                                ) : (
                                    initials
                                )}
                            </div>

                            <div className={styles.identityText}>
                                <h1>{fullName}</h1>
                                <p>{player.email}</p>
                            </div>
                        </div>

                        <Link
                            href="/app/seguridad"
                            className={styles.secondaryButton}
                        >
                            Seguridad de la cuenta
                        </Link>
                    </div>
                </div>
            </section>

            <section className={styles.content}>
                <div className={styles.container}>
                    <div className={styles.sectionHeading}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                INFORMACIÓN PERSONAL
                            </span>
                            <h2>Tu perfil</h2>
                            <p>
                                Mantén actualizados tus datos para la
                                organización de los torneos.
                            </p>
                        </div>
                    </div>

                    <div className={styles.profileLayout}>
                        <div className={styles.mainColumn}>
                            <ProfileForm
                                player={{
                                    nombre: player.nombre,
                                    apellidos: player.apellidos ?? "",
                                    telefono: player.telefono ?? "",
                                    ciudad: player.ciudad ?? "",
                                    instagram: player.instagram ?? "",
                                    pala: player.pala ?? "",
                                    manoDominante:
                                        player.mano_dominante ?? "",
                                }}
                            />
                        </div>

                        <aside className={styles.sideColumn}>
                            <section className={styles.infoCard}>
                                <span className={styles.cardEyebrow}>
                                    INFORMACIÓN DEPORTIVA
                                </span>

                                <h3>Tu situación actual</h3>

                                <div className={styles.infoRow}>
                                    <span>Categoría</span>
                                    <strong>
                                        {categoryName ?? "Pendiente de asignación"}
                                    </strong>
                                </div>

                                <div className={styles.infoRow}>
                                    <span>Estado de la cuenta</span>
                                    <strong>{statusLabel}</strong>
                                </div>

                                <div className={styles.infoRow}>
                                    <span>Correo electrónico</span>
                                    <strong className={styles.emailValue}>
                                        {player.email}
                                    </strong>
                                </div>

                                <p className={styles.infoNote}>
                                    La categoría y el estado de tu cuenta
                                    son gestionados por la organización.
                                    Si necesitas corregir algún dato de
                                    esta información, ponte en contacto
                                    con el equipo.
                                </p>
                            </section>

                            <section className={styles.securityCard}>
                                <div>
                                    <span className={styles.cardEyebrow}>
                                        ACCESO
                                    </span>
                                    <h3>Seguridad</h3>
                                    <p>
                                        Gestiona la contraseña y las
                                        opciones de acceso de tu cuenta.
                                    </p>
                                </div>

                                <Link
                                    href="/app/seguridad"
                                    className={styles.textLink}
                                >
                                    Ir a seguridad
                                    <span aria-hidden="true">→</span>
                                </Link>
                            </section>
                        </aside>
                    </div>
                </div>
            </section>
        </main>
    );
}