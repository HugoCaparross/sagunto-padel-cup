import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import PublicShell from "@/components/public/PublicShell";
import {
    EmptyPublic,
    ErrorPublic,
    PageIntro,
} from "@/components/public/PublicBlocks";
import {
    displayPlayerName,
    getPublicTournamentBySlug,
} from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
});

function formatDate(value: string) {
    return dateFormatter.format(new Date(value));
}

function formatStatus(value: string) {
    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(value: string) {
    const normalized = value.toLowerCase();

    if (
        normalized.includes("final") ||
        normalized.includes("termin")
    ) {
        return styles.statusFinished;
    }

    if (
        normalized.includes("activo") ||
        normalized.includes("curso") ||
        normalized.includes("jug")
    ) {
        return styles.statusLive;
    }

    if (
        normalized.includes("inscrip") ||
        normalized.includes("abiert")
    ) {
        return styles.statusOpen;
    }

    return styles.statusDefault;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const result = await getPublicTournamentBySlug(slug);

    if (result.error || !result.data) {
        return buildMetadata({
            title: "Torneo no encontrado",
            description:
                "El torneo solicitado no está disponible.",
            path: `/torneos/${slug}`,
            noIndex: true,
        });
    }

    return buildMetadata({
        title: result.data.tournament.nombre,
        description:
            result.data.tournament.descripcion ??
            `Información, resultados y seguimiento de ${result.data.tournament.nombre}.`,
        path: `/torneos/${slug}`,
        image: result.data.tournament.cover_image,
    });
}

export default async function TournamentPage({
    params,
}: PageProps) {
    const { slug } = await params;

    const result = await getPublicTournamentBySlug(slug);

    if (result.error?.message === "TORNEO_NOT_FOUND") {
        notFound();
    }

    if (result.error || !result.data) {
        return (
            <PublicShell>
                <ErrorPublic
                    message={
                        result.error?.message ??
                        "No se ha podido cargar el torneo."
                    }
                />
            </PublicShell>
        );
    }

    const {
        tournament,
        club,
        season,
        categories,
        pairs,
        matches,
        standings,
        brackets,
        sponsors,
    } = result.data;

    const statusLabel = formatStatus(
        tournament.estado,
    );

    const schema = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: tournament.nombre,
        startDate: tournament.fecha_inicio,
        endDate: tournament.fecha_fin,
        url: `https://www.saguntopadelcup.com/torneos/${tournament.slug}`,
        location: club
            ? {
                "@type":
                    "SportsActivityLocation",
                name: club.nombre,
                address:
                    club.direccion ??
                    undefined,
            }
            : undefined,
    };

    return (
        <PublicShell>
            <PageIntro
                eyebrow={
                    tournament.tournament_type ===
                        "master"
                        ? "MASTER FINAL"
                        : "TORNEO · SAGUNTO PADEL CUP"
                }
                title={tournament.nombre}
                description={
                    tournament.descripcion ??
                    "Toda la información del torneo, categorías, parejas, partidos y clasificación."
                }
            />

            <section className={styles.content}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(
                            schema,
                        ),
                    }}
                />

                <div className={styles.heroMeta}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                            FECHAS
                        </span>

                        <strong className={styles.metaValue}>
                            {formatDate(
                                tournament.fecha_inicio,
                            )}
                            <span aria-hidden="true">
                                {" "}
                                —
                                {" "}
                            </span>
                            {formatDate(
                                tournament.fecha_fin,
                            )}
                        </strong>
                    </div>

                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                            CLUB
                        </span>

                        <strong className={styles.metaValue}>
                            {club?.nombre ??
                                "Pendiente"}
                        </strong>

                        {club?.direccion && (
                            <span
                                className={
                                    styles.metaSecondary
                                }
                            >
                                {club.direccion}
                            </span>
                        )}
                    </div>

                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>
                            ESTADO
                        </span>

                        <span
                            className={`${styles.status} ${getStatusClass(
                                tournament.estado,
                            )}`}
                        >
                            <span
                                className={
                                    styles.statusDot
                                }
                                aria-hidden="true"
                            />
                            {statusLabel}
                        </span>
                    </div>

                    {season && (
                        <div className={styles.metaItem}>
                            <span
                                className={
                                    styles.metaLabel
                                }
                            >
                                TEMPORADA
                            </span>

                            <strong
                                className={
                                    styles.metaValue
                                }
                            >
                                {season.name}
                            </strong>
                        </div>
                    )}
                </div>

                <div className={styles.sectionGrid}>
                    <section className={styles.infoSection}>
                        <div className={styles.sectionHeading}>
                            <span className={styles.sectionEyebrow}>
                                COMPETICIÓN
                            </span>

                            <h2>Categorías</h2>
                        </div>

                        {categories.length ? (
                            <div
                                className={
                                    styles.categoryList
                                }
                            >
                                {categories.map(
                                    (item) => (
                                        <article
                                            className={
                                                styles.categoryItem
                                            }
                                            key={`${item.tournament_id}-${item.categoria_id}`}
                                        >
                                            <div>
                                                <strong>
                                                    {item
                                                        .category
                                                        ?.nombre ??
                                                        "Categoría"}
                                                </strong>

                                                <span>
                                                    {item.cupo_maximo ??
                                                        0}{" "}
                                                    plazas
                                                </span>
                                            </div>

                                            <span
                                                className={
                                                    styles.categoryArrow
                                                }
                                                aria-hidden="true"
                                            >
                                                →
                                            </span>
                                        </article>
                                    ),
                                )}
                            </div>
                        ) : (
                            <EmptyPublic
                                title="Sin categorías publicadas"
                                description="Todavía no hay categorías visibles para este torneo."
                            />
                        )}
                    </section>

                    <section className={styles.infoSection}>
                        <div className={styles.sectionHeading}>
                            <span className={styles.sectionEyebrow}>
                                PARTICIPACIÓN
                            </span>

                            <h2>Parejas</h2>
                        </div>

                        {pairs.length ? (
                            <div
                                className={
                                    styles.pairList
                                }
                            >
                                {pairs.map(
                                    (pair, index) => (
                                        <article
                                            className={
                                                styles.pairItem
                                            }
                                            key={
                                                pair.id
                                            }
                                        >
                                            <span
                                                className={
                                                    styles.pairNumber
                                                }
                                            >
                                                {String(
                                                    index +
                                                    1,
                                                ).padStart(
                                                    2,
                                                    "0",
                                                )}
                                            </span>

                                            <div
                                                className={
                                                    styles.pairNames
                                                }
                                            >
                                                <strong>
                                                    {displayPlayerName(
                                                        pair.player1,
                                                    )}
                                                </strong>

                                                <span>
                                                    {displayPlayerName(
                                                        pair.player2,
                                                    )}
                                                </span>
                                            </div>
                                        </article>
                                    ),
                                )}
                            </div>
                        ) : (
                            <EmptyPublic
                                title="Sin parejas publicadas"
                                description="Todavía no hay parejas disponibles para mostrar."
                            />
                        )}
                    </section>
                </div>

                <section
                    className={`${styles.competitionSection} ${styles.matchesSection}`}
                >
                    <div className={styles.sectionHeading}>
                        <span className={styles.sectionEyebrow}>
                            SEGUIMIENTO
                        </span>

                        <h2>Resultados y partidos</h2>

                        <p>
                            Consulta los enfrentamientos
                            publicados y el estado actual de
                            la competición.
                        </p>
                    </div>

                    {matches.length ? (
                        <div
                            className={
                                styles.matches
                            }
                        >
                            {matches.map((match) => (
                                <article
                                    className={
                                        styles.match
                                    }
                                    key={match.id}
                                >
                                    <div
                                        className={
                                            styles.matchContext
                                        }
                                    >
                                        <span>
                                            {
                                                match.fase
                                            }
                                        </span>

                                        {match.tramo && (
                                            <span>
                                                {
                                                    match.tramo
                                                }
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className={
                                            styles.matchPlayers
                                        }
                                    >
                                        <strong>
                                            {match.pair1
                                                ? displayPlayerName(
                                                    match
                                                        .pair1
                                                        .player1,
                                                )
                                                : "Pendiente"}
                                        </strong>

                                        <span
                                            className={
                                                styles.vs
                                            }
                                        >
                                            VS
                                        </span>

                                        <strong>
                                            {match.pair2
                                                ? displayPlayerName(
                                                    match
                                                        .pair2
                                                        .player1,
                                                )
                                                : "Pendiente"}
                                        </strong>
                                    </div>

                                    <div
                                        className={
                                            styles.matchStatus
                                        }
                                    >
                                        {
                                            match.estado
                                        }
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <EmptyPublic
                            title="Todavía no hay partidos"
                            description="Los partidos aparecerán aquí cuando la organización los genere."
                        />
                    )}
                </section>

                {standings.length > 0 && (
                    <section
                        className={
                            styles.competitionSection
                        }
                    >
                        <div
                            className={
                                styles.sectionHeading
                            }
                        >
                            <span
                                className={
                                    styles.sectionEyebrow
                                }
                            >
                                CLASIFICACIÓN
                            </span>

                            <h2>
                                Clasificación de grupos
                            </h2>

                            <p>
                                Posición y rendimiento de
                                las parejas dentro de cada
                                grupo.
                            </p>
                        </div>

                        <div
                            className={
                                styles.tableWrap
                            }
                        >
                            <table>
                                <thead>
                                    <tr>
                                        <th scope="col">
                                            Grupo
                                        </th>
                                        <th scope="col">
                                            Pareja
                                        </th>
                                        <th scope="col">
                                            PJ
                                        </th>
                                        <th scope="col">
                                            V
                                        </th>
                                        <th scope="col">
                                            D
                                        </th>
                                        <th scope="col">
                                            Pts
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {standings.map(
                                        (row) => (
                                            <tr
                                                key={
                                                    row.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        row.groupName
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.pair_id
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.partidos_jugados
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.victorias
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.derrotas
                                                    }
                                                </td>

                                                <td>
                                                    <strong>
                                                        {
                                                            row.puntos
                                                        }
                                                    </strong>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {brackets.length > 0 && (
                    <section
                        className={
                            styles.competitionSection
                        }
                    >
                        <div
                            className={
                                styles.sectionHeading
                            }
                        >
                            <span
                                className={
                                    styles.sectionEyebrow
                                }
                            >
                                FASE FINAL
                            </span>

                            <h2>Cuadros</h2>

                            <p>
                                Consulta las fases finales
                                generadas para la
                                competición.
                            </p>
                        </div>

                        <div
                            className={
                                styles.brackets
                            }
                        >
                            {brackets.map(
                                (bracket) => (
                                    <article
                                        className={
                                            styles.bracket
                                        }
                                        key={
                                            bracket.id
                                        }
                                    >
                                        <span
                                            className={
                                                styles.bracketLabel
                                            }
                                        >
                                            CUADRO
                                        </span>

                                        <strong>
                                            {bracket.tramo.toUpperCase()}
                                        </strong>

                                        <span
                                            className={
                                                styles.bracketStatus
                                            }
                                        >
                                            Cuadro
                                            generado
                                        </span>
                                    </article>
                                ),
                            )}
                        </div>
                    </section>
                )}

                {sponsors.length > 0 && (
                    <section
                        className={
                            styles.sponsorsSection
                        }
                    >
                        <div
                            className={
                                styles.sectionHeading
                            }
                        >
                            <span
                                className={
                                    styles.sectionEyebrow
                                }
                            >
                                APOYO
                            </span>

                            <h2>Patrocinadores</h2>
                        </div>

                        <div
                            className={
                                styles.sponsors
                            }
                        >
                            {sponsors.map(
                                (sponsor) =>
                                    sponsor.enlace ? (
                                        <a
                                            key={
                                                sponsor.id
                                            }
                                            href={
                                                sponsor.enlace
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {
                                                sponsor.nombre
                                            }

                                            <span aria-hidden="true">
                                                ↗
                                            </span>
                                        </a>
                                    ) : (
                                        <span
                                            key={
                                                sponsor.id
                                            }
                                        >
                                            {
                                                sponsor.nombre
                                            }
                                        </span>
                                    ),
                            )}
                        </div>
                    </section>
                )}

                <div className={styles.backNavigation}>
                    <Link href="/torneos">
                        <span aria-hidden="true">
                            ←
                        </span>
                        Todos los torneos
                    </Link>
                </div>
            </section>
        </PublicShell>
    );
}