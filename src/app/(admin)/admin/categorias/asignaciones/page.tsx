import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { formatDate } from "@/lib/format";
import { assignCategory } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage({
    searchParams,
}: {
    searchParams: Promise<{ player?: string; error?: string; ok?: string }>;
}) {
    const { player, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/categorias/asignaciones");

    const [playersRes, catsRes, subsRes, recentRes] = await Promise.all([
        supabase.from("players").select("id,display_name").order("display_name").limit(1000),
        supabase.from("categories").select("id,name").eq("is_active", true).order("display_order"),
        supabase.from("subgroups").select("id,name").eq("is_active", true).order("display_order"),
        supabase
            .from("player_category_history")
            .select("valid_from,valid_to,reason,created_at,players(display_name),categories(name),subgroups(name)")
            .order("created_at", { ascending: false })
            .limit(30),
    ]);

    const players = (playersRes.data ?? []) as any[];
    const categories = (catsRes.data ?? []) as any[];
    const subgroups = (subsRes.data ?? []) as any[];
    const recent = (recentRes.data ?? []) as any[];

    const history = player
        ? (
            (
                await supabase
                    .from("player_category_history")
                    .select("id,valid_from,valid_to,reason,categories(name),subgroups(name)")
                    .eq("player_id", player)
                    .order("valid_from", { ascending: false })
            ).data ?? []
        ) as any[]
        : [];

    const current = history.find((h) => h.valid_to === null);
    const today = new Date().toISOString().slice(0, 10);

    return (
        <>
            <PageHeader eyebrow="Configuración" title="Asignaciones de categoría" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            <p className={styles.alertWarning} style={{ marginBottom: 24 }}>
                Las reglas de ascenso y descenso todavía no están definidas en el reglamento. Los cambios se hacen a mano,
                con motivo y fecha de vigencia.
            </p>

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <form method="get" className={styles.toolbar}>
                    <select className={styles.select} name="player" defaultValue={player ?? ""} required>
                        <option value="" disabled>Selecciona un jugador…</option>
                        {players.map((p) => (
                            <option key={p.id} value={p.id}>{p.display_name}</option>
                        ))}
                    </select>
                    <button className={styles.btnSecondary} type="submit">Ver historial</button>
                </form>
            </section>

            {player && (
                <div className={styles.detailGrid} style={{ marginBottom: 24 }}>
                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>Nuevo cambio</h2>
                        <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                            Actual: <strong>{current ? `${current.categories?.name ?? "—"}${current.subgroups ? ` · ${current.subgroups.name}` : ""}` : "Sin categoría"}</strong>
                        </p>
                        <form action={assignCategory} className={styles.form}>
                            <input type="hidden" name="player_id" value={player} />

                            <label className={styles.field}>
                                <span>Categoría</span>
                                <select name="category_id" required defaultValue="">
                                    <option value="" disabled>Selecciona…</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className={styles.field}>
                                <span>Subgrupo (opcional)</span>
                                <select name="subgroup_id" defaultValue="">
                                    <option value="">Sin subgrupo</option>
                                    {subgroups.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className={styles.field}>
                                <span>Vigente desde</span>
                                <input type="date" name="valid_from" defaultValue={today} required />
                            </label>

                            <label className={styles.field}>
                                <span>Motivo (obligatorio)</span>
                                <textarea name="reason" rows={2} required minLength={5} />
                            </label>

                            <div>
                                <button className={styles.btnPrimary} type="submit">Asignar categoría</button>
                            </div>
                        </form>
                    </section>

                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>Historial del jugador</h2>
                        {history.length === 0 ? (
                            <EmptyState title="Sin historial" text="Este jugador aún no tiene categoría asignada." />
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Categoría</th>
                                            <th>Vigencia</th>
                                            <th>Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h) => (
                                            <tr key={h.id}>
                                                <td>
                                                    {h.categories?.name ?? "—"}
                                                    {h.subgroups ? ` · ${h.subgroups.name}` : ""}
                                                </td>
                                                <td className={styles.muted}>
                                                    {formatDate(h.valid_from)} → {h.valid_to ? formatDate(h.valid_to) : "vigente"}
                                                </td>
                                                <td className={styles.muted}>{h.reason ?? "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            )}

            <section className={styles.card}>
                <h2 className={styles.cardTitle}>Últimos cambios</h2>
                {recent.length === 0 ? (
                    <p className={styles.muted}>Todavía no hay cambios registrados.</p>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Jugador</th>
                                    <th>Categoría</th>
                                    <th>Desde</th>
                                    <th>Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.players?.display_name ?? "—"}</td>
                                        <td>
                                            {r.categories?.name ?? "—"}
                                            {r.subgroups ? ` · ${r.subgroups.name}` : ""}
                                        </td>
                                        <td className={styles.muted}>{formatDate(r.valid_from)}</td>
                                        <td className={styles.muted}>{r.reason ?? "—"}</td>
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