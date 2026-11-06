import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState, StatusBadge } from "@/components/crm/ui";
import { formatDate } from "@/lib/format";
import { MASTER_STATUS_LABEL, MASTER_EDITABLE, MASTER_LOCKED_EVENT_STATUS } from "@/lib/master";
import { createMasterFinal, recalculateCandidates, setQualificationStatus } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function MasterPage({
    searchParams,
}: {
    searchParams: Promise<{ event?: string; error?: string; ok?: string }>;
}) {
    const { event: eventParam, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/master");

    const [mastersRes, seasonsRes] = await Promise.all([
        supabase
            .from("events")
            .select("id,name,status,starts_at,season_id,seasons(name)")
            .eq("event_type", "master_final")
            .order("starts_at", { ascending: true, nullsFirst: false }),
        supabase
            .from("seasons")
            .select("id,name,status")
            .in("status", ["draft", "active"])
            .order("start_date", { ascending: false }),
    ]);

    const masters = (mastersRes.data ?? []) as any[];
    const seasons = (seasonsRes.data ?? []) as any[];
    const master = masters.find((m) => m.id === eventParam) ?? masters[0] ?? null;
    const locked = master ? MASTER_LOCKED_EVENT_STATUS.includes(master.status) : false;

    let quals: any[] = [];
    if (master) {
        const { data } = await supabase
            .from("master_final_qualifications")
            .select(
                "id,ranking_position,eligibility_status,qualification_reason,players(display_name,player_category_history(valid_to,categories(name,display_order)))",
            )
            .eq("event_id", master.id);
        quals = (data ?? []) as any[];
    }

    const groups = new Map<string, { order: number; rows: any[] }>();
    for (const q of quals) {
        const cur = (q.players?.player_category_history ?? []).find((h: any) => h.valid_to === null);
        const name = cur?.categories?.name ?? "Sin categoría";
        const order = cur?.categories?.display_order ?? 99;
        if (!groups.has(name)) groups.set(name, { order, rows: [] });
        groups.get(name)!.rows.push(q);
    }
    const sortedGroups = [...groups.entries()].sort((a, b) => a[1].order - b[1].order);

    const confirmedCount = quals.filter((q) => q.eligibility_status === "confirmed").length;

    return (
        <>
            <PageHeader eyebrow="Competición" title="Máster Final" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            {!master ? (
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>Crear el Máster Final</h2>
                    {seasons.length === 0 ? (
                        <p className={styles.alertWarning}>Crea primero una temporada en Temporadas.</p>
                    ) : (
                        <form action={createMasterFinal} className={styles.toolbar}>
                            <select className={styles.select} name="season_id" required defaultValue="">
                                <option value="" disabled>Temporada…</option>
                                {seasons.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <input className={styles.input} name="name" defaultValue="Máster Final" />
                            <label className={styles.field}>
                                <span>Fecha y hora (Madrid)</span>
                                <input type="datetime-local" name="starts_at" />
                            </label>
                            <button className={styles.btnPrimary} type="submit">Crear Máster</button>
                        </form>
                    )}
                </section>
            ) : (
                <>
                    <section className={styles.card} style={{ marginBottom: 24 }}>
                        <div className={styles.toolbar} style={{ justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2 className={styles.cardTitle} style={{ margin: 0 }}>{master.name}</h2>
                                <p className={styles.muted} style={{ margin: "4px 0 0", fontSize: 13 }}>
                                    {master.seasons?.name} · {formatDate(master.starts_at)} ·{" "}
                                    {confirmedCount} confirmados
                                </p>
                            </div>
                            {masters.length > 1 && (
                                <form method="get" className={styles.toolbar} style={{ margin: 0 }}>
                                    <select className={styles.select} name="event" defaultValue={master.id}>
                                        {masters.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <button className={styles.btnSecondary} type="submit">Ver</button>
                                </form>
                            )}
                        </div>

                        {locked ? (
                            <p className={styles.alertWarning} style={{ marginTop: 16 }}>
                                La lista está cerrada. No se pueden recalcular ni cambiar estados.
                            </p>
                        ) : (
                            <form action={recalculateCandidates} className={styles.toolbar} style={{ marginTop: 16 }}>
                                <input type="hidden" name="event_id" value={master.id} />
                                <label className={styles.field}>
                                    <span>Plazas por categoría</span>
                                    <input type="number" name="places" min={1} defaultValue={6} />
                                </label>
                                <label className={styles.field}>
                                    <span>Mínimo de pruebas en la temporada</span>
                                    <input type="number" name="min_events" min={0} defaultValue={1} />
                                </label>
                                <button className={styles.btnPrimary} type="submit">Calcular candidatos</button>
                            </form>
                        )}
                    </section>

                    {sortedGroups.length === 0 ? (
                        <EmptyState
                            title="Sin candidatos calculados"
                            text="Pulsa Calcular candidatos para generar la clasificación por categoría."
                        />
                    ) : (
                        sortedGroups.map(([name, group]) => {
                            const rows = [...group.rows].sort(
                                (x, y) => (x.ranking_position ?? 999) - (y.ranking_position ?? 999),
                            );
                            return (
                                <section key={name} className={styles.card} style={{ marginBottom: 16 }}>
                                    <h2 className={styles.cardTitle}>{name}</h2>
                                    <div className={styles.tableWrap}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Pos.</th>
                                                    <th>Jugador</th>
                                                    <th>Detalle</th>
                                                    <th>Estado</th>
                                                    <th>Cambiar a</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((q) => {
                                                    const canEdit = !locked && MASTER_EDITABLE.includes(q.eligibility_status)
                                                        || (!locked && q.eligibility_status === "candidate");
                                                    return (
                                                        <tr key={q.id}>
                                                            <td>{q.ranking_position ?? "—"}</td>
                                                            <td><strong>{q.players?.display_name ?? "—"}</strong></td>
                                                            <td className={styles.muted}>{q.qualification_reason ?? "—"}</td>
                                                            <td>
                                                                <StatusBadge
                                                                    value={q.eligibility_status}
                                                                    label={MASTER_STATUS_LABEL[q.eligibility_status] ?? q.eligibility_status}
                                                                />
                                                            </td>
                                                            <td>
                                                                {canEdit ? (
                                                                    <form action={setQualificationStatus} className={styles.toolbar} style={{ margin: 0 }}>
                                                                        <input type="hidden" name="id" value={q.id} />
                                                                        <input type="hidden" name="event_id" value={master.id} />
                                                                        <select className={styles.select} name="status" defaultValue={q.eligibility_status}>
                                                                            {MASTER_EDITABLE.map((s) => (
                                                                                <option key={s} value={s}>
                                                                                    {MASTER_STATUS_LABEL[s]}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <button className={styles.btnSecondary} type="submit">Guardar</button>
                                                                    </form>
                                                                ) : (
                                                                    <span className={styles.muted}>—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            );
                        })
                    )}
                </>
            )}
        </>
    );
}