import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import {
    EmptyPublic,
    ErrorPublic,
    PageIntro,
} from "@/components/public/PublicBlocks";
import {
    getPublicCategories,
    getPublicRanking,
    getPublicTournaments,
} from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

export const metadata = buildMetadata({
    title: "Master Final",
    description:
        "Race to Master, elegibilidad y cierre de temporada de Sagunto Padel Cup.",
    path: "/master-final",
});

function formatDate(value: string): string {
    return new Date(`${value}T12:00:00`).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Madrid",
    });
}

export default async function MasterFinalPage() {
    const categories = await getPublicCategories();

    if (categories.error) {
        return (
            <PublicShell>
                <PageIntro eyebrow="MASTER FINAL" title="Master Final" description="El cierre de la temporada de Sagunto Padel Cup." />
                <section className={styles.content}>
                    <ErrorPublic message={categories.error.message} />
                </section>
            </PublicShell>
        );
    }

    const [rankings, tournaments] = await Promise.all([
        Promise.all(categories.data.map((category) => getPublicRanking(category.id))),
        getPublicTournaments(),
    ]);
    const rankingError = rankings.find((ranking) => ranking.error)?.error;
    const masterTournament = tournaments.data?.find(
        (tournament) => tournament.tournament_type === "master",
    );
    const season = rankings.find((ranking) => ranking.data?.season)?.data?.season;

    return (
        <PublicShell>
            <PageIntro
                eyebrow="MASTER FINAL"
                title="El cierre de la temporada"
                description="Sigue la Race to Master y consulta quién ocupa las plazas directas de cada categoría."
            />

            <section className={styles.content}>
                <div className={styles.intro}>
                    <span>RACE TO MASTER</span>
                    <h2>Clasificación individual por categoría</h2>
                    <p>
                        Las cuatro primeras posiciones individuales de cada categoría
                        obtienen acceso directo al Master Final. Si hay empate por la
                        cuarta plaza, se muestran todos los jugadores empatados; el
                        desempate oficial está pendiente de aprobación.
                    </p>
                </div>

                {tournaments.error ? (
                    <ErrorPublic message={tournaments.error.message} />
                ) : masterTournament ? (
                    <div className={styles.season}>
                        <strong>Master Final</strong>
                        <span>
                            {formatDate(masterTournament.fecha_inicio)}
                            {masterTournament.fecha_fin !== masterTournament.fecha_inicio &&
                                ` – ${formatDate(masterTournament.fecha_fin)}`}
                        </span>
                    </div>
                ) : null}

                {rankingError ? (
                    <ErrorPublic message={rankingError.message} />
                ) : !season ? (
                    <EmptyPublic
                        title="Temporada no disponible"
                        description="Todavía no existe una temporada activa publicada."
                    />
                ) : (
                    <>
                        <div className={styles.season}>
                            <strong>{season.name}</strong>
                            <span>Temporada activa</span>
                        </div>

                        {rankings.map((ranking) => {
                            if (ranking.error || !ranking.data?.category) return null;

                            const entries = ranking.data.entries;
                            const qualification = ranking.data.qualification;
                            const qualifiedPlayerIds = new Set(qualification.qualifiedPlayerIds);
                            const qualified = entries.filter((entry) => qualifiedPlayerIds.has(entry.player.id));

                            return (
                                <section key={ranking.data.category.id}>
                                    <div className={styles.heading}>
                                        <span>RACE TO MASTER</span>
                                        <h2>{ranking.data.category.nombre}</h2>
                                    </div>

                                    {entries.length === 0 ? (
                                        <EmptyPublic
                                            title="Sin clasificación"
                                            description="Todavía no hay puntos publicados para esta categoría."
                                        />
                                    ) : (
                                        <div className={styles.list}>
                                            {qualified.map((entry) => (
                                                <Link href={`/jugadores/${entry.player.id}`} key={entry.player.id}>
                                                    <span>#{entry.position}</span>
                                                    <strong>{entry.player.nombre} {entry.player.apellidos}</strong>
                                                    <b>
                                                        {qualification.hasCutoffTie && entry.points === qualification.cutoffPoints
                                                            ? `${entry.points} pts · Empate por plaza directa`
                                                            : `${entry.points} pts · Plaza directa`}
                                                    </b>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </>
                )}

                <div className={styles.actions}>
                    <Link href="/ranking">VER RANKING</Link>
                    <Link href="/circuito">CÓMO FUNCIONA EL CIRCUITO</Link>
                </div>
            </section>
        </PublicShell>
    );
}
