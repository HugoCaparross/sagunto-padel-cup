import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, StatusBadge, EmptyState } from "@/components/crm/ui";
import { PLAYER_STATUS_LABEL } from "@/lib/format";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>;
}) {
    const { q = "", status = "" } = await searchParams;
    const { supabase } = await requireAdmin("/admin/jugadores");

    let query = supabase
        .from("players")
        .select("id,player_code,display_name,status,created_at,player_category_history(valid_to,categories(name),subgroups(name))")
        .order("display_name", { ascending: true })
        .limit(300);

    if (q.trim()) query = query.ilike("display_name", `%${q.trim()}%`);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    const rows = (data ?? []) as any[];

    return (
        <>
            <PageHeader
                eyebrow="CRM · Jugadores"
                title="Jugadores"
                actions={<span className={styles.muted}>{rows.length} resultados</span>}
            />

            <form className={styles.toolbar} method="get">
                <input
                    className={`${styles.input} ${styles.search}`}
                    name="q"
                    defaultValue={q}
                    placeholder="Buscar por nombre…"
                />
                <select className={styles.select} name="status" defaultValue={status}>
                    <option value="">Todos los estados</option>
                    {Object.entries(PLAYER_STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
                <button className={styles.btnSecondary} type="submit">
                    Filtrar
                </button>
            </form>

            {error ? (
                <EmptyState
                    title="No se pueden cargar los jugadores"
                    text="Revisa la conexión con Supabase y los permisos de la cuenta."
                />
            ) : rows.length === 0 ? (
                <EmptyState title="Sin resultados" text="Prueba con otro nombre o estado." />
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Jugador</th>
                                <th>Código</th>
                                <th>Categoría actual</th>
                                <th>Estado</th>
                                <th>Alta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((p) => {
                                const current = (p.player_category_history ?? []).find(
                                    (h: any) => h.valid_to === null,
                                );
                                return (
                                    <tr key={p.id}>
                                        <td>
                                            <Link href={`/admin/jugadores/${p.id}`}>{p.display_name}</Link>
                                        </td>
                                        <td className={styles.muted}>{p.player_code ?? "—"}</td>
                                        <td>
                                            {current
                                                ? `${current.categories?.name ?? "—"}${current.subgroups ? ` · ${current.subgroups.name}` : ""
                                                }`
                                                : "Sin categoría"}
                                        </td>
                                        <td>
                                            <StatusBadge value={p.status} label={PLAYER_STATUS_LABEL[p.status]} />
                                        </td>
                                        <td className={styles.muted}>
                                            {new Date(p.created_at).toLocaleDateString("es-ES")}
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