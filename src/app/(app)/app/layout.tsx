import { redirect } from "next/navigation";

import PlayerAppShell from "@/components/private/PlayerAppShell";
import { getAuthenticatedContext } from "@/lib/auth/flow";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, player } = await getAuthenticatedContext();

    if (!user) {
        redirect("/login");
    }

    // Los administradores utilizan su propio panel.
    if (player?.role === "admin") {
        redirect("/admin/torneos");
    }

    if (!player || !player.onboarding_completado) {
        redirect("/registro/confirma");
    }

    const playerName = [
        player.nombre,
        player.apellidos,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        <PlayerAppShell
            playerName={playerName || "Mi cuenta"}
            playerEmail={player.email || user.email || ""}
        >
            {children}
        </PlayerAppShell>
    );
}