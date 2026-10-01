"use client";

import {
    ChevronDown,
    CircleUserRound,
    LockKeyhole,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

import LogoutButton from "@/components/auth/LogoutButton";

import styles from "./AccountMenu.module.css";

type AccountMenuProps = {
    name: string;
    email: string;
    avatarUrl?: string | null;
    compact?: boolean;
};

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "U";

    return parts
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase();
}

export default function AccountMenu({
    name,
    email,
    avatarUrl,
    compact = false,
}: AccountMenuProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!open) return;

        function handlePointerDown(event: PointerEvent) {
            if (
                event.target instanceof Node &&
                !rootRef.current?.contains(event.target)
            ) {
                setOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    function toggleMenu() {
        setOpen((current) => !current);
    }

    function closeMenu() {
        setOpen(false);
    }

    const initials = getInitials(name);

    return (
        <div
            ref={rootRef}
            className={`${styles.root} ${compact ? styles.compact : ""
                }`}
        >
            <button
                ref={triggerRef}
                type="button"
                className={styles.trigger}
                onClick={toggleMenu}
                aria-expanded={open}
                aria-controls={menuId}
                aria-haspopup="true"
                aria-label={`Menú de cuenta de ${name}`}
            >
                <span className={styles.avatar} aria-hidden="true">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="" />
                    ) : (
                        <span>{initials}</span>
                    )}
                </span>

                {!compact && (
                    <span className={styles.triggerText}>
                        <span className={styles.triggerName}>{name}</span>
                        <span className={styles.triggerEmail}>{email}</span>
                    </span>
                )}

                <ChevronDown
                    className={`${styles.chevron} ${open ? styles.chevronOpen : ""
                        }`}
                    size={16}
                    aria-hidden="true"
                />
            </button>

            {open && (
                <div
                    id={menuId}
                    className={styles.dropdown}
                    aria-label="Opciones de cuenta"
                >
                    <div className={styles.dropdownHeader}>
                        <span className={styles.dropdownAvatar}>
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt="" />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </span>

                        <span className={styles.dropdownIdentity}>
                            <strong>{name}</strong>
                            <span>{email}</span>
                        </span>
                    </div>

                    <div className={styles.divider} />

                    <nav
                        className={styles.navigation}
                        aria-label="Gestión de cuenta"
                    >
                        <Link
                            href="/app/perfil"
                            className={styles.menuLink}
                            onClick={closeMenu}
                        >
                            <CircleUserRound
                                size={17}
                                aria-hidden="true"
                            />
                            <span>Mi perfil</span>
                        </Link>

                        <Link
                            href="/app/seguridad"
                            className={styles.menuLink}
                            onClick={closeMenu}
                        >
                            <ShieldCheck
                                size={17}
                                aria-hidden="true"
                            />
                            <span>Seguridad</span>
                        </Link>

                        <Link
                            href="/app/privacidad"
                            className={styles.menuLink}
                            onClick={closeMenu}
                        >
                            <LockKeyhole
                                size={17}
                                aria-hidden="true"
                            />
                            <span>Privacidad</span>
                        </Link>
                    </nav>

                    <div className={styles.divider} />

                    <div className={styles.logout}>
                        <LogoutButton onDone={closeMenu} />
                    </div>
                </div>
            )}
        </div>
    );
}