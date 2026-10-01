
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminTournamentOverview } from "@/lib/services/admin";

import styles from "./page.module.css";

interface TournamentDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

const STATUS_LABELS: Record<string, string> = {
    borrador: "Borrador",
    publicado: "Publicado",
    inscripciones_abiertas: "Inscripciones abiertas",
    en_juego: "En juego",
    finalizado: "Finalizado",
    archivado: "Archivado",
};

function formatDate(value: string | null | undefined): string {
    if (!value) return "Sin fecha";

    const date = new Date(`${value.slice(0, 10)}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "Fecha no disponible";
    }

    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
}

function Metric({
    label,
    value,
    description,
}: {
    label: string;
    value: number;
    description?: string;
}) {
    return (
        <article className={styles.metric}>
            <span className={styles.metricLabel}>{label}</span>

            <strong className={styles.metricValue}>{value}</strong>

            {description && (
                <span className={styles.metricDescription}>
                    {description}
                </span>
            )}
        </article>
    );
}

const sections = [
    {
        title: "Configuración",
        links: [
            {
                label: "Editar torneo",
                description: "Datos generales, fechas y configuración.",
                href: (id: string) => `/admin/torneos/${id}/editar`,
            },
            {
                label: "Categorías",
                description: "Categorías incluidas en la prueba.",
                href: (id: string) => `/admin/torneos/${id}/categorias`,
            },
        ],
    },
    {
        title: "Competición",
        links: [
            {
                label: "Inscripciones",
                description: "Parejas inscritas, pagos y check-in.",
                href: (id: string) => `/admin/torneos/${id}/inscripciones`,
            },
            {
                label: "Sorteo",
                description: "Organización de grupos y sorteos.",
                href: (id: string) => `/admin/torneos/${id}/sorteo`,
            },
            {
                label: "Cuadros",
                description: "Cuadros eliminatorios y tramos.",
                href: (id: string) => `/admin/torneos/${id}/cuadros`,
            },
            {
                label: "Horarios",
                description: "Programación de partidos y pistas.",
                href: (id: string) => `/admin/torneos/${id}/horarios`,
            },
            {
                label: "Resultados",
                description: "Seguimiento de partidos y resultados.",
                href: (id: string) => `/admin/torneos/${id}/resultados`,
            },
        ],
    },
    {
        title: "Contenido y organización",
        links: [
            {
                label: "Patrocinadores",
                description: "Patrocinadores asociados a esta prueba.",
                href: (id: string) => `/admin/torneos/${id}/patrocinadores`,
            },
            {
                label: "Premios",
                description: "Premios por categoría y posición.",
                href: (id: string) => `/admin/torneos/${id}/premios`,
            },
            {
                label: "Galería",
                description: "Imágenes y contenido visual del torneo.",
                href: (id: string) => `/admin/torneos/${id}/galeria`,
            },
        ],
    },
];

export default async function TournamentDetailPage({
    params,
}: TournamentDetailPageProps) {
    const { id } = await params;

    let overview;

    try {
        overview = await getAdminTournamentOverview(id);
    } catch {
        notFound();
    }

    const { tournament, summary } = overview;

    if (!summary) {
        notFound();
    }

    const status =
        STATUS_LABELS[tournament.estado] ?? tournament.estado;

    const statusClass =
        styles[`status_${tournament.estado}`] ??
        styles.status_default;

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <nav
                    className={styles.breadcrumbs}
                    aria-label="Migas de pan"
                >
                    <Link href="/admin">Administración</Link>

                    <span aria-hidden="true">/</span>

                    <Link href="/admin/torneos">Torneos</Link>

                    <span aria-hidden="true">/</span>

                    <span aria-current="page">
                        {tournament.nombre}
                    </span>
                </nav>

                <header className={styles.header}>
                    <div className={styles.headerMain}>
                        <span className={styles.eyebrow}>
                            Ficha del torneo
                        </span>

                        <div className={styles.titleRow}>
                            <h1 className={styles.title}>
                                {tournament.nombre}
                            </h1>

                            <span
                                className={`${styles.statusBadge} ${statusClass}`}
                            >
                                {status}
                            </span>
                        </div>

                        <p className={styles.subtitle}>
                            {summary.season?.name ??
                                "Temporada sin asignar"}
                            {" · "}
                            {summary.club?.nombre ?? "Club sin asignar"}
                        </p>
                    </div>

                    <Link
                        href={`/admin/torneos/${id}/editar`}
                        className={styles.primaryButton}
                    >
                        Editar torneo
                    </Link>
                </header>

                <section className={styles.infoGrid}>
                    <article className={styles.infoCard}>
                        <span className={styles.infoLabel}>
                            Fecha de inicio
                        </span>

                        <strong>
                            {formatDate(tournament.fecha_inicio)}
                        </strong>
                    </article>

                    <article className={styles.infoCard}>
                        <span className={styles.infoLabel}>
                            Fecha de finalización
                        </span>

                        <strong>
                            {formatDate(tournament.fecha_fin)}
                        </strong>
                    </article>

                    <article className={styles.infoCard}>
                        <span className={styles.infoLabel}>
                            Tipo de torneo
                        </span>

                        <strong>
                            {tournament.tournament_type === "master"
                                ? "Master"
                                : "Prueba regular"}
                        </strong>
                    </article>

                    <article className={styles.infoCard}>
                        <span className={styles.infoLabel}>
                            Precio informativo
                        </span>

                        <strong>
                            {tournament.precio_texto || "No definido"}
                        </strong>
                    </article>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeading}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Resumen
                            </span>

                            <h2>Estado de la competición</h2>
                        </div>
                    </div>

                    <div className={styles.metricsGrid}>
                        <Metric
                            label="Parejas"
                            value={summary.total_pairs}
                            description="Registradas en el torneo"
                        />

                        <Metric
                            label="Confirmadas"
                            value={summary.confirmed_pairs}
                            description="Inscripciones confirmadas"
                        />

                        <Metric
                            label="Pendientes de pago"
                            value={summary.pending_payment_pairs}
                            description="Requieren revisión"
                        />

                        <Metric
                            label="Lista de espera"
                            value={summary.waiting_list_pairs}
                            description="Parejas en espera"
                        />

                        <Metric
                            label="Parejas incompletas"
                            value={summary.incomplete_pairs}
                            description="Pendientes de segundo jugador"
                        />

                        <Metric
                            label="Partidos pendientes"
                            value={summary.pending_matches}
                        />

                        <Metric
                            label="Partidos en juego"
                            value={summary.live_matches}
                        />

                        <Metric
                            label="Partidos finalizados"
                            value={summary.completed_matches}
                        />
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeading}>
                        <div>
                            <span className={styles.sectionEyebrow}>
                                Categorías
                            </span>

                            <h2>Categorías del torneo</h2>
                        </div>

                        <Link
                            href={`/admin/torneos/${id}/categorias`}
                            className={styles.textLink}
                        >
                            Gestionar categorías →
                        </Link>
                    </div>

                    {summary.categories.length === 0 ? (
                        <div className={styles.emptyState}>
                            <h3>Todavía no hay categorías</h3>

                            <p>
                                Añade las categorías que formarán parte de
                                esta prueba.
                            </p>

                            <Link
                                href={`/admin/torneos/${id}/categorias`}
                                className={styles.secondaryButton}
                            >
                                Configurar categorías
                            </Link>
                        </div>
                    ) : (
                        <div className={styles.categoryList}>
                            {summary.categories.map((item, index) => (
                                <article
                                    key={`${item.category?.nombre ?? "categoria"}-${index}`}
                                    className={styles.categoryCard}
                                >
                                    <div>
                                        <h3>
                                            {item.category?.nombre ??
                                                "Categoría sin nombre"}
                                        </h3>

                                        <p>
                                            {item.pair_count} parejas
                                            {" · "}
                                            {item.confirmed_pair_count} confirmadas
                                        </p>
                                    </div>

                                    <div className={styles.categoryStats}>
                                        <span>
                                            {item.pending_match_count} pendientes
                                        </span>

                                        <span>
                                            {item.live_match_count} en juego
                                        </span>

                                        <span>
                                            {item.completed_match_count} finalizados
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {sections.map((section) => (
                    <section
                        className={styles.section}
                        key={section.title}
                    >
                        <div className={styles.sectionHeading}>
                            <div>
                                <h2>{section.title}</h2>
                            </div>
                        </div>

                        <div className={styles.linksGrid}>
                            {section.links.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href(id)}
                                    className={styles.adminLink}
                                >
                                    <div>
                                        <h3>{link.label}</h3>

                                        <p>{link.description}</p>
                                    </div>

                                    <span
                                        className={styles.linkArrow}
                                        aria-hidden="true"
                                    >
                                        →
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
}
