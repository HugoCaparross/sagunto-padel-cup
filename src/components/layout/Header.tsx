"use client";

import { ArrowUpRight, Menu, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./Header.module.css";

const navigation = [
    { label: "Calendario", href: "/torneos" },
    { label: "Ranking", href: "/ranking" },
    { label: "Jugadores", href: "/jugadores" },
    { label: "Circuito", href: "/circuito" },
    { label: "Master", href: "/master-final" },
    { label: "Noticias", href: "/noticias" },
];

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);

        onScroll();

        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [menuOpen]);

    return (
        <header
            className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}
        >
            <div className={styles.container}>
                <Link
                    href="/"
                    className={styles.brand}
                    aria-label="Sagunto Padel Cup"
                    onClick={() => setMenuOpen(false)}
                >
                    <span className={styles.brandLogoWrap}>
                        <Image
                            src="/images/brand/sagunto-padel-cup-logo.png"
                            alt="Sagunto Padel Cup"
                            width={1422}
                            height={1106}
                            priority
                            className={styles.brandLogo}
                        />
                    </span>

                    <span className={styles.brandText}>
                        <strong>SAGUNTO</strong>
                        <span>PADEL CUP</span>
                    </span>
                </Link>

                <nav
                    className={styles.navigation}
                    aria-label="Navegación principal"
                >
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={styles.navLink}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.actions}>
                    <Link href="/login" className={styles.login}>
                        <UserRound size={16} aria-hidden="true" />
                        Acceder
                    </Link>

                    <Link
                        href="/registro"
                        className={styles.register}
                    >
                        Inscribirme
                        <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                </div>

                <button
                    className={styles.menuButton}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={menuOpen}
                    type="button"
                >
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <div
                className={`${styles.mobilePanel} ${menuOpen ? styles.mobilePanelOpen : ""}`}
            >
                <div className={styles.mobileInner}>
                    <div className={styles.mobileSeason}>
                        <span>TEMPORADA</span>
                        <strong>2026 / 2027</strong>
                    </div>

                    <nav className={styles.mobileNav}>
                        {navigation.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={styles.mobileLink}
                            >
                                <span>{item.label}</span>
                                <ArrowUpRight size={20} aria-hidden="true" />
                            </Link>
                        ))}
                    </nav>

                    <div className={styles.mobileActions}>
                        <Link
                            href="/login"
                            onClick={() => setMenuOpen(false)}
                            className={styles.mobileLogin}
                        >
                            Acceder
                        </Link>

                        <Link
                            href="/registro"
                            onClick={() => setMenuOpen(false)}
                            className={styles.mobileRegister}
                        >
                            Inscribirme
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
