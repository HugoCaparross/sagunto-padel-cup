import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState, StatusBadge } from "@/components/crm/ui";
import { SPONSOR_TYPE_LABEL } from "@/lib/organizations";
import { saveSponsor, attachSponsorToEvent, detachSponsorFromEvent } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function SponsorsPage({
    searchParams,
}: {
    searchParams: Promise<{ edit?: string; event?: string; error?: string; ok?: string }>;
}) {
    const { edit, event, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/patrocinadores");

    const [sponsorsRes, eventsRes, linksRes] = await Promise.all([
        supabase
            .from("sponsors")
            .select("id,name,sponsor_type,description,website_url,logo_url,display_order,is_published")
            .order("display_order")
            .order("name"),
        supabase.from("events").select("id,name").order("starts_at", { ascending: false, nullsFirst: false }),
        supabase
            .from("event_sponsors")
            .select("event_id,sponsor_id,placement,display_order,sponsors(name)")
            .order("display_order"),
    ]);

    const sponsors = (sponsorsRes.data ?? []) as any[];
    const events = (eventsRes.data ?? []) as any[];
    const links = (linksRes.data ?? []) as any[];

    const current = sponsors.find((s) => s.id === edit) ?? null;
    const eventId = events.find((e) => e.id === event)?.id ?? events[0]?.id ?? "";
    const eventLinks = links.filter((l) => l.event_id === eventId);

    return (
        <>
            <PageHeader eyebrow="Comunicación" title="Patrocinadores" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>{current ? `Editar: ${current.name}` : "Nuevo patrocinador"}</h2>

                <form key={current?.id ?? "new"} action={saveSponsor} className={styles.form}>
                    {current && <input type="hidden" name="id" value={current.id} />}

                    <div className={styles.toolbar}>
                        <input className={styles.input} name="name" placeholder="Nombre" required minLength={2} maxLength={80} defaultValue={current?.name ?? ""} />
                        <select className={styles.select} name="sponsor_type" defaultValue={current?.sponsor_type ?? "sponsor"}>
                            {Object.entries(SPONSOR_TYPE_LABEL).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                            ))}
                        </select>
                        <input className={styles.input} type="number" name="display_order" placeholder="Orden" style={{ width: 90 }} defaultValue={current?.display_order ?? 0} />
                    </div>

                    <div className={styles.toolbar}>
                        <input className={`${styles.input} ${styles.search}`} name="website_url" placeholder="https://..." defaultValue={current?.website_url ?? ""} />
                        <input className={`${styles.input} ${styles.search}`} name="logo_url" placeholder="URL del logo" defaultValue={current?.logo_url ?? ""} />
                    </div>

                    <label className={styles.field}>
                        <span>Descripción de la colaboración</span>
                        <textarea name="description" rows={3} defaultValue={current?.description ?? ""} />
                    </label>

                    <label className={styles.check}>
                        <input type="checkbox" name="is_published" defaultChecked={current?.is_published ?? true} />
                        <span>Visible en la web</span>
                    </label>

                    <div className={styles.toolbar}>
                        <button className={styles.btnPrimary} type="submit">{current ? "Guardar" : "Crear patrocinador"}</button>
                        {current && <Link className={styles.btnGhost} href="/admin/patrocinadores">Cancelar</Link>}
                    </div>
                </form>
            </section>

            {sponsors.length === 0 ? (
                <EmptyState title="Sin patrocinadores" text="Añade el primer patrocinador o colaborador." />
            ) : (
                <div className={styles.tableWrap} style={{ marginBottom: 24 }}>
                    <table className={styles.table}>
                        <thead>
                            <tr><th>Nombre</th><th>Tipo</th><th>Visible</th><th></th></tr>
                        </thead>
                        <tbody>
                            {sponsors.map((s) => (
                                <tr key={s.id}>
                                    <td><strong>{s.name}</strong></td>
                                    <td className={styles.muted}>{SPONSOR_TYPE_LABEL[s.sponsor_type] ?? s.sponsor_type}</td>
                                    <td>
                                        <StatusBadge value={s.is_published ? "active" : "inactive"} label={s.is_published ? "Visible" : "Oculto"} />
                                    </td>
                                    <td><Link href={`/admin/patrocinadores?edit=${s.id}`}>Editar</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <section className={styles.card}>
                <h2 className={styles.cardTitle}>Patrocinadores por prueba</h2>

                <form method="get" className={styles.toolbar}>
                    <select className={styles.select} name="event" defaultValue={eventId}>
                        {events.map((e) => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>
                    <button className={styles.btnSecondary} type="submit">Ver prueba</button>
                </form>

                {eventId && sponsors.length > 0 && (
                    <form action={attachSponsorToEvent} className={styles.toolbar}>
                        <input type="hidden" name="event_id" value={eventId} />
                        <select className={styles.select} name="sponsor_id" required defaultValue="">
                            <option value="" disabled>Patrocinador…</option>
                            {sponsors.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <input className={styles.input} name="placement" placeholder="Ubicación (ej. Principal)" />
                        <input className={styles.input} type="number" name="display_order" defaultValue={0} style={{ width: 90 }} />
                        <button className={styles.btnPrimary} type="submit">Asociar</button>
                    </form>
                )}

                {eventLinks.length === 0 ? (
                    <p className={styles.muted} style={{ marginTop: 16 }}>Esta prueba no tiene patrocinadores asociados.</p>
                ) : (
                    <div className={styles.tableWrap} style={{ marginTop: 16 }}>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Patrocinador</th><th>Ubicación</th><th>Orden</th><th></th></tr>
                            </thead>
                            <tbody>
                                {eventLinks.map((l) => (
                                    <tr key={l.sponsor_id}>
                                        <td>{l.sponsors?.name ?? "—"}</td>
                                        <td>{l.placement ?? "—"}</td>
                                        <td className={styles.muted}>{l.display_order}</td>
                                        <td>
                                            <form action={detachSponsorFromEvent}>
                                                <input type="hidden" name="event_id" value={l.event_id} />
                                                <input type="hidden" name="sponsor_id" value={l.sponsor_id} />
                                                <button className={styles.btnGhost} type="submit">Quitar</button>
                                            </form>
                                        </td>
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