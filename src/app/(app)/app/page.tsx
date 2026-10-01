import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    ShieldCheck,
    Trophy,
    UserRound,
} from "lucide-react";

import { getAuthenticatedContext } from "@/lib/auth/flow";
import { getPlayerStats } from "@/lib/services/players";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Inicio",
    description:
        "Tu espacio personal de jugador en Sagunto Padel Cup.",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function PlayerDashboardPage() {
    const { player } = await getAuthenticatedContext();

    if (!player) {
        return null;
    }

    const playerStats = await getPlayerStats(player.id);

    const firstName =
        player.nombre?.trim().split(/\s+/)[0] || "jugador";

    const accountStatus =
        player.estado === "activo"
            ? "Activa"
            : player.estado || "Pendiente";

    const profileComplete = Boolean(
        player.nombre &&
        player.apellidos &&
        player.telefono &&
        player.ciudad &&
        player.categoria_actual_id
    );

    return (
        <main className={styles.page}>
            <section className={styles.welcome}>
                <div>
                    <span className={styles.eyebrow}>
                        TU ESPACIO PERSONAL
                    </span>

                    <h1>
                        Hola, {firstName}
                    </h1>

                    <p>
                        Desde aquí puedes consultar y gestionar
                        la información de tu cuenta de jugador.
                    </p>
                </div>
            </section>

            <section
                className={styles.statusGrid}
                aria-label="Resumen de tu cuenta"
            >
                <article className={styles.statusCard}>
                    <div className={styles.cardIcon}>
                        <UserRound size={19} />
                    </div>

                    <div className={styles.statusContent}>
                        <span>Perfil</span>
                        <strong>
                            {profileComplete
                                ? "Información completada"
                                : "Revisar información"}
                        </strong>
                        <p>
                            Comprueba que tus datos personales y
                            deportivos estén actualizados.
                        </p>
                        <Link href="/app/perfil">
                            Ir a mi perfil
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </article>

                <article className={styles.statusCard}>
                    <div className={styles.cardIcon}>
                        <ShieldCheck size={19} />
                    </div>

                    <div className={styles.statusContent}>
                        <span>Cuenta</span>
                        <strong>{accountStatus}</strong>
                        <p>
                            Gestiona la seguridad y el acceso
                            a tu cuenta.
                        </p>
                        <Link href="/app/seguridad">
                            Configurar seguridad
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </article>
            </section>

            <section className={styles.nextSection}>
                <div className={styles.sectionHeading}>
                    <div>
                        <span className={styles.eyebrow}>
                            SIGUIENTE PASO
                        </span>
                        <h2>Tu actividad en el circuito</h2>
                    </div>
                </div>

                <div className={styles.statusGrid}>
                    <article className={styles.statusCard}>
                        <div className={styles.cardIcon}>
                            <Trophy size={19} />
                        </div>
                        <div className={styles.statusContent}>
                            <span>Actividad registrada</span>
                            <strong>{playerStats.tournamentsPlayed} torneos</strong>
                            <p>Participaciones asociadas a tus parejas y partidos finalizados.</p>
                        </div>
                    </article>
                    <article className={styles.statusCard}>
                        <div className={styles.cardIcon}>
                            <UserRound size={19} />
                        </div>
                        <div className={styles.statusContent}>
                            <span>Partidos finalizados</span>
                            <strong>{playerStats.matchesPlayed} jugados · {playerStats.matchesWon} ganados</strong>
                            <p>Estadísticas calculadas a partir de los resultados registrados.</p>
                        </div>
                    </article>
                </div>

                <div hidden className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <UserRound size={20} />
                    </div>

                    <div>
                        <strong>
                            Tu espacio de competición
                        </strong>
                        <p>
                            Aquí podrás consultar tus torneos,
                            inscripciones, resultados y posición
                            en el ranking cuando esas funciones
                            estén disponibles en tu área privada.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
