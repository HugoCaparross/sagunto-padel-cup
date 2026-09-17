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

import styles from "./page.module.css";

export const metadata = buildMetadata({
    title: "Master Final",
    description:
        "Race to Master, elegibilidad y cierre de temporada de Sagunto Padel Cup.",
    path: "/master-final",
});

export default async function MasterFinalPage() {
    const categories = await getPublicCategories();

    if (categories.error) {
        return (
            <PublicShell>
                <PageIntro
                    eyebrow="MASTER FINAL"
                    title="Master Final"
                    description="El cierre de la temporada de Sagunto Padel Cup."
                />

                <section className={styles.content}>
                    <ErrorPublic
                        message={categories.error.message}
                    />
                </section>
            </PublicShell>
        );
    }

    const category = categories.data[0] ?? null;

    const ranking = category
        ? await getPublicRanking(category.id)
        : null;

    return (
        <PublicShell>
            <PageIntro
                eyebrow="MASTER FINAL"
                title="El cierre de la temporada"
                description="Sigue la Race to Master y consulta la clasificación de la temporada."
            />

            <section className={styles.content}>
                <div className={styles.intro}>
                    <span>RACE TO MASTER</span>

                    <h2>
                        Una clasificación dentro de la temporada
                    </h2>

                    <p>
                        La Race to Master permite seguir la posición
                        de los jugadores durante la temporada. El
                        acceso al Master corresponde a quienes hayan
                        disputado al menos una prueba previa del
                        circuito.
                    </p>
                </div>

                {!ranking ? (
                    <EmptyPublic
                        title="Clasificación no disponible"
                        description="Todavía no hay datos de clasificación publicados."
                    />
                ) : ranking.error ? (
                    <ErrorPublic
                        message={ranking.error.message}
                    />
                ) : !ranking.data?.season ? (
                    <EmptyPublic
                        title="Temporada no disponible"
                        description="Todavía no existe una temporada activa publicada."
                    />
                ) : (
                    <>
                        <div className={styles.season}>
                            <strong>
                                {ranking.data.season.name}
                            </strong>

                            <span>
                                Temporada activa
                            </span>
                        </div>

                        {ranking.data.category ? (
                            <section>
                                <div className={styles.heading}>
                                    <span>
                                        CATEGORÍA
                                    </span>

                                    <h2>
                                        {ranking.data.category.nombre}
                                    </h2>
                                </div>

                                {ranking.data.entries.length === 0 ? (
                                    <EmptyPublic
                                        title="Sin clasificación"
                                        description="Todavía no hay puntos publicados para esta categoría."
                                    />
                                ) : (
                                    <div className={styles.list}>
                                        {ranking.data.entries
                                            .slice(0, 4)
                                            .map((entry) => (
                                                <Link
                                                    href={`/jugadores/${entry.player.id}`}
                                                    key={entry.player.id}
                                                >
                                                    <span>
                                                        #{entry.position}
                                                    </span>

                                                    <strong>
                                                        {
                                                            entry
                                                                .player
                                                                .nombre
                                                        }{" "}
                                                        {
                                                            entry
                                                                .player
                                                                .apellidos
                                                        }
                                                    </strong>

                                                    <b>
                                                        {entry.points} pts
                                                    </b>
                                                </Link>
                                            ))}
                                    </div>
                                )}
                            </section>
                        ) : (
                            <EmptyPublic
                                title="Categoría no disponible"
                                description="No hay una categoría pública disponible para mostrar."
                            />
                        )}
                    </>
                )}

                <div className={styles.actions}>
                    <Link href="/ranking">
                        VER RANKING
                    </Link>

                    <Link href="/circuito">
                        CÓMO FUNCIONA EL CIRCUITO
                    </Link>
                </div>
            </section>
        </PublicShell>
    );
}