import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { formatDate } from "@/lib/format";
import { MATCH_STATUS_LABEL } from "@/lib/match-rules";
import {
    createBracketStage,
    saveBracketSeeds,
    generateBracket,
    deleteDraftStage,
    scheduleMatch,
    applyBracketResults,
} from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
    draft: "Borrador",
    in_progress: "En juego",
    completed: "Finalizado",
};

const STAGE_CLASS: Record<string, string> = {
    draft: "warning",
    in_progress: "info",
    completed: "success",
};

function pairName(r: any) {
    if (!r) return "Por definir";
    return (
        [...(r.registration_players ?? [])]
            .sort((x: any, y: any) => x.player_order - y.player_order)
            .map((rp: any) => rp.players?.display_name)
            .filter(Boolean)
            .join(" / ") || "Pareja sin nombre"
    );
}

export default async function BracketsPage({
    searchParams,
}: {
    searchParams: Promise<{ event?: string; error?: string; ok?: string }>;
}) {
    const { event: eventParam, error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/cuadros");

    const { data: eventsData } = await supabase
        .from("events")
        .select("id,name,status")
        .eq("event_type", "regular")
        .order("starts_at", { ascending: true, nullsFirst: false });

    const events = (eventsData ?? []) as any[];
    const event = events.find((e) => e.id === eventParam) ?? events[0] ?? null;

    if (!event) {
        return (
            <>
                <PageHeader eyebrow="Competición" title="Cuadros" />
                <EmptyState title="Sin pruebas" text="Crea una prueba para generar cuadros." />
            </>
        );
    }

    const [catsRes, subsRes, regsRes, stagesRes] = await Promise.all([
        supabase.from("categories").select("id,name").eq("is_active", true).order("display_order"),
        supabase.from("subgroups").select("id,name").eq("is_active", true).order("display_order"),
        supabase
            .from("registrations")
            .select("id,event_categories(category_id,categories(name)),registration_players(player_order,players(display_name))")
            .eq("event_id", event.id)
            .eq("status", "confirmed"),
        supabase
            .from("bracket_stages")
            .select("stage_id,category_id,subgroup_id,size,categories(name),subgroups(name),competition_stages(status,name)")
            .eq("event_id", event.id),
    ]);

    const categories = (catsRes.data ?? []) as any[];
    const subgroups = (subsRes.data ?? []) as any[];
    const regs = (regsRes.data ?? []) as any[];
    const stages = (stagesRes.data ?? []) as any[];
    const stageIds = stages.map((s) => s.stage_id as string);

    let entries: any[] = [];
    let matches: any[] = [];

    if (stageIds.length > 0) {
        const entriesRes = await supabase
            .from("bracket_entries")
            .select("registration_id,stage_id,seed")
            .in("stage_id", stageIds);
        entries = (entriesRes.data ?? []) as any[];

        const matchesRes = await supabase
            .from("matches")
            .select(
                "id,stage_id,match_number,status,scheduled_at,court_name,registration_a_id,registration_b_id,winner_registration_id,bracket_matches(round_no,pos,teams)",
            )
            .in("stage_id", stageIds);
        matches = (matchesRes.data ?? []) as any[];
    }

    const regById = new Map<string, any>(regs.map((r) => [r.id, r]));

    return (
        <>
            <PageHeader eyebrow={`Competición · ${event.name}`} title="Cuadros, grupos y horarios" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            <form method="get" className={styles.toolbar}>
                <select className={styles.select} name="event" defaultValue={event.id}>
                    {events.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                </select>
                <button className={styles.btnSecondary} type="submit">Ver prueba</button>
            </form>

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>Nuevo cuadro</h2>
                <form action={createBracketStage} className={styles.toolbar}>
                    <input type="hidden" name="event_id" value={event.id} />
                    <select className={styles.select} name="category_id" required defaultValue="">
                        <option value="" disabled>Categoría…</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <select className={styles.select} name="subgroup_id" required defaultValue="">
                        <option value="" disabled>Subgrupo…</option>
                        {subgroups.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <button className={styles.btnPrimary} type="submit">Crear cuadro</button>
                </form>
            </section>

            {stages.length === 0 ? (
                <EmptyState title="Sin cuadros" text="Crea el primer cuadro de esta prueba." />
            ) : (
                stages.map((st) => {
                    const status: string = st.competition_stages?.status ?? "draft";
                    const isDraft = status === "draft";
                    const candidates = regs.filter((r) => r.event_categories?.category_id === st.category_id);
                    const seedMap = new Map<string, number>(
                        entries.filter((e) => e.stage_id === st.stage_id).map((e) => [e.registration_id, e.seed]),
                    );
                    const stageMatches = matches
                        .filter((m) => m.stage_id === st.stage_id)
                        .map((m) => ({ ...m, bm: Array.isArray(m.bracket_matches) ? m.bracket_matches[0] : m.bracket_matches }))
                        .sort((a, b) => (a.bm?.round_no ?? 0) - (b.bm?.round_no ?? 0) || (a.bm?.pos ?? 0) - (b.bm?.pos ?? 0));

                    return (
                        <section key={st.stage_id} className={styles.card} style={{ marginBottom: 24 }}>
                            <div className={styles.toolbar} style={{ justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                                        {st.categories?.name} · {st.subgroups?.name}
                                    </h2>
                                    {st.size && (
                                        <p className={styles.muted} style={{ margin: "4px 0 0", fontSize: 13 }}>
                                            Cuadro de {st.size} plazas
                                        </p>
                                    )}
                                </div>
                                <span className={`${styles.badge} ${styles[STAGE_CLASS[status]]}`}>
                                    {STAGE_LABEL[status] ?? status}
                                </span>
                            </div>

                            {isDraft ? (
                                <>
                                    {candidates.length === 0 ? (
                                        <p className={styles.alertWarning} style={{ marginTop: 16 }}>
                                            No hay parejas confirmadas en esta categoría.
                                        </p>
                                    ) : (
                                        <form action={saveBracketSeeds} className={styles.form} style={{ marginTop: 16 }}>
                                            <input type="hidden" name="event_id" value={event.id} />
                                            <input type="hidden" name="stage_id" value={st.stage_id} />
                                            <div className={styles.tableWrap}>
                                                <table className={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th>Pareja</th>
                                                            <th>Cabeza de serie</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {candidates.map((r) => (
                                                            <tr key={r.id}>
                                                                <td>{pairName(r)}</td>
                                                                <td>
                                                                    <select
                                                                        className={styles.select}
                                                                        name={`seed_${r.id}`}
                                                                        defaultValue={seedMap.get(r.id) ?? ""}
                                                                    >
                                                                        <option value="">Fuera del cuadro</option>
                                                                        {candidates.map((_, i) => (
                                                                            <option key={i} value={i + 1}>{i + 1}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div>
                                                <button className={styles.btnSecondary} type="submit">
                                                    Guardar cabezas de serie
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    <div className={styles.toolbar} style={{ marginTop: 16 }}>
                                        <form action={generateBracket}>
                                            <input type="hidden" name="event_id" value={event.id} />
                                            <input type="hidden" name="stage_id" value={st.stage_id} />
                                            <button className={styles.btnPrimary} type="submit">Generar cuadro</button>
                                        </form>
                                        <form action={deleteDraftStage}>
                                            <input type="hidden" name="event_id" value={event.id} />
                                            <input type="hidden" name="stage_id" value={st.stage_id} />
                                            <button className={styles.btnGhost} type="submit">Eliminar cuadro</button>
                                        </form>
                                    </div>
                                </>
                            ) : stageMatches.length === 0 ? (
                                <p className={styles.muted}>Sin partidos todavía.</p>
                            ) : (
                                <div className={styles.tableWrap} style={{ marginTop: 16 }}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Partido</th>
                                                <th>Pareja A</th>
                                                <th>Pareja B</th>
                                                <th>Ganador</th>
                                                <th>Estado</th>
                                                <th>Pista y hora</th>
                                                <th>Resultado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stageMatches.map((m) => (
                                                <tr key={m.id}>
                                                    <td>
                                                        <strong>{m.bm?.teams === 2 ? "Final" : m.match_number}</strong>
                                                    </td>
                                                    <td>{pairName(regById.get(m.registration_a_id))}</td>
                                                    <td>{pairName(regById.get(m.registration_b_id))}</td>
                                                    <td>{m.winner_registration_id ? pairName(regById.get(m.winner_registration_id)) : "—"}</td>
                                                    <td className={styles.muted}>{MATCH_STATUS_LABEL[m.status] ?? m.status}</td>
                                                    <td>
                                                        <form action={scheduleMatch} className={styles.toolbar} style={{ margin: 0 }}>
                                                            <input type="hidden" name="event_id" value={event.id} />
                                                            <input type="hidden" name="match_id" value={m.id} />
                                                            <input
                                                                className={styles.input}
                                                                style={{ width: 130 }}
                                                                name="court_name"
                                                                placeholder="Pista"
                                                                defaultValue={m.court_name ?? ""}
                                                            />
                                                            <input
                                                                className={styles.input}
                                                                type="datetime-local"
                                                                name="scheduled_at"
                                                                aria-label="Fecha y hora"
                                                            />
                                                            <button className={styles.btnSecondary} type="submit">Guardar</button>
                                                        </form>
                                                        {m.scheduled_at && (
                                                            <p className={styles.muted} style={{ fontSize: 12, margin: "4px 0 0" }}>
                                                                Actual: {formatDate(m.scheduled_at)}
                                                                {m.court_name ? ` · ${m.court_name}` : ""}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Link href={`/admin/resultados/${m.id}`}>Introducir</Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {status === "completed" && (
                                <form action={applyBracketResults} style={{ marginTop: 16 }}>
                                    <input type="hidden" name="event_id" value={event.id} />
                                    <input type="hidden" name="stage_id" value={st.stage_id} />
                                    <button className={styles.btnPrimary} type="submit">
                                        Aplicar resultados a la prueba
                                    </button>
                                </form>
                            )}
                        </section>
                    );
                })
            )}
        </>
    );
}