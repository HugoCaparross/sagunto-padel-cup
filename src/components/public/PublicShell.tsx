import Link from "next/link";
import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import styles from "./PublicShell.module.css";

const columns = [
    { title: "CIRCUITO", links: [["Torneos", "/torneos"], ["Ranking", "/ranking"], ["Jugadores", "/jugadores"], ["Circuito", "/circuito"]] },
    { title: "COMPETICIÓN", links: [["Calendario", "/calendario"], ["Master Final", "/master-final"], ["Comparar", "/comparar"], ["Galería", "/galeria"]] },
    { title: "AYUDA", links: [["Preguntas frecuentes", "/circuito/faq"], ["Reglamento", "/circuito/reglamento"], ["Contacto", "/contacto"], ["Noticias", "/noticias"]] },
] as const;

export default function PublicShell({ children }: { children: ReactNode }) {
    return <div className={styles.shell}>
        <Header />
        <main>{children}</main>
        <footer className={styles.footer}>
            <div className={styles.footerInner}>
                <div className={styles.footerTop}>
                    <div className={styles.footerBrand}>
                        <strong>SAGUNTO PADEL CUP</strong>
                        <p>Circuito de pádel amateur en Sagunto. Torneos, ranking individual, Race to Master y competición durante toda la temporada.</p>
                    </div>
                    <nav className={styles.footerNavigation} aria-label="Navegación del pie de página">
                        {columns.map((column) => <div className={styles.footerColumn} key={column.title}><strong>{column.title}</strong>{column.links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div>)}
                    </nav>
                </div>
                <div className={styles.footerBottom}>
                    <span>© {new Date().getFullYear()} Sagunto Padel Cup</span>
                    <nav className={styles.footerLegal} aria-label="Enlaces legales">
                        <Link href="/aviso-legal">Aviso legal</Link><Link href="/privacidad">Privacidad</Link><Link href="/cookies">Cookies</Link>
                    </nav>
                </div>
            </div>
        </footer>
    </div>;
}
