import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { PageHeader, Kpi, StatusBadge, EmptyState } from "@/components/crm/ui";
import { REGISTRATION_STATUS_LABEL, formatDate, formatPoints } from "@/lib/format";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function PlayerDashboard() {
    const { supabase, user } = await requireUser("/jugador");

    const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

    const { data: player } = await supabase
        .from("players")
        .select("id,display_name,player_code")
        .eq("profile_id", user.id)
        .maybeSingle();

    if (!player) {
        return (
            <>
                <PageHeader eyebrow="Bienvenido/a" title={profile?.display_name ?? "Jugador/a"} />
                <p className={styles.alertWarning}>
                    Tu cuenta todavía no está vinculada a un perfil deportivo. Contacta con la organización para activarlo.
                </p>
            </>
        );
    }

    const [points, regs] = await Promise.all([
        supabase.from("point_transactions").select("points").eq("player_id", player.id),
        supabase
            .from("registrations")
            .select("id,status,events(name,starts_at),event_categories(categories(name))")
            .order("submitted_at", { ascending: false })
            .limit(5),
    ]);

    const total = ((points.data ?? []) as any[]).reduce((acc, p) => acc + Number(p.points ?? 0), 0);
    const list = (regs.data ?? []) as any[];
    const upcoming = list.filter((r) => r.status === "confirmed" || r.status === "pending");

    return (
        <>
            <PageHeader eyebrow="Mi resumen" title={`Hola, ${player.display_name.split(" ")[0]}`} />

            <section className={`${styles.grid} ${styles.kpis}`} style={{ marginBottom: 24 }}>
                <Kpi label="Puntos totales" value={formatPoints(total)} />
                <Kpi label="Inscripciones activas" value={upcoming.length} />
                <Kpi label="Código de jugador" value={player.player_code ?? "—"} />
            </section>

            <section className={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h2 className={styles.cardTitle} style={{ margin: 0 }}>Inscripciones recientes</h2>
                    <Link href="/jugador/inscripciones" className={styles.btnGhost}>
                        Ver todas →
                    </Link>
                </div>
                {list.length === 0 ? (
                    <EmptyState
                        title="Aún no te has inscrito"
                        text="Consulta el calendario del circuito y elige tu próxima prueba."
                    />
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                        {list.map((r) => (
                            <li key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                <span>
                                    <strong>{r.events?.name}</strong>
                                    <br />
                                    <span className={styles.muted}>
                                        {r.event_categories?.categories?.name} · {formatDate(r.events?.starts_at)}
                                    </span>
                                </span>
                                <StatusBadge value={r.status} label={REGISTRATION_STATUS_LABEL[r.status]} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}