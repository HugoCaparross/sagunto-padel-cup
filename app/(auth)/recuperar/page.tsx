import type { Metadata } from "next";
import { RecuperarForm } from "@/components/auth/FormularioAuth";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function PaginaRecuperar() {
  return (
    <main className="mx-auto max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
      <RecuperarForm />
    </main>
  );
}