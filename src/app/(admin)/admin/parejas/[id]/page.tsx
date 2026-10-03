import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminPairDetail } from "@/lib/services/admin";
import styles from "../../admin-list.module.css";

const PAIR_LABELS: Record<string, string> = { confirmada: "Confirmada", lista_espera: "Lista de espera", incompleta: "Incompleta", pendiente_pago: "Pendiente de pago" };

export default async function AdminPairDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const detail = await getAdminPairDetail(id);
    if (!detail) notFound();
    const playerLabel = (player: { nombre: string; apellidos: string | null } | null) => player ? `${player.nombre} ${player.apellidos ?? ""}`.trim() : "Jugador pendiente";
    return <main className={styles.page}>
        <nav className={styles.breadcrumbs} aria-label="Migas de pan"><Link href="/admin">Administración</Link><span>/</span><Link href="/admin/parejas">Parejas</Link><span>/</span><span aria-current="page">Detalle</span></nav>
        <header className={styles.header}><div><span className={styles.eyebrow}>Ficha de pareja</span><h1 className={styles.title}>{playerLabel(detail.player1)} / {playerLabel(detail.player2)}</h1><p className={styles.description}>{detail.tournament?.nombre ?? "Torneo no disponible"} · {detail.category?.nombre ?? "Categoría no disponible"}</p></div><Link className={styles.quietButton} href="/admin/parejas">Volver a parejas</Link></header>
        <section className={styles.panel} aria-labelledby="pair-info"><h2 id="pair-info">Datos de la pareja</h2><dl className={styles.detailGrid}>
            <div><dt>Identificador</dt><dd><code>{detail.pair.id}</code></dd></div><div><dt>Estado</dt><dd>{PAIR_LABELS[detail.pair.estado]}</dd></div>
            <div><dt>Torneo</dt><dd>{detail.tournament?.nombre ?? "No disponible"}</dd></div><div><dt>Categoría</dt><dd>{detail.category?.nombre ?? "No disponible"}</dd></div>
            <div><dt>Inscripción</dt><dd>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(new Date(detail.pair.fecha_inscripcion))}</dd></div>
        </dl><p className={styles.privateNote}>La composición es de solo consulta. No se habilitan sustituciones sin una regla aprobada y un historial transaccional.</p></section>
        <section className={styles.panel} aria-labelledby="pair-registration"><h2 id="pair-registration">Inscripciones</h2>{!detail.registrations.length ? <div className={styles.empty}><p>No hay inscripción asociada a esta pareja.</p></div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Estado</th><th>Pago</th><th>Check-in</th><th>Ficha</th></tr></thead><tbody>{detail.registrations.map((registration) => <tr key={registration.id}><td>{registration.estado}</td><td>{registration.payment_status}</td><td>{registration.checked_in ? "Realizado" : "Pendiente"}</td><td><Link href={`/admin/inscripciones/${registration.id}`}>Ver inscripción</Link></td></tr>)}</tbody></table></div>}</section>
        <section className={styles.panel} aria-labelledby="pair-matches"><h2 id="pair-matches">Partidos relacionados</h2>{!detail.matches.length ? <div className={styles.empty}><p>No hay partidos asociados a esta pareja.</p></div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Fase</th><th>Estado</th><th>Fecha</th><th>Resultado</th></tr></thead><tbody>{detail.matches.map((match) => <tr key={match.id}><td>{match.fase}</td><td>{match.estado}</td><td>{match.hora_programada ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }).format(new Date(match.hora_programada)) : "Sin programar"}</td><td>{match.resultado_json ? "Resultado registrado" : "Sin resultado"}</td></tr>)}</tbody></table></div>}</section>
    </main>;
}
