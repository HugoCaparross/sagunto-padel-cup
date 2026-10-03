"use client";

import {
    LogOut,
    LoaderCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
    signOut,
} from "@/lib/supabase/client";

import styles from "./LogoutButton.module.css";

type Props = {
    mobile?: boolean;
    compact?: boolean;
    onDone?: () => void;
};

export default function LogoutButton({
    mobile = false,
    compact = false,
    onDone,
}: Props) {
    const router =
        useRouter();

    const [
        loading,
        setLoading,
    ] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleLogout() {
        if (loading) {
            return;
        }

        setLoading(true);
        setErrorMessage("");

        try {
            await signOut();

            onDone?.();

            router.replace("/");
            router.refresh();
        } catch (error) {
            console.error(
                "[SPC Logout]",
                error,
            );

            setErrorMessage("No se ha podido cerrar la sesión. Inténtalo de nuevo.");
            setLoading(false);
        }
    }

    return (
        <div className={styles.logoutWrap}>
        <button
            type="button"
            className={
                mobile
                    ? styles.mobile
                    : compact
                        ? styles.compact
                        : styles.button
            }
            aria-label={loading ? "Cerrando sesión" : "Cerrar sesión"}
            onClick={handleLogout}
            disabled={loading}
            aria-busy={loading}
        >
            {loading ? (
                <LoaderCircle
                    className={styles.loader}
                    size={15}
                />
            ) : (
                <LogOut
                    size={15}
                    aria-hidden="true"
                />
            )}

            <span>
                {loading
                    ? "Saliendo..."
                    : "Salir"}
            </span>
        </button>
            {errorMessage && (
                <span className={styles.error} role="alert">{errorMessage}</span>
            )}
        </div>
    );
}
