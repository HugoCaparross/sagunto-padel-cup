import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState, Kpi } from "@/components/crm/ui";
import { formatDate, formatPoints } from "@/lib/format";
import { createRankingSnapshot } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

const SNAPSHOT_LABEL: Record<string, string> = {
    live: "En vivo",
    pre_close: "Antes del cierre",
    post_close: "Después del cierre",
    published: "Publicado",
    master_final: "Máster",
};

export default async function RankingAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ season?: string; error?: string; ok?: string }>;
}) {
    const { season, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/ranking");

    const { data: seasonsData } = await supabase
        .from("seasons")
        .select("id,name,status,start_date,end_date")
        .order("start_date", { ascending: false });

    const seasons = (seasonsData ?? []) as any[];
    const selected =
        seasons.find((s) => s.id === season) ??
        seasons.find((s) => s.status === "active") ??
        seasons[0] ??
        null;

    if (!selected) {
        return (
            <>
                <PageHeader eyebrow="Clasificación" title="Ranking" />
                <EmptyState title="Sin temporadas" text="Crea una temporada para ver su ranking." />
            </>
        );
    }

    const isClosed = selected.status === "closed" || selected.status === "archived";

    const [rankRes, snapsRes, preRes, discRes] = await Promise.all([
        supabase.rpc("get_ranking_live", { p_season_id: selected.id }),
        supabase
            .from("ranking_snapshots")
            .select("id,snapshot_type,as_of,is_public")
            .eq("season_id", selected.id)
            .order("as_of", { ascending: false })
            .limit(10),
        supabase
            .from("ranking_snapshots")
            .select("id")
            .eq("season_id", selected.id)
            .eq("snapshot_type", "pre_close")
            .order("as_of", { ascending: false })
            .limit(1)
            .maybeSingle(),
        isClosed
            ? supabase.rpc("closure_discrepancies", { p_season_id: selected.id })
            : Promise.resolve({ data: [], error: null }),
    ]);

    const rows = (rankRes.data ?? []) as any[];
    const snapshots = (snapsRes.data ?? []) as any[];
    const discrepancies = (discRes.data ?? []) as any[];

    const preId = (preRes.data as any)?.id as string | undefined;
    const preMap = new Map<string, number>();
    if (preId) {
        const { data } = await supabase
            .from("ranking_snapshot_entries")
            .select("player_id,points_before_close")
            .eq("snapshot_id", preId);
        for (const e of (data ?? []) as any[]) {
            preMap.set(e.player_id, Number(e.points_before_close ?? 0));
        }
    }

    const total = rows.reduce((acc, r) => acc + Number(r.points ?? 0), 0);
    const average = rows.length ? total / rows.length : 0;

    return (
        <>
            <PageHeader eyebrow="Clasificación" title={`Ranking · ${selected.name}`} />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}
            {rankRes.error && (
                <p className={styles.alertError} role="alert">
                    No se pudo calcular el ranking: {rankRes.error.message}
                </p>
            )}

            <form method="get" className={styles.toolbar}>
                <select className={styles.select} name="season" defaultValue={selected.id}>
                    {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name} ({s.status})
                        </option>
                    ))}
                </select>
                <button className={styles.btnSecondary} type="submit">Ver temporada</button>
            </form>

            <section className={`${styles.grid} ${styles.kpis}`} style={{ marginBottom: 24 }}>
                <Kpi label="Jugadores con puntos" value={rows.length} />
                <Kpi label="Puntos totales" value={formatPoints(total)} />
                <Kpi label="Media por jugador" value={formatPoints(average.toFixed(2))} />
                <Kpi label="Estado" value={isClosed ? "Cerrada" : "En curso"} hint={isClosed ? "Cierre 70/30 aplicado" : undefined} />
            </section>

            {rows.length === 0 ? (
                <EmptyState title="Sin puntos" text="El ranking aparecerá cuando se asignen puntos en esta temporada." />
            ) : (
                <div className={styles.tableWrap} style={{ marginBottom: 24 }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Pos.</th>
                                <th>Jugador</th>
                                <th>Categoría</th>
                                <th>Pruebas</th>
                                <th>Puntos</th>
                                {preId && <th>Antes del cierre</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.player_id}>
                                    <td><strong>{r.rank_position}</strong></td>
                                    <td>
                                        <Link href={`/admin/jugadores/${r.player_id}`}>{r.display_name}</Link>
                                    </td>
                                    <td className={styles.muted}>
                                        {r.category_name ?? "—"}
                                        {r.subgroup_name ? ` · ${r.subgroup_name}` : ""}
                                    </td>
                                    <td>{r.events_played}</td>
                                    <td><strong>{formatPoints(r.points)}</strong></td>
                                    {preId && (
                                        <td className={styles.muted}>
                                            {preMap.has(r.player_id) ? formatPoints(preMap.get(r.player_id)) : "—"}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={styles.detailGrid}>
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>Guardar y publicar</h2>

                    <form action={createRankingSnapshot} className={styles.form} style={{ marginBottom: 20 }}>
                        <input type="hidden" name="season_id" value={selected.id} />
                        <input type="hidden" name="type" value="live" />
                        <p className={styles.muted} style={{ fontSize: 13, margin: 0 }}>
                            Guarda una foto del ranking actual. No cambia lo que ve el público.
                        </p>
                        <div>
                            <button className={styles.btnSecondary} type="submit">Guardar snapshot en vivo</button>
                        </div>
                    </form>

                    <form action={createRankingSnapshot} className={styles.form}>
                        <input type="hidden" name="season_id" value={selected.id} />
                        <input type="hidden" name="type" value="published" />
                        <p className={styles.muted} style={{ fontSize: 13, margin: 0 }}>
                            Publica el ranking como oficial. El anterior publicado deja de ser público, pero se conserva.
                        </p>
                        <label className={styles.check}>
                            <input type="checkbox" name="confirm" />
                            <span>Confirmo que quiero publicar este ranking</span>
                        </label>
                        <div>
                            <button className={styles.btnPrimary} type="submit">Publicar ranking</button>
                        </div>
                    </form>
                </section>

                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>Snapshots</h2>
                    {snapshots.length === 0 ? (
                        <p className={styles.muted}>Todavía no hay snapshots de esta temporada.</p>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Fecha</th>
                                        <th>Público</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {snapshots.map((s) => (
                                        <tr key={s.id}>
                                            <td>{SNAPSHOT_LABEL[s.snapshot_type] ?? s.snapshot_type}</td>
                                            <td className={styles.muted}>{formatDate(s.as_of)}</td>
                                            <td>{s.is_public ? "Sí" : "No"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            <section className={styles.card} style={{ marginTop: 24 }}>
                <h2 className={styles.cardTitle}>Discrepancias tras el cierre</h2>
                {!isClosed ? (
                    <p className={styles.muted}>Disponible cuando la temporada tenga un cierre 70/30 completado.</p>
                ) : discrepancies.length === 0 ? (
                    <p className={styles.alertSuccess} style={{ margin: 0 }}>
                        Todo cuadra: los puntos actuales coinciden con los puntos finales del cierre.
                    </p>
                ) : (
                    <>
                        <p className={styles.alertError}>
                            Hay {discrepancies.length} jugador(es) cuyos puntos no coinciden con el cierre. Revísalos antes de publicar.
                        </p>
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Jugador</th>
                                        <th>Esperado</th>
                                        <th>Actual</th>
                                        <th>Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {discrepancies.map((d) => (
                                        <tr key={d.player_id}>
                                            <td>
                                                <Link href={`/admin/jugadores/${d.player_id}`}>{d.display_name}</Link>
                                            </td>
                                            <td>{formatPoints(d.expected)}</td>
                                            <td>{formatPoints(d.actual)}</td>
                                            <td><strong>{formatPoints(d.diff)}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>
        </>
    );
}