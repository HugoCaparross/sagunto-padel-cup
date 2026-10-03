import Link from "next/link";
import { notFound } from "next/navigation";
import type { RegistrationStatus } from "@/types/database";
import { getAdminPlayer, getAdminPlayersByIds, getAdminRegistrations, getAdminRankingPoints, getCategories, requireAdminContext } from "@/lib/services/admin";
import { getPlayerStats } from "@/lib/services/players";
import { getTournaments } from "@/lib/services/tournaments";
import styles from "../../admin-list.module.css";

const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
    confirmada: "Confirmada", lista_espera: "Lista de espera", pendiente_pago: "Pendiente de pago", cancelada: "Cancelada",
};

export default async function AdminPlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminContext();
    const { id } = await params;
    const [player, stats, registrations, points, categories, tournaments] = await Promise.all([
        getAdminPlayer(id),
        getPlayerStats(id),
        getAdminRegistrations({ playerId: id }),
        getAdminRankingPoints({ playerId: id }),
        getCategories(),
        getTournaments(),
    ]);
    if (!player) notFound();
    const rankedPoints = points.reduce((sum, point) => sum + point.puntos_obtenidos, 0);
    const partnerIds = registrations.flatMap((registration) => registration.pair?.player_2_id ? [registration.pair.player_2_id] : []);
    const partnerPlayers = await getAdminPlayersByIds(partnerIds);
    const partnerNames = new Map(partnerPlayers.map((partner) => [partner.id, `${partner.nombre} ${partner.apellidos ?? ""}`.trim()]));
    const categoryNames = new Map(categories.map((category) => [category.id, category.nombre]));
    const tournamentNames = new Map(tournaments.map((tournament) => [tournament.id, tournament.nombre]));

    return <main className={styles.page}>
        <nav className={styles.breadcrumbs} aria-label="Migas de pan"><Link href="/admin">Administracion</Link><span>/</span><Link href="/admin/jugadores">Jugadores</Link><span>/</span><span aria-current="page">Ficha</span></nav>
        <header className={styles.header}><div><span className={styles.eyebrow}>Ficha deportiva</span><h1 className={styles.title}>{player.nombre} {player.apellidos}</h1><p className={styles.description}>Estado: {player.estado} · Categoria actual: {player.category?.nombre ?? "Sin categoria asignada"}</p></div></header>

        <section className={styles.panel} aria-labelledby="player-details"><h2 id="player-details">Datos deportivos</h2>
            <dl className={styles.detailGrid}>
                <div><dt>Identificador</dt><dd><code>{player.id}</code></dd></div>
                <div><dt>Fecha de alta</dt><dd>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(new Date(player.fecha_alta))}</dd></div>
                <div><dt>Mano dominante</dt><dd>{player.mano_dominante ?? "No informada"}</dd></div>
                <div><dt>Pala</dt><dd>{player.pala ?? "No informada"}</dd></div>
                <div><dt>Localidad</dt><dd>{player.ciudad ?? "No informada"}</dd></div>
                <div><dt>Estado del perfil</dt><dd>{player.onboarding_completado ? "Perfil completado" : "Perfil pendiente"}</dd></div>
            </dl>
            <p className={styles.privateNote}>Esta ficha omite email y telefono; esos datos no son necesarios para consultar la actividad deportiva.</p>
        </section>

        <section className={styles.panel} aria-labelledby="player-stats"><h2 id="player-stats">Actividad competitiva</h2>
            <div className={styles.metricsGrid}>
                <article className={styles.metric}><span>Partidos finalizados</span><strong>{stats.matchesPlayed}</strong></article>
                <article className={styles.metric}><span>Victorias</span><strong>{stats.matchesWon}</strong></article>
                <article className={styles.metric}><span>Derrotas</span><strong>{stats.matchesLost}</strong></article>
                <article className={styles.metric}><span>Puntos en el ledger</span><strong>{rankedPoints}</strong></article>
                <article className={styles.metric}><span>Inscripciones</span><strong>{registrations.length}</strong></article>
            </div>
            <p className={styles.privateNote}>Los partidos cuentan solo encuentros con resultado finalizado. Los puntos muestran el ledger consultado, sin recalcular ni aplicar desempates.</p>
        </section>

        <section className={styles.panel} aria-labelledby="player-registrations"><h2 id="player-registrations">Inscripciones y parejas</h2>
            {!registrations.length ? <div className={styles.empty}><h3>Sin inscripciones</h3><p>No hay inscripciones asociadas a este jugador.</p></div> : <div className={styles.tableWrap}><table className={styles.table}>
                <thead><tr><th scope="col">Torneo</th><th scope="col">Categoria</th><th scope="col">Pareja</th><th scope="col">Inscripcion</th><th scope="col">Pago</th><th scope="col">Detalle</th></tr></thead>
                <tbody>{registrations.map((registration) => <tr key={registration.id}>
                    <td>{registration.tournament?.nombre ?? "Torneo no disponible"}</td>
                    <td>{categoryNames.get(registration.categoria_id ?? registration.pair?.categoria_id ?? "") ?? "Sin categoria"}</td>
                    <td>{registration.pair?.player_2_id ? `${partnerNames.get(registration.pair.player_2_id) ?? "Jugador no disponible"} · ${registration.pair.estado}` : "Pareja incompleta"}</td>
                    <td>{REGISTRATION_LABELS[registration.estado]}</td>
                    <td>{registration.payment_status ?? "pendiente"}</td>
                    <td><Link href={`/admin/inscripciones/${registration.id}`}>Ver inscripcion</Link></td>
                </tr>)}</tbody>
            </table></div>}
        </section>

        <section className={styles.panel} aria-labelledby="player-points"><h2 id="player-points">Historial de puntos</h2>
            {!points.length ? <div className={styles.empty}><h3>Sin puntos registrados</h3><p>El ledger no contiene puntos para este jugador.</p></div> : <div className={styles.tableWrap}><table className={styles.table}>
                <thead><tr><th scope="col">Fecha</th><th scope="col">Torneo</th><th scope="col">Categoria</th><th scope="col">Ronda</th><th scope="col">Puntos</th></tr></thead>
                <tbody>{points.slice(0, 50).map((point) => <tr key={point.id}><td>{point.fecha}</td><td>{tournamentNames.get(point.tournament_id) ?? "Torneo no disponible"}</td><td>{categoryNames.get(point.categoria_id) ?? "Categoria no disponible"}</td><td>{point.ronda_alcanzada}</td><td>{point.puntos_obtenidos}</td></tr>)}</tbody>
            </table></div>}
            {points.length > 50 && <p className={styles.privateNote}>Se muestran los 50 registros mas recientes de {points.length}.</p>}
        </section>
    </main>;
}
