import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import { EmptyPublic, ErrorPublic, PageIntro } from "@/components/public/PublicBlocks";
import { getPublicPlayers } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

export const metadata = buildMetadata({
    title: "Comparar jugadores",
    description: "Compara puntos, categoría y actividad de jugadores de Sagunto Padel Cup.",
    path: "/comparar",
});

type Props = { searchParams: Promise<{ a?: string; b?: string }> };

export default async function ComparePage({ searchParams }: Props) {
    const params = await searchParams;
    const result = await getPublicPlayers();

    if (result.error) {
        return <PublicShell><PageIntro eyebrow="COMPARAR" title="Dos jugadores, una comparación clara" description="Consulta sus datos deportivos públicos en paralelo." /><section className={styles.content}><ErrorPublic message={result.error.message} /></section></PublicShell>;
    }

    if (!result.data.length) {
        return <PublicShell><PageIntro eyebrow="COMPARAR" title="Dos jugadores, una comparación clara" description="Consulta sus datos deportivos públicos en paralelo." /><section className={styles.content}><EmptyPublic title="Todavía no hay jugadores públicos" description="La comparación estará disponible cuando existan perfiles publicados." /></section></PublicShell>;
    }

    const first = result.data.find((player) => player.id === params.a) ?? result.data[0];
    const second = result.data.find((player) => player.id === params.b && player.id !== first.id) ?? result.data.find((player) => player.id !== first.id) ?? null;

    return (
        <PublicShell>
            <PageIntro eyebrow="COMPARAR" title="Dos jugadores, una comparación clara" description="Consulta categoría, puntos y actividad pública sin convertir la comparación en una clasificación nueva." />
            <section className={styles.content}>
                <form className={styles.selector} method="get">
                    <label>Jugador 1<select name="a" defaultValue={first.id}>{result.data.map((player) => <option value={player.id} key={player.id}>{player.nombre} {player.apellidos ?? ""}</option>)}</select></label>
                    <label>Jugador 2<select name="b" defaultValue={second?.id ?? ""}>{result.data.map((player) => <option value={player.id} key={player.id}>{player.nombre} {player.apellidos ?? ""}</option>)}</select></label>
                    <button type="submit">COMPARAR</button>
                </form>

                {second ? (
                    <div className={styles.comparison}>
                        {[first, second].map((player) => (
                            <article key={player.id} className={styles.player}>
                                <span>{player.category?.nombre ?? "Categoría pendiente"}</span>
                                <h2>{player.nombre} {player.apellidos ?? ""}</h2>
                                <div className={styles.stats}>
                                    <div><small>PUNTOS</small><strong>{player.points}</strong></div>
                                    <div><small>CATEGORÍA</small><strong>{player.category?.nombre ?? "—"}</strong></div>
                                </div>
                                <Link href={`/jugadores/${player.id}`}>VER PERFIL</Link>
                            </article>
                        ))}
                    </div>
                ) : <EmptyPublic title="Necesitas dos jugadores" description="Selecciona dos perfiles distintos para realizar la comparación." />}
            </section>
        </PublicShell>
    );
}
