"use client";

import {
    Activity,
    BarChart3,
    Bell,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    CreditCard,
    FolderOpen,
    Handshake,
    LayoutDashboard,
    Menu,
    Newspaper,
    Settings,
    ShieldCheck,
    Trophy,
    Users,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import LogoutButton from "@/components/auth/LogoutButton";

import styles from "./AdminShell.module.css";

type NavigationItem = {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
};

type NavigationGroup = {
    label: string;
    items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
    {
        label: "General",
        items: [
            {
                label: "Panel de control",
                href: "/admin",
                icon: LayoutDashboard,
                exact: true,
            },
        ],
    },
    {
        label: "Competición",
        items: [
            {
                label: "Torneos",
                href: "/admin/torneos",
                icon: Trophy,
            },
            {
                label: "Inscripciones",
                href: "/admin/inscripciones",
                icon: ClipboardList,
            },
            {
                label: "Partidos",
                href: "/admin/competicion",
                icon: Activity,
            },
            {
                label: "Ranking",
                href: "/admin/ranking",
                icon: BarChart3,
            },
            {
                label: "Categorías",
                href: "/admin/categorias",
                icon: Activity,
            },
            {
                label: "Master",
                href: "/admin/master",
                icon: Trophy,
            },
        ],
    },
    {
        label: "Participantes",
        items: [
            {
                label: "Jugadores",
                href: "/admin/jugadores",
                icon: Users,
            },
        ],
    },
    {
        label: "Organización",
        items: [
            {
                label: "Clubes",
                href: "/admin/clubes",
                icon: FolderOpen,
            },
            {
                label: "Patrocinadores",
                href: "/admin/patrocinadores",
                icon: Handshake,
            },
            {
                label: "Premios",
                href: "/admin/premios",
                icon: CreditCard,
            },
        ],
    },
    {
        label: "Comunicación",
        items: [
            {
                label: "Contenidos",
                href: "/admin/contenidos",
                icon: Newspaper,
            },
            {
                label: "Galería",
                href: "/admin/galeria",
                icon: FolderOpen,
            },
            {
                label: "Notificaciones",
                href: "/admin/notificaciones",
                icon: Bell,
            },
            {
                label: "Emails",
                href: "/admin/emails",
                icon: ClipboardList,
            },
        ],
    },
    {
        label: "Sistema",
        items: [
            {
                label: "Ajustes",
                href: "/admin/ajustes",
                icon: Settings,
            },
        ],
    },
];

// Keep navigation limited to implemented destinations so users never land on
// an empty 404 route from the administration shell.
const availableAdminRoutes = new Set([
    "/admin",
    "/admin/torneos",
    "/admin/inscripciones",
    "/admin/jugadores",
    "/admin/ranking",
    "/admin/contenidos",
    "/admin/competicion",
]);

function isActiveRoute(
    pathname: string,
    item: NavigationItem,
): boolean {
    if (item.exact) {
        return pathname === item.href;
    }

    return (
        pathname === item.href ||
        pathname.startsWith(`${item.href}/`)
    );
}

export default function AdminShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    function closeMobileMenu() {
        setMobileOpen(false);
    }

    return (
        <div
            className={[
                styles.shell,
                collapsed ? styles.shellCollapsed : "",
            ].join(" ")}
        >
            {mobileOpen && (
                <button
                    type="button"
                    className={styles.mobileBackdrop}
                    aria-label="Cerrar menú de administración"
                    onClick={closeMobileMenu}
                />
            )}

            <aside
                className={[
                    styles.sidebar,
                    mobileOpen ? styles.sidebarMobileOpen : "",
                ].join(" ")}
                aria-label="Navegación administrativa"
            >
                <div className={styles.sidebarHeader}>
                    <Link
                        href="/admin"
                        className={styles.brand}
                        aria-label="Sagunto Padel Cup, administración"
                        onClick={closeMobileMenu}
                    >
                        <span className={styles.brandMark}>
                            SPC
                        </span>

                        <span className={styles.brandText}>
                            <strong>SAGUNTO</strong>
                            <span>PADEL CUP</span>
                        </span>
                    </Link>

                    <button
                        type="button"
                        className={styles.mobileClose}
                        aria-label="Cerrar menú"
                        onClick={closeMobileMenu}
                    >
                        <X size={19} aria-hidden="true" />
                    </button>
                </div>

                <div className={styles.sidebarLabel}>
                    ADMINISTRACIÓN
                </div>

                <nav className={styles.navigation}>
                    {navigationGroups
                        .filter((group) =>
                            group.items.some((item) => availableAdminRoutes.has(item.href)),
                        )
                        .map((group) => (
                        <div
                            className={styles.navigationGroup}
                            key={group.label}
                        >
                            <span className={styles.groupLabel}>
                                {group.label}
                            </span>

                            <ul className={styles.navigationList}>
                                {group.items
                                    .filter((item) => availableAdminRoutes.has(item.href))
                                    .map((item) => {
                                    const Icon = item.icon;
                                    const active = isActiveRoute(
                                        pathname,
                                        item,
                                    );

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={[
                                                    styles.navigationLink,
                                                    active
                                                        ? styles.navigationLinkActive
                                                        : "",
                                                ].join(" ")}
                                                aria-current={
                                                    active ? "page" : undefined
                                                }
                                                title={
                                                    collapsed
                                                        ? item.label
                                                        : undefined
                                                }
                                                onClick={closeMobileMenu}
                                            >
                                                <Icon
                                                    size={18}
                                                    strokeWidth={1.8}
                                                    aria-hidden="true"
                                                />

                                                <span>{item.label}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.adminIdentity}>
                        <span className={styles.adminAvatar}>
                            <ShieldCheck
                                size={17}
                                aria-hidden="true"
                            />
                        </span>

                        <span className={styles.adminIdentityText}>
                            <strong>Administración</strong>
                            <span>Panel privado</span>
                        </span>
                    </div>

                    <LogoutButton compact={collapsed} />
                </div>
            </aside>

            <div className={styles.mainArea}>
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <button
                            type="button"
                            className={styles.mobileMenuButton}
                            aria-label="Abrir menú"
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={20} aria-hidden="true" />
                        </button>

                        <button
                            type="button"
                            className={styles.collapseButton}
                            aria-label={
                                collapsed
                                    ? "Expandir menú lateral"
                                    : "Contraer menú lateral"
                            }
                            onClick={() =>
                                setCollapsed((current) => !current)
                            }
                        >
                            {collapsed ? (
                                <ChevronRight
                                    size={17}
                                    aria-hidden="true"
                                />
                            ) : (
                                <ChevronLeft
                                    size={17}
                                    aria-hidden="true"
                                />
                            )}
                        </button>

                        <div className={styles.breadcrumb}>
                            <span>SPC</span>
                            <span aria-hidden="true">/</span>
                            <strong>
                                {getCurrentSection(pathname)}
                            </strong>
                        </div>
                    </div>

                    <div className={styles.topbarRight}>
                        <span className={styles.adminStatus}>
                            <span />
                            Sesión administrativa
                        </span>
                    </div>
                </header>

                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function getCurrentSection(pathname: string): string {
    const allItems = navigationGroups.flatMap(
        (group) => group.items,
    );

    const currentItem = [...allItems]
        .sort((a, b) => b.href.length - a.href.length)
        .find((item) => isActiveRoute(pathname, item));

    return currentItem?.label ?? "Administración";
}
