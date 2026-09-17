import PublicShell from "@/components/public/PublicShell";
import { PageIntro } from "@/components/public/PublicBlocks";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";
export const metadata = buildMetadata({ title: "Privacidad", description: "Información sobre privacidad y tratamiento de datos en Sagunto Padel Cup.", path: "/privacidad" });
export default function PrivacyPage() { return <PublicShell><PageIntro eyebrow="LEGAL" title="Privacidad" description="Información sobre el tratamiento de datos personales en la plataforma." /><article className={styles.article}><h2>Tratamiento de datos</h2><p>Esta página debe contener la política de privacidad vigente de la organización responsable de Sagunto Padel Cup.</p><h2>Derechos</h2><p>La versión publicada debe explicar los derechos de las personas usuarias y los canales habilitados para ejercerlos.</p><h2>Actualizaciones</h2><p>La organización mantendrá esta información actualizada cuando cambien las condiciones del servicio o el tratamiento de datos.</p></article></PublicShell> }
