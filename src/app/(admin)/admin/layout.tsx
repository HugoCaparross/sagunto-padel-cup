// Ruta: src/app/(admin)/admin/layout.tsx
import { requireAdmin } from "@/lib/admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <div className="min-h-screen bg-navy text-offwhite">{children}</div>;
}
