import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { PLACEMENTS } from "@/lib/placements";
import { createMasterPair, saveMasterResults, completeMaster } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

const MASTER_PLACEMENTS = PLACEMENTS.filter((p) => p.code !== 33);

export default async function MasterResultsPage({
    searchParams,
}: {
    searchParams: Promise<{ event?: string; error?: string; ok?: string }>;
}) {
    const { event: eventParam, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/master/resultados");

    const { data: mastersData } = await supabase
        .from("events")
        .select("id,name,status")
        .eq("event_type", "master_final")
        .order("starts_at", { ascending: true, nullsFirst: false });

    const masters = (mastersData ?? []) as any[];
    const master = masters.find((m) => m.id === eventParam) ?? masters[0] ?? null;

    if (!master) {
        return (
            <>
                <PageHeader eyebrow="Competición" title="Resultados del Máster" />
                <EmptyState title="Sin Máster Final" text="Créalo primero en la sección Máster Final." />
            </>
        );
    }

    const locked = master.status === "completed";

    const [catsRes, playersRes, regsRes, resultsRes] = await Promise.all([
        supabase.from("categories").select("id,name").eq("is_active", true).order("display_order"),
        supabase
            .from("master_final_qualifications")
            .select("player_id,players(display_name)")
            .eq("event_id", master.id)
            .eq("eligibility_status", "confirmed"),
        supabase
            .from("registrations")
            .select("id,status,event_categories(categories(name)),registration_players(player_order,players(display_name))")
            .eq("event_id", master.id)
            .order("submitted_at", { ascending: true }),
        supabase.from("master_final_results").select("registration_id,placement").eq("event_id", master.id),
    ]);

    const categories = (catsRes.data ?? []) as any[];
    const players = ((playersRes.data ?? []) as any[])
        .map((q) => ({ id: q.player_id as string, name: (q.players?.display_name ?? "") as string }))
        .sort((a, b) => a.name.localeCompare(b.name));
    const regs = (regsRes.data ?? []) as any[];
    const results = new Map<string, number>(
        ((resultsRes.data ?? []) as any[]).map((r) => [r.registration_id, r.placement]),
    );

    return (
        <>
            <PageHeader eyebrow="Competición" title={`Resultados · ${master.name}`} />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            {masters.length > 1 && (
                <form method="get" className={styles.toolbar}>
                    <select className={styles.select} name="event" defaultValue={master.id}>
                        {masters.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <button className={styles.btnSecondary} type="submit">Ver</button>
                </form>
            )}

            {!locked && (
                <section className={styles.card} style={{ marginBottom: 24 }}>
                    <h2 className={styles.cardTitle}>Nueva pareja</h2>
                    <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                        Solo aparecen jugadores confirmados para el Máster. Ambos deben estar en la misma categoría.
                    </p>
                    {players.length < 2 ? (
                        <p className={styles.alertWarning}>Necesitas al menos dos jugadores confirmados en Máster Final.</p>
                    ) : (
                        <form action={createMasterPair} className={styles.toolbar}>
                            <input type="hidden" name="event_id" value={master.id} />
                            <select className={styles.select} name="category_id" required defaultValue="">
                                <option value="" disabled>Categoría…</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <select className={styles.select} name="player_1" required defaultValue="">
                                <option value="" disabled>Jugador 1…</option>
                                {players.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <select className={styles.select} name="player_2" required defaultValue="">
                                <option value="" disabled>Jugador 2…</option>
                                {players.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <button className={styles.btnPrimary} type="submit">Crear pareja</button>
                        </form>
                    )}
                </section>
            )}

            {regs.length === 0 ? (
                <EmptyState title="Sin parejas" text="Crea las parejas del Máster para registrar sus resultados." />
            ) : (
                <form action={saveMasterResults} className={styles.form} style={{ marginBottom: 24 }}>
                    <input type="hidden" name="event_id" value={master.id} />
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Pareja</th>
                                    <th>Categoría</th>
                                    <th>Puesto final</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regs.map((r) => {
                                    const pair =
                                        [...(r.registration_players ?? [])]
                                            .sort((x: any, y: any) => x.player_order - y.player_order)
                                            .map((rp: any) => rp.players?.display_name)
                                            .filter(Boolean)
                                            .join(" / ") || "Pareja sin nombre";
                                    return (
                                        <tr key={r.id}>
                                            <td>
                                                <input type="hidden" name="registration_ids" value={r.id} />
                                                <strong>{pair}</strong>
                                            </td>
                                            <td>{r.event_categories?.categories?.name ?? "—"}</td>
                                            <td>
                                                <select
                                                    className={styles.select}
                                                    name={`pl_${r.id}`}
                                                    defaultValue={results.get(r.id) ?? ""}
                                                    disabled={locked}
                                                >
                                                    <option value="">—</option>
                                                    {MASTER_PLACEMENTS.map((p) => (
                                                        <option key={p.code} value={p.code}>{p.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {!locked && (
                        <div>
                            <button className={styles.btnSecondary} type="submit">Guardar resultados</button>
                        </div>
                    )}
                </form>
            )}

            <section className={styles.card}>
                <h2 className={styles.cardTitle}>Finalizar Máster</h2>
                {locked ? (
                    <p className={styles.alertSuccess}>El Máster está finalizado y sus resultados son públicos.</p>
                ) : (
                    <>
                        <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                            Al finalizar, los resultados se publican y ya no se pueden modificar.
                        </p>
                        <form action={completeMaster}>
                            <input type="hidden" name="event_id" value={master.id} />
                            <button className={styles.btnPrimary} type="submit">Finalizar Máster</button>
                        </form>
                    </>
                )}
            </section>
        </>
    );
}