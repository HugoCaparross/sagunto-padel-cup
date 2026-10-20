import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";

import styles from "./site-footer.module.css";

const footerGroups = [
    {
        title: "EL CIRCUITO",
        links: [
            ["Calendario", "/calendario"],
            ["Ranking", "/ranking"],
            ["Resultados", "/resultados"],
            ["Clubes", "/clubes"],
        ],
    },
    {
        title: "INFORMACIÓN",
        links: [
            ["Noticias", "/noticias"],
            ["Reglamento", "/reglamento"],
            ["Categorías", "/categorias"],
            ["Contacto", "/contacto"],
        ],
    },
    {
        title: "LEGAL",
        links: [
            ["Aviso legal", "/legal/aviso-legal"],
            ["Política de privacidad", "/legal/privacidad"],
            ["Política de cookies", "/legal/cookies"],
        ],
    },
];

export function SiteFooter() {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.footerGrid}`}>
                <div className={styles.footerBrand}>
                    <Link
                        href="/"
                        className={styles.brand}
                        aria-label="Sagunto Padel Cup, inicio"
                    >
                        <span className={styles.brandMark}>SPC</span>

                        <span>
                            SAGUNTO
                            <strong>PADEL CUP</strong>
                        </span>
                    </Link>

                    <p>
                        Deporte, comunidad
                        <br />
                        y una misma pasión.
                    </p>
                </div>

                {footerGroups.map((group) => (
                    <div className={styles.footerColumn} key={group.title}>
                        <h2>{group.title}</h2>

                        {group.links.map(([label, href]) => (
                            <Link href={href} key={href}>
                                {label}
                            </Link>
                        ))}
                    </div>
                ))}

                <div className={styles.social}>
                    <h2>SÍGUENOS</h2>

                    <div>
                        <a
                            href="https://www.instagram.com/"
                            aria-label="Instagram"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Instagram size={19} />
                        </a>

                        <a
                            href="https://www.youtube.com/"
                            aria-label="YouTube"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Youtube size={19} />
                        </a>
                    </div>
                </div>
            </div>

            <div className={`container ${styles.copyright}`}>
                <span>
                    © 2026 Sagunto Padel Cup. Todos los derechos reservados.
                </span>

                <span>Hecho en Sagunto.</span>
            </div>
        </footer>
    );
}