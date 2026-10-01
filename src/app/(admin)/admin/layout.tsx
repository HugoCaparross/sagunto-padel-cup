import type { ReactNode } from "react";

import { requireAdminContext } from "@/lib/services/admin";

import styles from "./admin.module.css";

interface AdminLayoutProps {
    children: ReactNode;
}

export default async function AdminLayout({
    children,
}: AdminLayoutProps) {
    await requireAdminContext();

    return (
        <div className={styles.adminLayout}>
            {children}
        </div>
    );
}