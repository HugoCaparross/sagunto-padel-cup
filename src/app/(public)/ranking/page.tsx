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
} from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";

import RankingInteractive from "./RankingInteractive";
import styles from "./page.module.css";

export const metadata = buildMetadata({
    title: "Ranking",
    description:
        "Ranking individual de Sagunto Padel Cup por categoría y temporada.",
    path: "/ranking",
});

type RankingPageProps = {
    searchParams: Promise<{
        categoria?: string;
    }>;
};

export default async function RankingPage({
    searchParams,
}: RankingPageProps) {
    const params = await searchParams;

    const categoriesResult = await getPublicCategories();

    if (categoriesResult.error) {
        return (
            <PublicShell>
                <PageIntro
                    eyebrow="RANKING"
                    title="Clasificación individual"
                    description="Consulta la clasificación de la temporada, descubre cómo evoluciona cada jugador y accede directamente a sus perfiles."
                />

                <section className={styles.content}>
                    <ErrorPublic
                        message={categoriesResult.error.message}
                    />
                </section>
            </PublicShell>
        );
    }

    const categories = categoriesResult.data ?? [];
    const selectedCategoryId =
        params.categoria ?? categories[0]?.id ?? "";

    const rankingResult =
        await getPublicRanking(selectedCategoryId);

    const ranking = rankingResult.data;
    const entries = ranking?.entries ?? [];

    const totalPoints = entries.reduce(
        (total, entry) => total + entry.points,
        0,
    );

    const totalTournaments = entries.reduce(
        (total, entry) => total + entry.tournaments,
        0,
    );

    const leader = entries[0] ?? null;

    return (
        <PublicShell>
            <PageIntro
                eyebrow="RANKING · TEMPORADA"
                title="Aquí se ve quién está subiendo."
                description="El ranking es individual: los puntos se obtienen jugando en pareja, pero cada jugador construye su propia posición durante la temporada."
            >
                <Link
                    href="/circuito#ranking"
                    className={styles.introLink}
                >
                    Cómo funciona el ranking
                </Link>
            </PageIntro>

            <section className={styles.content}>
                <div className={styles.topBar}>
                    <div>
                        <p className={styles.kicker}>
                            CLASIFICACIÓN ACTUAL
                        </p>

                        <h2>
                            {ranking?.season?.name ??
                                "Temporada actual"}
                        </h2>
                    </div>

                    {ranking?.category ? (
                        <div className={styles.categoryBadge}>
                            <span>CATEGORÍA</span>
                            <strong>
                                {ranking.category.nombre}
                            </strong>
                        </div>
                    ) : null}
                </div>

                <nav
                    className={styles.categories}
                    aria-label="Categorías del ranking"
                >
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/ranking?categoria=${encodeURIComponent(
                                category.id,
                            )}`}
                            className={
                                category.id ===
                                    selectedCategoryId
                                    ? styles.active
                                    : undefined
                            }
                            aria-current={
                                category.id ===
                                    selectedCategoryId
                                    ? "page"
                                    : undefined
                            }
                        >
                            {category.nombre}
                        </Link>
                    ))}
                </nav>

                {rankingResult.error ? (
                    <ErrorPublic
                        message={rankingResult.error.message}
                    />
                ) : !ranking?.category ? (
                    <EmptyPublic
                        title="Ranking todavía no disponible"
                        description="La temporada todavía no tiene una categoría activa disponible para mostrar."
                    />
                ) : entries.length === 0 ? (
                    <div className={styles.emptyLayout}>
                        <EmptyPublic
                            title={`Aún no hay puntos en ${ranking.category.nombre}`}
                            description="Cuando se registren los primeros resultados, esta clasificación se actualizará automáticamente."
                        />

                        <div className={styles.emptyAside}>
                            <span>PRÓXIMO PASO</span>
                            <strong>
                                Conoce cómo se reparten los puntos.
                            </strong>
                            <Link href="/circuito/reglamento">
                                Ver reglamento →
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.metrics}>
                            <div>
                                <span>JUGADORES CLASIFICADOS</span>
                                <strong>
                                    {entries.length}
                                </strong>
                            </div>

                            <div>
                                <span>PUNTOS ACUMULADOS</span>
                                <strong>
                                    {totalPoints.toLocaleString(
                                        "es-ES",
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>PRUEBAS REGISTRADAS</span>
                                <strong>
                                    {totalTournaments.toLocaleString(
                                        "es-ES",
                                    )}
                                </strong>
                            </div>

                            <div className={styles.leaderMetric}>
                                <span>LÍDER ACTUAL</span>
                                <strong>
                                    {leader
                                        ? `${leader.player.nombre} ${leader.player
                                                .apellidos ?? ""
                                            }`.trim()
                                        : "—"}
                                </strong>
                                {leader ? (
                                    <small>
                                        {leader.points.toLocaleString(
                                            "es-ES",
                                        )}{" "}
                                        puntos
                                    </small>
                                ) : null}
                            </div>
                        </div>

                        <RankingInteractive
                            entries={entries.map((entry) => ({
                                position: entry.position,
                                points: entry.points,
                                tournaments:
                                    entry.tournaments,
                                player: {
                                    id: entry.player.id,
                                    name:
                                        `${entry.player.nombre} ${entry.player.apellidos ??
                                            ""
                                            }`.trim(),
                                },
                            }))}
                            categoryName={
                                ranking.category.nombre
                            }
                        />
                    </>
                )}
            </section>
        </PublicShell>
    );
}
