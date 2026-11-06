import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState, StatusBadge } from "@/components/crm/ui";
import { ORGANIZER_ROLE_LABEL } from "@/lib/organizations";
import { saveClub, attachClubToEvent, detachClubFromEvent } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function ClubsPage({
    searchParams,
}: {
    searchParams: Promise<{ edit?: string; event?: string; error?: string; ok?: string }>;
}) {
    const { edit, event, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/clubes");

    const [clubsRes, eventsRes, linksRes] = await Promise.all([
        supabase
            .from("clubs")
            .select("id,name,city,address,description,website_url,logo_url,display_order,is_organizer,is_published")
            .order("display_order")
            .order("name"),
        supabase.from("events").select("id,name").order("starts_at", { ascending: false, nullsFirst: false }),
        supabase.from("event_organizers").select("event_id,club_id,organizer_role,display_order,clubs(name)").order("display_order"),
    ]);

    const clubs = (clubsRes.data ?? []) as any[];
    const events = (eventsRes.data ?? []) as any[];
    const links = (linksRes.data ?? []) as any[];

    const current = clubs.find((c) => c.id === edit) ?? null;
    const eventId = events.find((e) => e.id === event)?.id ?? events[0]?.id ?? "";
    const eventLinks = links.filter((l) => l.event_id === eventId);

    return (
        <>
            <PageHeader eyebrow="Comunicación" title="Clubes" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>{current ? `Editar: ${current.name}` : "Nuevo club"}</h2>

                <form key={current?.id ?? "new"} action={saveClub} className={styles.form}>
                    {current && <input type="hidden" name="id" value={current.id} />}

                    <div className={styles.toolbar}>
                        <input className={styles.input} name="name" placeholder="Nombre" required minLength={2} maxLength={80} defaultValue={current?.name ?? ""} />
                        <input className={styles.input} name="city" placeholder="Ciudad" defaultValue={current?.city ?? ""} />
                        <input className={styles.input} name="address" placeholder="Dirección" defaultValue={current?.address ?? ""} />
                        <input className={styles.input} type="number" name="display_order" placeholder="Orden" style={{ width: 90 }} defaultValue={current?.display_order ?? 0} />
                    </div>

                    <div className={styles.toolbar}>
                        <input className={`${styles.input} ${styles.search}`} name="website_url" placeholder="https://..." defaultValue={current?.website_url ?? ""} />
                        <input className={`${styles.input} ${styles.search}`} name="logo_url" placeholder="URL del logo" defaultValue={current?.logo_url ?? ""} />
                    </div>

                    <label className={styles.field}>
                        <span>Descripción</span>
                        <textarea name="description" rows={3} defaultValue={current?.description ?? ""} />
                    </label>

                    <div className={styles.toolbar}>
                        <label className={styles.check}>
                            <input type="checkbox" name="is_organizer" defaultChecked={current?.is_organizer ?? false} />
                            <span>Puede organizar pruebas</span>
                        </label>
                        <label className={styles.check}>
                            <input type="checkbox" name="is_published" defaultChecked={current?.is_published ?? true} />
                            <span>Visible en la web</span>
                        </label>
                    </div>

                    <div className={styles.toolbar}>
                        <button className={styles.btnPrimary} type="submit">{current ? "Guardar club" : "Crear club"}</button>
                        {current && <Link className={styles.btnGhost} href="/admin/clubes">Cancelar</Link>}
                    </div>
                </form>
            </section>

            {clubs.length === 0 ? (
                <EmptyState title="Sin clubes" text="Añade el primer club colaborador u organizador." />
            ) : (
                <div className={styles.tableWrap} style={{ marginBottom: 24 }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Club</th>
                                <th>Ciudad</th>
                                <th>Organiza</th>
                                <th>Visible</th>
                                <th>Web</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {clubs.map((c) => (
                                <tr key={c.id}>
                                    <td><strong>{c.name}</strong></td>
                                    <td className={styles.muted}>{c.city ?? "—"}</td>
                                    <td>{c.is_organizer ? "Sí" : "No"}</td>
                                    <td>
                                        <StatusBadge value={c.is_published ? "active" : "inactive"} label={c.is_published ? "Visible" : "Oculto"} />
                                    </td>
                                    <td className={styles.muted}>{c.website_url ? "Sí" : "—"}</td>
                                    <td><Link href={`/admin/clubes?edit=${c.id}`}>Editar</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <section className={styles.card}>
                <h2 className={styles.cardTitle}>Clubes por prueba</h2>

                <form method="get" className={styles.toolbar}>
                    <select className={styles.select} name="event" defaultValue={eventId}>
                        {events.map((e) => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>
                    <button className={styles.btnSecondary} type="submit">Ver prueba</button>
                </form>

                {eventId && clubs.length > 0 && (
                    <form action={attachClubToEvent} className={styles.toolbar}>
                        <input type="hidden" name="event_id" value={eventId} />
                        <select className={styles.select} name="club_id" required defaultValue="">
                            <option value="" disabled>Club…</option>
                            {clubs.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <select className={styles.select} name="organizer_role" defaultValue="organizer">
                            {Object.entries(ORGANIZER_ROLE_LABEL).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                            ))}
                        </select>
                        <input className={styles.input} type="number" name="display_order" defaultValue={0} style={{ width: 90 }} />
                        <button className={styles.btnPrimary} type="submit">Asociar</button>
                    </form>
                )}

                {eventLinks.length === 0 ? (
                    <p className={styles.muted} style={{ marginTop: 16 }}>Esta prueba no tiene clubes asociados.</p>
                ) : (
                    <div className={styles.tableWrap} style={{ marginTop: 16 }}>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Club</th><th>Rol</th><th>Orden</th><th></th></tr>
                            </thead>
                            <tbody>
                                {eventLinks.map((l) => (
                                    <tr key={l.club_id}>
                                        <td>{l.clubs?.name ?? "—"}</td>
                                        <td>{ORGANIZER_ROLE_LABEL[l.organizer_role] ?? l.organizer_role}</td>
                                        <td className={styles.muted}>{l.display_order}</td>
                                        <td>
                                            <form action={detachClubFromEvent}>
                                                <input type="hidden" name="event_id" value={l.event_id} />
                                                <input type="hidden" name="club_id" value={l.club_id} />
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