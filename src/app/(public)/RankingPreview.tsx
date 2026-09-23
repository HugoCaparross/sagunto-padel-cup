"use client";

import { useState } from "react";
import Link from "next/link";

import type { HomeData } from "./page.logic";
import styles from "./page.module.css";

type RankingCategory = {
    category: HomeData["categories"][number];
    ranking: HomeData["rankingPreview"];
};

export default function RankingPreview({
    categories,
}: {
    categories: RankingCategory[];
}) {
    const [selectedCategoryId, setSelectedCategoryId] = useState(
        categories[0]?.category.id ?? "",
    );

    const selected =
        categories.find(
            (item) => item.category.id === selectedCategoryId,
        ) ?? categories[0];

    if (!selected) return null;

    const topFive = selected.ranking.slice(0, 5);

    return (
        <div className={styles.rankingShowcase}>
            <div
                className={styles.rankingCategoryTabs}
                role="tablist"
                aria-label="Seleccionar categoría del ranking"
            >
                {categories.map((item) => {
                    const active =
                        item.category.id === selected.category.id;

                    return (
                        <button
                            key={item.category.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`${styles.rankingCategoryTab} ${active ? styles.rankingCategoryTabActive : ""
                                }`}
                            onClick={() =>
                                setSelectedCategoryId(item.category.id)
                            }
                        >
                            {getRankingCategoryLabel(item.category.nombre)}
                        </button>
                    );
                })}
            </div>

            <div className={styles.rankingPreviewPanel}>
                {topFive.length > 0 ? (
                    <>
                        <div className={styles.rankingHeader}>
                            <span>POS.</span>
                            <span>JUGADOR</span>
                            <span>PUNTOS</span>
                            <span>PRUEBAS</span>
                        </div>

                        {topFive.map((player) => (
                            <Link
                                key={player.playerId}
                                href={`/jugadores/${player.playerId}`}
                                className={styles.rankingRow}
                            >
                                <span className={styles.rankingPosition}>
                                    {String(player.position).padStart(2, "0")}
                                </span>
                                <span className={styles.rankingPlayer}>
                                    {player.nombre} {player.apellidos ?? ""}
                                </span>
                                <span className={styles.rankingPoints}>
                                    {player.puntos}
                                </span>
                                <span className={styles.rankingEvents}>
                                    {player.pruebas}
                                </span>
                            </Link>
                        ))}
                    </>
                ) : (
                    <div className={styles.rankingPreviewEmpty}>
                        <span className={styles.emptyCompetitionLine} />
                        <h3>EL RANKING COMIENZA AQUÍ</h3>
                        <p>
                            Todavía no hay jugadores clasificados en{" "}
                            {getRankingCategoryLabel(selected.category.nombre)}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function getRankingCategoryLabel(name: string): string {
    const match = name.match(/[1-4]/);
    return match ? `${match[0]}ª CATEGORÍA` : name;
}
