import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, requireAdminContext } from "@/lib/services/admin";
import { getTournamentById, getTournamentCategories } from "@/lib/services/tournaments";
import CategoryManager from "./CategoryManager";
import styles from "./page.module.css";

export default async function TournamentCategoriesPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminContext();
    const { id } = await params;
    const [tournament, categories, attached] = await Promise.all([getTournamentById(id), getCategories(), getTournamentCategories(id)]);
    if (!tournament) notFound();
    return <main className={styles.page}><div className={styles.container}>
        <nav className={styles.breadcrumbs} aria-label="Migas de pan"><Link href="/admin">Administración</Link><span>/</span><Link href="/admin/torneos">Torneos</Link><span>/</span><Link href={`/admin/torneos/${id}`}>{tournament.nombre}</Link><span>/</span><span aria-current="page">Categorías</span></nav>
        <header className={styles.header}><div><span className={styles.eyebrow}>Configuración deportiva</span><h1>Categorías</h1><p>Asigna categorías al torneo, define límites opcionales y controla si admiten inscripciones.</p></div></header>
        <p className={styles.notice}>Un cupo vacío queda sin límite. Desactivar inscripciones mantiene la categoría y sus datos históricos.</p>
        <CategoryManager tournamentId={id} categories={categories} attached={attached} />
    </div></main>;
}
