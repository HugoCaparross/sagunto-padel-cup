import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { formatDate, formatPoints } from "@/lib/format";
import { createPointsAdjustment } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function AdjustmentsPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; ok?: string }>;
}) {
    const { error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/ajustes");

    const [playersRes, seasonsRes, adjRes] = await Promise.all([
        supabase.from("players").select("id,display_name").order("display_name").limit(500),
        supabase
            .from("seasons")
            .select("id,name,status")
            .in("status", ["draft", "active"])
            .order("start_date", { ascending: false }),
        supabase
            .from("point_transactions")
            .select("points,reason,created_at,players(display_name),seasons(name)")
            .eq("transaction_type", "manual_adjustment")
            .order("created_at", { ascending: false })
            .limit(100),
    ]);

    const players = (playersRes.data ?? []) as any[];
    const seasons = (seasonsRes.data ?? []) as any[];
    const rows = (adjRes.data ?? []) as any[];

    return (
        <>
            <PageHeader eyebrow="Ranking" title="Ajustes de puntos" />

            {error && (
                <p className={styles.alertError} role="alert">
                    {error}
                </p>
            )}
            {ok && (
                <p className={styles.alertSuccess} role="status">
                    {ok}
                </p>
            )}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>Nuevo ajuste</h2>
                <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                    Usa un valor negativo para restar puntos. Los ajustes no sustituyen a la asignación de
                    resultados: sirven para correcciones excepcionales con motivo claro.
                </p>

                {seasons.length === 0 ? (
                    <p className={styles.alertWarning}>No hay temporadas abiertas para registrar ajustes.</p>
                ) : (
                    <form action={createPointsAdjustment} className={styles.form}>
                        <div className={styles.toolbar}>
                            <select className={styles.select} name="player_id" required defaultValue="">
                                <option value="" disabled>
                                    Jugador…
                                </option>
                                {players.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.display_name}
                                    </option>
                                ))}
                            </select>
                            <select className={styles.select} name="season_id" required defaultValue="">
                                <option value="" disabled>
                                    Temporada…
                                </option>
                                {seasons.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                className={styles.input}
                                type="number"
                                step="0.01"
                                name="points"
                                placeholder="Puntos (ej. 10 o -5)"
                                required
                            />
                        </div>
                        <label className={styles.field}>
                            <span>Motivo (obligatorio)</span>
                            <textarea name="reason" rows={2} required minLength={5} />
                        </label>
                        <div>
                            <button className={styles.btnPrimary} type="submit">
                                Registrar ajuste
                            </button>
                        </div>
                    </form>
                )}
            </section>

            <section className={styles.card}>
                <h2 className={styles.cardTitle}>Últimos ajustes</h2>
                {rows.length === 0 ? (
                    <EmptyState title="Sin ajustes" text="Los ajustes manuales aparecerán aquí." />
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Jugador</th>
                                    <th>Temporada</th>
                                    <th>Puntos</th>
                                    <th>Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i}>
                                        <td className={styles.muted}>{formatDate(r.created_at)}</td>
                                        <td>{r.players?.display_name ?? "—"}</td>
                                        <td className={styles.muted}>{r.seasons?.name ?? "—"}</td>
                                        <td>
                                            <strong>{formatPoints(r.points)}</strong>
                                        </td>
                                        <td>{r.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}