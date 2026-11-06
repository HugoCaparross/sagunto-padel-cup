import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { formatDate } from "@/lib/format";
import { createSeason, changeSeasonStatus } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

const SEASON_STATUS_LABEL: Record<string, string> = {
    draft: "Borrador",
    active: "Activa",
    closed: "Cerrada",
    archived: "Archivada",
};

export default async function SeasonsPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const { supabase } = await requireAdmin("/admin/temporadas");

    const { data } = await supabase
        .from("seasons")
        .select("id,name,status,start_date,end_date")
        .order("start_date", { ascending: false });

    const rows = (data ?? []) as any[];

    return (
        <>
            <PageHeader eyebrow="Configuración" title="Temporadas" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>Nueva temporada</h2>
                <form action={createSeason} className={styles.toolbar}>
                    <input className={`${styles.input} ${styles.search}`} name="name" placeholder="Ej. Temporada 2026/27" required />
                    <input className={styles.input} type="date" name="start_date" required aria-label="Inicio" />
                    <input className={styles.input} type="date" name="end_date" required aria-label="Fin" />
                    <select className={styles.select} name="status" defaultValue="draft">
                        <option value="draft">Borrador</option>
                        <option value="active">Activa</option>
                    </select>
                    <button className={styles.btnPrimary} type="submit">Crear temporada</button>
                </form>
            </section>

            {rows.length === 0 ? (
                <EmptyState title="Sin temporadas" text="Crea la primera temporada del circuito." />
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Temporada</th>
                                <th>Periodo</th>
                                <th>Estado</th>
                                <th>Cambiar estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((s) => (
                                <tr key={s.id}>
                                    <td><strong>{s.name}</strong></td>
                                    <td className={styles.muted}>
                                        {formatDate(s.start_date)} → {formatDate(s.end_date)}
                                    </td>
                                    <td>{SEASON_STATUS_LABEL[s.status] ?? s.status}</td>
                                    <td>
                                        <form action={changeSeasonStatus} className={styles.toolbar} style={{ margin: 0 }}>
                                            <input type="hidden" name="id" value={s.id} />
                                            <select className={styles.select} name="status" defaultValue={s.status}>
                                                {Object.entries(SEASON_STATUS_LABEL).map(([v, l]) => (
                                                    <option key={v} value={v}>{l}</option>
                                                ))}
                                            </select>
                                            <button className={styles.btnSecondary} type="submit">Guardar</button>
                                        </form>
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