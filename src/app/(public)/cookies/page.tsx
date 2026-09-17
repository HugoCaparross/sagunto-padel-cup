import PublicShell from "@/components/public/PublicShell";
import { PageIntro } from "@/components/public/PublicBlocks";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";
export const metadata = buildMetadata({ title: "Cookies", description: "Política de cookies de Sagunto Padel Cup.", path: "/cookies" });
export default function CookiesPage() { return <PublicShell><PageIntro eyebrow="LEGAL" title="Cookies" description="Información sobre las cookies y tecnologías similares utilizadas por la plataforma." /><article className={styles.article}><h2>Uso de cookies</h2><p>La versión publicada debe identificar las cookies utilizadas, su finalidad, duración y proveedor cuando corresponda.</p><h2>Gestión</h2><p>La persona usuaria debe poder conocer y gestionar las opciones disponibles de acuerdo con la configuración vigente del sitio.</p></article></PublicShell> }
