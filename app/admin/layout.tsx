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
    <div className="min-h-screen bg-[#F4F5F4] text-[#18232D] lg:grid lg:grid-cols-[220px_1fr]">
      <AdminSidebar />
      <div className="min-w-0 p-4 lg:p-8">{children}</div>
    </div>
  );
}