import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    BadgeCheck,
    Mail,
    ShieldCheck,
    Trophy,
    UserRound,
} from "lucide-react";

import { getAuthenticatedContext } from "@/lib/auth/flow";
import ProfileForm from "@/components/private/profile/ProfileForm";
import LogoutButton from "@/components/auth/LogoutButton";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Mi perfil",
    description:
        "Consulta y gestiona tu perfil de jugador en Sagunto Padel Cup.",
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

function getInitials(
    nombre: string,
    apellidos?: string | null,
) {
    const first = nombre.trim().charAt(0);
    const last = apellidos?.trim().charAt(0) ?? "";

    return `${first}${last}`.toUpperCase() || "J";
}

function formatStatus(
    status: string | null | undefined,
) {
    if (!status) return "Sin información";

    const normalized = status.toLowerCase();

    if (normalized === "activo") return "Activo";
    if (normalized === "baja") return "De baja";
    if (normalized === "suspendido") return "Suspendido";

    return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function PerfilPage({
    searchParams,
}: Props) {
    const [{ user, player }, params] = await Promise.all([
        getAuthenticatedContext(),
        searchParams,
    ]);

    if (!user || !player) {
        return null;
    }

    const fullName =
        `${player.nombre} ${player.apellidos ?? ""}`.trim();

    const initials = getInitials(
        player.nombre,
        player.apellidos,
    );

    const email =
        player.email || user.email || "Correo no disponible";

    const isActive = player.estado === "activo";

    const categoryStatus = player.categoria_actual_id
        ? "Asignada"
        : "Pendiente de asignación";

    const profileData = {
        nombre: player.nombre ?? "",
        apellidos: player.apellidos ?? "",
        telefono: player.telefono ?? "",
        ciudad: player.ciudad ?? "",
        instagram: player.instagram ?? "",
        pala: player.pala ?? "",
        manoDominante: player.mano_dominante ?? "",
    };

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                {params.welcome === "1" && (
                    <div
                        className={styles.welcome}
                        role="status"
                    >
                        <span className={styles.welcomeIcon}>
                            <BadgeCheck
                                size={19}
                                aria-hidden="true"
                            />
                        </span>

                        <div className={styles.welcomeText}>
                            <strong>
                                Bienvenido a Sagunto Padel Cup
                            </strong>

                            <span>
                                Tu perfil de jugador ya está preparado.
                            </span>
                        </div>
                    </div>
                )}

                <header className={styles.pageHeader}>
                    <div className={styles.heading}>
                        <span className={styles.eyebrow}>
                            MI CUENTA
                        </span>

                        <h1>Mi perfil</h1>

                        <p>
                            Consulta y gestiona tu información
                            personal y deportiva.
                        </p>
                    </div>

                    <div className={styles.headerActions}>
                        <Link
                            href="/app/seguridad"
                            className={styles.securityLink}
                        >
                            <ShieldCheck
                                size={17}
                                aria-hidden="true"
                            />

                            Seguridad

                            <ArrowRight
                                size={15}
                                aria-hidden="true"
                            />
                        </Link>

                        <LogoutButton variant="light" />
                    </div>
                </header>

                <section
                    className={styles.identityCard}
                    aria-labelledby="identity-title"
                >
                    <div className={styles.identityMain}>
                        <div className={styles.avatar}>
                            {player.foto_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={player.foto_url}
                                    alt=""
                                />
                            ) : (
                                <span aria-hidden="true">
                                    {initials}
                                </span>
                            )}
                        </div>

                        <div className={styles.identityInfo}>
                            <span className={styles.identityLabel}>
                                PERFIL DE JUGADOR
                            </span>

                            <h2 id="identity-title">
                                {fullName}
                            </h2>

                            <p className={styles.identityEmail}>
                                <Mail
                                    size={15}
                                    aria-hidden="true"
                                />

                                <span>{email}</span>
                            </p>
                        </div>
                    </div>

                    <div
                        className={`${styles.statusBadge} ${isActive
                                ? styles.statusActive
                                : styles.statusOther
                            }`}
                    >
                        <span
                            className={styles.statusDot}
                            aria-hidden="true"
                        />

                        {formatStatus(player.estado)}
                    </div>
                </section>

                <div className={styles.sections}>
                    <section
                        className={styles.section}
                        aria-labelledby="personal-title"
                    >
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <UserRound
                                    size={19}
                                    aria-hidden="true"
                                />
                            </div>

                            <div>
                                <h2 id="personal-title">
                                    Datos personales
                                </h2>

                                <p>
                                    Información vinculada a tu cuenta.
                                </p>
                            </div>
                        </div>

                        <ProfileForm player={profileData} />
                    </section>

                    <section
                        className={styles.section}
                        aria-labelledby="sport-title"
                    >
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <Trophy
                                    size={19}
                                    aria-hidden="true"
                                />
                            </div>

                            <div>
                                <h2 id="sport-title">
                                    Información deportiva
                                </h2>

                                <p>
                                    Datos relacionados con tu
                                    participación en el circuito.
                                </p>
                            </div>
                        </div>

                        <div className={styles.sportGrid}>
                            <div className={styles.sportItem}>
                                <div className={styles.sportItemIcon}>
                                    <Trophy
                                        size={17}
                                        aria-hidden="true"
                                    />
                                </div>

                                <div>
                                    <span className={styles.detailLabel}>
                                        Categoría actual
                                    </span>

                                    <strong>
                                        {categoryStatus}
                                    </strong>

                                    <p>
                                        La categoría es gestionada
                                        según las reglas deportivas
                                        del circuito.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}