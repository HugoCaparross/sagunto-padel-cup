"use client";

import { ArrowUpRight, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./Header.module.css";

const navigation = [
    { label: "Torneos", href: "/torneos" },
    { label: "Ranking", href: "/ranking" },
    { label: "Jugadores", href: "/jugadores" },
    { label: "Circuito", href: "/circuito" },
    { label: "Master", href: "/master-final" },
    { label: "Noticias", href: "/noticias" },
];

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!menuOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        const onResize = () => {
            if (window.innerWidth > 850) setMenuOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("resize", onResize);
        };
    }, [menuOpen]);

    function closeMenu() {
        setMenuOpen(false);
    }

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link
                    href="/"
                    className={styles.brand}
                    aria-label="Sagunto Padel Cup — Inicio"
                    onClick={closeMenu}
                >
                    <span className={styles.brandMark} aria-hidden="true">
                        SPC
                    </span>

                    <span className={styles.brandWordmark}>
                        <strong>SAGUNTO</strong>
                        <span>PADEL CUP</span>
                    </span>
                </Link>

                <nav className={styles.desktopNavigation} aria-label="Navegación principal">
                    {navigation.map((item) => (
                        <Link href={item.href} key={item.href} className={styles.navigationLink}>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.desktopActions}>
                    <Link href="/login" className={styles.loginButton}>
                        <UserRound size={15} strokeWidth={2} aria-hidden="true" />
                        Acceder
                    </Link>

                    <Link href="/registro" className={styles.registerButton}>
                        Inscribirme
                        <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
                    </Link>
                </div>

                <button
                    type="button"
                    className={styles.menuButton}
                    aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation"
                    onClick={() => setMenuOpen((current) => !current)}
                >
                    {menuOpen ? <X size={23} aria-hidden="true" /> : <Menu size={23} aria-hidden="true" />}
                </button>
            </div>

            <div
                id="mobile-navigation"
                className={`${styles.mobileNavigation} ${menuOpen ? styles.mobileNavigationOpen : ""}`}
                aria-hidden={!menuOpen}
            >
                <nav aria-label="Navegación móvil" className={styles.mobileNavigationInner}>
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
                                <ArrowUpRight size={19} strokeWidth={2} aria-hidden="true" />
                            </Link>
                        ))}
                    </div>

                    <div className={styles.mobileActions}>
                        <Link href="/login" className={styles.mobileLogin} tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>
                            <UserRound size={15} aria-hidden="true" />
                            Acceder
                        </Link>

                        <Link href="/registro" className={styles.mobileRegister} tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>
                            Inscribirme
                            <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}
