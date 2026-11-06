import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { formatDate, formatPoints } from "@/lib/format";
import { executeSeasonClosure } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function ClosurePage({
    searchParams,
}: {
    searchParams: Promise<{ season?: string; error?: string; ok?: string }>;
}) {
    const { season, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/cierre");

    const { data: seasonsData } = await supabase
        .from("seasons")
        .select("id,name,status,start_date,end_date")
        .order("start_date", { ascending: false });

    const seasons = (seasonsData ?? []) as any[];
    const selected =
        seasons.find((s) => s.id === season) ??
        seasons.find((s) => s.status !== "closed" && s.status !== "archived") ??
        null;

    const isOpen = !!selected && selected.status !== "closed" && selected.status !== "archived";
    const nextCandidates = selected
        ? seasons.filter(
            (s) =>
                s.id !== selected.id &&
                s.start_date > selected.start_date &&
                (s.status === "draft" || s.status === "active"),
        )
        : [];

    let preview: any[] = [];
    let closures: any[] = [];

    if (selected) {
        if (isOpen) {
            const { data } = await supabase.rpc("preview_season_closure", { p_season_id: selected.id });
            preview = (data ?? []) as any[];
        }
        const { data } = await supabase
            .from("season_closures")
            .select("id,revision_number,status,completed_at,carryover_percentage")
            .eq("season_id", selected.id)
            .order("revision_number", { ascending: false });
        closures = (data ?? []) as any[];
    }

    const totals = preview.reduce(
        (acc, r) => ({
            before: acc.before + Number(r.points_before),
            carried: acc.carried + Number(r.points_carried),
            discarded: acc.discarded + Number(r.points_discarded),
        }),
        { before: 0, carried: 0, discarded: 0 },
    );

    return (
        <>
            <PageHeader eyebrow="Ranking" title="Cierre 70/30" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            <form method="get" className={styles.toolbar}>
                <select className={styles.select} name="season" defaultValue={selected?.id ?? ""}>
                    {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name} ({s.status})
                        </option>
                    ))}
                </select>
                <button className={styles.btnSecondary} type="submit">Ver temporada</button>
            </form>

            {!selected ? (
                <EmptyState title="Sin temporadas" text="Crea una temporada en el apartado Temporadas." />
            ) : !isOpen ? (
                <p className={styles.alertWarning}>Esta temporada ya está cerrada. No se puede volver a ejecutar el cierre.</p>
            ) : (
                <>
                    <section className={styles.card} style={{ marginBottom: 24 }}>
                        <h2 className={styles.cardTitle}>Previsualización: {selected.name}</h2>
                        <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                            Se conserva el {selected.carryover_percentage} % de los puntos (redondeo: {selected.rounding_method}).
                            Nada cambia hasta que confirmes.
                        </p>

                        {preview.length === 0 ? (
                            <EmptyState title="Sin puntos que cerrar" text="Aún no hay movimientos de puntos en esta temporada." />
                        ) : (
                            <>
                                <div className={styles.tableWrap} style={{ marginBottom: 16 }}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Jugador</th>
                                                <th>Antes</th>
                                                <th>Se conserva</th>
                                                <th>Se elimina</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((r) => (
                                                <tr key={r.player_id}>
                                                    <td>{r.display_name}</td>
                                                    <td>{formatPoints(r.points_before)}</td>
                                                    <td><strong>{formatPoints(r.points_carried)}</strong></td>
                                                    <td className={styles.muted}>{formatPoints(r.points_discarded)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className={styles.muted} style={{ fontSize: 13 }}>
                                    Total: {formatPoints(totals.before)} antes · {formatPoints(totals.carried)} conservados · {formatPoints(totals.discarded)} eliminados
                                </p>

                                <form action={executeSeasonClosure} className={styles.form} style={{ marginTop: 20 }}>
                                    <input type="hidden" name="season_id" value={selected.id} />

                                    <label className={styles.field}>
                                        <span>Temporada siguiente (recibe el 30 %)</span>
                                        <select name="next_season_id" defaultValue="">
                                            <option value="">Ninguna por ahora</option>
                                            {nextCandidates.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className={styles.check}>
                                        <input type="checkbox" name="confirm" />
                                        <span>Entiendo que el cierre es irreversible y solo se puede ejecutar una vez.</span>
                                    </label>

                                    <div>
                                        <button className={styles.btnPrimary} type="submit">Ejecutar cierre 70/30</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </section>
                </>
            )}

            <section className={styles.card}>
                <h2 className={styles.cardTitle}>Historial de cierres</h2>
                {closures.length === 0 ? (
                    <p className={styles.muted}>Esta temporada no tiene cierres registrados.</p>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Revisión</th><th>Estado</th><th>Conservado</th><th>Completado</th></tr>
                            </thead>
                            <tbody>
                                {closures.map((c) => (
                                    <tr key={c.id}>
                                        <td>{c.revision_number}</td>
                                        <td>{c.status}</td>
                                        <td>{c.carryover_percentage} %</td>
                                        <td className={styles.muted}>{formatDate(c.completed_at)}</td>
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