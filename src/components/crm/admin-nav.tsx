"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavGroup } from "@/lib/admin-nav";
import styles from "./crm.module.css";

export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
    const pathname = usePathname();

    return (
        <nav className={styles.nav} aria-label="Administración">
            {groups.map((group) => (
                <div key={group.area} className={styles.navGroup}>
                    <span className={styles.navLabel}>{group.area}</span>
                    {group.items.map((item) => {
                        const active =
                            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
}