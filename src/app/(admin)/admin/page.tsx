import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, Kpi, StatusBadge, EmptyState } from "@/components/crm/ui";
import { REGISTRATION_STATUS_LABEL, EVENT_STATUS_LABEL, formatDate } from "@/lib/format";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    const { supabase } = await requireAdmin();
    const nowIso = new Date().toISOString();

    const [players, pending, confirmed, season, upcoming, recent] = await Promise.all([
        supabase.from("players").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
        supabase.from("seasons").select("id,name,end_date").eq("status", "active").maybeSingle(),
        supabase
            .from("events")
            .select("id,name,starts_at,status")
            .gte("starts_at", nowIso)
            .order("starts_at", { ascending: true })
            .limit(4),
        supabase
            .from("registrations")
            .select("id,status,submitted_at,events(name),registration_players(players(display_name))")
            .order("submitted_at", { ascending: false })
            .limit(8),
    ]);

    const recentRows = (recent.data ?? []) as any[];

    return (
        <>
            <PageHeader eyebrow="Panel de control" title="Resumen operativo" />

            <section className={`${styles.grid} ${styles.kpis}`} style={{ marginBottom: 24 }}>
                <Kpi label="Jugadores activos" value={players.count ?? 0} />
                <Kpi label="Inscripciones pendientes" value={pending.count ?? 0} hint="Requieren revisión" />
                <Kpi label="Inscripciones confirmadas" value={confirmed.count ?? 0} />
                <Kpi
                    label="Temporada activa"
                    value={season.data?.name ?? "—"}
                    hint={season.data ? `Hasta ${formatDate(season.data.end_date)}` : "Sin temporada activa"}
                />
            </section>

            <section className={styles.detailGrid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Próximas pruebas</h2>
                    {(upcoming.data ?? []).length === 0 ? (
                        <EmptyState title="Sin pruebas programadas" text="Cuando crees una prueba aparecerá aquí." />
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                            {(upcoming.data ?? []).map((e: any) => (
                                <li key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                    <span>
                                        <strong>{e.name}</strong>
                                        <br />
                                        <span className={styles.muted}>{formatDate(e.starts_at)}</span>
                                    </span>
                                    <span className={`${styles.badge} ${styles.info}`}>
                                        {EVENT_STATUS_LABEL[e.status] ?? e.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={styles.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h2 className={styles.cardTitle} style={{ margin: 0 }}>Últimas inscripciones</h2>
                        <Link href="/admin/inscripciones" className={styles.btnGhost}>
                            Ver todas →
                        </Link>
                    </div>
                    {recentRows.length === 0 ? (
                        <EmptyState title="Sin inscripciones" text="Las nuevas solicitudes aparecerán aquí." />
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                            {recentRows.map((r) => (
                                <li key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                    <span>
                                        <strong>
                                            {(r.registration_players ?? [])
                                                .map((rp: any) => rp.players?.display_name)
                                                .filter(Boolean)
                                                .join(" / ") || "Pareja sin nombre"}
                                        </strong>
                                        <br />
                                        <span className={styles.muted}>
                                            {r.events?.name} · {formatDate(r.submitted_at)}
                                        </span>
                                    </span>
                                    <StatusBadge value={r.status} label={REGISTRATION_STATUS_LABEL[r.status]} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </>
    );
}