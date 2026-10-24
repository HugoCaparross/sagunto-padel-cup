"use client";

import { useMemo, useState } from "react";
import {
    ArrowDownRight,
    ArrowUpRight,
    Minus,
} from "lucide-react";

import styles from "./ranking-preview.module.css";

export type RankingPlayer = {
    position: number;
    name: string;
    points: number;
    events: number;
    movement: number;
    category?: string | null;
};

type RankingPreviewProps = {
    players: RankingPlayer[];
};

const filters = [
    { label: "General", value: "all" },
    { label: "1.ª categoría", value: "1" },
    { label: "2.ª categoría", value: "2" },
    { label: "3.ª categoría", value: "3" },
    { label: "Iniciación", value: "initiation" },
];

export function RankingPreview({
    players,
}: RankingPreviewProps) {
    const [activeCategory, setActiveCategory] = useState("all");

    const filteredPlayers = useMemo(() => {
        if (activeCategory === "all") {
            return players;
        }

        return players.filter(
            (player) => player.category === activeCategory,
        );
    }, [players, activeCategory]);

    return (
        <div className={styles.wrap}>
            <div
                className={styles.filters}
                role="group"
                aria-label="Filtrar ranking por categoría"
            >
                {filters.map((filter) => (
                    <button
                        key={filter.value}
                        type="button"
                        className={
                            activeCategory === filter.value
                                ? styles.selected
                                : ""
                        }
                        aria-pressed={activeCategory === filter.value}
                        onClick={() => setActiveCategory(filter.value)}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th scope="col">POS.</th>
                            <th scope="col">JUGADOR/A</th>
                            <th scope="col">PUNTOS</th>
                            <th scope="col">PRUEBAS</th>
                            <th scope="col">VAR.</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredPlayers.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className={styles.emptyState}
                                >
                                    {players.length === 0
                                        ? "No hay una clasificación oficial publicada para la temporada activa."
                                        : "No hay jugadores clasificados en esta categoría."}
                                </td>
                            </tr>
                        ) : (
                            filteredPlayers.map((player, index) => (
                                <tr key={`${player.name}-${player.position}`}>
                                    <td>{index + 1}</td>

                                    <td>
                                        <span className={styles.avatar}>
                                            {player.name
                                                .split(" ")
                                                .map((part) => part[0])
                                                .join("")
                                                .slice(0, 2)}
                                        </span>
                                        {player.name}
                                    </td>

                                    <td>
                                        {player.points.toLocaleString("es-ES")}
                                    </td>

                                    <td>{player.events}</td>

                                    <td>
                                        {player.movement > 0 ? (
                                            <span className={styles.up}>
                                                <ArrowUpRight size={15} />
                                                +{player.movement}
                                            </span>
                                        ) : player.movement < 0 ? (
                                            <span className={styles.down}>
                                                <ArrowDownRight size={15} />
                                                {player.movement}
                                            </span>
                                        ) : (
                                            <span className={styles.same}>
                                                <Minus size={14} />
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}