import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { ADMIN_NAV, ADMIN_NAV_FOOTER } from "@/lib/admin/nav";
import { AdminNav } from "@/components/admin/AdminNav";
import styles from "@/components/crm/crm.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireAdmin();

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <Link href="/admin" className={styles.brand}>
                    SAGUNTO <span>PADEL CUP</span>
                    <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: ".12em" }}>ADMIN</div>
                </Link>

                <AdminNav items={ADMIN_NAV} footer={ADMIN_NAV_FOOTER} />

                <form action={signOut} className={styles.sidebarFooter}>
                    <button type="submit" className={styles.btnGhost} style={{ color: "#fff", padding: 0 }}>
                        Cerrar sesión
                    </button>
                </form>
            </aside>
            <div className={styles.main}>{children}</div>
        </div>
    );
}