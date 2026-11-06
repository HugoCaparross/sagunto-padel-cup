import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { EVENT_STATUS_LABEL, formatDate } from "@/lib/format";
import { createEvent, changeEventStatus } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function EventsPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const { supabase } = await requireAdmin("/admin/pruebas");

    const [events, seasons, categories] = await Promise.all([
        supabase
            .from("events")
            .select("id,event_number,name,starts_at,status,seasons(name)")
            .order("starts_at", { ascending: true, nullsFirst: false }),
        supabase
            .from("seasons")
            .select("id,name,status")
            .in("status", ["draft", "active"])
            .order("start_date", { ascending: false }),
        supabase
            .from("categories")
            .select("id,name")
            .eq("is_active", true)
            .order("display_order"),
    ]);

    const rows = (events.data ?? []) as any[];
    const seasonList = (seasons.data ?? []) as any[];
    const categoryList = (categories.data ?? []) as any[];

    return (
        <>
            <PageHeader eyebrow="Circuito" title="Pruebas" />

            {error && (
                <p className={styles.alertError} role="alert">
                    {error}
                </p>
            )}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>Nueva prueba</h2>

                {seasonList.length === 0 ? (
                    <p className={styles.alertWarning}>
                        Crea primero una temporada en el apartado Temporadas.
                    </p>
                ) : (
                    <form action={createEvent} className={styles.form}>
                        <div className={styles.toolbar}>
                            <select className={styles.select} name="season_id" required defaultValue="">
                                <option value="" disabled>
                                    Temporada…
                                </option>
                                {seasonList.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <select className={styles.select} name="event_number" required defaultValue="">
                                <option value="" disabled>
                                    Nº prueba…
                                </option>
                                {[1, 2, 3, 4, 5, 6].map((n) => (
                                    <option key={n} value={n}>
                                        Prueba {n}
                                    </option>
                                ))}
                            </select>
                            <input
                                className={`${styles.input} ${styles.search}`}
                                name="name"
                                placeholder="Nombre de la prueba"
                                required
                            />
                            <select className={styles.select} name="status" defaultValue="draft">
                                {Object.entries(EVENT_STATUS_LABEL).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.toolbar}>
                            <label className={styles.field}>
                                <span>Inicio (hora de Madrid)</span>
                                <input type="datetime-local" name="starts_at" />
                            </label>
                            <label className={styles.field}>
                                <span>Fin</span>
                                <input type="datetime-local" name="ends_at" />
                            </label>
                            <label className={styles.field}>
                                <span>Abre inscripciones</span>
                                <input type="datetime-local" name="registration_opens_at" />
                            </label>
                            <label className={styles.field}>
                                <span>Cierra inscripciones</span>
                                <input type="datetime-local" name="registration_closes_at" />
                            </label>
                            <label className={styles.field}>
                                <span>Cupo total (opcional)</span>
                                <input type="number" min={1} name="registration_capacity" />
                            </label>
                        </div>

                        <fieldset style={{ border: "1px solid #D5D9DC", borderRadius: 7, padding: 12 }}>
                            <legend style={{ padding: "0 6px", color: "#65717B", fontSize: 12 }}>
                                Categorías que se juegan
                            </legend>
                            <div className={styles.toolbar} style={{ margin: 0 }}>
                                {categoryList.map((c) => (
                                    <label key={c.id} className={styles.check}>
                                        <input type="checkbox" name="categories" value={c.id} />
                                        <span>{c.name}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div>
                            <button className={styles.btnPrimary} type="submit">
                                Crear prueba
                            </button>
                        </div>
                    </form>
                )}
            </section>

            {rows.length === 0 ? (
                <EmptyState title="Sin pruebas" text="Crea la primera prueba de la temporada." />
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Prueba</th>
                                <th>Temporada</th>
                                <th>Fecha</th>
                                <th>Cambiar estado</th>
                                <th>Resultados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((e) => (
                                <tr key={e.id}>
                                    <td>{e.event_number ?? "—"}</td>
                                    <td>
                                        <strong>{e.name}</strong>
                                    </td>
                                    <td className={styles.muted}>{e.seasons?.name ?? "—"}</td>
                                    <td className={styles.muted}>{formatDate(e.starts_at)}</td>
                                    <td>
                                        <form
                                            action={changeEventStatus}
                                            className={styles.toolbar}
                                            style={{ margin: 0 }}
                                        >
                                            <input type="hidden" name="id" value={e.id} />
                                            <select className={styles.select} name="status" defaultValue={e.status}>
                                                {Object.entries(EVENT_STATUS_LABEL).map(([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button className={styles.btnSecondary} type="submit">
                                                Guardar
                                            </button>
                                        </form>
                                    </td>
                                    <td>
                                        <Link href={`/admin/pruebas/${e.id}/resultados`}>Resultados</Link>
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