import Link from "next/link";

import { getTournaments } from "@/lib/services/tournaments";
import { TOURNAMENT_STATES } from "@/lib/constants";

import styles from "./page.module.css";

type SearchParams = Promise<{
    q?: string;
    estado?: string;
    temporada?: string;
    desde?: string;
    hasta?: string;
}>;

const STATUS_LABELS: Record<string, string> = {
    borrador: "Borrador",
    publicado: "Publicado",
    inscripciones_abiertas: "Inscripciones abiertas",
    en_juego: "En juego",
    finalizado: "Finalizado",
    archivado: "Archivado",
};

const STATUS_CLASSES: Record<string, string> = {
    borrador: styles.statusDraft,
    publicado: styles.statusPublished,
    inscripciones_abiertas: styles.statusOpen,
    en_juego: styles.statusLive,
    finalizado: styles.statusFinished,
    archivado: styles.statusArchived,
};

function formatDate(value: string): string {
    const date = new Date(`${value.slice(0, 10)}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "Fecha no disponible";
    }

    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getTournamentTypeLabel(type: string): string {
    return type === "master" ? "Master" : "Prueba regular";
}

export default async function AdminTournamentsPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const params = await searchParams;

    const search = params.q?.trim() ?? "";
    const selectedStatus = params.estado ?? "";
    const seasonId = params.temporada ?? "";
    const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(params.desde ?? "") ? params.desde : "";
    const toDate = /^\d{4}-\d{2}-\d{2}$/.test(params.hasta ?? "") ? params.hasta : "";

    const validStatus = TOURNAMENT_STATES.includes(
        selectedStatus as (typeof TOURNAMENT_STATES)[number],
    )
        ? (selectedStatus as (typeof TOURNAMENT_STATES)[number])
        : undefined;

    const allTournaments = await getTournaments();
    const seasons = Array.from(
        new Map(allTournaments.flatMap((tournament) => tournament.season
            ? [[tournament.season.id, tournament.season.name] as const]
            : [])).entries(),
    );
    const tournaments = allTournaments.filter((tournament) =>
        (!search || tournament.nombre.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es"))) &&
        (!validStatus || tournament.estado === validStatus) &&
        (!seasonId || tournament.season_id === seasonId) &&
        (!fromDate || tournament.fecha_inicio >= fromDate) &&
        (!toDate || tournament.fecha_inicio <= toDate),
    );

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <span className={styles.eyebrow}>
                            Administración
                        </span>

                        <h1 className={styles.title}>
                            Torneos
                        </h1>

                        <p className={styles.description}>
                            Crea pruebas y gestiona la competición
                            de cada torneo del circuito.
                        </p>
                    </div>

                    <Link
                        href="/admin/torneos/nuevo"
                        className={styles.primaryButton}
                    >
                        <span aria-hidden="true">+</span>
                        Nuevo torneo
                    </Link>
                </header>

                <section className={styles.content}>
                    <div className={styles.toolbar}>
                        <div>
                            <h2 className={styles.sectionTitle}>
                                Todos los torneos
                            </h2>

                            <p className={styles.resultCount}>
                                {tournaments.length}{" "}
                                {tournaments.length === 1
                                    ? "torneo encontrado"
                                    : "torneos encontrados"}
                            </p>
                        </div>

                        <form
                            action="/admin/torneos"
                            method="GET"
                            className={styles.filters}
                        >
                            <label
                                htmlFor="tournament-search"
                                className={styles.srOnly}
                            >
                                Buscar torneo
                            </label>

                            <input
                                id="tournament-search"
                                type="search"
                                name="q"
                                defaultValue={search}
                                placeholder="Buscar torneo..."
                                className={styles.searchInput}
                            />

                            <label
                                htmlFor="tournament-status"
                                className={styles.srOnly}
                            >
                                Filtrar por estado
                            </label>

                            <select
                                id="tournament-status"
                                name="estado"
                                defaultValue={validStatus ?? ""}
                                className={styles.statusSelect}
                            >
                                <option value="">
                                    Todos los estados
                                </option>

                                {TOURNAMENT_STATES.map((status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {STATUS_LABELS[status]}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="tournament-season" className={styles.srOnly}>Filtrar por temporada</label>
                            <select id="tournament-season" name="temporada" defaultValue={seasonId} className={styles.statusSelect}>
                                <option value="">Todas las temporadas</option>
                                {seasons.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                            </select>

                            <label htmlFor="tournament-from" className={styles.srOnly}>Desde fecha de inicio</label>
                            <input id="tournament-from" type="date" name="desde" defaultValue={fromDate} className={styles.statusSelect} />

                            <label htmlFor="tournament-to" className={styles.srOnly}>Hasta fecha de inicio</label>
                            <input id="tournament-to" type="date" name="hasta" defaultValue={toDate} className={styles.statusSelect} />

                            <button
                                type="submit"
                                className={styles.filterButton}
                            >
                                Filtrar
                            </button>

                            {(search || validStatus || seasonId || fromDate || toDate) && (
                                <Link
                                    href="/admin/torneos"
                                    className={styles.clearButton}
                                >
                                    Limpiar
                                </Link>
                            )}
                        </form>
                    </div>

                    {tournaments.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <span aria-hidden="true">▤</span>
                            </div>

                            <h3 className={styles.emptyTitle}>
                                No hay torneos
                            </h3>

                            <p className={styles.emptyDescription}>
                                {search || validStatus || seasonId || fromDate || toDate
                                    ? "No se han encontrado torneos con los filtros seleccionados."
                                    : "Todavía no hay torneos registrados."}
                            </p>

                            {!search && !validStatus && !seasonId && !fromDate && !toDate && (
                                <Link
                                    href="/admin/torneos/nuevo"
                                    className={styles.primaryButton}
                                >
                                    Crear primer torneo
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th scope="col">
                                            Torneo
                                        </th>

                                        <th scope="col">
                                            Temporada
                                        </th>

                                        <th scope="col">
                                            Fechas
                                        </th>

                                        <th scope="col">
                                            Club
                                        </th>

                                        <th scope="col">
                                            Tipo
                                        </th>

                                        <th scope="col">
                                            Estado
                                        </th>

                                        <th scope="col">
                                            <span className={styles.srOnly}>
                                                Acciones
                                            </span>
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {tournaments.map((tournament) => {
                                        const type =
                                            tournament.tournament_type ??
                                            "regular";

                                        return (
                                            <tr key={tournament.id}>
                                                <td>
                                                    <div className={styles.tournamentCell}>
                                                        <Link
                                                            href={`/admin/torneos/${tournament.id}`}
                                                            className={styles.tournamentName}
                                                        >
                                                            {tournament.nombre}
                                                        </Link>

                                                        <span className={styles.tournamentSlug}>
                                                            /{tournament.slug}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    {tournament.season?.name ??
                                                        "Sin temporada"}
                                                </td>

                                                <td>
                                                    <div className={styles.dateCell}>
                                                        <span>
                                                            {formatDate(
                                                                tournament.fecha_inicio,
                                                            )}
                                                        </span>

                                                        {tournament.fecha_fin !==
                                                            tournament.fecha_inicio && (
                                                                <span className={styles.dateEnd}>
                                                                    {formatDate(
                                                                        tournament.fecha_fin,
                                                                    )}
                                                                </span>
                                                            )}
                                                    </div>
                                                </td>

                                                <td>
                                                    {tournament.club?.nombre ??
                                                        "Sin club"}
                                                </td>

                                                <td>
                                                    {getTournamentTypeLabel(
                                                        type,
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`${styles.statusBadge} ${STATUS_CLASSES[
                                                            tournament.estado
                                                            ] ??
                                                            styles.statusArchived
                                                            }`}
                                                    >
                                                        {STATUS_LABELS[
                                                            tournament.estado
                                                        ] ??
                                                            tournament.estado}
                                                    </span>
                                                </td>

                                                <td>
                                                    <Link
                                                        href={`/admin/torneos/${tournament.id}`}
                                                        className={styles.actionLink}
                                                        aria-label={`Gestionar ${tournament.nombre}`}
                                                    >
                                                        Gestionar
                                                        <span aria-hidden="true">
                                                            →
                                                        </span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
