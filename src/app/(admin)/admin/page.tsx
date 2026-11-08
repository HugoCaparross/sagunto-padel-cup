import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/crm/ui";
import { formatDate } from "@/lib/format";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

type Task = {
    id: string;
    priority: 1 | 2 | 3;
    count?: number;
    title: string;
    detail: string;
    href: string;
};

const PRIORITY_LABEL: Record<1 | 2 | 3, string> = {
    1: "Urgente",
    2: "Pendiente",
    3: "Revisar",
};

export default async function AdminHome() {
    const { supabase } = await requireAdmin("/admin");

    const now = new Date();
    const nowIso = now.toISOString();
    const today = nowIso.slice(0, 10);
    const in60 = new Date(now.getTime() + 60 * 86400000).toISOString();

    const [
        pendingRegs,
        toValidate,
        openIncidents,
        draftEvents,
        unscheduled,
        dueNews,
        endedSeasons,
        resultRows,
        activeBatches,
    ] = await Promise.all([
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "finished_pending_validation"),
        supabase.from("incidents").select("id", { count: "exact", head: true }).neq("status", "resolved"),
        supabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .eq("status", "draft")
            .gte("starts_at", nowIso)
            .lte("starts_at", in60),
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "scheduled").is("scheduled_at", null),
        supabase
            .from("news")
            .select("id", { count: "exact", head: true })
            .eq("status", "scheduled")
            .lte("scheduled_at", nowIso),
        supabase.from("seasons").select("id,name,end_date").eq("status", "active").lt("end_date", today),
        supabase.from("registration_results").select("event_id"),
        supabase.from("event_point_batches").select("event_id").eq("status", "active"),
    ]);

    const withPoints = new Set(((activeBatches.data ?? []) as any[]).map((b) => b.event_id));
    const eventsWithoutPoints = new Set(
        ((resultRows.data ?? []) as any[]).map((r) => r.event_id).filter((id) => !withPoints.has(id)),
    );

    const tasks: Task[] = [];

    if ((pendingRegs.count ?? 0) > 0) {
        tasks.push({
            id: "regs",
            priority: 1,
            count: pendingRegs.count ?? 0,
            title: "Inscripciones por confirmar",
            detail: "Solicitudes pendientes de revisión",
            href: "/admin/inscripciones",
        });
    }

    if ((toValidate.count ?? 0) > 0) {
        tasks.push({
            id: "validate",
            priority: 1,
            count: toValidate.count ?? 0,
            title: "Partidos por validar",
            detail: "Marcador guardado, pendiente de validación",
            href: "/admin/resultados",
        });
    }

    if ((openIncidents.count ?? 0) > 0) {
        tasks.push({
            id: "incidents",
            priority: 1,
            count: openIncidents.count ?? 0,
            title: "Incidencias abiertas",
            detail: "Problemas registrados sin resolver",
            href: "/admin/auditoria",
        });
    }

    for (const s of (endedSeasons.data ?? []) as any[]) {
        tasks.push({
            id: `closure-${s.id}`,
            priority: 1,
            title: `Cierre 70/30 pendiente: ${s.name}`,
            detail: `La temporada terminó el ${formatDate(s.end_date)}`,
            href: `/admin/cierre?season=${s.id}`,
        });
    }

    if ((draftEvents.count ?? 0) > 0) {
        tasks.push({
            id: "draft-events",
            priority: 2,
            count: draftEvents.count ?? 0,
            title: "Pruebas en borrador próximas",
            detail: "Empiezan en los próximos 60 días y aún no están publicadas",
            href: "/admin/pruebas",
        });
    }

    if ((unscheduled.count ?? 0) > 0) {
        tasks.push({
            id: "unscheduled",
            priority: 2,
            count: unscheduled.count ?? 0,
            title: "Partidos sin horario",
            detail: "Asigna pista y hora desde el cuadro",
            href: "/admin/cuadros",
        });
    }

    if (eventsWithoutPoints.size > 0) {
        tasks.push({
            id: "points",
            priority: 2,
            count: eventsWithoutPoints.size,
            title: "Pruebas con resultados sin puntos",
            detail: "Resultados guardados que todavía no suman puntos",
            href: "/admin/pruebas",
        });
    }

    if ((dueNews.count ?? 0) > 0) {
        tasks.push({
            id: "news",
            priority: 3,
            count: dueNews.count ?? 0,
            title: "Noticias programadas sin publicar",
            detail: "La fecha ya ha pasado. Publícalas desde Noticias",
            href: "/admin/noticias",
        });
    }

    tasks.sort((a, b) => a.priority - b.priority);

    return (
        <>
            <PageHeader eyebrow="Inicio" title="Pendientes" />

            {tasks.length === 0 ? (
                <section className={styles.card}>
                    <p className={styles.muted} style={{ margin: 0 }}>
                        No hay nada pendiente.
                    </p>
                </section>
            ) : (
                <div style={{ display: "grid", gap: 24 }}>
                    {([1, 2, 3] as const).map((p) => {
                        const group = tasks.filter((t) => t.priority === p);
                        if (group.length === 0) return null;
                        return (
                            <section key={p}>
                                <p className={styles.eyebrow}>{PRIORITY_LABEL[p]}</p>
                                <div style={{ display: "grid", gap: 8 }}>
                                    {group.map((t) => (
                                        <Link
                                            key={t.id}
                                            href={t.href}
                                            className={styles.card}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 16,
                                                textDecoration: "none",
                                                color: "inherit",
                                            }}
                                        >
                                            {t.count !== undefined && (
                                                <strong
                                                    style={{
                                                        fontFamily: "var(--font-oswald), Impact, sans-serif",
                                                        fontSize: 28,
                                                        color: "#0D1B2A",
                                                        minWidth: 44,
                                                    }}
                                                >
                                                    {t.count}
                                                </strong>
                                            )}
                                            <span style={{ flex: 1 }}>
                                                <strong>{t.title}</strong>
                                                <br />
                                                <span className={styles.muted} style={{ fontSize: 13 }}>
                                                    {t.detail}
                                                </span>
                                            </span>
                                            <span style={{ color: "#F0443A", fontWeight: 600, whiteSpace: "nowrap" }}>
                                                Resolver →
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </>
    );
}