import { redirect } from "next/navigation";

import {
    getAuthenticatedContext,
} from "@/lib/auth/flow";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const {
        user,
        player,
    } =
        await getAuthenticatedContext();

    if (!user) {
        redirect("/login");
    }

    if (
        !player ||
        !player.onboarding_completado
    ) {
        redirect(
            "/registro/confirma",
        );
    }

    return children;
}