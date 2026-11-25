import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { exigirOrganizador, usuarioActual } from "@/lib/auth/organizador";

export default async function LayoutAdmin({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const userId = await usuarioActual();
  if (!userId) redirect("/login?siguiente=/admin");

  // El middleware ya lo comprueba; esta segunda comprobación protege aunque cambie el middleware
  const esOrganizador = (await exigirOrganizador()) !== null;
  if (!esOrganizador) redirect("/cuenta");

  return (
    <div className="admin-shell min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] lg:grid lg:grid-cols-[220px_1fr]">
      <AdminSidebar />
      <div className="admin-content min-w-0 p-4 lg:p-8">{children}</div>
    </div>
  );
}