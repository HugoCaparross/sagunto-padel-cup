import Link from "next/link";
import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import styles from "./PublicShell.module.css";

export default function PublicShell({ children }: { children: ReactNode }) {
    return (
        <div className={styles.shell}>
            <Header />
            <main>{children}</main>
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div>
                        <strong>SAGUNTO PADEL CUP</strong>
                        <p>Circuito de pádel amateur.</p>
                    </div>
                    <nav aria-label="Enlaces legales">
                        <Link href="/aviso-legal">Aviso legal</Link>
                        <Link href="/privacidad">Privacidad</Link>
                        <Link href="/cookies">Cookies</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
