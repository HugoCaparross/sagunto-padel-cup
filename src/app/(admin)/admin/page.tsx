import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, ClipboardList, Newspaper, Plus, Users } from "lucide-react";
import type { ReactNode } from "react";

import { getAdminDashboardSummary } from "@/lib/services/admin";
import { getTournaments } from "@/lib/services/tournaments";
import styles from "./page.module.css";

function saguntoToday(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Madrid",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Madrid",
    }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export default async function AdminDashboardPage() {
    const [summary, tournaments] = await Promise.all([
        getAdminDashboardSummary(),
        getTournaments(),
    ]);
    const nextTournament = tournaments.find((tournament) =>
        tournament.fecha_inicio >= saguntoToday() && tournament.estado !== "archivado",
    );

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>Sagunto Padel Cup · Administración</span>
                    <h1 className={styles.title}>Panel de control</h1>
                    <p className={styles.description}>Revisa las prioridades de la competición y continúa con la siguiente tarea.</p>
                </div>
                <Link href="/admin/torneos/nuevo" className={styles.primaryButton}><Plus size={17} aria-hidden="true" /> Crear torneo</Link>
            </header>

            <section className={styles.feature} aria-labelledby="next-tournament-heading">
                <div className={styles.featureIcon}><CalendarDays size={21} aria-hidden="true" /></div>
                <div className={styles.featureCopy}>
                    <span className={styles.sectionLabel}>Próxima fecha del circuito</span>
                    {nextTournament ? (
                        <>
                            <h2 id="next-tournament-heading">{nextTournament.nombre}</h2>
                            <p>{formatDate(nextTournament.fecha_inicio)}{nextTournament.fecha_fin !== nextTournament.fecha_inicio ? ` – ${formatDate(nextTournament.fecha_fin)}` : ""} · {nextTournament.estado.replaceAll("_", " ")}</p>
                        </>
                    ) : (
                        <>
                            <h2 id="next-tournament-heading">No hay torneos futuros</h2>
                            <p>Los torneos programados aparecerán aquí cuando tengan una fecha de inicio.</p>
                        </>
                    )}
                </div>
                {nextTournament && <Link href={`/admin/torneos/${nextTournament.id}`} className={styles.featureLink}>Abrir torneo <ArrowRight size={16} aria-hidden="true" /></Link>}
            </section>

            <section className={styles.section} aria-labelledby="priority-heading">
                <div className={styles.sectionHeading}>
                    <div><span className={styles.sectionLabel}>Atención prioritaria</span><h2 id="priority-heading">Tareas pendientes</h2></div>
                    <span className={styles.dataNote}>Datos actuales de Supabase</span>
                </div>
                <div className={styles.priorityGrid}>
                    <PriorityCard label="Pendientes de pago" value={summary.registrations.pendingPayment} href="/admin/inscripciones?estado=pendiente_pago" note="Revisar justificantes y actualizar el estado" tone="warning" />
                    <PriorityCard label="En lista de espera" value={summary.registrations.waitingList} href="/admin/inscripciones?estado=lista_espera" note="Consultar disponibilidad por torneo" tone="neutral" />
                    <PriorityCard label="Torneos con inscripción abierta" value={summary.tournaments.open} href="/admin/torneos?estado=inscripciones_abiertas" note="Revisar el estado de cada convocatoria" tone="info" />
                </div>
            </section>

            <section className={styles.section} aria-labelledby="shortcuts-heading">
                <div className={styles.sectionHeading}>
                    <div><span className={styles.sectionLabel}>Accesos rápidos</span><h2 id="shortcuts-heading">Gestión diaria</h2></div>
                </div>
                <div className={styles.shortcutGrid}>
                    <Shortcut href="/admin/torneos" icon={<CalendarDays size={19} aria-hidden="true" />} title="Torneos" description="Consultar calendario, estados y configuración." />
                    <Shortcut href="/admin/inscripciones" icon={<ClipboardList size={19} aria-hidden="true" />} title="Inscripciones" description="Revisar pagos y check-in de participantes." />
                    <Shortcut href="/admin/jugadores" icon={<Users size={19} aria-hidden="true" />} title="Jugadores" description="Buscar jugadores y consultar su categoría." />
                    <Shortcut href="/admin/ranking" icon={<ClipboardList size={19} aria-hidden="true" />} title="Ranking" description="Consultar puntos y plazas Race to Master." />
                    <Shortcut href="/admin/contenidos" icon={<Newspaper size={19} aria-hidden="true" />} title="Contenidos" description="Crear borradores y gestionar noticias públicas." />
                    <Shortcut href="/admin/competicion" icon={<Activity size={19} aria-hidden="true" />} title="Partidos" description="Programar horarios y pistas; consultar resultados." />
                </div>
            </section>
        </main>
    );
}

function PriorityCard({ label, value, href, note, tone }: { label: string; value: number; href: string; note: string; tone: "warning" | "neutral" | "info" }) {
    return (
        <Link href={href} className={`${styles.priorityCard} ${styles[`tone_${tone}`]}`}>
            <span className={styles.cardTop}><span>{label}</span><ArrowRight size={16} aria-hidden="true" /></span>
            <strong>{value.toLocaleString("es-ES")}</strong>
            <span className={styles.cardNote}>{note}</span>
        </Link>
    );
}

function Shortcut({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
    return <Link href={href} className={styles.shortcut}>{icon}<span><strong>{title}</strong><small>{description}</small></span><ArrowRight className={styles.shortcutArrow} size={17} aria-hidden="true" /></Link>;
}
