// Ruta: src/app/(admin)/admin/layout.tsx

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div
      className="min-h-screen bg-navy text-offwhite"
      data-area="admin"
    >
      {children}
    </div>
  );
}