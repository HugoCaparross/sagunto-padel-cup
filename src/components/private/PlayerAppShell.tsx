"use client";

import {
    CalendarDays,
    ChevronDown,
    LayoutDashboard,
    Menu,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import LogoutButton from "@/components/auth/LogoutButton";

import styles from "./PlayerAppShell.module.css";

type Props = {
    children: React.ReactNode;
    playerName: string;
    playerEmail: string;
};

const navigation = [
    {
        label: "Inicio",
        href: "/app",
        icon: LayoutDashboard,
    },
    {
        label: "Mi perfil",
        href: "/app/perfil",
        icon: UserRound,
    },
    {
        label: "Seguridad",
        href: "/app/seguridad",
        icon: ShieldCheck,
    },
];

function getPageTitle(pathname: string) {
    const current = navigation.find(
        (item) => item.href === pathname,
    );

    return current?.label ?? "Área de jugador";
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "J";
    }

    return parts
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase();
}

export default function PlayerAppShell({
    children,
    playerName,
    playerEmail,
}: Props) {
    const pathname = usePathname();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);

    const accountMenuRef = useRef<HTMLDivElement>(null);

    const title = getPageTitle(pathname);
    const initials = getInitials(playerName);

    function closeMobileMenu() {
        setMobileOpen(false);
    }

    function closeAccountMenu() {
        setAccountMenuOpen(false);
    }

    useEffect(() => {
        if (!accountMenuOpen) {
            return;
        }

        function handlePointerDown(event: PointerEvent) {
            if (
                event.target instanceof Node &&
                !accountMenuRef.current?.contains(event.target)
            ) {
                setAccountMenuOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setAccountMenuOpen(false);
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown,
            );
            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [accountMenuOpen]);

    return (
        <div className={styles.shell}>
            {mobileOpen && (
                <button
                    type="button"
                    className={styles.backdrop}
                    aria-label="Cerrar menú"
                    onClick={closeMobileMenu}
                />
            )}

            <aside
                id="player-sidebar"
                className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""
                    }`}
                aria-label="Navegación privada"
            >
                <div className={styles.brand}>
                    <Link
                        href="/app"
                        className={styles.brandLink}
                        onClick={closeMobileMenu}
                        aria-label="Sagunto Padel Cup, inicio del área privada"
                    >
                        <span className={styles.brandMark}>
                            <CalendarDays
                                size={20}
                                strokeWidth={2.4}
                                aria-hidden="true"
                            />
                        </span>

                        <span className={styles.brandText}>
                            <strong>SAGUNTO</strong>
                            <span>PADEL CUP</span>
                        </span>
                    </Link>

                    <button
                        type="button"
                        className={styles.closeMenu}
                        onClick={closeMobileMenu}
                        aria-label="Cerrar navegación"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.navGroup}>
                    <p className={styles.navLabel}>
                        ÁREA DE JUGADOR
                    </p>

                    <nav className={styles.navigation}>
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMobileMenu}
                                    className={`${styles.navLink} ${active
                                            ? styles.navLinkActive
                                            : ""
                                        }`}
                                    aria-current={
                                        active ? "page" : undefined
                                    }
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={1.9}
                                        aria-hidden="true"
                                    />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className={styles.sidebarBottom}>
                    <div className={styles.sidebarHelp}>
                        <span className={styles.helpTitle}>
                            ¿Necesitas ayuda?
                        </span>

                        <p>
                            Contacta con la organización si tienes
                            alguna consulta sobre tu cuenta.
                        </p>

                        <Link href="/contacto">
                            Contactar
                        </Link>
                    </div>

                    <div className={styles.account}>
                        <div
                            className={styles.avatar}
                            aria-hidden="true"
                        >
                            {initials}
                        </div>

                        <div className={styles.accountInfo}>
                            <span className={styles.accountName}>
                                {playerName}
                            </span>

                            <span className={styles.accountEmail}>
                                {playerEmail}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            <div className={styles.mainColumn}>
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <button
                            type="button"
                            className={styles.menuButton}
                            onClick={() => setMobileOpen(true)}
                            aria-label="Abrir menú"
                            aria-controls="player-sidebar"
                            aria-expanded={mobileOpen}
                        >
                            <Menu size={21} />
                        </button>

                        <div className={styles.breadcrumb}>
                            <span>Área de jugador</span>

                            <span
                                className={styles.breadcrumbDivider}
                            >
                                /
                            </span>

                            <strong>{title}</strong>
                        </div>
                    </div>

                    <div
                        className={styles.accountMenuContainer}
                        ref={accountMenuRef}
                    >
                        <button
                            type="button"
                            className={styles.topbarProfile}
                            onClick={() =>
                                setAccountMenuOpen((open) => !open)
                            }
                            aria-expanded={accountMenuOpen}
                            aria-controls="account-dropdown"
                            aria-haspopup="true"
                        >
                            <span
                                className={styles.topbarAvatar}
                                aria-hidden="true"
                            >
                                {initials}
                            </span>

                            <span>Mi cuenta</span>

                            <ChevronDown
                                size={14}
                                className={`${styles.topbarChevron
                                    } ${accountMenuOpen
                                        ? styles.topbarChevronOpen
                                        : ""
                                    }`}
                                aria-hidden="true"
                            />
                        </button>

                        {accountMenuOpen && (
                            <div
                                id="account-dropdown"
                                className={styles.accountDropdown}
                            >
                                <div
                                    className={styles.dropdownHeader}
                                >
                                    <span
                                        className={styles.dropdownName}
                                    >
                                        {playerName}
                                    </span>

                                    <span
                                        className={styles.dropdownEmail}
                                    >
                                        {playerEmail}
                                    </span>
                                </div>

                                <nav
                                    className={styles.dropdownLinks}
                                    aria-label="Opciones de cuenta"
                                >
                                    <Link
                                        href="/app/perfil"
                                        className={styles.dropdownLink}
                                        onClick={closeAccountMenu}
                                    >
                                        <UserRound
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        <span>Mi perfil</span>
                                    </Link>

                                    <Link
                                        href="/app/seguridad"
                                        className={styles.dropdownLink}
                                        onClick={closeAccountMenu}
                                    >
                                        <ShieldCheck
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        <span>Seguridad</span>
                                    </Link>
                                </nav>

                                <div
                                    className={styles.dropdownLogout}
                                >
                                    <LogoutButton
                                        onDone={closeAccountMenu}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className={styles.content}>
                    {children}
                </div>

                <footer className={styles.footer}>
                    <span>
                        © {new Date().getFullYear()} Sagunto Padel Cup
                    </span>

                    <nav
                        className={styles.footerLinks}
                        aria-label="Enlaces legales"
                    >
                        <Link href="/aviso-legal">
                            Aviso legal
                        </Link>

                        <Link href="/privacidad">
                            Privacidad
                        </Link>

                        <Link href="/contacto">
                            Contacto
                        </Link>
                    </nav>
                </footer>
            </div>
        </div>
    );
}