import Link from "next/link";
import PublicShell from "@/components/public/PublicShell";
import { EmptyPublic, ErrorPublic, PageIntro } from "@/components/public/PublicBlocks";
import { getPublicCategories } from "@/lib/public/site";
import { getPublicRanking } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";

export const metadata = buildMetadata({ title: "Ranking", description: "Ranking individual de Sagunto Padel Cup por categoría y temporada.", path: "/ranking" });

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
    const params = await searchParams;
    const categories = await getPublicCategories();
    const selected = params.categoria ?? categories.data?.[0]?.id;
    const result = await getPublicRanking(selected);

    return <PublicShell>
        <PageIntro eyebrow="RANKING" title="Clasificación individual" description="Los puntos se acumulan individualmente a lo largo de la temporada, aunque se obtengan jugando en pareja." />
        <section className={styles.content}>
            {categories.error ? <ErrorPublic message={categories.error.message} /> : <nav className={styles.categories} aria-label="Categorías">{categories.data.map((category) => <Link className={category.id === selected ? styles.active : ""} key={category.id} href={`/ranking?categoria=${encodeURIComponent(category.id)}`}>{category.nombre}</Link>)}</nav>}
            {result.error ? <ErrorPublic message={result.error.message} /> : !result.data?.category ? <EmptyPublic title="Ranking no disponible" description="Todavía no existe una categoría con datos de ranking." /> : result.data.entries.length === 0 ? <EmptyPublic title="Sin puntos registrados" description={`Todavía no hay puntos publicados para ${result.data.category.nombre}.`} /> : <div className={styles.tableWrap}><table><thead><tr><th>#</th><th>Jugador</th><th>Pruebas</th><th>Puntos</th></tr></thead><tbody>{result.data.entries.map((entry) => <tr key={entry.player.id}><td>{entry.position}</td><td><Link href={`/jugadores/${entry.player.id}`}>{entry.player.nombre} {entry.player.apellidos ?? ""}</Link></td><td>{entry.tournaments}</td><td><strong>{entry.points}</strong></td></tr>)}</tbody></table></div>}
        </section>
    </PublicShell>;
}
