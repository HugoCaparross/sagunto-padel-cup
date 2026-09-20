import PublicShell from "@/components/public/PublicShell";
import { PageIntro } from "@/components/public/PublicBlocks";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

export const metadata = buildMetadata({
    title: "Preguntas frecuentes",
    description:
        "Preguntas frecuentes sobre inscripción, competición, ranking, categorías y Master Final.",
    path: "/circuito/faq",
});

const groups = [
    {
        title: "Inscripción",
        items: [
            [
                "¿Puedo inscribirme sin pareja?",
                "Sí. La inscripción está diseñada para permitir que una persona participe sin tener pareja cerrada. Puede elegir una pareja existente, introducir a su compañero o entrar en la búsqueda de compañero.",
            ],
            [
                "¿Cuándo queda confirmada mi inscripción?",
                "La inscripción pasa primero a pendiente de pago. El pago se realiza fuera de la plataforma y la organización lo verifica antes de marcar la inscripción como confirmada.",
            ],
        ],
    },
    {
        title: "Competición",
        items: [
            [
                "¿Cómo se estructura un torneo?",
                "La estructura depende del número de parejas. El sistema contempla plantillas confirmadas para 3, 4 y 8 parejas y debe poder incorporar otras estructuras sin duplicar la lógica.",
            ],
            [
                "¿Cómo se resuelven los grupos?",
                "En grupos se juega todos contra todos, a un set y con punto de oro. La clasificación utiliza, por defecto, enfrentamiento directo, diferencia de sets y diferencia de juegos.",
            ],
        ],
    },
    {
        title: "Ranking y categorías",
        items: [
            [
                "¿El ranking es de pareja?",
                "No. El ranking es individual por categoría. Los resultados deportivos se producen en pareja, pero los puntos se asignan individualmente a cada jugador.",
            ],
            [
                "¿Puedo cambiar de categoría?",
                "La organización valida la categoría y una solicitud de cambio puede afectar al siguiente torneo. El cambio no borra resultados ni puntos históricos.",
            ],
            [
                "¿Qué ocurre al cerrar la temporada?",
                "Se conserva el 30 % de los puntos acumulados y se elimina el 70 % mediante una operación explícita y trazable de cierre de temporada. El histórico permanece.",
            ],
        ],
    },
    {
        title: "Master Final",
        items: [
            [
                "¿Quién puede acceder al Master?",
                "Puede acceder cualquier persona que haya disputado al menos una prueba regular previa del circuito, de acuerdo con la elegibilidad de la temporada.",
            ],
        ],
    },
];

export default function FaqPage() {
    return (
        <PublicShell>
            <PageIntro
                eyebrow="CIRCUITO · FAQ"
                title="Preguntas frecuentes"
                description="Las respuestas esenciales sobre inscripción, competición, ranking, categorías y Master Final."
            />

            <section className={styles.content}>
                {groups.map((group) => (
                    <section className={styles.group} key={group.title}>
                        <p className={styles.eyebrow}>{group.title}</p>

                        {group.items.map(([question, answer]) => (
                            <details key={question}>
                                <summary>{question}</summary>
                                <p>{answer}</p>
                            </details>
                        ))}
                    </section>
                ))}
            </section>
        </PublicShell>
    );
}