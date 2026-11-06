import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, StatusBadge, EmptyState, Kpi } from "@/components/crm/ui";
import {
    PLAYER_STATUS_LABEL,
    REGISTRATION_STATUS_LABEL,
    TRANSACTION_LABEL,
    formatDate,
    formatPoints,
} from "@/lib/format";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function PlayerDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { supabase } = await requireAdmin(`/admin/jugadores/${id}`);

    const { data: player } = await supabase
        .from("players")
        .select(
            "id,player_code,display_name,status,profile_id,created_at,player_category_history(valid_from,valid_to,reason,categories(name),subgroups(name))",
        )
        .eq("id", id)
        .maybeSingle();

    if (!player) notFound();

    const [regs, points] = await Promise.all([
        supabase
            .from("registration_players")
            .select("registrations(id,status,submitted_at,events(name,starts_at),event_categories(categories(name)))")
            .eq("player_id", id),
        supabase
            .from("point_transactions")
            .select("points,transaction_type,reason,created_at,events(name),seasons(name)")
            .eq("player_id", id)
            .order("created_at", { ascending: false }),
    ]);

    const registrations = ((regs.data ?? []) as any[]).map((r) => r.registrations).filter(Boolean);
    const txs = (points.data ?? []) as any[];
    const total = txs.reduce((acc, t) => acc + Number(t.points ?? 0), 0);
    const history = [...((player as any).player_category_history ?? [])].sort((a: any, b: any) =>
        a.valid_from < b.valid_from ? 1 : -1,
    );
    const currentCategory = history.find((h: any) => h.valid_to === null);

    return (
        <>
            <PageHeader
                eyebrow="CRM · Ficha de jugador"
                title={player.display_name}
                actions={
                    <Link className={styles.btnSecondary} href="/admin/jugadores">
                        ← Volver al listado
                    </Link>
                }
            />

            <section className={`${styles.grid} ${styles.kpis}`} style={{ marginBottom: 24 }}>
                <Kpi label="Puntos acumulados" value={formatPoints(total)} hint="Suma de movimientos" />
                <Kpi label="Inscripciones" value={registrations.length} />
                <Kpi label="Categoría actual" value={currentCategory?.categories?.name ?? "—"} />
            </section>

            <section className={styles.detailGrid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Datos</h2>
                    <dl className={styles.dl}>
                        <dt>Código</dt>
                        <dd>{player.player_code ?? "—"}</dd>
                        <dt>Estado</dt>
                        <dd>
                            <StatusBadge value={player.status} label={PLAYER_STATUS_LABEL[player.status]} />
                        </dd>
                        <dt>Cuenta vinculada</dt>
                        <dd>{player.profile_id ? "Sí" : "No"}</dd>
                        <dt>Alta</dt>
                        <dd>{formatDate(player.created_at)}</dd>
                    </dl>

                    <h3 className={styles.cardTitle} style={{ marginTop: 24 }}>
                        Historial de categorías
                    </h3>
                    {history.length === 0 ? (
                        <p className={styles.muted}>Sin registros.</p>
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                            {history.map((h: any, i: number) => (
                                <li key={i}>
                                    <strong>
                                        {h.categories?.name}
                                        {h.subgroups ? ` · ${h.subgroups.name}` : ""}
                                    </strong>
                                    <br />
                                    <span className={styles.muted}>
                                        {formatDate(h.valid_from)} → {h.valid_to ? formatDate(h.valid_to) : "vigente"}
                                        {h.reason ? ` · ${h.reason}` : ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Inscripciones</h2>
                        {registrations.length === 0 ? (
                            <EmptyState
                                title="Sin inscripciones"
                                text="Este jugador aún no se ha inscrito a ninguna prueba."
                            />
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Prueba</th>
                                            <th>Categoría</th>
                                            <th>Fecha</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map((r: any) => (
                                            <tr key={r.id}>
                                                <td>{r.events?.name ?? "—"}</td>
                                                <td>{r.event_categories?.categories?.name ?? "—"}</td>
                                                <td className={styles.muted}>{formatDate(r.submitted_at)}</td>
                                                <td>
                                                    <StatusBadge value={r.status} label={REGISTRATION_STATUS_LABEL[r.status]} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Movimientos de puntos</h2>
                        {txs.length === 0 ? (
                            <EmptyState title="Sin puntos" text="Los puntos aparecerán tras validar resultados." />
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Prueba</th>
                                            <th>Tipo</th>
                                            <th>Puntos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {txs.map((t, i) => (
                                            <tr key={i}>
                                                <td className={styles.muted}>{formatDate(t.created_at)}</td>
                                                <td>{t.events?.name ?? t.seasons?.name ?? "—"}</td>
                                                <td>
                                                    {TRANSACTION_LABEL[t.transaction_type] ?? t.transaction_type}
                                                    {t.reason ? ` · ${t.reason}` : ""}
                                                </td>
                                                <td>
                                                    <strong>{formatPoints(t.points)}</strong>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}