import { markPresence } from "@/app/(admin)/admin/competicion/actions";
import styles from "@/components/crm/crm.module.css";

export type PresencePair = { id: string; name: string; presentedAt: string | null };

/** Presencia registrada por la organización. Una vez marcada no se puede desmarcar. */
export function PresenceBoard({ eventId, pairs }: { eventId: string; pairs: PresencePair[] }) {
    const present = pairs.filter((p) => p.presentedAt).length;

    return (
        <section className={styles.card}>
            <h2 className={styles.cardTitle}>
                Presentes {present} de {pairs.length}
            </h2>

            {pairs.length === 0 ? (
                <p className={styles.muted}>No hay parejas confirmadas en esta prueba.</p>
            ) : (
                <ul className={styles.checkList}>
                    {pairs.map((p) => (
                        <li key={p.id} className={styles.checkRow}>
                            <strong>{p.name}</strong>
                            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                {p.presentedAt && <span className={styles.muted}>{p.presentedAt}</span>}
                                <form action={markPresence}>
                                    <input type="hidden" name="event_id" value={eventId} />
                                    <input type="hidden" name="registration_id" value={p.id} />
                                    <button
                                        type="submit"
                                        className={p.presentedAt ? styles.btnSecondary : styles.btnPrimary}
                                        disabled={!!p.presentedAt}
                                    >
                                        {p.presentedAt ? "Presente" : "Marcar presente"}
                                    </button>
                                </form>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}