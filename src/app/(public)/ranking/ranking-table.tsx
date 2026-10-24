"use client";

import { useMemo, useState } from "react";

export type RankingRow = {
    id: string;
    position: number | null;
    name: string;
    points: number;
    category: string | null;
};

const tabs = [
    { label: "General", value: "all" },
    { label: "1.ª categoría", value: "first" },
    { label: "2.ª categoría", value: "second" },
    { label: "3.ª categoría", value: "third" },
    { label: "Iniciación", value: "fourth_initiation" },
];

export default function RankingTable({
    rows,
    published,
    error,
}: {
    rows: RankingRow[];
    published: boolean;
    error: boolean;
}) {
    const [active, setActive] = useState("all");

    const filtered = useMemo(
        () =>
            active === "all"
                ? rows
                : rows.filter((row) => row.category === active),
        [rows, active],
    );

    return (
        <div>
            <div
                className="ranking-tabs"
                role="group"
                aria-label="Filtrar ranking por categoría"
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        aria-pressed={active === tab.value}
                        className={active === tab.value ? "active" : ""}
                        onClick={() => setActive(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="ranking-table-wrap">
                <table className="ranking-table">
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
                        {error ? (
                            <tr>
                                <td colSpan={5} className="ranking-empty">
                                    No se ha podido cargar el ranking.
                                    Inténtalo de nuevo más tarde.
                                </td>
                            </tr>
                        ) : !published ? (
                            <tr>
                                <td colSpan={5} className="ranking-empty">
                                    No hay una clasificación oficial publicada
                                    para la temporada activa.
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="ranking-empty">
                                    No hay jugadores clasificados en esta
                                    categoría.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{row.position ?? index + 1}</td>
                                    <td>{row.name}</td>
                                    <td>
                                        {row.points.toLocaleString("es-ES")}
                                    </td>
                                    <td>—</td>
                                    <td>—</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .ranking-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .ranking-tabs button {
                    border: 0;
                    border-radius: 999px;
                    background: #0d1b2a;
                    color: #fff;
                    padding: 11px 17px;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.15s;
                }

                .ranking-tabs button:hover {
                    background: #263e50;
                }

                .ranking-tabs button.active {
                    background: #f0443a;
                }

                .ranking-tabs button:focus-visible {
                    outline: 3px solid #f0443a;
                    outline-offset: 3px;
                }

                .ranking-table-wrap {
                    overflow-x: auto;
                    border-radius: 8px;
                    background: #102635;
                }

                .ranking-table {
                    width: 100%;
                    border-collapse: collapse;
                    color: #fff;
                    text-align: left;
                    min-width: 580px;
                }

                .ranking-table th {
                    padding: 16px 12px;
                    color: #c9d6df;
                    font-size: 10px;
                    font-weight: 800;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
                }

                .ranking-table td {
                    padding: 13px 12px;
                    font-size: 13px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .ranking-table tbody tr:last-child td {
                    border-bottom: 0;
                }

                .ranking-empty {
                    padding: 16px 12px !important;
                }

                @media (max-width: 600px) {
                    .ranking-tabs {
                        gap: 6px;
                    }

                    .ranking-tabs button {
                        padding: 10px 12px;
                        font-size: 11px;
                    }
                }
            `}</style>
        </div>
    );
}