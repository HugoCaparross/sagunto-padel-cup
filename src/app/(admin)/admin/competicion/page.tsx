import type { Json, MatchPhase, MatchStatus } from "@/types/database";
import { MATCH_PHASES, MATCH_STATUSES } from "@/lib/constants";
import { getAdminMatches } from "@/lib/services/admin";
import { getPublicCategories } from "@/lib/public/site";
import { getTournaments } from "@/lib/services/tournaments";

import { assignCourtAction, scheduleMatchAction } from "./actions";
import styles from "../admin-list.module.css";

type SearchParams = Promise<{ torneo?: string; categoria?: string; fase?: string; estado?: string; resultado?: string }>;
const STATUS_LABELS: Record<MatchStatus, string> = {
    pendiente: "Pendiente",
    en_juego: "En juego",
    finalizado: "Finalizado",
    walkover: "Incomparecencia",
    retirada: "Retirada",
    aplazado: "Aplazado",
};
const PHASE_LABELS: Record<MatchPhase, string> = {
    grupos: "Grupos", octavos: "Octavos", cuartos: "Cuartos", semis: "Semifinal", final: "Final",
};

function localDateTime(value: string | null): string {
    if (!value) return "";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(date);
    return parts.replace(" ", "T");
}

function displayDateTime(value: string | null): string {
    if (!value) return "Sin programar";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "Fecha no disponible";
    return new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid",
    }).format(date);
}

function scoreLabel(result: Json | null): string {
    if (!result || typeof result !== "object" || Array.isArray(result)) return "—";
    const sets = (result as { sets?: unknown }).sets;
    if (!Array.isArray(sets)) return "—";
    return sets.map((set) => {
        if (!set || typeof set !== "object") return "?";
        const score = set as { pair1?: unknown; pair2?: unknown };
        return `${String(score.pair1 ?? "?")}-${String(score.pair2 ?? "?")}`;
    }).join(", ") || "—";
}

function pairLabel(pair: { player1?: { nombre: string; apellidos: string | null } | null; player2?: { nombre: string; apellidos: string | null } | null } | null | undefined): string {
    if (!pair) return "Por asignar";
    const name = (player: { nombre: string; apellidos: string | null } | null | undefined) => player ? `${player.nombre} ${player.apellidos ?? ""}`.trim() : "Jugador pendiente";
    return `${name(pair.player1)} / ${name(pair.player2)}`;
}

function stateTone(state: MatchStatus): string {
    if (state === "finalizado") return styles.success;
    if (state === "en_juego") return styles.info;
    if (state === "aplazado" || state === "retirada" || state === "walkover") return styles.warning;
    return styles.neutral;
}

