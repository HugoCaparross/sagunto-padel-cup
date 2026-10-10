import Link from "next/link";
import type { Metadata } from "next";

import PublicShell from "@/components/public/PublicShell";
import {
    EmptyPublic,
    ErrorPublic,
    PageIntro,
} from "@/components/public/PublicBlocks";
import { getPublicTournaments } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
    title: "Torneos",
    description:
        "Consulta las pruebas publicadas del circuito Sagunto Padel Cup, sus fechas, clubes y estado de inscripciÃ³n.",
    path: "/torneos",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

function formatDateRange(start: string, end: string) {
    return `${dateFormatter.format(new Date(start))} â€” ${dateFormatter.format(new Date(end))}`;
}

function formatStatus(status: string) {
    return status.replaceAll("_", " ");
}

export default async function TournamentsPage() {
    const result = await getPublicTournaments();

    if (result.error) {
        return (
            <PublicShell>
                <PageIntro
                    eyebrow="TORNEOS"
                    title="Pruebas del circuito"
                    description="Consulta las pruebas publicadas, sus fechas y la informaciÃ³n de cada torneo."
                />

                <section className={styles.content}>
                    <ErrorPublic message={result.error.message} />
                </section>
            </PublicShell>
        );
    }

    const tournaments = [...result.data].sort(
        (a, b) =>
            new Date(a.fecha_inicio).getTime() -
            new Date(b.fecha_inicio).getTime(),
    );

    return (
        <PublicShell>
            <PageIntro
                eyebrow="TORNEOS"
                title="Pruebas del circuito"
                description="Consulta las pruebas publicadas, sus fechas, clubes y estado de inscripciÃ³n de Sagunto Padel Cup."
            />

            <section className={styles.content}>
                {tournaments.length === 0 ? (
                    <EmptyPublic
                        title="TodavÃ­a no hay torneos publicados"
                        description="Cuando la organizaciÃ³n publique una nueva prueba aparecerÃ¡ aquÃ­ con toda su informaciÃ³n."
                    />
                ) : (
                    <div className={styles.grid}>
                        {tournaments.map((tournament) => (
                            <article
                                className={styles.card}
                                key={tournament.id}
                            >
                                <div className={styles.cardTop}>
                                    <span className={styles.status}>
                                        {formatStatus(tournament.estado)}
                                    </span>

                                    {tournament.tournament_type === "master" ? (
                                        <span className={styles.type}>
                                            MASTER FINAL
                                        </span>
                                    ) : null}
                                </div>

                                <h2>{tournament.nombre}</h2>

                                <p className={styles.date}>
                                    {formatDateRange(
                                        tournament.fecha_inicio,
                                        tournament.fecha_fin,
                                    )}
                                </p>

                                <p className={styles.club}>
                                    {tournament.club?.nombre ??
                                        "Club pendiente de publicar"}
                                </p>

                                {tournament.descripcion ? (
                                    <p className={styles.description}>
                                        {tournament.descripcion}
                                    </p>
                                ) : null}

                                <Link
                                    href={`/torneos/${tournament.slug}`}
                                    className={styles.link}
                                >
                                    Ver torneo
                                    <span aria-hidden="true">â†’</span>
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </PublicShell>
    );
}
