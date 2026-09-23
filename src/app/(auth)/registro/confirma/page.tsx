import type { Metadata } from "next";
import { redirect } from "next/navigation";

import PublicShell from "@/components/public/PublicShell";

import {
    getPublicCategories,
} from "@/lib/public/site";

import {
    getPlayerByAuthUserId,
} from "@/lib/services/players";

import {
    getUser,
} from "@/lib/supabase/server";

import RegistrationForm from "./RegistrationForm";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Completa tu perfil",

    description:
        "Completa tu perfil de jugador en Sagunto Padel Cup.",

    robots: {
        index: false,
        follow: false,
    },
};

export default async function RegistroConfirmaPage() {
    const user =
        await getUser();

    if (!user) {
        redirect("/login");
    }

    const player =
        await getPlayerByAuthUserId(
            user.id,
        );

    if (
        player?.onboarding_completado
    ) {
        redirect(
            "/app/perfil",
        );
    }

    const categoriesResult =
        await getPublicCategories();

    const categories =
        categoriesResult.data ?? [];

    const metadata =
        user.user_metadata ?? {};

    const fullName =
        typeof metadata.full_name ===
            "string"
            ? metadata.full_name
            : typeof metadata.name ===
                "string"
                ? metadata.name
                : "";

    const parts =
        fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    const firstName =
        parts.shift() ?? "";

    const surname =
        parts.join(" ");

    const avatarUrl =
        typeof metadata.avatar_url ===
            "string"
            ? metadata.avatar_url
            : null;

    return (
        <PublicShell>
            <div className={styles.page}>
                <section
                    className={styles.section}
                    aria-labelledby="complete-profile-title"
                >
                    <div
                        className={
                            styles.container
                        }
                    >
                        <header
                            className={
                                styles.header
                            }
                        >
                            <span
                                className={
                                    styles.eyebrow
                                }
                            >
                                ÚLTIMO PASO · PERFIL
                                DE JUGADOR
                            </span>

                            <h1 id="complete-profile-title">
                                Completa tu perfil.
                            </h1>

                            <p>
                                Tu cuenta ya está
                                conectada. Solo
                                necesitamos estos
                                datos para crear o
                                completar tu perfil
                                dentro del circuito.
                            </p>
                        </header>

                        <RegistrationForm
                            email={
                                user.email ??
                                ""
                            }
                            defaultName={
                                firstName
                            }
                            defaultSurname={
                                surname
                            }
                            defaultAvatar={
                                avatarUrl
                            }
                            categories={
                                categories
                            }
                            existingPlayer={
                                player
                            }
                        />
                    </div>
                </section>
            </div>
        </PublicShell>
    );
}