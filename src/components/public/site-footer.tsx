
import Image from "next/image";
import Link from "next/link";
import styles from "./site-footer.module.css";

export default function SiteFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.main}>
                    <div className={styles.brand}>
                        <Link
                            href="/"
                            className={styles.logoLink}
                            aria-label="Sagunto Padel Cup - Inicio"
                        >
                            <Image
                                src="/images/logo-sagunto-padel-cup.png"
                                alt="Sagunto Padel Cup"
                                width={320}
                                height={110}
                                priority
                                className={styles.logoImage}
                            />
                        </Link>

                        <p className={styles.description}>
                            El circuito de pádel de Sagunto. Compite, disfruta y forma parte
                            de nuestra comunidad.
                        </p>

                        <div className={styles.socials}>
                            <a
                                href="https://www.instagram.com/saguntopadelcup/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                                aria-label="Instagram de Sagunto Padel Cup"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    className={styles.socialIcon}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="5" />
                                    <circle cx="12" cy="12" r="4" />
                                    <circle
                                        cx="17.5"
                                        cy="6.5"
                                        r="0.8"
                                        fill="currentColor"
                                    />
                                </svg>
                                <span>Instagram</span>
                            </a>

                            <a
                                href="https://www.tiktok.com/@saguntopadelcup"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                                aria-label="TikTok de Sagunto Padel Cup"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    className={styles.socialIcon}
                                    fill="currentColor"
                                >
                                    <path d="M19.6 7.1a6.7 6.7 0 0 1-4.1-1.4v8.1a6.1 6.1 0 1 1-5.3-6.1v3.4a2.8 2.8 0 1 0 1.9 2.7V2.5h3.4a6.7 6.7 0 0 0 4.1 4.1v.5Z" />
                                </svg>
                                <span>TikTok</span>
                            </a>
                        </div>

                        <a
                            href="mailto:saguntopadelcup@gmail.com"
                            className={styles.contactEmail}
                            aria-label="Enviar un correo a Sagunto Padel Cup"
                        >
                            saguntopadelcup@gmail.com
                        </a>
                    </div>

                    <nav
                        className={styles.navigation}
                        aria-label="Navegación del pie de página"
                    >
                        <div className={styles.navColumn}>
                            <h2 className={styles.columnTitle}>Navegación</h2>
                            <Link href="/">Inicio</Link>
                            <Link href="/calendario">Calendario</Link>
                            <Link href="/ranking">Ranking</Link>
                            <Link href="/resultados">Resultados</Link>
                            <Link href="/actualidad">Actualidad</Link>
                        </div>

                        <div className={styles.navColumn}>
                            <h2 className={styles.columnTitle}>Sagunto Padel Cup</h2>
                            <Link href="/sobre-nosotros">Sobre nosotros</Link>
                            <Link href="/patrocinadores">Patrocinadores</Link>
                            <Link href="/contacto">Contacto</Link>
                        </div>
                    </nav>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {currentYear} Sagunto Padel Cup. Todos los derechos reservados.
                    </p>

                    <div className={styles.legalLinks}>
                        <Link href="/aviso-legal">Aviso legal</Link>
                        <Link href="/politica-privacidad">
                            Política de privacidad
                        </Link>
                        <Link href="/politica-cookies">Política de cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}