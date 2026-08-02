// Ruta: src/app/(admin)/admin/layout.tsx
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <div className="min-h-screen bg-navy text-offwhite">{children}</div>;
}