import Link from "next/link";
import type { PairStatus } from "@/types/database";
import { getCategories, getAdminPairs } from "@/lib/services/admin";
import { getTournaments } from "@/lib/services/tournaments";
import styles from "../admin-list.module.css";

type SearchParams = Promise<{ q?: string; torneo?: string; categoria?: string; estado?: string; pagina?: string }>;
const PAIR_STATES: PairStatus[] = ["confirmada", "lista_espera", "incompleta", "pendiente_pago"];
const PAIR_LABELS: Record<PairStatus, string> = { confirmada: "Confirmada", lista_espera: "Lista de espera", incompleta: "Incompleta", pendiente_pago: "Pendiente de pago" };

export default async function AdminPairsPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const search = params.q?.trim() ?? "";
    const [categories, tournaments] = await Promise.all([getCategories(), getTournaments()]);
    const tournamentId = tournaments.some((item) => item.id === params.torneo) ? params.torneo : "";
    const categoryId = categories.some((item) => item.id === params.categoria) ? params.categoria : "";
    const status = PAIR_STATES.includes(params.estado as PairStatus) ? params.estado as PairStatus : undefined;
    const page = Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1);
    const result = await getAdminPairs({ search, tournamentId: tournamentId || undefined, categoryId: categoryId || undefined, estado: status, page, pageSize: 50 });
    const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
    const pageHref = (value: number) => {
        const query = new URLSearchParams();
        if (search) query.set("q", search);
        if (tournamentId) query.set("torneo", tournamentId);
        if (categoryId) query.set("categoria", categoryId);
        if (status) query.set("estado", status);
        if (value > 1) query.set("pagina", String(value));
        return `/admin/parejas${query.size ? `?${query}` : ""}`;
    };

    return <main className={styles.page}>
        <header className={styles.header}><div><span className={styles.eyebrow}>Participantes</span><h1 className={styles.title}>Parejas</h1><p className={styles.description}>Consulta integrantes, torneo, categoría y estado. Los cambios de integrantes no se ofrecen aquí mientras sigan pendientes las reglas de sustitución.</p></div><span className={styles.count}>{result.total} parejas</span></header>
        <section className={styles.panel} aria-label="Listado de parejas">
            <form action="/admin/parejas" method="GET" className={styles.toolbar}>
                <div className={styles.field}><label htmlFor="pair-search">Buscar integrante</label><input id="pair-search" className={styles.input} type="search" name="q" defaultValue={search} placeholder="Nombre o apellidos" /></div>
                <div className={styles.field}><label htmlFor="pair-tournament">Torneo</label><select id="pair-tournament" className={styles.select} name="torneo" defaultValue={tournamentId}><option value="">Todos</option>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.nombre}</option>)}</select></div>
                <div className={styles.field}><label htmlFor="pair-category">Categoría</label><select id="pair-category" className={styles.select} name="categoria" defaultValue={categoryId}><option value="">Todas</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></div>
                <div className={styles.field}><label htmlFor="pair-status">Estado</label><select id="pair-status" className={styles.select} name="estado" defaultValue={status ?? ""}><option value="">Todos</option>{PAIR_STATES.map((state) => <option key={state} value={state}>{PAIR_LABELS[state]}</option>)}</select></div>
                <button className={styles.button} type="submit">Filtrar</button>
                {(search || tournamentId || categoryId || status) && <Link className={styles.quietButton} href="/admin/parejas">Limpiar</Link>}
            </form>
            {!result.rows.length ? <div className={styles.empty}><h2>{search || tournamentId || categoryId || status ? "Sin resultados" : "Todavía no hay parejas"}</h2><p>Las parejas se crean durante los flujos de inscripción.</p></div> : <div className={styles.tableWrap}><table className={styles.table}>
                <thead><tr><th scope="col">Integrantes</th><th scope="col">Torneo</th><th scope="col">Categoría</th><th scope="col">Estado</th><th scope="col">Inscrita</th><th scope="col">Ficha</th></tr></thead>
                <tbody>{result.rows.map((pair) => <tr key={pair.id}>
                    <td><span className={styles.primaryText}>{pair.player1Name ?? "Jugador pendiente"}</span><span className={styles.secondaryText}>{pair.player2Name ?? "Segundo jugador pendiente"}</span></td>
                    <td>{pair.tournamentName ?? "Torneo no disponible"}</td><td>{pair.categoryName ?? "Categoría no disponible"}</td>
                    <td><span className={`${styles.badge} ${pair.estado === "confirmada" ? styles.success : pair.estado === "lista_espera" || pair.estado === "pendiente_pago" ? styles.warning : styles.neutral}`}>{PAIR_LABELS[pair.estado]}</span></td>
                    <td>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(new Date(pair.fecha_inscripcion))}</td>
                    <td><Link href={`/admin/parejas/${pair.id}`}>Ver detalle</Link></td>
                </tr>)}</tbody>
            </table></div>}
            {result.total > result.pageSize && <nav className={styles.pagination} aria-label="Paginación de parejas"><span>Página {result.page} de {pageCount}</span><div>{result.page > 1 && <Link className={styles.quietButton} href={pageHref(result.page - 1)}>Anterior</Link>}{result.page < pageCount && <Link className={styles.quietButton} href={pageHref(result.page + 1)}>Siguiente</Link>}</div></nav>}
        </section>
    </main>;
}
