import Link from "next/link";
import PublicShell from "@/components/public/PublicShell";
import { EmptyPublic, ErrorPublic, PageIntro } from "@/components/public/PublicBlocks";
import { getPublicTournaments } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";
import styles from "./page.module.css";

export const metadata = buildMetadata({ title: "Torneos", description: "Consulta los torneos de Sagunto Padel Cup, sus fechas, clubes, categorías y estado de inscripción.", path: "/torneos" });

function dateRange(start: string, end: string) { return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(start)) + (start !== end ? ` — ${new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(end))}` : ""); }

export default async function TournamentsPage() {
    const result = await getPublicTournaments();
    return <PublicShell><PageIntro eyebrow="COMPETICIÓN" title="Torneos" description="Todas las pruebas públicas del circuito, desde la inscripción hasta los resultados finales." />{result.error ? <ErrorPublic message={result.error.message} /> : result.data.length === 0 ? <EmptyPublic title="No hay torneos disponibles" description="Todavía no hay pruebas publicadas para mostrar." /> : <section className={styles.grid}>{result.data.map((tournament) => <article className={styles.card} key={tournament.id}><div className={styles.status}>{tournament.estado.replaceAll("_", " ")}</div><h2>{tournament.nombre}</h2><p>{dateRange(tournament.fecha_inicio, tournament.fecha_fin)}</p><p>{tournament.club?.nombre ?? "Club pendiente de asignar"}</p><Link href={`/torneos/${tournament.slug}`}>VER TORNEO →</Link></article>)}</section>}</PublicShell>;
}
