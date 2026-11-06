import { requireUser } from "@/lib/auth/session";
import { PageHeader, EmptyState, Kpi } from "@/components/crm/ui";
import { TRANSACTION_LABEL, formatDate, formatPoints } from "@/lib/format";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function MyHistory() {
    const { supabase } = await requireUser("/jugador/historial");

    const { data: player } = await supabase.from("players").select("id").maybeSingle();

    let txs: any[] = [];
    if (player) {
        const { data } = await supabase
            .from("point_transactions")
            .select("points,transaction_type,reason,created_at,events(name),seasons(name)")
            .eq("player_id", player.id)
            .order("created_at", { ascending: false });
        txs = (data ?? []) as any[];
    }

    const total = txs.reduce((acc, t) => acc + Number(t.points ?? 0), 0);

    return (
        <>
            <PageHeader eyebrow="Mi actividad" title="Mi historial de puntos" />

            <section className={`${styles.grid} ${styles.kpis}`} style={{ marginBottom: 24 }}>
                <Kpi label="Total acumulado" value={formatPoints(total)} hint="Todas las temporadas" />
                <Kpi label="Movimientos" value={txs.length} />
            </section>

            {txs.length === 0 ? (
                <EmptyState
                    title="Sin movimientos"
                    text="Tus puntos aparecerán aquí cuando se validen los resultados."
                />
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Prueba / temporada</th>
                                <th>Concepto</th>
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
        </>
    );
}