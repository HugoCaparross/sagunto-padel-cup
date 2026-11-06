import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, StatusBadge, EmptyState } from "@/components/crm/ui";
import { formatPoints } from "@/lib/format";
import { MATCH_STATUS_LABEL, DEFAULT_STAGE_RULES } from "@/lib/match-rules";
import { saveResult, validateMatch, revertMatch } from "../actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

function pairName(r: any) {
    if (!r) return "—";
    return (
        [...(r.registration_players ?? [])]
            .sort((x: any, y: any) => x.player_order - y.player_order)
            .map((rp: any) => rp.players?.display_name)
            .filter(Boolean)
            .join(" / ") || "Pareja sin nombre"
    );
}

export default async function MatchDetail({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ error?: string }>;
}) {
    const { id } = await params;
    const { error } = await searchParams;
    const { supabase } = await requireAdmin(`/admin/resultados/${id}`);

    const { data: match } = await supabase
        .from("matches")
        .select("id,match_number,round_name,status,scheduled_at,court_name,registration_a_id,registration_b_id,winner_registration_id,competition_stages(rules_json)")
        .eq("id", id)
        .maybeSingle();

    if (!match) notFound();

    const m = match as any;
    const ids = [m.registration_a_id, m.registration_b_id].filter(Boolean) as string[];

    const [regsRes, setsRes, txRes] = await Promise.all([
        supabase
            .from("registrations")
            .select("id,registration_players(player_order,players(display_name))")
            .in("id", ids),
        supabase
            .from("match_sets")
            .select("set_number,score_a,score_b,tie_break_a,tie_break_b")
            .eq("match_id", id)
            .order("set_number"),
        supabase
            .from("point_transactions")
            .select("points,transaction_type,reason,created_at,players(display_name)")
            .eq("match_id", id)
            .order("created_at", { ascending: false }),
    ]);

    const regs = (regsRes.data ?? []) as any[];
    const sets = (setsRes.data ?? []) as any[];
    const txs = (txRes.data ?? []) as any[];

    const nameA = pairName(regs.find((r) => r.id === m.registration_a_id));
    const nameB = pairName(regs.find((r) => r.id === m.registration_b_id));
    const winnerName = m.winner_registration_id
        ? m.winner_registration_id === m.registration_a_id ? nameA : nameB
        : null;

    const rules = { ...DEFAULT_STAGE_RULES, ...(m.competition_stages?.rules_json ?? {}) };
    const locked = m.status === "validated";
    const canValidate = m.status === "finished_pending_validation";

    return (
        <>
            <PageHeader
                eyebrow={`Partido ${m.match_number ?? ""}`}
                title={`${nameA} vs ${nameB}`}
                actions={
                    <>
                        <StatusBadge value={m.status} label={MATCH_STATUS_LABEL[m.status] ?? m.status} />
                        <Link className={styles.btnSecondary} href="/admin/resultados">← Volver</Link>
                    </>
                }
            />

            {error && <p className={styles.alertError} role="alert">{error}</p>}

            <section className={styles.detailGrid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Resultado</h2>

                    <form action={saveResult} className={styles.form}>
                        <input type="hidden" name="id" value={id} />

                        <table className={styles.table} style={{ minWidth: 0 }}>
                            <thead>
                                <tr>
                                    <th>Set</th>
                                    <th>{nameA}</th>
                                    <th>{nameB}</th>
                                    <th>Tie-break</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3].map((n) => {
                                    const s = sets[n - 1];
                                    return (
                                        <tr key={n}>
                                            <td>{n}</td>
                                            <td>
                                                <input className={styles.input} style={{ width: 70 }} type="number" min={0} name={`s${n}a`} defaultValue={s?.score_a ?? ""} disabled={locked} />
                                            </td>
                                            <td>
                                                <input className={styles.input} style={{ width: 70 }} type="number" min={0} name={`s${n}b`} defaultValue={s?.score_b ?? ""} disabled={locked} />
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <input className={styles.input} style={{ width: 60 }} type="number" min={0} name={`t${n}a`} defaultValue={s?.tie_break_a ?? ""} disabled={locked} aria-label={`Tie-break set ${n} pareja A`} />
                                                    <input className={styles.input} style={{ width: 60 }} type="number" min={0} name={`t${n}b`} defaultValue={s?.tie_break_b ?? ""} disabled={locked} aria-label={`Tie-break set ${n} pareja B`} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <p className={styles.muted} style={{ fontSize: 12 }}>
                            Formato: sets a {rules.games_to} juegos, tie-break a {rules.tiebreak_at}-{rules.tiebreak_at}.
                            {rules.best_of === 3 ? " Al mejor de tres sets." : " Un solo set."}
                        </p>

                        {!locked && (
                            <button className={styles.btnPrimary} type="submit">Guardar resultado</button>
                        )}
                    </form>
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Validación</h2>

                        {m.status === "validated" ? (
                            <>
                                <p>Ganador: <strong>{winnerName}</strong></p>
                                <p className={styles.muted}>Los puntos ya están asignados a cada jugador.</p>

                                <form action={revertMatch} className={styles.form} style={{ marginTop: 16 }}>
                                    <input type="hidden" name="id" value={id} />
                                    <label className={styles.field}>
                                        <span>Motivo de la reversión (obligatorio)</span>
                                        <textarea name="reason" rows={2} required />
                                    </label>
                                    <button className={styles.btnSecondary} type="submit">Revertir validación</button>
                                </form>
                            </>
                        ) : canValidate ? (
                            <form action={validateMatch} className={styles.form}>
                                <input type="hidden" name="id" value={id} />
                                <p className={styles.muted}>Revisa el marcador antes de validar. Al validar se generan los puntos.</p>
                                <button className={styles.btnPrimary} type="submit">Validar y asignar puntos</button>
                            </form>
                        ) : (
                            <p className={styles.muted}>Guarda primero el resultado para poder validarlo.</p>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Movimientos de puntos</h2>
                        {txs.length === 0 ? (
                            <EmptyState title="Sin movimientos" text="Aparecerán al validar el partido." />
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Jugador</th>
                                            <th>Tipo</th>
                                            <th>Puntos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {txs.map((t, i) => (
                                            <tr key={i}>
                                                <td>{t.players?.display_name ?? "—"}</td>
                                                <td className={styles.muted}>
                                                    {t.transaction_type === "reversal" ? "Reversión" : "Partido"}
                                                </td>
                                                <td><strong>{formatPoints(t.points)}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}