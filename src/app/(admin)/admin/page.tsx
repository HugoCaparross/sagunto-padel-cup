import Link from "next/link";

import {
    getAdminDashboardSummary,
} from "@/lib/services/admin";

import styles from "./page.module.css";

export default async function AdminDashboardPage() {
    const summary = await getAdminDashboardSummary();

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
                            Visión general de la actividad de
                            Sagunto Padel Cup.
                        </p>
                    </div>

                    <Link
                        href="/admin/torneos"
                        className={styles.secondaryButton}
                    >
                        Gestionar torneos
                    </Link>
                </header>

                <section
                    className={styles.section}
                    aria-labelledby="overview-heading"
                >
                    <div className={styles.sectionHeader}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Resumen
                            </span>

                            <h2
                                id="overview-heading"
                                className={styles.sectionTitle}
                            >
                                Estado de la competición
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
                            tone={
                                summary.tournaments.open > 0
                                    ? "brand"
                                    : "default"
                            }
                        />

                        <StatCard
                            label="Torneos en juego"
                            value={summary.tournaments.live}
                            href="/admin/torneos"
                            tone={
                                summary.tournaments.live > 0
                                    ? "brand"
                                    : "default"
                            }
                        />

                        <StatCard
                            label="Torneos finalizados"
                            value={summary.tournaments.finished}
                            href="/admin/torneos"
                            tone="success"
                        />
                    </div>
                </section>

                <section
                    className={styles.section}
                    aria-labelledby="participants-heading"
                >
                    <div className={styles.sectionHeader}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Participantes
                            </span>

                            <h2
                                id="participants-heading"
                                className={styles.sectionTitle}
                            >
                                Jugadores e inscripciones
                            </h2>
                        </div>

                        <Link
                            href="/admin/jugadores"
                            className={styles.textLink}
                        >
                            Ver jugadores
                        </Link>
                    </div>

                    <div className={styles.statsGrid}>
                        <StatCard
                            label="Jugadores registrados"
                            value={summary.players.total}
                            href="/admin/jugadores"
                        />

                        <StatCard
                            label="Jugadores activos"
                            value={summary.players.active}
                            href="/admin/jugadores"
                            tone="success"
                        />

                        <StatCard
                            label="Inscripciones"
                            value={summary.registrations.total}
                            href="/admin/parejas"
                        />

                        <StatCard
                            label="Inscripciones confirmadas"
                            value={summary.registrations.confirmed}
                            href="/admin/parejas"
                            tone="success"
                        />

                        <StatCard
                            label="Pendientes de pago"
                            value={summary.registrations.pendingPayment}
                            href="/admin/parejas"
                            tone={
                                summary.registrations.pendingPayment > 0
                                    ? "warning"
                                    : "default"
                            }
                        />

                        <StatCard
                            label="Lista de espera"
                            value={summary.registrations.waitingList}
                            href="/admin/parejas"
                        />

                        <StatCard
                            label="Check-in realizado"
                            value={summary.registrations.checkedIn}
                            href="/admin/parejas"
                        />
                    </div>
                </section>

                <section
                    className={styles.section}
                    aria-labelledby="matches-heading"
                >
                    <div className={styles.sectionHeader}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Competición en pista
                            </span>

                            <h2
                                id="matches-heading"
                                className={styles.sectionTitle}
                            >
                                Estado de los partidos
                            </h2>
                        </div>
                    </div>

                    <div className={styles.statsGrid}>
                        <StatCard
                            label="Partidos totales"
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

                    <div className={styles.progressPanel}>
                        <div className={styles.progressHeader}>
                            <div>
                                <h3 className={styles.panelTitle}>
                                    Progreso de los partidos
                                </h3>

                                <p className={styles.panelDescription}>
                                    Porcentaje de partidos finalizados
                                    sobre el total registrado.
                                </p>
                            </div>

                            <strong className={styles.progressValue}>
                                {summary.matches.total > 0
                                    ? `${Math.round(
                                        (summary.matches.finished /
                                            summary.matches.total) *
                                        100,
                                    )}%`
                                    : "—"}
                            </strong>
                        </div>

                        <div
                            className={styles.progressTrack}
                            role="progressbar"
                            aria-label="Partidos finalizados"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={
                                summary.matches.total > 0
                                    ? Math.round(
                                        (summary.matches.finished /
                                            summary.matches.total) *
                                        100,
                                    )
                                    : 0
                            }
                        >
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: `${summary.matches.total > 0
                                            ? Math.min(
                                                100,
                                                (summary.matches.finished /
                                                    summary.matches.total) *
                                                100,
                                            )
                                            : 0
                                        }%`,
                                }}
                            />
                        </div>

                        <div className={styles.progressFooter}>
                            <span>
                                {summary.matches.finished} finalizados
                            </span>

                            <span>
                                {Math.max(
                                    0,
                                    summary.matches.total -
                                    summary.matches.finished,
                                )}{" "}
                                restantes
                            </span>
                        </div>
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

                        <Link
                            href="/admin/ranking"
                            className={styles.textLink}
                        >
                            Gestionar ranking
                        </Link>
                    </div>

                    <div className={styles.rankingCard}>
                        <div className={styles.rankingMetric}>
                            <span className={styles.rankingLabel}>
                                Jugadores con ranking
                            </span>

                            <strong className={styles.rankingValue}>
                                {summary.ranking.totalPlayers}
                            </strong>
                        </div>

                        <div className={styles.rankingMetric}>
                            <span className={styles.rankingLabel}>
                                Puntos registrados
                            </span>

                            <strong className={styles.rankingValue}>
                                {summary.ranking.totalPoints.toLocaleString(
                                    "es-ES",
                                )}
                            </strong>
                        </div>
                    </div>
                </section>

                <section
                    className={styles.section}
                    aria-labelledby="quick-access-heading"
                >
                    <div className={styles.sectionHeader}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Administración
                            </span>

                            <h2
                                id="quick-access-heading"
                                className={styles.sectionTitle}
                            >
                                Accesos directos
                            </h2>
                        </div>
                    </div>

                    <div className={styles.linksGrid}>
                        <AdminLink
                            href="/admin/torneos"
                            title="Torneos"
                            description="Crear, configurar y gestionar las pruebas."
                        />

                        <AdminLink
                            href="/admin/jugadores"
                            title="Jugadores"
                            description="Consultar y gestionar participantes."
                        />

                        <AdminLink
                            href="/admin/parejas"
                            title="Parejas e inscripciones"
                            description="Gestionar parejas, altas y participación."
                        />

                        <AdminLink
                            href="/admin/ranking"
                            title="Ranking"
                            description="Consultar y administrar la clasificación."
                        />

                        <AdminLink
                            href="/admin/clubes"
                            title="Clubes"
                            description="Gestionar los clubes del circuito."
                        />

                        <AdminLink
                            href="/admin/patrocinadores"
                            title="Patrocinadores"
                            description="Consultar y gestionar colaboraciones."
                        />

                        <AdminLink
                            href="/admin/noticias"
                            title="Noticias"
                            description="Crear y administrar publicaciones."
                        />

                        <AdminLink
                            href="/admin/galeria"
                            title="Galería"
                            description="Gestionar imágenes y álbumes."
                        />

                        <AdminLink
                            href="/admin/master"
                            title="Master"
                            description="Gestionar la fase final del circuito."
                        />

                        <AdminLink
                            href="/admin/ajustes"
                            title="Ajustes"
                            description="Configurar el entorno administrativo."
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
                {value.toLocaleString("es-ES")}
            </strong>

            <span className={styles.statAction}>
                Consultar
                <span aria-hidden="true"> →</span>
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