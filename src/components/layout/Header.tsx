"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import styles from "./Header.module.css";

const navigation = [
    {
        label: "TORNEOS",
        href: "/torneos",
    },
    {
        label: "RANKING",
        href: "/ranking",
    },
    {
        label: "JUGADORES",
        href: "/jugadores",
    },
    {
        label: "CIRCUITO",
        href: "/circuito",
    },
    {
        label: "MASTER",
        href: "/master-final",
    },
    {
        label: "NOTICIAS",
        href: "/noticias",
    },
];

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    function closeMenu() {
        setMenuOpen(false);
    }

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link
                    href="/"
                    className={styles.brand}
                    aria-label="Sagunto Padel Cup - Inicio"
                    onClick={closeMenu}
                >
                    <Image
                        src="/logo-sagunto-padel-cup.svg"
                        alt="Sagunto Padel Cup"
                        width={185}
                        height={52}
                        priority
                        className={styles.logo}
                    />
                </Link>

                <nav
                    className={styles.desktopNavigation}
                    aria-label="NavegaciÃ³n principal"
                >
                    {navigation.map((item) => (
                        <Link
                            href={item.href}
                            key={item.href}
                            className={styles.navigationLink}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.desktopActions}>
                    <Link
                        href="/login"
                        className={styles.loginButton}
                    >
                        <span className={styles.loginIcon}>
                            â—¯
                        </span>
                        ACCEDER
                    </Link>

                    <Link
                        href="/registro"
                        className={styles.registerButton}
                    >
                        INSCRIBIRME
                        <span aria-hidden="true">â†’</span>
                    </Link>
                </div>

                <button
                    type="button"
                    className={styles.menuButton}
                    aria-label={
                        menuOpen ? "Cerrar menÃº" : "Abrir menÃº"
                    }
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation"
                    onClick={() =>
                        setMenuOpen((current) => !current)
                    }
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            <div
                id="mobile-navigation"
                className={`${styles.mobileNavigation} ${menuOpen
                        ? styles.mobileNavigationOpen
                        : ""
                    }`}
                aria-hidden={!menuOpen}
            >
                <nav
                    aria-label="NavegaciÃ³n mÃ³vil"
                    className={styles.mobileNavigationInner}
                >
                    <div className={styles.mobileLinks}>
                        {navigation.map((item) => (
                            <Link
                                href={item.href}
                                key={item.href}
                                className={styles.mobileNavigationLink}
                                tabIndex={menuOpen ? 0 : -1}
                                onClick={closeMenu}
                            >
                                <span>{item.label}</span>

                                <span aria-hidden="true">â†’</span>
                            </Link>
                        ))}
                    </div>

                    <div className={styles.mobileActions}>
                        <Link
                            href="/login"
                            className={styles.mobileLogin}
                            tabIndex={menuOpen ? 0 : -1}
                            onClick={closeMenu}
                        >
                            ACCEDER
                        </Link>

                        <Link
                            href="/registro"
                            className={styles.mobileRegister}
                            tabIndex={menuOpen ? 0 : -1}
                            onClick={closeMenu}
                        >
                            INSCRIBIRME
                            <span aria-hidden="true">â†’</span>
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}

