import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import { EmptyPublic, ErrorPublic, PageIntro } from "@/components/public/PublicBlocks";
import { getPublicTournaments } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

export const metadata = buildMetadata({
    title: "Calendario",
    description: "Calendario de pruebas y actividad de Sagunto Padel Cup.",
    path: "/calendario",
});

function monthLabel(value: string) {
    return new Intl.DateTimeFormat("es-ES", {
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

function dateRange(start: string, end: string) {
    const formatter = new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
    });
    return `${formatter.format(new Date(start))} — ${formatter.format(new Date(end))}`;
}

export default async function CalendarPage() {
    const result = await getPublicTournaments();

    if (result.error) {
        return (
            <PublicShell>
                <PageIntro
                    eyebrow="CALENDARIO"
                    title="La temporada, de un vistazo"
                    description="Consulta las pruebas publicadas y accede directamente a cada torneo."
                />
                <section className={styles.content}>
                    <ErrorPublic message={result.error.message} />
                </section>
            </PublicShell>
        );
    }

    if (result.data.length === 0) {
        return (
            <PublicShell>
                <PageIntro
                    eyebrow="CALENDARIO"
                    title="La temporada, de un vistazo"
                    description="Consulta las pruebas publicadas y accede directamente a cada torneo."
                />
                <section className={styles.content}>
                    <EmptyPublic
                        title="Todavía no hay pruebas publicadas"
                        description="Cuando la organización publique nuevos torneos aparecerán aquí ordenados por fecha."
                    />
                </section>
            </PublicShell>
        );
    }

    const tournaments = [...result.data].sort(
        (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
    );

    const months = tournaments.reduce<Record<string, typeof tournaments>>((groups, tournament) => {
        const key = monthLabel(tournament.fecha_inicio);
        (groups[key] ??= []).push(tournament);
        return groups;
    }, {});

    return (
        <PublicShell>
            <PageIntro
                eyebrow="CALENDARIO"
                title="La temporada, de un vistazo"
                description="Pruebas, fechas y estado de cada torneo publicado en Sagunto Padel Cup."
            />

            <section className={styles.content}>
                <div className={styles.timeline}>
                    {Object.entries(months).map(([month, items]) => (
                        <section className={styles.month} key={month}>
                            <header className={styles.monthHeader}>
                                <span>CALENDARIO</span>
                                <h2>{month}</h2>
                            </header>

                            <div className={styles.items}>
                                {items.map((tournament) => (
                                    <article className={styles.item} key={tournament.id}>
                                        <div className={styles.date}>{dateRange(tournament.fecha_inicio, tournament.fecha_fin)}</div>
                                        <div className={styles.main}>
                                            <span className={styles.status}>{tournament.estado.replaceAll("_", " ")}</span>
                                            <h3>{tournament.nombre}</h3>
                                            <p>{tournament.club?.nombre ?? "Club pendiente de publicar"}</p>
                                        </div>
                                        <Link href={`/torneos/${tournament.slug}`} className={styles.link}>
                                            VER TORNEO
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </section>
        </PublicShell>
    );
}