export default async function AdminCompetitionPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const tournaments = await getTournaments();
    const categoriesResult = await getPublicCategories();
    if (categoriesResult.error) throw categoriesResult.error;
    const tournamentId = tournaments.some((item) => item.id === params.torneo) ? params.torneo : "";
    const categoryId = categoriesResult.data.some((item) => item.id === params.categoria) ? params.categoria : "";
    const phase = MATCH_PHASES.includes(params.fase as MatchPhase) ? params.fase as MatchPhase : undefined;
    const status = MATCH_STATUSES.includes(params.estado as MatchStatus) ? params.estado as MatchStatus : undefined;
    const matches = await getAdminMatches({ tournamentId: tournamentId || undefined, categoryId: categoryId || undefined, fase: phase, estado: status });

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div><span className={styles.eyebrow}>Competición</span><h1 className={styles.title}>Partidos y resultados</h1><p className={styles.description}>Consulta partidos, programa fecha y pista. Los resultados se muestran como están registrados; esta vista no permite modificarlos.</p></div>
                <span className={styles.count}>{matches.length} partidos</span>
            </header>
            {params.resultado === "actualizada" && <p className={styles.feedback} role="status">El partido se ha actualizado.</p>}
            {params.resultado === "error" && <p className={`${styles.feedback} ${styles.danger}`} role="alert">No se pudo actualizar el partido. Revisa la fecha o el número de pista.</p>}
            <section className={styles.panel} aria-label="Listado de partidos">
                <form action="/admin/competicion" method="GET" className={styles.toolbar}>
                    <div className={styles.field}><label htmlFor="match-tournament">Torneo</label><select id="match-tournament" className={styles.select} name="torneo" defaultValue={tournamentId}><option value="">Todos</option>{tournaments.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
                    <div className={styles.field}><label htmlFor="match-category">Categoría</label><select id="match-category" className={styles.select} name="categoria" defaultValue={categoryId}><option value="">Todas</option>{categoriesResult.data.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
                    <div className={styles.field}><label htmlFor="match-phase">Fase</label><select id="match-phase" className={styles.select} name="fase" defaultValue={phase ?? ""}><option value="">Todas</option>{MATCH_PHASES.map((item) => <option key={item} value={item}>{PHASE_LABELS[item]}</option>)}</select></div>
                    <div className={styles.field}><label htmlFor="match-status">Estado</label><select id="match-status" className={styles.select} name="estado" defaultValue={status ?? ""}><option value="">Todos</option>{MATCH_STATUSES.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}</select></div>
                    <button className={styles.button} type="submit">Filtrar</button>
                    {(tournamentId || categoryId || phase || status) && <a className={styles.quietButton} href="/admin/competicion">Limpiar</a>}
                </form>
                {!matches.length ? (
                    <div className={styles.empty}><h2>{tournamentId || categoryId || phase || status ? "No hay partidos con estos filtros" : "Aún no hay partidos"}</h2><p>Los partidos se mostrarán cuando se genere un cuadro y se asignen sus encuentros.</p></div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th scope="col">Partido</th><th scope="col">Parejas</th><th scope="col">Fecha y pista</th><th scope="col">Resultado</th><th scope="col">Estado</th></tr></thead>
                            <tbody>{matches.map((match) => (
                                <tr key={match.id}>
                                    <td><span className={styles.primaryText}>{match.tournament_id ? tournaments.find((item) => item.id === match.tournament_id)?.nombre ?? "Torneo" : "Torneo"}</span><span className={styles.secondaryText}>{PHASE_LABELS[match.fase]}{match.match_number ? ` · Partido ${match.match_number}` : ""}</span></td>
                                    <td><span className={styles.primaryText}>{pairLabel(match.pair1)}</span><span className={styles.secondaryText}>vs. {pairLabel(match.pair2)}</span></td>
                                    <td>
                                        {["finalizado", "walkover", "retirada"].includes(match.estado) ? (
                                            <><span className={styles.primaryText}>{displayDateTime(match.hora_programada)}</span><span className={styles.secondaryText}>{match.pista ? `Pista ${match.pista}` : "Sin pista"}</span></>
                                        ) : (
                                            <>
                                                <form action={scheduleMatchAction} className={styles.inlineForm}><input type="hidden" name="matchId" value={match.id} /><label className="sr-only" htmlFor={`schedule-${match.id}`}>Programar fecha y hora</label><input id={`schedule-${match.id}`} className={styles.inlineSelect} type="datetime-local" name="scheduledAt" required defaultValue={localDateTime(match.hora_programada)} /><button className={styles.smallButton} type="submit">Guardar</button></form>
                                                <form action={assignCourtAction} className={styles.inlineForm}><input type="hidden" name="matchId" value={match.id} /><label className="sr-only" htmlFor={`court-${match.id}`}>Número de pista</label><input id={`court-${match.id}`} className={styles.inlineSelect} type="number" name="court" min={1} max={99} required defaultValue={match.pista ?? ""} placeholder="Pista" /><button className={styles.smallButton} type="submit">Asignar</button></form>
                                            </>
                                        )}
                                    </td>
                                    <td>{scoreLabel(match.resultado_json)}</td>
                                    <td><span className={`${styles.badge} ${stateTone(match.estado)}`}>{STATUS_LABELS[match.estado]}</span></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
