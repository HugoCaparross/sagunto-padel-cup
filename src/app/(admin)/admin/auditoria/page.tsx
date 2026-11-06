import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState, StatusBadge } from "@/components/crm/ui";
import { madridToIso } from "@/lib/time";
import { createIncident, updateIncident } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

const TABLE_OPTIONS = [
    "", "players", "registrations", "events", "seasons", "matches", "point_transactions",
    "season_closures", "scoring_rule_sets", "categories", "subgroups", "clubs", "sponsors",
    "news", "app_settings", "user_roles", "incidents",
];

const SEVERITY_LABEL: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta" };
const SEVERITY_TONE: Record<string, string> = { low: "neutral", medium: "warning", high: "error" };
const INCIDENT_LABEL: Record<string, string> = { open: "Abierta", in_progress: "En curso", resolved: "Resuelta" };
const INCIDENT_TONE: Record<string, string> = { open: "warning", in_progress: "info", resolved: "success" };

function fmt(iso: string | null | undefined) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export default async function AuditPage({
    searchParams,
}: {
    searchParams: Promise<{ action?: string; table?: string; from?: string; to?: string; error?: string; ok?: string }>;
}) {
    const { action = "", table = "", from = "", to = "", error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/auditoria");

    const [logRes, incRes] = await Promise.all([
        supabase.rpc("list_audit_log", {
            p_action: action.trim() || null,
            p_table: table.trim() || null,
            p_from: from ? madridToIso(`${from}T00:00`) : null,
            p_to: to ? madridToIso(`${to}T23:59`) : null,
            p_limit: 200,
            p_before: null,
        }),
        supabase
            .from("incidents")
            .select("id,title,description,severity,status,created_at,resolution_note,resolved_at")
            .order("created_at", { ascending: false })
            .limit(100),
    ]);

    const logs = (logRes.data ?? []) as any[];
    const incidents = (incRes.data ?? []) as any[];

    return (
        <>
            <PageHeader eyebrow="Sistema" title="Auditoría e incidencias" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}
            {logRes.error && (
                <p className={styles.alertError} role="alert">No se pudo cargar la auditoría: {logRes.error.message}</p>
            )}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>Registro de acciones</h2>

                <form method="get" className={styles.toolbar}>
                    <input className={styles.input} name="action" placeholder="Acción (ej. match, setting)" defaultValue={action} />
                    <select className={styles.select} name="table" defaultValue={table}>
                        {TABLE_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t || "Todas las tablas"}</option>
                        ))}
                    </select>
                    <input className={styles.input} type="date" name="from" defaultValue={from} aria-label="Desde" />
                    <input className={styles.input} type="date" name="to" defaultValue={to} aria-label="Hasta" />
                    <button className={styles.btnSecondary} type="submit">Filtrar</button>
                </form>

                {logs.length === 0 ? (
                    <EmptyState title="Sin registros" text="No hay acciones con esos filtros." />
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Quién</th>
                                    <th>Acción</th>
                                    <th>Elemento</th>
                                    <th>Motivo</th>
                                    <th>Cambios</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((l) => (
                                    <tr key={l.id}>
                                        <td className={styles.muted}>{fmt(l.created_at)}</td>
                                        <td>{l.actor_email ?? "Sistema"}</td>
                                        <td><code>{l.action}</code></td>
                                        <td className={styles.muted}>{l.entity_table}</td>
                                        <td className={styles.muted}>{l.reason ?? "—"}</td>
                                        <td>
                                            {(l.old_values || l.new_values) ? (
                                                <details>
                                                    <summary>Ver</summary>
                                                    <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", margin: 0 }}>
                                                        {JSON.stringify({ antes: l.old_values, despues: l.new_values }, null, 2)}
                                                    </pre>
                                                </details>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className={styles.card}>
                <h2 className={styles.cardTitle}>Incidencias</h2>

                <form action={createIncident} className={styles.form} style={{ marginBottom: 24 }}>
                    <div className={styles.toolbar}>
                        <input className={`${styles.input} ${styles.search}`} name="title" placeholder="Título de la incidencia" required minLength={5} maxLength={140} />
                        <select className={styles.select} name="severity" defaultValue="medium">
                            {Object.entries(SEVERITY_LABEL).map(([v, l]) => (
                                <option key={v} value={v}>Gravedad: {l}</option>
                            ))}
                        </select>
                    </div>
                    <label className={styles.field}>
                        <span>Descripción (opcional)</span>
                        <textarea name="description" rows={2} />
                    </label>
                    <div>
                        <button className={styles.btnPrimary} type="submit">Registrar incidencia</button>
                    </div>
                </form>

                {incidents.length === 0 ? (
                    <EmptyState title="Sin incidencias" text="Aquí aparecerán los problemas registrados y cómo se resolvieron." />
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {incidents.map((i) => (
                            <article key={i.id} className={styles.regCard}>
                                <div className={styles.toolbar} style={{ justifyContent: "space-between", margin: 0 }}>
                                    <strong>{i.title}</strong>
                                    <span className={styles.toolbar} style={{ margin: 0 }}>
                                        <StatusBadge value={SEVERITY_TONE[i.severity]} label={SEVERITY_LABEL[i.severity]} />
                                        <StatusBadge value={INCIDENT_TONE[i.status]} label={INCIDENT_LABEL[i.status]} />
                                    </span>
                                </div>
                                {i.description && <p className={styles.muted} style={{ margin: 0 }}>{i.description}</p>}
                                <p className={styles.muted} style={{ margin: 0, fontSize: 12 }}>
                                    Abierta: {fmt(i.created_at)}
                                    {i.resolved_at ? ` · Resuelta: ${fmt(i.resolved_at)}` : ""}
                                </p>
                                {i.resolution_note && (
                                    <p style={{ margin: 0, fontSize: 13 }}><strong>Solución:</strong> {i.resolution_note}</p>
                                )}

                                {i.status !== "resolved" && (
                                    <form action={updateIncident} className={styles.toolbar} style={{ margin: 0 }}>
                                        <input type="hidden" name="id" value={i.id} />
                                        <select className={styles.select} name="status" defaultValue={i.status === "in_progress" ? "in_progress" : "in_progress"}>
                                            <option value="in_progress">En curso</option>
                                            <option value="resolved">Resuelta</option>
                                        </select>
                                        <input className={`${styles.input} ${styles.search}`} name="resolution_note" placeholder="Cómo se ha solucionado (si la resuelves)" />
                                        <button className={styles.btnSecondary} type="submit">Actualizar</button>
                                    </form>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}