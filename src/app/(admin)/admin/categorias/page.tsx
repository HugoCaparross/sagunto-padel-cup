import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/crm/ui";
import { updateItem, moveItem, createItem } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

function ItemTable({ table, title, rows }: { table: "categories" | "subgroups"; title: string; rows: any[] }) {
    return (
        <section className={styles.card} style={{ marginBottom: 24 }}>
            <h2 className={styles.cardTitle}>{title}</h2>

            <div className={styles.tableWrap} style={{ marginBottom: 16 }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Orden</th>
                            <th>Nombre</th>
                            <th>Código</th>
                            <th>Activo</th>
                            <th>Guardar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => {
                            const formId = `f-${table}-${r.id}`;
                            return (
                                <tr key={r.id}>
                                    <td>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            <form action={moveItem}>
                                                <input type="hidden" name="table" value={table} />
                                                <input type="hidden" name="id" value={r.id} />
                                                <input type="hidden" name="direction" value="up" />
                                                <button className={styles.btnGhost} type="submit" disabled={i === 0} aria-label="Subir">
                                                    ↑
                                                </button>
                                            </form>
                                            <form action={moveItem}>
                                                <input type="hidden" name="table" value={table} />
                                                <input type="hidden" name="id" value={r.id} />
                                                <input type="hidden" name="direction" value="down" />
                                                <button
                                                    className={styles.btnGhost}
                                                    type="submit"
                                                    disabled={i === rows.length - 1}
                                                    aria-label="Bajar"
                                                >
                                                    ↓
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                    <td>
                                        <form id={formId} action={updateItem} style={{ display: "none" }}>
                                            <input type="hidden" name="table" value={table} />
                                            <input type="hidden" name="id" value={r.id} />
                                        </form>
                                        <input
                                            className={styles.input}
                                            form={formId}
                                            name="name"
                                            defaultValue={r.name}
                                            required
                                            minLength={2}
                                            maxLength={60}
                                        />
                                    </td>
                                    <td className={styles.muted}>{r.code}</td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            form={formId}
                                            name="is_active"
                                            defaultChecked={r.is_active}
                                            aria-label="Activo"
                                        />
                                    </td>
                                    <td>
                                        <button className={styles.btnSecondary} form={formId} type="submit">
                                            Guardar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <form action={createItem} className={styles.toolbar} style={{ margin: 0 }}>
                <input type="hidden" name="table" value={table} />
                <input className={`${styles.input} ${styles.search}`} name="name" placeholder="Nuevo nombre" required minLength={2} maxLength={60} />
                <button className={styles.btnPrimary} type="submit">Añadir</button>
            </form>
        </section>
    );
}

export default async function CategoriesPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; ok?: string }>;
}) {
    const { error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/categorias");

    const [catsRes, subsRes] = await Promise.all([
        supabase.from("categories").select("id,code,name,display_order,is_active").order("display_order"),
        supabase.from("subgroups").select("id,code,name,display_order,is_active").order("display_order"),
    ]);

    const cats = (catsRes.data ?? []) as any[];
    const subs = (subsRes.data ?? []) as any[];

    return (
        <>
            <PageHeader
                eyebrow="Configuración"
                title="Categorías y subgrupos"
                actions={
                    <Link className={styles.btnSecondary} href="/admin/categorias/asignaciones">
                        Asignaciones de jugadores →
                    </Link>
                }
            />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                Desactiva en lugar de borrar: el histórico de jugadores y pruebas se conserva. Cambiar un nombre o
                el orden no reescribe nada anterior.
            </p>

            <ItemTable table="categories" title="Categorías" rows={cats} />
            <ItemTable table="subgroups" title="Subgrupos" rows={subs} />
        </>
    );
}