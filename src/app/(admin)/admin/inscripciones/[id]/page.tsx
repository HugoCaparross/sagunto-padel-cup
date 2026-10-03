import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRegistrationHistory, getCategories, requireAdminContext } from "@/lib/services/admin";
import { getRegistrationById } from "@/lib/services/registrations";
import { getPlayerById } from "@/lib/services/players";
import styles from "../../admin-list.module.css";

function dateLabel(value: string | null | undefined): string {
    if (!value) return "No disponible";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "No disponible" : new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }).format(date);
}

function stateLabel(value: string): string {
    return ({ confirmada: "Confirmada", lista_espera: "Lista de espera", pendiente_pago: "Pendiente de pago", cancelada: "Cancelada", verificado: "Verificado", rechazado: "Rechazado", pendiente: "Pendiente", no_requerido: "No requerido" } as Record<string, string>)[value] ?? value;
}

function metadataLabel(value: unknown): string {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key}: ${String(item)}`).join(" · ");
}

export default async function AdminRegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminContext();
    const { id } = await params;
    const registration = await getRegistrationById(id);
    if (!registration) notFound();

    const player2 = registration.pair?.player_2_id ? await getPlayerById(registration.pair.player_2_id) : null;
    const [categories, history] = await Promise.all([getCategories(), getAdminRegistrationHistory(id)]);
    const categoryId = registration.categoria_id ?? registration.pair?.categoria_id;
    const category = categories.find((item) => item.id === categoryId);
    const player1Name = registration.player ? `${registration.player.nombre} ${registration.player.apellidos ?? ""}`.trim() : "Jugador no disponible";
    const player2Name = player2 ? `${player2.nombre} ${player2.apellidos ?? ""}`.trim() : null;

    return <main className={styles.page}>
        <nav className={styles.breadcrumbs} aria-label="Migas de pan"><Link href="/admin">Administracion</Link><span>/</span><Link href="/admin/inscripciones">Inscripciones</Link><span>/</span><span aria-current="page">Detalle</span></nav>
        <header className={styles.header}><div><span className={styles.eyebrow}>Ficha administrativa</span><h1 className={styles.title}>Inscripcion</h1><p className={styles.description}>{registration.tournament?.nombre ?? "Torneo no disponible"}</p></div><Link className={styles.quietButton} href={`/admin/inscripciones?torneo=${registration.tournament_id}`}>Volver al torneo</Link></header>
        <section className={styles.panel} aria-labelledby="registration-data"><h2 id="registration-data">Datos de la inscripcion</h2>
            <dl className={styles.detailGrid}>
                <div><dt>Identificador</dt><dd><code>{registration.id}</code></dd></div>
                <div><dt>Torneo</dt><dd>{registration.tournament?.nombre ?? "No disponible"}</dd></div>
                <div><dt>Categoria</dt><dd>{category?.nombre ?? "No disponible"}</dd></div>
                <div><dt>Estado de inscripcion</dt><dd>{stateLabel(registration.estado)}</dd></div>
                <div><dt>Estado de pago</dt><dd>{stateLabel(registration.payment_status ?? "pendiente")}</dd></div>
                <div><dt>Importe registrado</dt><dd>{registration.importe === null ? "No registrado" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(registration.importe)}</dd></div>
                <div><dt>Metodo de pago</dt><dd>{registration.metodo_pago}</dd></div>
                <div><dt>Check-in</dt><dd>{registration.checked_in ? `Realizado · ${dateLabel(registration.checked_in_at)}` : "Pendiente"}</dd></div>
                <div><dt>Ultima actualizacion</dt><dd>{dateLabel(registration.updated_at)}</dd></div>
                <div><dt>Pareja</dt><dd>{player1Name}{player2Name ? ` / ${player2Name}` : " / Segundo jugador pendiente"}</dd></div>
            </dl>
        </section>
        <section className={styles.panel} aria-labelledby="registration-history"><h2 id="registration-history">Actividad administrativa registrada</h2>
            <p className={styles.privateNote}>Se muestran los eventos presentes en el registro de auditoria. Las operaciones anteriores a su instrumentacion pueden no aparecer.</p>
            {!history.length ? <div className={styles.empty}><h3>Sin eventos de auditoria</h3><p>No hay operaciones registradas para esta inscripcion.</p></div> : <ol className={styles.historyList}>{history.map((event) => <li key={event.id}><strong>{stateLabel(event.accion)}</strong><time dateTime={event.fecha}>{dateLabel(event.fecha)}</time><span>{event.usuario_id ? `Usuario ${event.usuario_id}` : "Usuario no registrado"}</span>{metadataLabel(event.metadata) && <small>{metadataLabel(event.metadata)}</small>}</li>)}</ol>}
        </section>
    </main>;
}
