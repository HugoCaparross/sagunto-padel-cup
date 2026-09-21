"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, X, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";

import styles from "./page.module.css";

type RankingEntry = {
    position: number;
    points: number;
    tournaments: number;
    player: {
        id: string;
        name: string;
    };
};

type RankingInteractiveProps = {
    entries: RankingEntry[];
    categoryName: string;
};

export default function RankingInteractive({
    entries,
    categoryName,
}: RankingInteractiveProps) {
    const [query, setQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [onlyTop, setOnlyTop] = useState(false);

    const filteredEntries = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase("es");

        return entries.filter((entry) => {
            const matchesSearch =
                !normalized ||
                entry.player.name
                    .toLocaleLowerCase("es")
                    .includes(normalized);

            const matchesTop =
                !onlyTop || entry.position <= 10;

            return matchesSearch && matchesTop;
        });
    }, [entries, query, onlyTop]);

    const selectedPlayers = selectedIds
        .map((id) => entries.find((entry) => entry.player.id === id))
        .filter((entry): entry is RankingEntry => Boolean(entry));

    function togglePlayer(id: string) {
        setSelectedIds((current) => {
            if (current.includes(id)) {
                return current.filter((item) => item !== id);
            }

            if (current.length >= 2) {
                return [...current.slice(1), id];
            }

            return [...current, id];
        });
    }

    function clearSelection() {
        setSelectedIds([]);
    }

    const maxPoints = Math.max(
        ...entries.map((entry) => entry.points),
        1,
    );

    return (
        <div className={styles.rankingExperience}>
            <div className={styles.rankingToolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} aria-hidden="true" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                        placeholder="Buscar jugador..."
                        aria-label="Buscar jugador en el ranking"
                    />

                    {query ? (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            aria-label="Limpiar búsqueda"
                        >
                            <X size={16} aria-hidden="true" />
                        </button>
                    ) : null}
                </div>

                <button
                    type="button"
                    className={`${styles.filterButton} ${onlyTop ? styles.filterButtonActive : ""
                        }`}
                    onClick={() => setOnlyTop((current) => !current)}
                    aria-pressed={onlyTop}
                >
                    <SlidersHorizontal
                        size={16}
                        aria-hidden="true"
                    />
                    {onlyTop ? "Top 10" : "Todos"}
                </button>
            </div>

            <div className={styles.rankingMeta}>
                <span>
                    {filteredEntries.length}{" "}
                    {filteredEntries.length === 1
                        ? "jugador"
                        : "jugadores"}{" "}
                    visibles
                </span>

                {selectedPlayers.length > 0 ? (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className={styles.clearSelection}
                    >
                        Limpiar selección
                    </button>
                ) : (
                    <span>
                        Selecciona hasta 2 jugadores para comparar
                    </span>
                )}
            </div>

            {selectedPlayers.length > 0 ? (
                <div className={styles.selectionBar}>
                    <div>
                        <span>COMPARACIÓN</span>
                        <strong>
                            {selectedPlayers.length === 1
                                ? "Selecciona otro jugador"
                                : "Dos jugadores seleccionados"}
                        </strong>
                    </div>

                    <div className={styles.selectionPlayers}>
                        {selectedPlayers.map((entry) => (
                            <button
                                key={entry.player.id}
                                type="button"
                                onClick={() =>
                                    togglePlayer(entry.player.id)
                                }
                            >
                                <span>
                                    #{entry.position}
                                </span>
                                {entry.player.name}
                                <X
                                    size={14}
                                    aria-hidden="true"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            {selectedPlayers.length === 2 ? (
                <section className={styles.comparePanel}>
                    <div className={styles.compareHeader}>
                        <div>
                            <span>COMPARACIÓN DIRECTA</span>
                            <h3>
                                Dos formas distintas de llegar arriba.
                            </h3>
                        </div>

                        <button
                            type="button"
                            onClick={clearSelection}
                            aria-label="Cerrar comparación"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>

                    <div className={styles.compareGrid}>
                        {selectedPlayers.map((entry) => (
                            <article
                                key={entry.player.id}
                                className={styles.comparePlayer}
                            >
                                <div>
                                    <span>
                                        #{entry.position} ·{" "}
                                        {categoryName}
                                    </span>
                                    <h4>
                                        {entry.player.name}
                                    </h4>
                                </div>

                                <div className={styles.compareStats}>
                                    <div>
                                        <strong>
                                            {entry.points}
                                        </strong>
                                        <span>Puntos</span>
                                    </div>
                                    <div>
                                        <strong>
                                            {entry.tournaments}
                                        </strong>
                                        <span>Pruebas</span>
                                    </div>
                                </div>

                                <Link
                                    href={`/jugadores/${entry.player.id}`}
                                >
                                    Ver perfil
                                    <ArrowUpRight
                                        size={15}
                                        aria-hidden="true"
                                    />
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
            ) : null}

            {filteredEntries.length === 0 ? (
                <div className={styles.noResults}>
                    <span>NINGÚN RESULTADO</span>
                    <h3>
                        No encontramos jugadores con esa búsqueda.
                    </h3>
                    <p>
                        Prueba con otro nombre o elimina los filtros
                        para volver a ver toda la clasificación.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            setOnlyTop(false);
                        }}
                    >
                        Restablecer filtros
                    </button>
                </div>
            ) : (
                <>
                    <div className={styles.mobileRanking}>
                        {filteredEntries.map((entry) => {
                            const selected = selectedIds.includes(
                                entry.player.id,
                            );

                            return (
                                <article
                                    key={entry.player.id}
                                    className={`${styles.mobileRow} ${selected
                                            ? styles.rowSelected
                                            : ""
                                        }`}
                                >
                                    <button
                                        type="button"
                                        className={styles.positionButton}
                                        onClick={() =>
                                            togglePlayer(
                                                entry.player.id,
                                            )
                                        }
                                        aria-pressed={selected}
                                        aria-label={`Seleccionar ${entry.player.name} para comparar`}
                                    >
                                        {entry.position}
                                    </button>

                                    <div>
                                        <Link
                                            href={`/jugadores/${entry.player.id}`}
                                        >
                                            {entry.player.name}
                                        </Link>
                                        <span>
                                            {entry.tournaments}{" "}
                                            {entry.tournaments === 1
                                                ? "prueba"
                                                : "pruebas"}
                                        </span>
                                    </div>

                                    <strong>{entry.points}</strong>
                                </article>
                            );
                        })}
                    </div>

                    <div className={styles.rankingTable}>
                        <div className={styles.tableHeader}>
                            <span>POS.</span>
                            <span>JUGADOR</span>
                            <span>PRUEBAS</span>
                            <span>PUNTOS</span>
                            <span>COMPARAR</span>
                        </div>

                        {filteredEntries.map((entry) => {
                            const selected = selectedIds.includes(
                                entry.player.id,
                            );

                            return (
                                <div
                                    key={entry.player.id}
                                    className={`${styles.tableRow} ${selected
                                            ? styles.rowSelected
                                            : ""
                                        }`}
                                >
                                    <button
                                        type="button"
                                        className={styles.positionButton}
                                        onClick={() =>
                                            togglePlayer(
                                                entry.player.id,
                                            )
                                        }
                                        aria-pressed={selected}
                                    >
                                        {String(
                                            entry.position,
                                        ).padStart(2, "0")}
                                    </button>

                                    <div className={styles.playerCell}>
                                        <Link
                                            href={`/jugadores/${entry.player.id}`}
                                        >
                                            {entry.player.name}
                                            <ArrowUpRight
                                                size={14}
                                                aria-hidden="true"
                                            />
                                        </Link>

                                        <div className={styles.pointsBar}>
                                            <span
                                                style={{
                                                    width: `${Math.max(
                                                        4,
                                                        (entry.points /
                                                            maxPoints) *
                                                        100,
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <span>
                                        {entry.tournaments}
                                    </span>

                                    <strong>
                                        {entry.points}
                                    </strong>

                                    <button
                                        type="button"
                                        className={
                                            selected
                                                ? styles.compareSelected
                                                : styles.compareButton
                                        }
                                        onClick={() =>
                                            togglePlayer(
                                                entry.player.id,
                                            )
                                        }
                                        aria-pressed={selected}
                                    >
                                        {selected
                                            ? "Seleccionado"
                                            : "Comparar"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <p className={styles.interactionHint}>
                Puedes seleccionar un jugador para preparar una
                comparación. Al seleccionar un segundo, la
                comparación aparece automáticamente.
            </p>
        </div>
    );
}
