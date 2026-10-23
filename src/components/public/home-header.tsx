"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
    CalendarDays,
    Menu,
    Search,
    UserRound,
    X,
} from "lucide-react";

import styles from "./home-header.module.css";

const links = [
    { href: "/circuito", label: "El circuito" },
    { href: "/calendario", label: "Calendario" },
    { href: "/ranking", label: "Ranking" },
    { href: "/resultados", label: "Resultados" },
    { href: "/noticias", label: "Noticias" },
    { href: "/clubes", label: "Clubes" },
    { href: "/contacto", label: "Contacto" },
];

export function HomeHeader() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={`container ${styles.inner}`}>
                <Link
                    href="/"
                    className={styles.brand}
                    aria-label="Sagunto Padel Cup, inicio"
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

                <nav
                    className={styles.desktopNav}
                    aria-label="Navegación principal"
                >
                    <Link href="/" className={styles.active}>
                        Inicio
                    </Link>

                    {links.map((link) => (
                        <Link href={link.href} key={link.href}>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.actions}>
                    <Link
                        href="/buscar"
                        className={styles.searchButton}
                        aria-label="Buscar"
                    >
                        <Search size={17} />
                    </Link>

                    <Link href="/acceso" className={styles.login}>
                        <UserRound size={14} />
                        Iniciar sesión
                    </Link>

                    <Link href="/inscripcion" className={styles.register}>
                        <CalendarDays size={14} />
                        Inscripciones
                    </Link>
                </div>

                <button
                    className={styles.menuToggle}
                    type="button"
                    aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? <X size={23} /> : <Menu size={23} />}
                </button>
            </div>

            {menuOpen && (
                <nav
                    id="mobile-navigation"
                    className={styles.mobileNav}
                    aria-label="Navegación móvil"
                >
                    <Link href="/" onClick={() => setMenuOpen(false)}>
                        Inicio
                    </Link>

                    {links.map((link) => (
                        <Link
                            href={link.href}
                            key={link.href}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <Link href="/acceso" onClick={() => setMenuOpen(false)}>
                        Iniciar sesión
                    </Link>

                    <Link
                        href="/inscripcion"
                        className={styles.mobileRegister}
                        onClick={() => setMenuOpen(false)}
                    >
                        Inscripciones
                    </Link>
                </nav>
            )}
        </header>
    );
}