import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/components/crm/crm.module.css";

export type Tone = "success" | "warning" | "info" | "error" | "neutral";

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
    return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

/** Cabecera de página con una línea de estado y, opcionalmente, una acción principal. */
export function PageHead({
    eyebrow,
    title,
    status,
    action,
}: {
    eyebrow: string;
    title: string;
    status?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <>
            <header className={styles.pageHeader}>
                <div>
                    <p className={styles.eyebrow}>{eyebrow}</p>
                    <h1 className={styles.pageTitle}>{title}</h1>
                </div>
                {action && <div className={styles.headerActions}>{action}</div>}
            </header>
            {status && <div className={styles.statusLine}>{status}</div>}
        </>
    );
}

export function Tabs({
    base,
    current,
    tabs,
    extra = "",
}: {
    base: string;
    current: string;
    tabs: { key: string; label: string }[];
    extra?: string;
}) {
    return (
        <nav className={styles.tabs} aria-label="Secciones">
            {tabs.map((t) => (
                <Link
                    key={t.key}
                    href={`${base}?tab=${t.key}${extra}`}
                    className={styles.tab}
                    aria-current={current === t.key ? "page" : undefined}
                >
                    {t.label}
                </Link>
            ))}
        </nav>
    );
}

/** Panel lateral sin JavaScript: se abre con ?sel=… y se cierra volviendo a closeHref. */
export function Drawer({ title, closeHref, children }: { title: string; closeHref: string; children: ReactNode }) {
    return (
        <div className={styles.drawerLayer}>
            <Link href={closeHref} className={styles.drawerBackdrop} aria-label="Cerrar" />
            <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={title}>
                <header className={styles.drawerHead}>
                    <h2>{title}</h2>
                    <Link href={closeHref} className={styles.btnGhost}>
                        Cerrar
                    </Link>
                </header>
                <div className={styles.drawerBody}>{children}</div>
            </aside>
        </div>
    );
}

export function Row({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link href={href} className={styles.row}>
            {children}
        </Link>
    );
}

export function Empty({ title, text }: { title: string; text: string }) {
    return (
        <div className={styles.empty}>
            <strong>{title}</strong>
            <p>{text}</p>
        </div>
    );
}

export function Simulated() {
    return (
        <p className={styles.simBanner}>
            Datos simulados: las acciones de esta pantalla no se guardan todavía.
        </p>
    );
}