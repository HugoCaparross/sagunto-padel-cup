import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import styles from "@/components/crm/crm.module.css";

const NAV = [
    { href: "/jugador", label: "Mi resumen" },
    { href: "/jugador/inscripciones", label: "Mis inscripciones" },
    { href: "/jugador/historial", label: "Mi historial" },
    { href: "/jugador/perfil", label: "Mi perfil" },
];

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
    await requireUser("/jugador");

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    SAGUNTO <span>PADEL CUP</span>
                    <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: ".12em" }}>ÁREA DE JUGADOR</div>
                </div>
                <nav className={styles.nav} aria-label="Área de jugador">
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