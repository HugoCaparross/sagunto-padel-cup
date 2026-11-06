import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { PLACEMENTS } from "@/lib/placements";
import { formatDate, formatPoints } from "@/lib/format";
import { cloneRuleSet, saveRulePoints, publishRuleSet } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
    draft: "Borrador",
    published: "Publicada",
    archived: "Archivada",
    scheduled: "Programada",
};

const STATUS_TONE: Record<string, string> = {
    draft: "warning",
    published: "success",
    archived: "neutral",
    scheduled: "info",
};

export default async function RulesPage({
    searchParams,
}: {
    searchParams: Promise<{ set?: string; error?: string; ok?: string }>;
}) {
    const { set, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/reglas");

    const { data: setsData } = await supabase
        .from("scoring_rule_sets")
        .select("id,name,version,description,status,effective_from,effective_to,created_at")
        .order("created_at", { ascending: false });

    const sets = (setsData ?? []) as any[];

    if (sets.length === 0) {
        return (
            <>
                <PageHeader eyebrow="Puntuación" title="Reglas de puntuación" />
                <EmptyState title="Sin reglas" text="No hay versiones de reglas en la base de datos." />
            </>
        );
    }

    const selected = sets.find((s) => s.id === set) ?? sets.find((s) => s.status === "published") ?? sets[0];
    const published = sets.find((s) => s.status === "published") ?? null;
    const isDraft = selected.status === "draft";

    const [catsRes, subsRes, rulesRes] = await Promise.all([
        supabase.from("categories").select("id,name").eq("is_active", true).order("display_order"),
        supabase.from("subgroups").select("id,name").eq("is_active", true).order("display_order"),
        supabase
            .from("scoring_rules")
            .select("category_id,subgroup_id,placement,points")
            .eq("rule_set_id", selected.id),
    ]);

    const cats = (catsRes.data ?? []) as any[];
    const subs = (subsRes.data ?? []) as any[];
    const rules = (rulesRes.data ?? []) as any[];

    const pts = new Map<string, number>(
        rules.map((r) => [`${r.category_id}_${r.subgroup_id}_${r.placement}`, Number(r.points)]),
    );

    const { data: validationData } = await supabase.rpc("validate_rule_set", { p_rule_set: selected.id });
    const validation = (validationData ?? []) as any[];
    const hasErrors = validation.some((v) => v.severity === "error");

    let diffs: any[] = [];
    if (isDraft && published) {
        const { data } = await supabase.rpc("compare_rule_sets", {
            p_a: published.id,
            p_b: selected.id,
        });
        diffs = (data ?? []) as any[];
    }

    const today = new Date().toISOString().slice(0, 10);

    return (
        <>
            <PageHeader eyebrow="Puntuación" title="Reglas de puntuación" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <form method="get" className={styles.toolbar} style={{ marginBottom: 16 }}>
                    <select className={styles.select} name="set" defaultValue={selected.id}>
                        {sets.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} · {s.version} ({STATUS_LABEL[s.status] ?? s.status})
                            </option>
                        ))}
                    </select>
                    <button className={styles.btnSecondary} type="submit">Ver versión</button>
                </form>

                <div className={styles.grid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                    <div>
                        <p className={styles.muted} style={{ margin: 0, fontSize: 12 }}>Versión</p>
                        <strong>{selected.version}</strong>
                        <p className={styles.muted} style={{ margin: "4px 0 0", fontSize: 13 }}>{selected.description}</p>
                    </div>
                    <div>
                        <p className={styles.muted} style={{ margin: 0, fontSize: 12 }}>Estado</p>
                        <span className={`${styles.badge} ${styles[STATUS_TONE[selected.status] ?? "neutral"]}`}>
                            {STATUS_LABEL[selected.status] ?? selected.status}
                        </span>
                    </div>
                    <div>
                        <p className={styles.muted} style={{ margin: 0, fontSize: 12 }}>Vigencia</p>
                        <strong>
                            {selected.effective_from ? formatDate(selected.effective_from) : "—"}
                            {selected.effective_to ? ` → ${formatDate(selected.effective_to)}` : ""}
                        </strong>
                    </div>
                </div>
            </section>

            {isDraft && (
                <section className={styles.card} style={{ marginBottom: 24 }}>
                    <h2 className={styles.cardTitle}>Validación</h2>
                    {validation.length === 0 ? (
                        <p className={styles.alertSuccess} style={{ margin: 0 }}>
                            Versión válida: lista para publicar.
                        </p>
                    ) : (
                        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
                            {validation.map((v, i) => (
                                <li key={i} className={v.severity === "error" ? styles.alertError : styles.alertWarning}>
                                    {v.severity === "error" ? "Error: " : "Aviso: "}
                                    {v.detail}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <section style={{ marginBottom: 24 }}>
                {cats.map((cat) => (
                    <div key={cat.id} className={styles.card} style={{ marginBottom: 16 }}>
                        <h2 className={styles.cardTitle}>{cat.name}</h2>
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Posición</th>
                                        {subs.map((s) => (
                                            <th key={s.id}>{s.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PLACEMENTS.map((p) => (
                                        <tr key={p.code}>
                                            <td>{p.label}</td>
                                            {subs.map((s) => {
                                                const key = `${cat.id}_${s.id}_${p.code}`;
                                                return (
                                                    <td key={s.id}>
                                                        {isDraft ? (
                                                            <input
                                                                className={styles.input}
                                                                style={{ width: 100 }}
                                                                form="rules-form"
                                                                type="number"
                                                                step="0.01"
                                                                min={0}
                                                                name={`c_${cat.id}_${s.id}_${p.code}`}
                                                                defaultValue={pts.get(key) ?? ""}
                                                            />
                                                        ) : (
                                                            <strong>{formatPoints(pts.get(key))}</strong>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {isDraft && (
                    <form id="rules-form" action={saveRulePoints}>
                        <input type="hidden" name="rule_set_id" value={selected.id} />
                        <button className={styles.btnPrimary} type="submit">Guardar puntuaciones</button>
                    </form>
                )}
            </section>

            {isDraft && diffs.length > 0 && (
                <section className={styles.card} style={{ marginBottom: 24 }}>
                    <h2 className={styles.cardTitle}>Cambios frente a la versión publicada</h2>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Categoría</th>
                                    <th>Subgrupo</th>
                                    <th>Posición</th>
                                    <th>Antes</th>
                                    <th>Ahora</th>
                                    <th>Diferencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diffs.map((d, i) => (
                                    <tr key={i}>
                                        <td>{d.cat_name}</td>
                                        <td>{d.sub_name}</td>
                                        <td>{PLACEMENTS.find((p) => p.code === d.pos)?.label ?? d.pos}</td>
                                        <td>{formatPoints(d.old_points)}</td>
                                        <td><strong>{formatPoints(d.new_points)}</strong></td>
                                        <td>{Number(d.delta) > 0 ? "+" : ""}{formatPoints(d.delta)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <div className={styles.detailGrid}>
                {isDraft ? (
                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>Publicar esta versión</h2>
                        <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                            Al publicar, la versión actual pasa a archivada. Las pruebas ya asignadas conservan sus puntos.
                        </p>
                        <form action={publishRuleSet} className={styles.form}>
                            <input type="hidden" name="rule_set_id" value={selected.id} />
                            <label className={styles.field}>
                                <span>Entra en vigor el</span>
                                <input type="date" name="effective_from" defaultValue={today} required />
                            </label>
                            <label className={styles.check}>
                                <input type="checkbox" name="confirm" disabled={hasErrors} />
                                <span>Confirmo que quiero publicar esta versión</span>
                            </label>
                            <div>
                                <button className={styles.btnPrimary} type="submit" disabled={hasErrors}>
                                    Publicar versión
                                </button>
                            </div>
                            {hasErrors && (
                                <p className={styles.muted} style={{ fontSize: 12, margin: 0 }}>
                                    Corrige los errores de validación para poder publicar.
                                </p>
                            )}
                        </form>
                    </section>
                ) : (
                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>Nueva versión</h2>
                        <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                            Copia las puntuaciones de la versión que estás viendo para crear un borrador editable.
                        </p>
                        <form action={cloneRuleSet} className={styles.form}>
                            <input type="hidden" name="source_id" value={selected.id} />
                            <label className={styles.field}>
                                <span>Nombre de la versión</span>
                                <input name="version" required placeholder="Ej. v2" />
                            </label>
                            <label className={styles.field}>
                                <span>Descripción (opcional)</span>
                                <input name="description" placeholder="Qué cambia respecto a la anterior" />
                            </label>
                            <div>
                                <button className={styles.btnPrimary} type="submit">Crear borrador</button>
                            </div>
                        </form>
                    </section>
                )}

                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>Historial de versiones</h2>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Versión</th><th>Estado</th><th>Vigencia</th></tr>
                            </thead>
                            <tbody>
                                {sets.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <a href={`/admin/reglas?set=${s.id}`}>{s.version}</a>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${styles[STATUS_TONE[s.status] ?? "neutral"]}`}>
                                                {STATUS_LABEL[s.status] ?? s.status}
                                            </span>
                                        </td>
                                        <td className={styles.muted}>
                                            {s.effective_from ? formatDate(s.effective_from) : "—"}
                                            {s.effective_to ? ` → ${formatDate(s.effective_to)}` : ""}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}