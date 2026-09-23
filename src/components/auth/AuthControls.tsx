"use client";

import Link from "next/link";
import {
    ArrowUpRight,
    UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
    createClient,
    getBrowserUser,
    getCurrentPlayerProfile,
} from "@/lib/supabase/client";

import LogoutButton from "./LogoutButton";

import styles from "./AuthControls.module.css";

type Props = {
    mobile?: boolean;
    onNavigate?: () => void;
};

type State = {
    loading: boolean;
    authenticated: boolean;
    complete: boolean;
};

export default function AuthControls({
    mobile = false,
    onNavigate,
}: Props) {
    const [
        state,
        setState,
    ] = useState<State>({
        loading: true,
        authenticated: false,
        complete: false,
    });

    useEffect(() => {
        let active = true;

        const supabase =
            createClient();

        async function sync() {
            try {
                const user =
                    await getBrowserUser();

                if (!user) {
                    if (active) {
                        setState({
                            loading: false,
                            authenticated: false,
                            complete: false,
                        });
                    }

                    return;
                }

                const player =
                    await getCurrentPlayerProfile();

                if (active) {
                    setState({
                        loading: false,
                        authenticated: true,
                        complete:
                            Boolean(
                                player?.onboarding_completado,
                            ),
                    });
                }
            } catch {
                if (active) {
                    setState({
                        loading: false,
                        authenticated: false,
                        complete: false,
                    });
                }
            }
        }

        void sync();

        const {
            data,
        } =
            supabase.auth.onAuthStateChange(
                () => {
                    window.setTimeout(
                        () => {
                            void sync();
                        },
                        0,
                    );
                },
            );

        return () => {
            active = false;

            data.subscription.unsubscribe();
        };
    }, []);

    if (state.loading) {
        return (
            <span
                className={styles.loading}
                aria-hidden="true"
            />
        );
    }

    if (!state.authenticated) {
        return (
            <div
                className={
                    mobile
                        ? styles.mobileGroup
                        : styles.group
                }
            >
                <Link
                    href="/login"
                    className={
                        mobile
                            ? styles.mobileLogin
                            : styles.login
                    }
                    onClick={onNavigate}
                >
                    <UserRound
                        size={15}
                        aria-hidden="true"
                    />

                    <span>
                        Acceder
                    </span>
                </Link>

                <Link
                    href="/registro"
                    className={
                        mobile
                            ? styles.mobileRegister
                            : styles.register
                    }
                    onClick={onNavigate}
                >
                    <span>
                        Inscribirme
                    </span>

                    <ArrowUpRight
                        size={15}
                        aria-hidden="true"
                    />
                </Link>
            </div>
        );
    }

    return (
        <div
            className={
                mobile
                    ? styles.mobileGroup
                    : styles.group
            }
        >
            <Link
                href={
                    state.complete
                        ? "/app/perfil"
                        : "/registro/confirma"
                }
                className={
                    mobile
                        ? styles.mobileProfile
                        : styles.profile
                }
                onClick={onNavigate}
            >
                <UserRound
                    size={15}
                    aria-hidden="true"
                />

                <span>
                    {state.complete
                        ? "Mi perfil"
                        : "Completar perfil"}
                </span>
            </Link>

            <LogoutButton
                mobile={mobile}
                onDone={onNavigate}
            />
        </div>
    );
}