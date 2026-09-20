import PublicShell from "@/components/public/PublicShell";
import { PageIntro } from "@/components/public/PublicBlocks";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

export const metadata = buildMetadata({
    title: "Reglamento",
    description:
        "Consulta el reglamento de competición de Sagunto Padel Cup.",
    path: "/circuito/reglamento",
});

const sections = [
    {
        title: "1. Estructura del circuito",
        paragraphs: [
            "Sagunto Padel Cup se organiza por temporadas y está compuesto por pruebas regulares y un Master Final.",
            "La temporada 2026/27 contempla seis pruebas regulares y un Master Final previsto para diciembre de 2027.",
        ],
    },
    {
        title: "2. Categorías",
        paragraphs: [
            "Las categorías actuales son 1ª, 2ª, 3ª y 4ª. El sistema está preparado para incorporar modalidades masculina, femenina y mixta.",
            "La categoría vigente de un jugador determina la categoría en la que participa en cada prueba. Un cambio de categoría no modifica sus resultados ni sus puntos históricos.",
        ],
    },
    {
        title: "3. Inscripciones",
        paragraphs: [
            "Los jugadores pueden realizar una inscripción individual aunque todavía no tengan pareja.",
            "La plataforma diferencia entre inscripción pendiente de pago, confirmada, lista de espera y cancelada. Una pareja incompleta no se considera una inscripción confirmada.",
            "Los pagos se gestionan fuera de la plataforma.",
        ],
    },
    {
        title: "4. Formato de competición",
        paragraphs: [
            "El formato depende del número de parejas confirmadas en cada categoría.",
            "Con cuatro parejas se disputa una fase de todos contra todos. Después se juegan semifinales entre 1ª-4ª y 2ª-3ª; los ganadores disputan la final de Oro y los perdedores la final de Plata.",
            "Con ocho parejas se forman dos grupos de cuatro. Las dos primeras parejas de cada grupo pasan a semifinales de Oro; las terceras disputan la final de Plata y las cuartas la final de Bronce.",
        ],
    },
    {
        title: "5. Sistema de juego",
        paragraphs: [
            "Los partidos de fase de grupos se disputan a un set con punto de oro.",
            "En caso de empate en la clasificación de un grupo se aplican, por este orden, el enfrentamiento directo, la diferencia de sets y la diferencia de juegos.",
            "Las eliminatorias anteriores a las finales se disputan a nueve juegos con punto de oro.",
            "Las finales se disputan al mejor de dos sets con punto de oro. Si existe empate, se juega un super tie-break a diez puntos.",
        ],
    },
    {
        title: "6. Ranking",
        paragraphs: [
            "El ranking es individual y se calcula por categoría. Los puntos obtenidos en una prueba corresponden al resultado de la pareja, pero se asignan individualmente a cada jugador.",
            "Un jugador puede disputar diferentes pruebas con parejas diferentes y conservar sus puntos en su ranking individual.",
            "Al finalizar la temporada se conserva el 30 % de los puntos acumulados y se elimina el 70 % mediante una operación explícita y trazable de cierre de temporada. El histórico de puntos se conserva.",
        ],
    },
    {
        title: "7. Acceso al Master Final",
        paragraphs: [
            "El Master Final está abierto a los jugadores que hayan disputado al menos una prueba regular de la temporada, de acuerdo con las condiciones de elegibilidad establecidas.",
            "Los cuatro primeros pares por ranking y categoría reciben el reconocimiento correspondiente al cierre de temporada.",
        ],
    },
];

export default function ReglamentoPage() {
    return (
        <PublicShell>
            <PageIntro
                eyebrow="CIRCUITO · REGLAMENTO"
                title="Reglamento"
                description="Las reglas que definen la competición, el ranking y el funcionamiento del circuito."
            />

            <section className={styles.content}>
                <div className={styles.notice}>
                    <span>REGLAMENTO DEL CIRCUITO</span>
                    <p>
                        Esta página recoge las reglas generales de funcionamiento de
                        Sagunto Padel Cup.
                    </p>
                </div>

                <div className={styles.sections}>
                    {sections.map((section) => (
                        <article className={styles.section} key={section.title}>
                            <h2>{section.title}</h2>

                            <div>
                                {section.paragraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </PublicShell>
    );
}