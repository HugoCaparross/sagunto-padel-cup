"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/components/crm/crm.module.css";

type Item = { href: string; label: string };

function isActive(pathname: string, href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminNav({ items, footer }: { items: Item[]; footer: Item[] }) {
    const pathname = usePathname();

    return (
        <nav aria-label="Administración" className={styles.adminNav}>
            <ul className={styles.adminNavList}>
                {items.map((it) => (
                    <li key={it.href}>
                        <Link href={it.href} aria-current={isActive(pathname, it.href) ? "page" : undefined}>
                            {it.label}
                        </Link>
                    </li>
                ))}
            </ul>
            <ul className={`${styles.adminNavList} ${styles.adminNavFooter}`}>
                {footer.map((it) => (
                    <li key={it.href}>
                        <Link href={it.href} aria-current={isActive(pathname, it.href) ? "page" : undefined}>
                            {it.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}