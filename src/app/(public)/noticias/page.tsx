import Link from "next/link";
import PublicShell from "@/components/public/PublicShell";
import { EmptyPublic, ErrorPublic, PageIntro } from "@/components/public/PublicBlocks";
import { getPublicNews } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";

export const metadata = buildMetadata({ title: "Noticias", description: "Noticias, resultados y actualidad de Sagunto Padel Cup.", path: "/noticias" });

export default async function NewsPage() {
    const result = await getPublicNews();
    return <PublicShell><PageIntro eyebrow="ACTUALIDAD" title="Noticias" description="Información y contenido publicado alrededor del circuito." />{result.error ? <ErrorPublic message={result.error.message} /> : result.data.length === 0 ? <EmptyPublic title="No hay noticias publicadas" description="Todavía no hay noticias disponibles." /> : <section className={styles.grid}>{result.data.map((news) => <article key={news.id}><p>{news.categoria ?? "ACTUALIDAD"}</p><h2>{news.titulo}</h2>{news.excerpt && <span>{news.excerpt}</span>}<Link href={`/noticias/${news.slug}`}>LEER NOTICIA →</Link></article>)}</section>}</PublicShell>;
}
