import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState, StatusBadge } from "@/components/crm/ui";
import { formatDate } from "@/lib/format";
import { saveNews, publishDueNews } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
    draft: "Borrador",
    scheduled: "Programada",
    published: "Publicada",
    archived: "Archivada",
};

const STATUS_TONE: Record<string, string> = {
    draft: "neutral",
    scheduled: "info",
    published: "success",
    archived: "neutral",
};

export default async function NewsPage({
    searchParams,
}: {
    searchParams: Promise<{ edit?: string; error?: string; ok?: string }>;
}) {
    const { edit, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/noticias");

    const [newsRes, eventsRes] = await Promise.all([
        supabase
            .from("news")
            .select("id,title,excerpt,body_markdown,cover_image_url,status,is_pinned,event_id,published_at,scheduled_at,updated_at")
            .order("updated_at", { ascending: false })
            .limit(100),
        supabase.from("events").select("id,name").order("starts_at", { ascending: false, nullsFirst: false }),
    ]);

    const items = (newsRes.data ?? []) as any[];
    const events = (eventsRes.data ?? []) as any[];
    const current = items.find((n) => n.id === edit) ?? null;
    const scheduledPending = items.filter((n) => n.status === "scheduled").length;

    return (
        <>
            <PageHeader
                eyebrow="Comunicación"
                title="Noticias y avisos"
                actions={
                    scheduledPending > 0 ? (
                        <form action={publishDueNews}>
                            <button className={styles.btnSecondary} type="submit">
                                Publicar programadas ({scheduledPending})
                            </button>
                        </form>
                    ) : undefined
                }
            />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>{current ? `Editar: ${current.title}` : "Nueva noticia"}</h2>

                <form key={current?.id ?? "new"} action={saveNews} className={styles.form}>
                    {current && <input type="hidden" name="id" value={current.id} />}

                    <label className={styles.field}>
                        <span>Título</span>
                        <input name="title" required minLength={5} maxLength={140} defaultValue={current?.title ?? ""} />
                    </label>

                    <label className={styles.field}>
                        <span>Resumen (opcional)</span>
                        <input name="excerpt" maxLength={240} defaultValue={current?.excerpt ?? ""} />
                    </label>

                    <label className={styles.field}>
                        <span>Contenido (Markdown)</span>
                        <textarea name="body_markdown" rows={8} required minLength={20} defaultValue={current?.body_markdown ?? ""} />
                    </label>

                    <div className={styles.toolbar}>
                        <input className={`${styles.input} ${styles.search}`} name="cover_image_url" placeholder="URL de la imagen de portada" defaultValue={current?.cover_image_url ?? ""} />
                        <select className={styles.select} name="event_id" defaultValue={current?.event_id ?? ""}>
                            <option value="">Sin prueba asociada</option>
                            {events.map((e) => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.toolbar}>
                        <select className={styles.select} name="status" defaultValue={current?.status ?? "draft"}>
                            {Object.entries(STATUS_LABEL).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                            ))}
                        </select>
                        <label className={styles.field}>
                            <span>Fecha programada (hora de Madrid, si es programada)</span>
                            <input type="datetime-local" name="scheduled_at" />
                        </label>
                        <label className={styles.check}>
                            <input type="checkbox" name="is_pinned" defaultChecked={current?.is_pinned ?? false} />
                            <span>Fijar en portada (máximo 3)</span>
                        </label>
                    </div>

                    <div className={styles.toolbar}>
                        <button className={styles.btnPrimary} type="submit">{current ? "Guardar" : "Crear noticia"}</button>
                        {current && <Link className={styles.btnGhost} href="/admin/noticias">Cancelar</Link>}
                    </div>
                </form>
            </section>

            {items.length === 0 ? (
                <EmptyState title="Sin noticias" text="Crea el primer aviso o comunicado." />
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Fijada</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((n) => (
                                <tr key={n.id}>
                                    <td><strong>{n.title}</strong></td>
                                    <td>
                                        <StatusBadge value={STATUS_TONE[n.status] ?? "neutral"} label={STATUS_LABEL[n.status] ?? n.status} />
                                    </td>
                                    <td className={styles.muted}>
                                        {n.status === "scheduled"
                                            ? `Programada: ${formatDate(n.scheduled_at)}`
                                            : formatDate(n.published_at ?? n.updated_at)}
                                    </td>
                                    <td>{n.is_pinned ? "Sí" : "No"}</td>
                                    <td><Link href={`/admin/noticias?edit=${n.id}`}>Editar</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}