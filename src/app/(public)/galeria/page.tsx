import PublicShell from "@/components/public/PublicShell";
import { EmptyPublic, ErrorPublic, PageIntro } from "@/components/public/PublicBlocks";
import { getPublicGallery } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";

export const metadata = buildMetadata({ title: "Galería", description: "Galería pública de Sagunto Padel Cup.", path: "/galeria" });

export default async function GalleryPage() {
    const result = await getPublicGallery();
    return <PublicShell><PageIntro eyebrow="GALERÍA" title="Momentos del circuito" description="Contenido publicado de las pruebas de Sagunto Padel Cup." />{result.error ? <ErrorPublic message={result.error.message} /> : result.data.length === 0 ? <EmptyPublic title="Galería vacía" description="Todavía no hay fotografías o vídeos publicados." /> : <section className={styles.grid}>{result.data.map((item) => item.tipo === "foto" ? <figure key={item.id}><img src={item.url} alt={item.title ?? "Fotografía de Sagunto Padel Cup"} loading="lazy" /><figcaption>{item.caption ?? item.title}</figcaption></figure> : <figure key={item.id}><video src={item.url} controls preload="metadata" /><figcaption>{item.caption ?? item.title}</figcaption></figure>)}</section>}</PublicShell>;
}
