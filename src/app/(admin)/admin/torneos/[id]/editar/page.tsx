import Link from "next/link";
import { notFound } from "next/navigation";
import { getClubs, requireAdminContext } from "@/lib/services/admin";
import { getTournamentById } from "@/lib/services/tournaments";
import { getSeasons } from "@/lib/services/seasons";
import EditTournamentForm from "./EditTournamentForm";
import styles from "./page.module.css";

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminContext();
    const { id } = await params;
    const [tournament, seasons, clubs] = await Promise.all([getTournamentById(id), getSeasons(), getClubs()]);
    if (!tournament) notFound();
    return <main className={styles.page}><div className={styles.container}>
        <nav className={styles.breadcrumbs} aria-label="Migas de pan"><Link href="/admin">Administración</Link><span aria-hidden="true">/</span><Link href="/admin/torneos">Torneos</Link><span aria-hidden="true">/</span><Link href={`/admin/torneos/${id}`}>{tournament.nombre}</Link><span aria-hidden="true">/</span><span aria-current="page">Editar</span></nav>
        <header className={styles.header}><div><span className={styles.eyebrow}>Gestión de competición</span><h1>Editar torneo</h1><p>Actualiza los datos generales de {tournament.nombre}.</p></div></header>
        {(!seasons.length || !clubs.length) ? <p className={styles.error} role="alert">Se necesita al menos una temporada y un club registrados para editar esta ficha.</p> : <EditTournamentForm tournament={tournament} seasons={seasons} clubs={clubs} />}
    </div></main>;
}
