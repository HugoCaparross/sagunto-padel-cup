import Link from "next/link";
import PublicShell from "@/components/public/PublicShell";
import { EmptyPublic, ErrorPublic, PageIntro } from "@/components/public/PublicBlocks";
import { getPublicRanking } from "@/lib/public/site";
import { getPublicCategories } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";

export const metadata = buildMetadata({ title: "Master", description: "Race to Master y clasificación de la temporada de Sagunto Padel Cup.", path: "/master" });

export default async function MasterPage() {
    const categories = await getPublicCategories();
    const selected = categories.data?.[0]?.id;
    const ranking = await getPublicRanking(selected);
    return <PublicShell><PageIntro eyebrow="RACE TO MASTER" title="Camino al Master" description="Consulta la clasificación de la temporada y sigue quién ocupa las primeras posiciones de cada categoría." /><section className={styles.content}>{ranking.error ? <ErrorPublic message={ranking.error.message} /> : !ranking.data?.season ? <EmptyPublic title="Temporada no disponible" description="Todavía no hay una temporada activa publicada." /> : <><div className={styles.season}><strong>{ranking.data.season.name}</strong><span>Las posiciones se calculan con los puntos publicados de la temporada activa.</span></div><h2>{ranking.data.category?.nombre ?? "Categoría"}</h2>{ranking.data.entries.length ? <div className={styles.list}>{ranking.data.entries.slice(0, 4).map((entry) => <Link href={`/jugadores/${entry.player.id}`} key={entry.player.id}><span>#{entry.position}</span><strong>{entry.player.nombre} {entry.player.apellidos ?? ""}</strong><b>{entry.points} pts</b></Link>)}</div> : <EmptyPublic title="Sin clasificación" description="Todavía no hay puntos registrados para esta categoría." />}</>}</section></PublicShell>;
}
