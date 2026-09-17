import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import PublicShell from "@/components/public/PublicShell";
import { EmptyPublic, ErrorPublic, PageIntro } from "@/components/public/PublicBlocks";
import { getPublicPlayer } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const result = await getPublicPlayer(id);
    if (result.error || !result.data) return buildMetadata({ title: "Jugador no encontrado", description: "El jugador solicitado no está disponible.", path: `/jugadores/${id}`, noIndex: true });
    return buildMetadata({ title: `${result.data.player.nombre} ${result.data.player.apellidos ?? ""}`.trim(), description: `Perfil deportivo, ranking y resultados de ${result.data.player.nombre}.`, path: `/jugadores/${id}`, image: result.data.player.foto_url });
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getPublicPlayer(id);
    if (result.error?.message === "PLAYER_NOT_FOUND") notFound();
    if (result.error || !result.data) return <PublicShell><ErrorPublic message={result.error?.message} /></PublicShell>;
    const { player, category, points, tournaments, results, instagramVisible } = result.data;
    return <PublicShell><PageIntro eyebrow="JUGADOR" title={`${player.nombre} ${player.apellidos ?? ""}`.trim()} description={category?.nombre ?? "Categoría pendiente"} /><section className={styles.content}><div className={styles.stats}><div><strong>PUNTOS</strong><span>{points}</span></div><div><strong>PRUEBAS</strong><span>{tournaments}</span></div><div><strong>CATEGORÍA</strong><span>{category?.nombre ?? "Pendiente"}</span></div>{instagramVisible && player.instagram && <div><strong>INSTAGRAM</strong><span>{player.instagram}</span></div>}</div><section><h2>Historial de resultados</h2>{results.length ? <div className={styles.results}>{results.map((result) => <article key={result.id}><div><strong>{result.tournament?.nombre ?? "Torneo"}</strong><span>{result.ronda_alcanzada}</span></div><strong>{result.puntos_obtenidos} pts</strong></article>)}</div> : <EmptyPublic title="Sin resultados" description="Todavía no hay resultados de ranking publicados para este jugador." />}</section><Link href="/jugadores">← Todos los jugadores</Link></section></PublicShell>;
}
