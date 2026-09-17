import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import { PageIntro } from "@/components/public/PublicBlocks";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

export const metadata = buildMetadata({
    title: "Circuito",
    description:
        "Conoce cómo funciona Sagunto Padel Cup, sus categorías, ranking, pruebas y Master Final.",
    path: "/circuito",
});

export default function CircuitPage() {
    return (
        <PublicShell>
            <PageIntro
                eyebrow="SAGUNTO PADEL CUP"
                title="El circuito"
                description="Todo lo que necesitas saber para competir, sumar puntos y seguir la temporada."
            />

            <div className={styles.content}>
                <section className={styles.section}>
                    <span className={styles.eyebrow}>
                        EL CIRCUITO
                    </span>

                    <h2>
                        Competición real durante toda la temporada
                    </h2>

                    <p>
                        Sagunto Padel Cup es un circuito de pádel
                        amateur construido alrededor de pruebas
                        puntuables, un ranking individual y un
                        Master Final de cierre de temporada.
                    </p>
                </section>

                <section className={styles.grid}>
                    <article>
                        <strong>2026/27</strong>
                        <span>Temporada inicial</span>
                    </article>

                    <article>
                        <strong>6</strong>
                        <span>Pruebas regulares</span>
                    </article>

                    <article>
                        <strong>1</strong>
                        <span>Master Final</span>
                    </article>

                    <article>
                        <strong>4</strong>
                        <span>Categorías</span>
                    </article>
                </section>

                <section className={styles.section}>
                    <span className={styles.eyebrow}>
                        CATEGORÍAS
                    </span>

                    <h2>
                        1ª · 2ª · 3ª · 4ª
                    </h2>

                    <p>
                        El jugador compite en una categoría
                        determinada. La organización valida la
                        categoría y cualquier cambio se aplica a
                        partir del siguiente torneo, manteniendo
                        intacto el histórico.
                    </p>
                </section>

                <section className={styles.section}>
                    <span className={styles.eyebrow}>
                        RANKING
                    </span>

                    <h2>
                        Los puntos son individuales
                    </h2>

                    <p>
                        Aunque los resultados se obtienen jugando
                        en pareja, los puntos pertenecen
                        individualmente a cada jugador y se
                        acumulan durante la temporada.
                    </p>

                    <Link
                        href="/ranking"
                        className={styles.link}
                    >
                        CONSULTAR RANKING
                    </Link>
                </section>

                <section className={styles.section}>
                    <span className={styles.eyebrow}>
                        MASTER FINAL
                    </span>

                    <h2>
                        El cierre de la temporada
                    </h2>

                    <p>
                        El Master Final es la prueba de cierre de
                        la temporada. La Race to Master permite
                        seguir la clasificación y la elegibilidad
                        durante el circuito.
                    </p>

                    <Link
                        href="/master-final"
                        className={styles.link}
                    >
                        VER MASTER FINAL
                    </Link>
                </section>

                <section className={styles.links}>
                    <Link href="/circuito/faq">
                        Preguntas frecuentes
                    </Link>

                    <Link href="/circuito/reglamento">
                        Reglamento
                    </Link>

                    <Link href="/calendario">
                        Calendario
                    </Link>
                </section>
            </div>
        </PublicShell>
    );
}