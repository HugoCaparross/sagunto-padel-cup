import PublicShell from "@/components/public/PublicShell";
import { PageIntro } from "@/components/public/PublicBlocks";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";

export const metadata = buildMetadata({
    title: "Contacto",
    description: "Canal de contacto y consultas de Sagunto Padel Cup.",
    path: "/contacto",
});

export default function ContactPage() {
    return (
        <PublicShell>
            <PageIntro eyebrow="CONTACTO" title="¿Tienes una duda sobre el circuito?" description="Utiliza este espacio para consultas sobre torneos, inscripciones, ranking, categorías o funcionamiento de Sagunto Padel Cup." />
            <section className={styles.content}>
                <div className={styles.grid}>
                    <div className={styles.copy}>
                        <span>CONSULTAS</span>
                        <h2>Estamos para ayudarte con la competición.</h2>
                        <p>Las dudas deben poder resolverse con información clara y contextual. Para una consulta relacionada con un torneo concreto, incluye siempre el nombre de la prueba y, si procede, la categoría.</p>
                    </div>
                    <form className={styles.form}>
                        <label>Nombre<input name="name" autoComplete="name" required /></label>
                        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
                        <label>Motivo<select name="topic" defaultValue="torneo"><option value="torneo">Torneo</option><option value="inscripcion">Inscripción</option><option value="ranking">Ranking</option><option value="categoria">Categoría</option><option value="otro">Otra consulta</option></select></label>
                        <label>Mensaje<textarea name="message" rows={6} required /></label>
                        <button type="button" disabled>ENVIAR CONSULTA</button>
                        <p className={styles.note}>El canal de envío debe conectarse al sistema de comunicación que defina la organización antes de producción.</p>
                    </form>
                </div>
            </section>
        </PublicShell>
    );
}
