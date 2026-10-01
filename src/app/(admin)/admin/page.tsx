import Link from "next/link";

import {
    getAdminDashboardSummary,
} from "@/lib/services/admin";

import styles from "./page.module.css";

export default async function AdminDashboardPage() {
    const summary =
        await getAdminDashboardSummary();

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <span className={styles.eyebrow}>
                            Administración
                        </span>

                        <h1 className={styles.title}>
                            Panel de control
                        </h1>

                        <p className={styles.description}>
                            Gestión general de Sagunto Padel Cup.
                        </p>
                    </div>
                </header>

                <section
                    className={styles.section}
                    aria-labelledby="competicion-heading"
                >
                    <div className={styles.sectionHeader}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Competición
                            </span>

                            <h2
                                id="competicion-heading"
                                className={styles.sectionTitle}
                            >
                                Estado actual
                            </h2>
                        </div>
                    </div>

                    <div className={styles.statsGrid}>
                        <StatCard
                            label="Torneos"
                            value={summary.tournaments.total}
                            href="/admin/torneos"
                        />

                        <StatCard
                            label="Inscripciones abiertas"
                            value={summary.tournaments.open}
                            href="/admin/torneos"
                        />

                        <StatCard
                            label="Torneos en juego"
                            value={summary.tournaments.live}
                            href="/admin/torneos"
                        />

                        <StatCard
                            label="Torneos finalizados"
                            value={summary.tournaments.finished}
                            href="/admin/torneos"
                        />
                    </div>
                </section>

                <section
                    className={styles.section}
                    aria-labelledby="jugadores-heading"
                >
                    <div className={styles.sectionHeader}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Participantes
                            </span>

                            <h2
                                id="jugadores-heading"
                                className={styles.sectionTitle}
                            >
                                Jugadores e inscripciones
                            </h2>
                        </div>
                    </div>

                    <div className={styles.statsGrid}>
                        <StatCard
                            label="Jugadores"
                            value={summary.players.total}
                            href="/admin/jugadores"
                        />

                        <StatCard
                            label="Jugadores activos"
                            value={summary.players.active}
                            href="/admin/jugadores"
                        />

                        <StatCard
                            label="Inscripciones"
                            value={summary.registrations.total}
                            href="/admin/parejas"
                        />

                        <StatCard
                            label="Pendientes de pago"
                            value={
                                summary.registrations.pendingPayment
                            }
                            href="/admin/parejas"
                            tone={
                                summary.registrations.pendingPayment >
                                    0
                                    ? "warning"
                                    : "default"
                            }
                        />

                        <StatCard
                            label="Confirmadas"
                            value={
                                summary.registrations.confirmed
                            }
                            href="/admin/parejas"
                            tone="success"
                        />

                        <StatCard
                            label="Lista de espera"
                            value={
                                summary.registrations.waitingList
                            }
                            href="/admin/parejas"
                        />

                        <StatCard
                            label="Check-in"
                            value={
                                summary.registrations.checkedIn
                            }
                            href="/admin/parejas"
                        />
                    </div>
                </section>

                <section
                    className={styles.section}
                    aria-labelledby="partidos-heading"
                >
                    <div className={styles.sectionHeader}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Competición en pista
                            </span>

                            <h2
                                id="partidos-heading"
                                className={styles.sectionTitle}
                            >
                                Partidos
                            </h2>
                        </div>
                    </div>

                    <div className={styles.statsGrid}>
                        <StatCard
                            label="Partidos"
                            value={summary.matches.total}
                            href="/admin/torneos"
                        />

                        <StatCard
                            label="Pendientes"
                            value={summary.matches.pending}
                            href="/admin/torneos"
                        />

                        <StatCard
                            label="En juego"
                            value={summary.matches.live}
                            href="/admin/torneos"
                            tone={
                                summary.matches.live > 0
                                    ? "brand"
                                    : "default"
                            }
                        />

                        <StatCard
                            label="Finalizados"
                            value={summary.matches.finished}
                            href="/admin/torneos"
                            tone="success"
                        />

                        <StatCard
                            label="Aplazados"
                            value={summary.matches.postponed}
                            href="/admin/torneos"
                            tone={
                                summary.matches.postponed > 0
                                    ? "warning"
                                    : "default"
                            }
                        />
                    </div>
                </section>

                <section
                    className={styles.section}
                    aria-labelledby="ranking-heading"
                >
                    <div className={styles.sectionHeader}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Circuito
                            </span>

                            <h2
                                id="ranking-heading"
                                className={styles.sectionTitle}
                            >
                                Ranking
                            </h2>
                        </div>
                    </div>

                    <div className={styles.rankingCard}>
                        <div>
                            <span className={styles.rankingLabel}>
                                Jugadores con ranking
                            </span>

                            <strong className={styles.rankingValue}>
                                {summary.ranking.totalPlayers}
                            </strong>
                        </div>

                        <div>
                            <span className={styles.rankingLabel}>
                                Puntos registrados
                            </span>

                            <strong className={styles.rankingValue}>
                                {summary.ranking.totalPoints}
                            </strong>
                        </div>

                        <Link
                            href="/admin/ranking"
                            className={styles.secondaryButton}
                        >
                            Gestionar ranking
                        </Link>
                    </div>
                </section>

                <section
                    className={styles.section}
                    aria-labelledby="gestion-heading"
                >
                    <div className={styles.sectionHeader}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Gestión
                            </span>

                            <h2
                                id="gestion-heading"
                                className={styles.sectionTitle}
                            >
                                Accesos rápidos
                            </h2>
                        </div>
                    </div>

                    <div className={styles.linksGrid}>
                        <AdminLink
                            href="/admin/torneos"
                            title="Torneos"
                            description="Crear, configurar y gestionar pruebas."
                        />

                        <AdminLink
                            href="/admin/jugadores"
                            title="Jugadores"
                            description="Gestionar participantes y perfiles."
                        />

                        <AdminLink
                            href="/admin/parejas"
                            title="Parejas"
                            description="Gestionar parejas e inscripciones."
                        />

                        <AdminLink
                            href="/admin/ranking"
                            title="Ranking"
                            description="Consultar y administrar la clasificación."
                        />

                        <AdminLink
                            href="/admin/clubes"
                            title="Clubes"
                            description="Gestionar clubes participantes."
                        />

                        <AdminLink
                            href="/admin/patrocinadores"
                            title="Patrocinadores"
                            description="Gestionar patrocinadores del circuito."
                        />

                        <AdminLink
                            href="/admin/noticias"
                            title="Noticias"
                            description="Crear y publicar contenido."
                        />

                        <AdminLink
                            href="/admin/galeria"
                            title="Galería"
                            description="Gestionar imágenes y contenido visual."
                        />

                        <AdminLink
                            href="/admin/master"
                            title="Master"
                            description="Gestionar la fase final del circuito."
                        />

                        <AdminLink
                            href="/admin/ajustes"
                            title="Ajustes"
                            description="Configuración administrativa."
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}

function StatCard({
    label,
    value,
    href,
    tone = "default",
}: {
    label: string;
    value: number;
    href: string;
    tone?: "default" | "brand" | "success" | "warning";
}) {
    return (
        <Link
            href={href}
            className={`${styles.statCard} ${styles[`statCard_${tone}`]}`}
        >
            <span className={styles.statLabel}>
                {label}
            </span>

            <strong className={styles.statValue}>
                {value}
            </strong>

            <span className={styles.statAction}>
                Gestionar
            </span>
        </Link>
    );
}

function AdminLink({
    href,
    title,
    description,
}: {
    href: string;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className={styles.adminLink}
        >
            <div>
                <h3 className={styles.adminLinkTitle}>
                    {title}
                </h3>

                <p className={styles.adminLinkDescription}>
                    {description}
                </p>
            </div>

            <span
                className={styles.adminLinkArrow}
                aria-hidden="true"
            >
                →
            </span>
        </Link>
    );
}