import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, StatusBadge, EmptyState } from "@/components/crm/ui";
import { REGISTRATION_STATUS_LABEL, formatDate } from "@/lib/format";
import { changeRegistrationStatus } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

const COLUMNS = ["pending", "waitlist", "confirmed", "rejected"] as const;

const TRANSITIONS: Record<string, string[]> = {
    pending: ["confirmed", "waitlist", "rejected"],
    waitlist: ["confirmed", "rejected", "cancelled"],
    confirmed: ["waitlist", "cancelled"],
    rejected: ["pending"],
    cancelled: ["pending"],
};

export default async function RegistrationsPage() {
    const { supabase } = await requireAdmin("/admin/inscripciones");

    const { data, error } = await supabase
        .from("registrations")
        .select(
            "id,status,submitted_at,events(name,starts_at),event_categories(categories(name),subgroups(name)),registration_players(player_order,players(display_name))",
        )
        .order("submitted_at", { ascending: true })
        .limit(300);

    const rows = (data ?? []) as any[];

    return (
        <>
            <PageHeader
                eyebrow="CRM · Inscripciones"
                title="Inscripciones"
                actions={<span className={styles.muted}>{rows.length} solicitudes</span>}
            />

            {error ? (
                <EmptyState
                    title="No se pueden cargar las inscripciones"
                    text="Revisa la conexión con Supabase y los permisos."
                />
            ) : rows.length === 0 ? (
                <EmptyState title="Sin inscripciones" text="Cuando los jugadores se inscriban aparecerán aquí." />
            ) : (
                <div className={styles.pipeline}>
                    {COLUMNS.map((col) => {
                        const items = rows.filter((r) => r.status === col);
                        return (
                            <section key={col} className={styles.column} aria-label={REGISTRATION_STATUS_LABEL[col]}>
                                <div className={styles.columnHead}>
                                    <span>{REGISTRATION_STATUS_LABEL[col]}</span>
                                    <StatusBadge value={col} label={String(items.length)} />
                                </div>

                                {items.map((r) => {
                                    const names = (r.registration_players ?? [])
                                        .sort((a: any, b: any) => a.player_order - b.player_order)
                                        .map((rp: any) => rp.players?.display_name)
                                        .filter(Boolean)
                                        .join(" / ");
                                    const cat = [r.event_categories?.categories?.name, r.event_categories?.subgroups?.name]
                                        .filter(Boolean)
                                        .join(" · ");

                                    return (
                                        <article key={r.id} className={styles.regCard}>
                                            <strong>{names || "Pareja sin nombre"}</strong>
                                            <p className={styles.muted}>
                                                {r.events?.name} · {cat || "Sin categoría"}
                                            </p>
                                            <p className={styles.muted}>Solicitud: {formatDate(r.submitted_at)}</p>

                                            <form action={changeRegistrationStatus}>
                                                <input type="hidden" name="id" value={r.id} />
                                                <select
                                                    className={styles.select}
                                                    name="status"
                                                    defaultValue=""
                                                    required
                                                    aria-label="Nuevo estado"
                                                >
                                                    <option value="" disabled>
                                                        Cambiar a…
                                                    </option>
                                                    {(TRANSITIONS[r.status] ?? []).map((s) => (
                                                        <option key={s} value={s}>
                                                            {REGISTRATION_STATUS_LABEL[s]}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button className={styles.btnSecondary} type="submit">
                                                    Aplicar
                                                </button>
                                            </form>
                                        </article>
                                    );
                                })}
                            </section>
                        );
                    })}
                </div>
            )}
        </>
    );
}