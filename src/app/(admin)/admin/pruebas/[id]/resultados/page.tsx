import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState, StatusBadge } from "@/components/crm/ui";
import { PLACEMENTS } from "@/lib/placements";
import { formatDate } from "@/lib/format";
import { saveEventResults, awardEventPoints, revertEventPoints } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function EventResultsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ error?: string; ok?: string }>;
}) {
    const { id } = await params;
    const { error, ok } = await searchParams;
    const { supabase } = await requireAdmin(`/admin/pruebas/${id}/resultados`);

    const { data: event } = await supabase.from("events").select("id,name").eq("id", id).maybeSingle();
    if (!event) notFound();

    const [regsRes, subsRes, resultsRes, batchesRes] = await Promise.all([
        supabase
            .from("registrations")
            .select("id,event_categories(categories(name)),registration_players(player_order,players(display_name))")
            .eq("event_id", id)
            .eq("status", "confirmed"),
        supabase.from("subgroups").select("id,name").eq("is_active", true).order("display_order"),
        supabase.from("registration_results").select("registration_id,subgroup_id,placement").eq("event_id", id),
        supabase
            .from("event_point_batches")
            .select("id,version,status,created_at,reverted_at,reverted_reason")
            .eq("event_id", id)
            .order("version", { ascending: false }),
    ]);

    const regs = (regsRes.data ?? []) as any[];
    const subgroups = (subsRes.data ?? []) as any[];
    const current = new Map<string, any>((resultsRes.data ?? []).map((r: any) => [r.registration_id, r]));
    const batches = (batchesRes.data ?? []) as any[];
    const active = batches.find((b) => b.status === "active") ?? null;
    const locked = !!active;

    return (
        <>
            <PageHeader eyebrow={`Prueba · ${event.name}`} title="Resultados finales" />

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

            {regs.length === 0 ? (
                <EmptyState
                    title="Sin parejas confirmadas"
                    text="Confirma inscripciones en el tablero de inscripciones para poder registrar resultados."
                />
            ) : (
                <>
                    <form action={saveEventResults} className={styles.form} style={{ marginBottom: 24 }}>
                        <input type="hidden" name="event_id" value={id} />
                        {locked && (
                            <p className={styles.alertWarning}>
                                Esta prueba tiene puntos asignados (versión {active.version}). Para cambiar resultados,
                                revierte primero la asignación.
                            </p>
                        )}
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Pareja</th>
                                        <th>Categoría</th>
                                        <th>Subgrupo</th>
                                        <th>Ronda alcanzada</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {regs.map((r) => {
                                        const cur = current.get(r.id);
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
                                                        name={`sub_${r.id}`}
                                                        defaultValue={cur?.subgroup_id ?? ""}
                                                        disabled={locked}
                                                    >
                                                        <option value="">—</option>
                                                        {subgroups.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <select
                                                        className={styles.select}
                                                        name={`pl_${r.id}`}
                                                        defaultValue={cur?.placement ?? ""}
                                                        disabled={locked}
                                                    >
                                                        <option value="">—</option>
                                                        {PLACEMENTS.map((p) => (
                                                            <option key={p.code} value={p.code}>
                                                                {p.label}
                                                            </option>
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
                                <button className={styles.btnSecondary} type="submit">
                                    Guardar resultados
                                </button>
                            </div>
                        )}
                    </form>

                    <section className={styles.card} style={{ marginBottom: 24 }}>
                        <h2 className={styles.cardTitle}>Puntos de la prueba</h2>

                        {active ? (
                            <>
                                <p>
                                    Puntos asignados: <strong>versión {active.version}</strong>, el{" "}
                                    {formatDate(active.created_at)}.
                                </p>
                                <form action={revertEventPoints} className={styles.form}>
                                    <input type="hidden" name="event_id" value={id} />
                                    <label className={styles.field}>
                                        <span>Motivo de la reversión (obligatorio)</span>
                                        <textarea name="reason" rows={2} required minLength={5} />
                                    </label>
                                    <div>
                                        <button className={styles.btnSecondary} type="submit">
                                            Revertir puntos
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <>
                                <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                                    Guarda los resultados antes de asignar. Cada jugador recibe sus puntos según la
                                    tabla de su categoría y subgrupo.
                                </p>
                                <form action={awardEventPoints}>
                                    <input type="hidden" name="event_id" value={id} />
                                    <button className={styles.btnPrimary} type="submit">
                                        Asignar puntos a la prueba
                                    </button>
                                </form>
                            </>
                        )}
                    </section>

                    {batches.length > 0 && (
                        <section className={styles.card}>
                            <h2 className={styles.cardTitle}>Historial de asignaciones</h2>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Versión</th>
                                            <th>Estado</th>
                                            <th>Creada</th>
                                            <th>Revertida</th>
                                            <th>Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batches.map((b) => (
                                            <tr key={b.id}>
                                                <td>{b.version}</td>
                                                <td>
                                                    <StatusBadge
                                                        value={b.status === "active" ? "active" : "inactive"}
                                                        label={b.status === "active" ? "Activa" : "Revertida"}
                                                    />
                                                </td>
                                                <td className={styles.muted}>{formatDate(b.created_at)}</td>
                                                <td className={styles.muted}>{formatDate(b.reverted_at)}</td>
                                                <td className={styles.muted}>{b.reverted_reason ?? "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </>
            )}
        </>
    );
}