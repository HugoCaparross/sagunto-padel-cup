import PublicShell from "@/components/public/PublicShell";
import { PageIntro } from "@/components/public/PublicBlocks";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";
export const metadata = buildMetadata({ title: "Aviso legal", description: "Aviso legal de Sagunto Padel Cup.", path: "/aviso-legal" });
export default function LegalNoticePage() { return <PublicShell><PageIntro eyebrow="LEGAL" title="Aviso legal" description="Información legal e identificativa de la plataforma." /><article className={styles.article}><h2>Responsable</h2><p>La versión de producción debe identificar de forma completa a la entidad responsable, sus datos de contacto y la información legal exigible.</p><h2>Condiciones</h2><p>La organización debe publicar aquí las condiciones de uso aplicables al sitio y a sus contenidos.</p></article></PublicShell> }
