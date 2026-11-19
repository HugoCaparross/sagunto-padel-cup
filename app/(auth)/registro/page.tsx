import type { Metadata } from "next";
import { RegistroForm } from "@/components/auth/FormularioAuth";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function PaginaRegistro() {
  return (
    <main className="mx-auto max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <RegistroForm />
    </main>
  );
}