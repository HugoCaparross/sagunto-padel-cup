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
};

type RankingPreviewProps = {
    players: RankingPlayer[];
};

export function RankingPreview({
    players,
}: RankingPreviewProps) {
    return (
        <div className={styles.wrap}>
            <div
                className={styles.filters}
                aria-label="Categorías de ranking"
            >
                <span className={styles.selected}>General</span>
                <span>1.ª categoría</span>
                <span>2.ª categoría</span>
                <span>3.ª categoría</span>
                <span>Iniciación</span>
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
                        {players.map((player) => (
                            <tr key={player.position}>
                                <td>{player.position}</td>

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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}