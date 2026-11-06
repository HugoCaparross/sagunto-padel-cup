import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import styles from "@/components/crm/crm.module.css";

const NAV = [
    { href: "/admin", label: "Panel" },
    { href: "/admin/jugadores", label: "Jugadores" },
    { href: "/admin/inscripciones", label: "Inscripciones" },
    { href: "/admin/temporadas", label: "Temporadas" },
    { href: "/admin/pruebas", label: "Pruebas" },
    { href: "/admin/resultados", label: "Resultados" },
    { href: "/admin/cierre", label: "Cierre 70/30" },
    { href: "/admin/ajustes", label: "Ajustes de puntos" },
    { href: "/admin/master", label: "Máster Final" },
    { href: "/admin/master/resultados", label: "Resultados Máster" },
    { href: "/admin/ranking", label: "Ranking" },
    { href: "/admin/reglas", label: "Reglas de puntuación" },
    { href: "/admin/categorias", label: "Categorías" },
    { href: "/admin/cuadros", label: "Cuadros" },
    { href: "/admin/clubes", label: "Clubes" },
    { href: "/admin/patrocinadores", label: "Patrocinadores" },
    { href: "/admin/noticias", label: "Noticias" },
    { href: "/admin/configuracion", label: "Configuración" },
    { href: "/admin/auditoria", label: "Auditoría" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireAdmin();

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    SAGUNTO <span>PADEL CUP</span>
                    <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: ".12em" }}>CRM · ADMIN</div>
                </div>
                <nav className={styles.nav} aria-label="Administración">
                    {NAV.map((item) => (
                        <Link key={item.href} href={item.href}>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                    <form action={signOut}>
                        <button type="submit" className={styles.btnGhost} style={{ color: "#fff", padding: 0 }}>
                            Cerrar sesión
                        </button>
                    </form>
                </div>
            </aside>
            <div className={styles.main}>{children}</div>
        </div>
    );
}