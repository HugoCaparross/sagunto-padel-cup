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
    onDone?: () => void;
};

export default function LogoutButton({
    mobile = false,
    onDone,
}: Props) {
    const router =
        useRouter();

    const [
        loading,
        setLoading,
    ] = useState(false);

    async function handleLogout() {
        if (loading) {
            return;
        }

        setLoading(true);

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

            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            className={
                mobile
                    ? styles.mobile
                    : styles.button
            }
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
    );
}