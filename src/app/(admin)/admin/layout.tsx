import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { getAuthenticatedContext } from "@/lib/auth/flow";

type AdminLayoutProps = {
    children: ReactNode;
};

export default async function AdminLayout({
    children,
}: AdminLayoutProps) {
    const { user, player } = await getAuthenticatedContext();

    if (!user) {
        redirect("/login?next=%2Fadmin%2Ftorneos");
    }

    if (!player) {
        redirect("/registro/confirma");
    }

    // Administrative access is based on the database role, not on user
    // metadata and not on whether the player onboarding was completed.
    if (player.role === "admin") {
        return <AdminShell>{children}</AdminShell>;
    }

    if (!player.onboarding_completado) {
        redirect("/registro/confirma");
    }

    redirect("/app/perfil?error=admin_required");
}