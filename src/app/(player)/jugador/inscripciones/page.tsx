import { requireUser } from "@/lib/auth/session";
import { PageHeader, StatusBadge, EmptyState } from "@/components/crm/ui";
import { REGISTRATION_STATUS_LABEL, formatDate } from "@/lib/format";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function MyRegistrations() {
    const { supabase } = await requireUser("/jugador/inscripciones");

    const { data } = await supabase
        .from("registrations")
        .select(
            "id,status,submitted_at,events(name,starts_at),event_categories(categories(name),subgroups(name)),registration_players(player_order,players(display_name))",
        )
        .order("submitted_at", { ascending: false });

    const rows = (data ?? []) as any[];

    return (
        <>
            <PageHeader eyebrow="Mi actividad" title="Mis inscripciones" />

            {rows.length === 0 ? (
                <EmptyState
                    title="Sin inscripciones"
                    text="Cuando te inscribas a una prueba aparecerá aquí su estado."
                />
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Prueba</th>
                                <th>Pareja</th>
                                <th>Categoría</th>
                                <th>Fecha prueba</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => {
                                const pair = (r.registration_players ?? [])
                                    .sort((a: any, b: any) => a.player_order - b.player_order)
                                    .map((rp: any) => rp.players?.display_name)
                                    .filter(Boolean)
                                    .join(" / ");
                                const cat = [r.event_categories?.categories?.name, r.event_categories?.subgroups?.name]
                                    .filter(Boolean)
                                    .join(" · ");
                                return (
                                    <tr key={r.id}>
                                        <td>
                                            <strong>{r.events?.name}</strong>
                                        </td>
                                        <td>{pair || "—"}</td>
                                        <td>{cat || "—"}</td>
                                        <td className={styles.muted}>{formatDate(r.events?.starts_at)}</td>
                                        <td>
                                            <StatusBadge value={r.status} label={REGISTRATION_STATUS_LABEL[r.status]} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}