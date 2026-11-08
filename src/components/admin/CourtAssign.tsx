import { addCourt, assignCourt } from "@/app/(admin)/admin/competicion/actions";
import styles from "@/components/crm/crm.module.css";

export type CourtPick = { id: string; name: string };
export type CourtMatch = { id: string; label: string; a: string; b: string; court: string | null };

/** Lista de pistas de la prueba, con alta de nuevas pistas. */
export function CourtManager({ eventId, courts }: { eventId: string; courts: CourtPick[] }) {
    return (
        <section className={styles.card}>
            <h2 className={styles.cardTitle}>Pistas</h2>
            <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                {courts.length ? courts.map((c) => c.name).join(" · ") : "Esta prueba todavía no tiene pistas."}
            </p>
            <form action={addCourt} className={styles.toolbar} style={{ margin: 0 }}>
                <input type="hidden" name="event_id" value={eventId} />
                <input className={styles.input} name="name" required maxLength={40} placeholder="Pista 4" />
                <button className={styles.btnSecondary} type="submit">
                    Añadir pista
                </button>
            </form>
        </section>
    );
}

/** Asignación de pista a partidos pendientes. La hora queda registrada automáticamente. */
export function CourtAssign({
    eventId,
    matches,
    courts,
}: {
    eventId: string;
    matches: CourtMatch[];
    courts: CourtPick[];
}) {
    if (courts.length === 0) {
        return <p className={styles.alertWarning}>Añade primero las pistas de esta prueba.</p>;
    }
    if (matches.length === 0) {
        return <p className={styles.muted}>No hay partidos pendientes de pista.</p>;
    }

    return (
        <ul className={styles.checkList}>
            {matches.map((m) => (
                <li key={m.id} className={styles.checkRow}>
                    <span>
                        <strong>{m.label}</strong>
                        <div className={styles.muted} style={{ fontSize: 12 }}>
                            {m.a} vs {m.b}
                        </div>
                    </span>
                    <form action={assignCourt} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="hidden" name="event_id" value={eventId} />
                        <input type="hidden" name="match_id" value={m.id} />
                        <select className={styles.select} name="court_name" defaultValue={m.court ?? ""} required>
                            <option value="" disabled>
                                Pista…
                            </option>
                            {courts.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <button className={styles.btnSecondary} type="submit">
                            Asignar
                        </button>
                    </form>
                </li>
            ))}
        </ul>
    );
}