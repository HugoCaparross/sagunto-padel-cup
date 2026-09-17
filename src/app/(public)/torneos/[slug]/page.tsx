import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import PublicShell from "@/components/public/PublicShell";
import { EmptyPublic, ErrorPublic, PageIntro } from "@/components/public/PublicBlocks";
import { displayPlayerName, getPublicTournamentBySlug } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const result = await getPublicTournamentBySlug(slug);
    if (result.error || !result.data) {
        return buildMetadata({ title: "Torneo no encontrado", description: "El torneo solicitado no está disponible.", path: `/torneos/${slug}`, noIndex: true });
    }
    return buildMetadata({
        title: result.data.tournament.nombre,
        description: result.data.tournament.descripcion ?? `Información, resultados y seguimiento de ${result.data.tournament.nombre}.`,
        path: `/torneos/${slug}`,
        image: result.data.tournament.cover_image,
    });
}

export default async function TournamentPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const result = await getPublicTournamentBySlug(slug);
    if (result.error?.message === "TORNEO_NOT_FOUND") notFound();
    if (result.error || !result.data) return <PublicShell><ErrorPublic message={result.error?.message} /></PublicShell>;

    const { tournament, club, season, categories, pairs, matches, standings, brackets, sponsors } = result.data;
    const schema = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: tournament.nombre,
        startDate: tournament.fecha_inicio,
        endDate: tournament.fecha_fin,
        url: `https://www.saguntopadelcup.com/torneos/${tournament.slug}`,
        location: club ? { "@type": "SportsActivityLocation", name: club.nombre, address: club.direccion ?? undefined } : undefined,
    };

    return (
        <PublicShell>
            <PageIntro eyebrow={tournament.tournament_type === "master" ? "MASTER" : "TORNEO"} title={tournament.nombre} description={tournament.descripcion ?? undefined} />
            <section className={styles.content}>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
                <div className={styles.meta}>
                    <div><strong>FECHAS</strong><span>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(tournament.fecha_inicio))} — {new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(tournament.fecha_fin))}</span></div>
                    <div><strong>CLUB</strong><span>{club?.nombre ?? "Pendiente"}</span></div>
                    <div><strong>ESTADO</strong><span>{tournament.estado.replaceAll("_", " ")}</span></div>
                    {season && <div><strong>TEMPORADA</strong><span>{season.name}</span></div>}
                </div>

                <div className={styles.columns}>
                    <section><h2>Categorías</h2>{categories.length ? <ul>{categories.map((item) => <li key={`${item.tournament_id}-${item.categoria_id}`}>{item.category?.nombre ?? "Categoría"} · {item.cupo_maximo} plazas</li>)}</ul> : <EmptyPublic title="Sin categorías publicadas" description="Todavía no hay categorías visibles para este torneo." />}</section>
                    <section><h2>Parejas</h2>{pairs.length ? <ul>{pairs.map((pair) => <li key={pair.id}>{displayPlayerName(pair.player1)} + {displayPlayerName(pair.player2)}</li>)}</ul> : <EmptyPublic title="Sin parejas publicadas" description="Todavía no hay parejas disponibles para mostrar." />}</section>
                </div>

                <section>
                    <h2>Resultados y partidos</h2>
                    {matches.length ? <div className={styles.matches}>{matches.map((match) => <div key={match.id}><span>{match.fase} · {match.tramo ?? ""}</span><strong>{match.pair1?.id ?? "Pendiente"} vs {match.pair2?.id ?? "Pendiente"}</strong><em>{match.estado}</em></div>)}</div> : <EmptyPublic title="Todavía no hay partidos" description="Los partidos aparecerán aquí cuando la organización los genere." />}
                </section>

                {standings.length > 0 && <section><h2>Standings</h2><div className={styles.tableWrap}><table><thead><tr><th>Grupo</th><th>Pareja</th><th>PJ</th><th>V</th><th>D</th><th>Pts</th></tr></thead><tbody>{standings.map((row) => <tr key={row.id}><td>{row.groupName}</td><td>{row.pair_id}</td><td>{row.partidos_jugados}</td><td>{row.victorias}</td><td>{row.derrotas}</td><td>{row.puntos}</td></tr>)}</tbody></table></div></section>}

                {brackets.length > 0 && <section><h2>Cuadros</h2><div className={styles.brackets}>{brackets.map((bracket) => <article key={bracket.id}><strong>{bracket.tramo.toUpperCase()}</strong><span>Cuadro generado</span></article>)}</div></section>}

                {sponsors.length > 0 && <section><h2>Patrocinadores</h2><div className={styles.sponsors}>{sponsors.map((sponsor) => sponsor.enlace ? <a key={sponsor.id} href={sponsor.enlace} rel="noopener noreferrer">{sponsor.nombre}</a> : <span key={sponsor.id}>{sponsor.nombre}</span>)}</div></section>}

                <Link href="/torneos">← Todos los torneos</Link>
            </section>
        </PublicShell>
    );
}
