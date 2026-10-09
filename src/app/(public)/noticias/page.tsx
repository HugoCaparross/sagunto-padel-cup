import Link from "next/link";
import type { Metadata } from "next";

import PublicShell from "@/components/public/PublicShell";
import {
    EmptyPublic,
    ErrorPublic,
    PageIntro,
} from "@/components/public/PublicBlocks";
import { getPublicNews } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
    title: "Noticias",
    description:
        "Actualidad, novedades y noticias de Sagunto Padel Cup.",
    path: "/noticias",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
});

export default async function NewsPage() {
    const result = await getPublicNews();

    if (result.error) {
        return (
            <PublicShell>
                <PageIntro
                    eyebrow="ACTUALIDAD"
                    title="Noticias"
                    description="Toda la actualidad de Sagunto Padel Cup."
                />

                <section className={styles.content}>
                    <ErrorPublic message={result.error.message} />
                </section>
            </PublicShell>
        );
    }

    const news = [...result.data].sort(
        (a, b) =>
            new Date(
                b.fecha_publicacion ?? b.created_at,
            ).getTime() -
            new Date(
                a.fecha_publicacion ?? a.created_at,
            ).getTime(),
    );

    return (
        <PublicShell>
            <PageIntro
                eyebrow="ACTUALIDAD"
                title="Noticias"
                description="Actualidad, novedades y contenidos publicados por Sagunto Padel Cup."
            />

            <section className={styles.content}>
                {news.length === 0 ? (
                    <EmptyPublic
                        title="Todavía no hay noticias"
                        description="Cuando se publique una noticia aparecerá aquí."
                    />
                ) : (
                    <div className={styles.grid}>
                        {news.map((item) => {
                            const publishedDate =
                                item.fecha_publicacion ??
                                item.created_at;

                            return (
                                <article
                                    className={styles.card}
                                    key={item.id}
                                >
                                    <div className={styles.cardMeta}>
                                        <span>
                                            {item.categoria ??
                                                "ACTUALIDAD"}
                                        </span>

                                        <time dateTime={publishedDate}>
                                            {dateFormatter.format(
                                                new Date(
                                                    publishedDate,
                                                ),
                                            )}
                                        </time>
                                    </div>

                                    <h2>{item.titulo}</h2>

                                    {item.excerpt ? (
                                        <p>{item.excerpt}</p>
                                    ) : (
                                        <p>
                                            Consulta la noticia completa y
                                            descubre toda la información.
                                        </p>
                                    )}

                                    <Link
                                        href={`/noticias/${item.slug}`}
                                        className={styles.link}
                                    >
                                        Leer noticia
                                        <span aria-hidden="true">→</span>
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </PublicShell>
    );
}