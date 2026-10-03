import { getPublicCategories } from "@/lib/public/site";
import { createClient } from "@/lib/supabase/server";
import { getAdminRanking, requireAdminContext } from "@/lib/services/admin";
import { getMasterQualification } from "@/lib/competition/ranking";

import styles from "../admin-list.module.css";

type SearchParams = Promise<{ categoria?: string }>;

export default async function AdminRankingPage({ searchParams }: { searchParams: SearchParams }) {
    await requireAdminContext();
    const params = await searchParams;
    const [categoriesResult, supabase] = await Promise.all([
        getPublicCategories(),
        createClient(),
    ]);
    if (categoriesResult.error) throw categoriesResult.error;

    const { data: season, error: seasonError } = await supabase
        .from("seasons")
        .select("id, name")
        .eq("status", "activa")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (seasonError) throw new Error(`No se pudo cargar la temporada: ${seasonError.message}`);

    const categoryId = categoriesResult.data.some((category) => category.id === params.categoria)
        ? params.categoria!
        : categoriesResult.data[0]?.id;
    const category = categoriesResult.data.find((item) => item.id === categoryId);
    const entries = season && categoryId ? await getAdminRanking(season.id, categoryId) : [];
    const qualification = getMasterQualification(entries.map((entry) => ({
        playerId: entry.playerId,
        points: entry.totalPoints,
        position: entry.posicion,
    })));
    const qualifiedPlayerIds = new Set(qualification.qualifiedPlayerIds);

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>Competición</span>
                    <h1 className={styles.title}>Ranking y Race to Master</h1>
                    <p className={styles.description}>Clasificación individual de la temporada activa. Las plazas directas se calculan para cada categoría; los empates en la cuarta posición quedan pendientes de la regla oficial de desempate.</p>
                </div>
                {season && <span className={styles.count}>{season.name}</span>}
            </header>

            {!season ? (
                <section className={styles.panel}><div className={styles.empty}><h2>No hay temporada activa</h2><p>Activa una temporada en la configuración de datos para consultar su clasificación.</p></div></section>
            ) : categoriesResult.data.length === 0 ? (
                <section className={styles.panel}><div className={styles.empty}><h2>No hay categorías activas</h2><p>Las categorías activas aparecerán aquí.</p></div></section>
            ) : (
                <section className={styles.panel} aria-label="Ranking individual">
                    <form action="/admin/ranking" method="GET" className={styles.toolbar}>
                        <div className={styles.field}>
                            <label htmlFor="ranking-category">Categoría</label>
                            <select id="ranking-category" className={styles.select} name="categoria" defaultValue={categoryId}>
                                {categoriesResult.data.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                            </select>
                        </div>
                        <button className={styles.button} type="submit">Ver clasificación</button>
                        <span className={styles.count}>{entries.length} jugadores</span>
                    </form>

                    {!entries.length ? (
                        <div className={styles.empty}><h2>Sin puntos publicados</h2><p>La clasificación aparecerá cuando se registren puntos oficiales para esta temporada y categoría.</p></div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead><tr><th scope="col">Posición</th><th scope="col">Jugador</th><th scope="col">Puntos</th><th scope="col">Pruebas</th><th scope="col">Acceso Master</th></tr></thead>
                                <tbody>
                                    {entries.map((entry) => {
                                        const isQualified = qualifiedPlayerIds.has(entry.playerId);
                                        const tiedAtCutoff = qualification.hasCutoffTie && entry.totalPoints === qualification.cutoffPoints;
                                        return (
                                            <tr key={entry.playerId}>
                                                <td><span className={styles.primaryText}>#{entry.posicion}</span></td>
                                                <td><span className={styles.primaryText}>{entry.player ? `${entry.player.nombre} ${entry.player.apellidos}` : "Jugador no disponible"}</span></td>
                                                <td>{entry.totalPoints.toLocaleString("es-ES")} pts</td>
                                                <td>{entry.tournamentsPlayed}</td>
                                                <td>
                                                    {isQualified ? (
                                                        <span className={`${styles.badge} ${tiedAtCutoff ? styles.warning : styles.success}`}>{tiedAtCutoff ? "Empate pendiente" : "Plaza directa"}</span>
                                                    ) : <span className={`${styles.badge} ${styles.neutral}`}>Fuera del top 4</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {category && <p className={styles.privateNote}>Categoría {category.nombre} · Top 4 individual según puntos acumulados. No se resuelven empates automáticamente.</p>}
                </section>
            )}
        </main>
    );
}
