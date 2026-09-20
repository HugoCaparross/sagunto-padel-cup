import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import { ErrorPublic } from "@/components/public/PublicBlocks";
import { getPublicNewsBySlug } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const result = await getPublicNewsBySlug(slug);

    if (result.error || !result.data) {
        return buildMetadata({
            title: "Noticia no encontrada",
            description:
                "La noticia solicitada no está disponible.",
            path: `/noticias/${slug}`,
            noIndex: true,
        });
    }

    return buildMetadata({
        title: result.data.titulo,
        description:
            result.data.excerpt ??
            "Actualidad de Sagunto Padel Cup.",
        path: `/noticias/${slug}`,
        image: result.data.imagen_destacada,
    });
}

export default async function NewsDetailPage({
    params,
}: PageProps) {
    const { slug } = await params;

    const result = await getPublicNewsBySlug(slug);

    if (result.error?.message === "NEWS_NOT_FOUND") {
        notFound();
    }

    if (result.error || !result.data) {
        return (
            <PublicShell>
                <ErrorPublic
                    message={
                        result.error?.message ??
                        "No se ha podido cargar la noticia."
                    }
                />
            </PublicShell>
        );
    }

    const news = result.data;

    const publishedDate =
        news.fecha_publicacion ?? news.created_at;

    const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: news.titulo,
        datePublished: publishedDate,
        image: news.imagen_destacada
            ? [news.imagen_destacada]
            : undefined,
    };

    return (
        <PublicShell>
            <section className={styles.article}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schema),
                    }}
                />

                <p className={styles.category}>
                    {news.categoria ?? "ACTUALIDAD"}
                </p>

                <h1>{news.titulo}</h1>

                {news.excerpt && (
                    <p className={styles.excerpt}>
                        {news.excerpt}
                    </p>
                )}

                <time dateTime={publishedDate}>
                    {new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "long",
                    }).format(new Date(publishedDate))}
                </time>

                <div className={styles.body}>
                    {news.contenido ? (
                        <p>{news.contenido}</p>
                    ) : (
                        <p>
                            Esta noticia no contiene texto
                            adicional.
                        </p>
                    )}
                </div>

                <Link href="/noticias">
                    ← Todas las noticias
                </Link>
            </section>
        </PublicShell>
    );
}