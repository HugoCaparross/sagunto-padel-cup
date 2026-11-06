import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState, StatusBadge } from "@/components/crm/ui";
import { formatDate } from "@/lib/format";
import { MATCH_STATUS_LABEL } from "@/lib/match-rules";
import { createMatch } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

// Supabase devuelve las relaciones como arrays o objetos según el caso; no tipamos los joins de forma estricta.
type RegRow = any;

function pairName(r: RegRow | undefined) {
    if (!r) return "—";
    return (
        [...(r.registration_players ?? [])]
            .sort((x: any, y: any) => x.player_order - y.player_order)
            .map((rp: any) => rp.players?.display_name)
            .filter(Boolean)
            .join(" / ") || "Pareja sin nombre"
    );
}

function pairLabel(r: RegRow) {
    return `${r.events?.name ?? "Prueba"} · ${r.event_categories?.categories?.name ?? ""}: ${pairName(r)}`;
}

export default async function MatchesPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const { supabase } = await requireAdmin("/admin/resultados");

    const [matchesRes, regsRes] = await Promise.all([
        supabase
            .from("matches")
            .select(
                "id,match_number,round_name,status,scheduled_at,court_name,registration_a_id,registration_b_id,competition_stages(event_categories(events(name),categories(name)))",
            )
            .order("scheduled_at", { ascending: true, nullsFirst: false })
            .limit(200),
        supabase
            .from("registrations")
            .select("id,status,events(name),event_categories(categories(name)),registration_players(player_order,players(display_name))")
            .order("submitted_at", { ascending: true })
            .limit(500),
    ]);

    const matches = (matchesRes.data ?? []) as any[];
    const regs: RegRow[] = regsRes.data ?? [];
    const regById = new Map<string, RegRow>(regs.map((r) => [r.id, r]));
    const confirmed = regs.filter((r) => r.status === "confirmed");

    return (
        <>
            <PageHeader eyebrow="Competición" title="Resultados" />

            {error && (
                <p className={styles.alertError} role="alert">
                    {error}
                </p>
            )}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>Nuevo partido</h2>
                {confirmed.length < 2 ? (
                    <p className={styles.alertWarning}>
                        Necesitas al menos dos parejas confirmadas en la misma prueba y categoría.
                    </p>
                ) : (
                    <form action={createMatch} className={styles.form}>
                        <div className={styles.toolbar}>
                            <select className={styles.select} name="registration_a_id" required defaultValue="">
                                <option value="" disabled>
                                    Pareja A…
                                </option>
                                {confirmed.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {pairLabel(r)}
                                    </option>
                                ))}
                            </select>
                            <select className={styles.select} name="registration_b_id" required defaultValue="">
                                <option value="" disabled>
                                    Pareja B…
                                </option>
                                {confirmed.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {pairLabel(r)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.toolbar}>
                            <input className={styles.input} name="round_name" placeholder="Fase (ej. Grupo A)" />
                            <input className={styles.input} name="court_name" placeholder="Pista" />
                            <label className={styles.field}>
                                <span>Fecha y hora (Madrid)</span>
                                <input type="datetime-local" name="scheduled_at" />
                            </label>
                            <button className={styles.btnPrimary} type="submit">
                                Crear partido
                            </button>
                        </div>
                    </form>
                )}
            </section>

            {matches.length === 0 ? (
                <EmptyState title="Sin partidos" text="Crea el primer partido entre dos parejas confirmadas." />
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Partido</th>
                                <th>Pareja A</th>
                                <th>Pareja B</th>
                                <th>Prueba</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map((m) => (
                                <tr key={m.id}>
                                    <td>
                                        <Link href={`/admin/resultados/${m.id}`}>
                                            {m.match_number ?? "—"}
                                            {m.round_name ? ` · ${m.round_name}` : ""}
                                        </Link>
                                    </td>
                                    <td>{pairName(regById.get(m.registration_a_id))}</td>
                                    <td>{pairName(regById.get(m.registration_b_id))}</td>
                                    <td className={styles.muted}>
                                        {m.competition_stages?.event_categories?.events?.name ?? "—"}
                                    </td>
                                    <td className={styles.muted}>{formatDate(m.scheduled_at)}</td>
                                    <td>
                                        <StatusBadge value={m.status} label={MATCH_STATUS_LABEL[m.status] ?? m.status} />
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