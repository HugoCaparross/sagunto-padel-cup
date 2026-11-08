import { PageHead, Tabs, Empty } from "@/components/admin/ui";
import { PresenceBoard } from "@/components/admin/PresenceBoard";
import { CourtAssign, CourtManager } from "@/components/admin/CourtAssign";
import { loadEvents, loadPresentation } from "@/lib/admin/competicion-data";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

const TABS = [
    { key: "presentacion", label: "Presentación" },
    { key: "partidos", label: "Partidos" },
    { key: "cuadro", label: "Grupos y cuadro" },
    { key: "resultados", label: "Resultados" },
    { key: "inscripciones", label: "Inscripciones" },
];

export default async function Competicion({
    searchParams,
}: {
    searchParams: Promise<{ prueba?: string; tab?: string; ok?: string; error?: string }>;
}) {
    const { prueba, tab = "presentacion", ok, error } = await searchParams;
    const events = await loadEvents();
    const event =
        events.find((e) => e.id === prueba) ??
        events.find((e) => e.status === "in_progress") ??
        events[0] ??
        null;

    if (!event) {
        return (
            <>
                <PageHead eyebrow="Competición" title="Competición" />
                <Empty title="No hay pruebas" text="Crea una prueba en Pruebas para empezar." />
            </>
        );
    }

    const data = tab === "presentacion" ? await loadPresentation(event.id) : null;
    const presentCount = data ? data.pairs.filter((p) => p.presentedAt).length : 0;
    const pendingCourt = data ? data.matches.filter((m) => !m.court).length : 0;
    const base = "/admin/competicion";
    const extra = `&prueba=${event.id}`;

    return (
        <>
            <PageHead
                eyebrow="Competición"
                title={event.name}
                status={
                    data ? (
                        <>
                            <span>
                                Presentes: <strong>{presentCount} de {data.pairs.length}</strong>
                            </span>
                            <span>
                                Partidos sin pista: <strong>{pendingCourt}</strong>
                            </span>
                        </>
                    ) : (
                        <span>Datos de esta pestaña pendientes de conectar</span>
                    )
                }
            />

            <form method="get" className={styles.toolbar}>
                <select className={styles.select} name="prueba" defaultValue={event.id}>
                    {events.map((e) => (
                        <option key={e.id} value={e.id}>
                            {e.name}
                        </option>
                    ))}
                </select>
                <input type="hidden" name="tab" value={tab} />
                <button className={styles.btnSecondary} type="submit">
                    Cambiar prueba
                </button>
            </form>

            {ok && (
                <p className={styles.alertSuccess} role="status">
                    {ok}
                </p>
            )}
            {error && (
                <p className={styles.alertError} role="alert">
                    {error}
                </p>
            )}

            <Tabs base={base} current={tab} tabs={TABS} extra={extra} />

            {tab === "presentacion" && data && (
                <div className={styles.detailGrid}>
                    <div style={{ display: "grid", gap: 16 }}>
                        <PresenceBoard eventId={event.id} pairs={data.pairs} />
                        <CourtManager eventId={event.id} courts={data.courts} />
                    </div>
                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>Asignar pista</h2>
                        <CourtAssign eventId={event.id} matches={data.matches} courts={data.courts} />
                    </section>
                </div>
            )}

            {tab !== "presentacion" && (
                <Empty
                    title="Pendiente de conectar"
                    text="Esta pestaña todavía muestra datos de la maqueta. Se conecta en el siguiente paso."
                />
            )}
        </>
    );
}